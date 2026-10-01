"use server";
import { randomBytes, createHash } from "node:crypto";
import { and, eq, gt, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { admisiones, usuarios, tokensCuenta, metricas } from "@/db/schema";
import {
  destinoSeguro,
  admisionSchema,
  estadosAdmision,
  validarConfirmacion,
  zonaHoraria,
  meetValido,
  passwordSchema,
  escapeHtml,
} from "@/lib/platform/rules";
import { limitar, limitarSolicitud, safeError } from "@/lib/platform/security";
import { encolarCorreo, enlaceMail } from "@/lib/platform/mail";
import { emailDisponible } from "@/lib/email";
import { requerirAdmin, requerirProfesional } from "@/lib/auth/dal";
import { hashearPassword } from "@/lib/auth/password";
import { crearSesion } from "@/lib/auth/session";
import type { ActionState } from "@/lib/platform/types";
export async function solicitarAdmision(
  _: ActionState,
  fd: FormData,
): Promise<ActionState> {
  try {
    if (fd.get("website")) return { error: "No pudimos validar la solicitud." };
    const p = admisionSchema.safeParse(Object.fromEntries(fd));
    if (!p.success)
      return { error: p.error.issues[0]?.message ?? "Revisá los datos." };
    await limitarSolicitud("admision", 10);
    await limitar("admision-email", p.data.email, 3, 3600);
    const { mayor: _mayor, privacidad: _privacidad, ...datos } = p.data;
    void _mayor;
    void _privacidad;
    const [a] = await db
      .insert(admisiones)
      .values(datos)
      .onConflictDoNothing()
      .returning();
    if (!a)
      return {
        ok: true,
        mensaje:
          "Tu solicitud ya fue recibida. El equipo se comunicará con vos.",
      };
    await db.insert(metricas).values({ evento: "solicitud_admision" });
    await encolarCorreo(
      `admision:${a.id}:recibida`,
      a.email,
      "Recibimos tu solicitud de admisión",
      `<p>Hola ${escapeHtml(a.nombre)}. El equipo va a contactarte para coordinar la admisión de 45–50 minutos por Google Meet. La confirmación requiere abono previo, coordinado directamente con la profesional.</p>`,
    );
    revalidatePath("/admin/admisiones");
    return {
      ok: true,
      id: a.id,
      mensaje:
        "Recibimos tu solicitud. PSICOMAR se comunicará con vos para asignar profesional y coordinar la admisión.",
    };
  } catch (e) {
    return { error: safeError(e) };
  }
}
export async function guardarAdmision(
  _: ActionState,
  fd: FormData,
): Promise<ActionState> {
  await requerirAdmin();
  try {
    const p = z
      .object({
        id: z.uuid(),
        revision: z.coerce.number().int().nonnegative(),
        estado: z.enum(estadosAdmision),
        profesional: z.enum(["", "Kiara", "Maite"]),
        zonaHoraria,
        fecha: z.union([z.literal(""), z.iso.datetime({ offset: true })]),
        meet: z.string().max(300),
        observacion: z.string().max(500),
      })
      .parse(Object.fromEntries(fd));
    if (p.meet && !meetValido(p.meet))
      return { error: "Usá un enlace HTTPS de meet.google.com." };
    const fecha = p.fecha ? new Date(p.fecha) : null;
    if (fecha && isNaN(fecha.getTime())) return { error: "Fecha inválida." };
    const datos = {
      estado: p.estado,
      profesional: p.profesional || null,
      zonaHoraria: p.zonaHoraria,
      fecha,
      meet: p.meet || null,
      observacion: p.observacion,
      abonoRecibido: fd.get("abonoRecibido") === "on",
    };
    validarConfirmacion(datos);
    const [a] = await db
      .update(admisiones)
      .set({ ...datos, revision: p.revision + 1, updatedAt: new Date() })
      .where(and(eq(admisiones.id, p.id), eq(admisiones.revision, p.revision)))
      .returning();
    if (!a)
      return {
        error: "La solicitud cambió. Recargá la página antes de guardar.",
      };
    let enviado = true;
    if (a.estado === "confirmada") {
      const horario = new Intl.DateTimeFormat("es-AR", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: a.zonaHoraria,
      }).format(a.fecha!);
      const firma = createHash("sha256")
        .update(`${a.fecha?.toISOString()}|${a.meet}|${a.profesional}`)
        .digest("hex")
        .slice(0, 20);
      enviado = await encolarCorreo(
        `admision:${a.id}:confirmada:${firma}`,
        a.email,
        "Tu admisión está confirmada",
        `<p>Hola ${escapeHtml(a.nombre)}. Tu admisión con ${escapeHtml(a.profesional!)} está confirmada.</p><p>${escapeHtml(horario)} (${escapeHtml(a.zonaHoraria)}). Duración: 45–50 minutos.</p><p><a href="${escapeHtml(a.meet!)}">Ingresar a Google Meet</a></p><p>Buscá un lugar privado y una conexión estable. Para cambios, contactá al equipo por el canal de coordinación habitual.</p>`,
      );
    }
    revalidatePath("/admin/admisiones");
    revalidatePath(`/admin/admisiones/${p.id}`);
    return {
      ok: true,
      mensaje: enviado
        ? "Cambios guardados."
        : "Cambios guardados. El correo NO se envió; revisá Configuración y reintentá desde Correos.",
    };
  } catch (e) {
    return { error: safeError(e) };
  }
}
export async function registrarProfesional(
  _: ActionState,
  fd: FormData,
): Promise<ActionState> {
  let u;
  try {
    const p = z
      .object({
        nombre: z.string().trim().min(3).max(120),
        email: z
          .email()
          .max(254)
          .transform((v) => v.toLowerCase()),
        password: passwordSchema,
        privacidad: z.literal("on"),
      })
      .safeParse(Object.fromEntries(fd));
    if (!p.success)
      return { error: p.error.issues[0]?.message ?? "Revisá los datos." };
    await limitarSolicitud("registro", 10);
    await limitar("registro-email", p.data.email, 3, 3600);
    const [nuevo] = await db
      .insert(usuarios)
      .values({
        nombre: p.data.nombre,
        email: p.data.email,
        passwordHash: await hashearPassword(p.data.password),
        rol: "profesional",
      })
      .onConflictDoNothing()
      .returning();
    if (!nuevo)
      return {
        error:
          "No pudimos crear la cuenta. Si ya te registraste, ingresá o recuperá tu contraseña.",
      };
    u = nuevo;
    await db.insert(metricas).values({ evento: "registro_profesional" });
    if (emailDisponible()) {
      const token = randomBytes(32).toString("hex");
      await db.insert(tokensCuenta).values({
        hash: createHash("sha256").update(token).digest("hex"),
        usuarioId: u.id,
        tipo: "verificacion",
        expiresAt: new Date(Date.now() + 86400000),
      });
      await encolarCorreo(
        `bienvenida:${u.id}`,
        u.email,
        "Bienvenido a Academia PsicoMar",
        `<p>Tu cuenta profesional está creada.</p>${enlaceMail("Verificar mi email", `/verificar?token=${token}`)}`,
      );
    }
    await crearSesion({
      userId: u.id,
      nombre: u.nombre,
      rol: u.rol,
      sessionVersion: u.sessionVersion,
    });
  } catch (e) {
    return { error: safeError(e) };
  }
  redirect(destinoSeguro(fd.get("volver")) || "/cuenta");
}
export async function recuperarCuenta(
  _: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const mensaje =
    "Si hay una cuenta con ese email, recibirás instrucciones para recuperar el acceso.";
  try {
    const email = z.email().max(254).parse(fd.get("email")).toLowerCase();
    await limitarSolicitud("recuperar", 10);
    await limitar("recuperar-email", email, 3, 3600);
    if (!emailDisponible())
      return {
        error:
          "La recuperación por email no está disponible en este momento. Contactá a PSICOMAR.",
      };
    const [u] = await db
      .select()
      .from(usuarios)
      .where(and(eq(usuarios.email, email), eq(usuarios.rol, "profesional")))
      .limit(1);
    if (u) {
      const token = randomBytes(32).toString("hex");
      await db.insert(tokensCuenta).values({
        hash: createHash("sha256").update(token).digest("hex"),
        usuarioId: u.id,
        tipo: "reset",
        expiresAt: new Date(Date.now() + 1800000),
      });
      await encolarCorreo(
        `reset:${createHash("sha256").update(token).digest("hex")}`,
        email,
        "Recuperá tu acceso",
        enlaceMail(
          "Crear una nueva contraseña",
          `/recuperar/nueva?token=${token}`,
        ),
      );
    }
    return { ok: true, mensaje };
  } catch (e) {
    return { error: safeError(e) };
  }
}
export async function restablecerCuenta(
  _: ActionState,
  fd: FormData,
): Promise<ActionState> {
  try {
    await limitarSolicitud("reset", 10);
    const password = passwordSchema.parse(fd.get("password"));
    const token = z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .parse(fd.get("token"));
    const hash = createHash("sha256").update(token).digest("hex");
    const passwordHash = await hashearPassword(password);
    await db.transaction(async (tx) => {
      const [t] = await tx
        .delete(tokensCuenta)
        .where(
          and(
            eq(tokensCuenta.hash, hash),
            eq(tokensCuenta.tipo, "reset"),
            gt(tokensCuenta.expiresAt, new Date()),
          ),
        )
        .returning();
      if (!t) throw new Error("El enlace venció o ya fue utilizado.");
      await tx
        .update(usuarios)
        .set({
          passwordHash,
          sessionVersion: sql`${usuarios.sessionVersion}+1`,
          updatedAt: new Date(),
        })
        .where(eq(usuarios.id, t.usuarioId));
      await tx
        .delete(tokensCuenta)
        .where(
          and(
            eq(tokensCuenta.usuarioId, t.usuarioId),
            eq(tokensCuenta.tipo, "reset"),
          ),
        );
    });
    return {
      ok: true,
      mensaje:
        "Contraseña actualizada. Ya podés ingresar con tu nueva contraseña.",
    };
  } catch (e) {
    return { error: safeError(e) };
  }
}
export async function verificarEmail(
  _: ActionState,
  fd: FormData,
): Promise<ActionState> {
  try {
    await limitarSolicitud("verificar", 15);
    const token = z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .parse(fd.get("token"));
    await db.transaction(async (tx) => {
      const [t] = await tx
        .delete(tokensCuenta)
        .where(
          and(
            eq(
              tokensCuenta.hash,
              createHash("sha256").update(token).digest("hex"),
            ),
            eq(tokensCuenta.tipo, "verificacion"),
            gt(tokensCuenta.expiresAt, new Date()),
          ),
        )
        .returning();
      if (!t) throw new Error("El enlace venció o ya fue utilizado.");
      await tx
        .update(usuarios)
        .set({ emailVerifiedAt: new Date() })
        .where(eq(usuarios.id, t.usuarioId));
    });
    return { ok: true, mensaje: "Tu email está verificado." };
  } catch (e) {
    return { error: safeError(e) };
  }
}
export async function guardarPerfil(
  _: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const u = await requerirProfesional();
  const p = z.string().trim().min(3).max(120).safeParse(fd.get("nombre"));
  if (!p.success) return { error: "Revisá tu nombre completo." };
  await db
    .update(usuarios)
    .set({ nombre: p.data, updatedAt: new Date() })
    .where(eq(usuarios.id, u.id));
  revalidatePath("/cuenta");
  return {
    ok: true,
    mensaje:
      "Perfil actualizado. Los certificados ya emitidos conservan el nombre original.",
  };
}

export async function reenviarVerificacion(
  prev: ActionState,
): Promise<ActionState> {
  void prev;
  const u = await requerirProfesional();
  if (u.emailVerifiedAt)
    return { ok: true, mensaje: "Tu email ya está verificado." };
  try {
    await limitar("reverificar", u.id, 3, 3600);
    if (!emailDisponible())
      return {
        error:
          "El envío de correo todavía no está habilitado. Contactá a PSICOMAR.",
      };
    const token = randomBytes(32).toString("hex");
    const hash = createHash("sha256").update(token).digest("hex");
    await db.insert(tokensCuenta).values({
      hash,
      usuarioId: u.id,
      tipo: "verificacion",
      expiresAt: new Date(Date.now() + 86400000),
    });
    const ok = await encolarCorreo(
      `verificacion:${hash}`,
      u.email,
      "Verificá tu email",
      enlaceMail("Verificar mi email", `/verificar?token=${token}`),
    );
    return ok
      ? { ok: true, mensaje: "Revisá tu casilla de correo." }
      : { error: "No pudimos enviar el correo. Contactá al equipo." };
  } catch (e) {
    return { error: safeError(e) };
  }
}
