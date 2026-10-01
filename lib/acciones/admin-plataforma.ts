"use server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  ofertas,
  formaciones,
  productos,
  cupones,
  configuracion,
  archivosPrivados,
  correos,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth/dal";
import { safeError } from "@/lib/platform/security";
import {
  curriculumSchema,
  quizSchema,
  materialesSchema,
} from "@/lib/platform/content-schema";
import { guardarPrivado } from "@/lib/platform/storage";
import { enviarPendiente } from "@/lib/platform/mail";
import type { ActionState } from "@/lib/platform/types";
export async function prepararCatalogo(
  prev: ActionState,
): Promise<ActionState> {
  void prev;
  await requerirAdmin();
  await db.transaction(async (tx) => {
    const fs = await tx.select().from(formaciones);
    for (const f of fs)
      await tx
        .insert(ofertas)
        .values({
          clave: `curso:${f.slug}`,
          tipo: "curso",
          nombre: f.nombre,
          formacionId: f.id,
          precioMp: f.precio ? f.precio * 100 : null,
          cargaHoraria: f.duracion,
        })
        .onConflictDoNothing();
    const ps = await tx.select().from(productos);
    for (const p of ps)
      await tx
        .insert(ofertas)
        .values({
          clave: `herramienta:${p.slug}`,
          tipo: "herramienta",
          nombre: p.nombre,
          productoId: p.id,
          precioMp: p.precio ? p.precio * 100 : null,
        })
        .onConflictDoNothing();
    for (const [clave, nombre] of [
      ["30", "Supervisión individual · 30 minutos"],
      ["60", "Supervisión individual · 60 minutos"],
      ["grupal", "Supervisión grupal · mes"],
    ])
      await tx
        .insert(ofertas)
        .values({ clave: `supervision:${clave}`, tipo: "supervision", nombre })
        .onConflictDoNothing();
  });
  revalidatePath("/admin/academia");
  return {
    ok: true,
    mensaje:
      "Catálogo preparado. Las ofertas nuevas quedan inactivas hasta completar y revisar su contenido.",
  };
}
export async function guardarOferta(
  _: ActionState,
  fd: FormData,
): Promise<ActionState> {
  await requerirAdmin();
  try {
    const id = z.uuid().parse(fd.get("id"));
    const nombre = z.string().trim().min(3).max(200).parse(fd.get("nombre"));
    const curriculum = curriculumSchema.parse(
      JSON.parse(String(fd.get("curriculum"))),
    );
    const evaluacion = quizSchema.parse(
      JSON.parse(String(fd.get("evaluacion"))),
    );
    const materiales = materialesSchema.parse(
      JSON.parse(String(fd.get("materiales"))),
    );
    const cargaHoraria = z.string().max(200).parse(fd.get("cargaHoraria"));
    const precio = (v: FormDataEntryValue | null) => {
      if (!v) return null;
      const n = Number(v);
      if (!Number.isFinite(n) || n <= 0 || n > 20000000)
        throw new Error("Revisá el precio.");
      return Math.round(n * 100);
    };
    const precioMp = precio(fd.get("precioMp")),
      precioTransferencia = precio(fd.get("precioTransferencia"));
    const activa = fd.get("activa") === "on";
    const [o] = await db.select().from(ofertas).where(eq(ofertas.id, id));
    if (!o) throw new Error("Oferta inexistente.");
    const refs = [
      ...materiales,
      ...curriculum.modulos.flatMap((m) =>
        m.lecciones.flatMap((l) => l.materiales),
      ),
    ].map((m) => m.archivoId);
    if (refs.length) {
      const validos = await db
        .select()
        .from(archivosPrivados)
        .where(
          and(
            inArray(archivosPrivados.id, refs),
            eq(archivosPrivados.uso, "material"),
          ),
        );
      if (refs.some((id) => !validos.some((a) => a.id === id)))
        throw new Error(
          "Uno de los materiales no existe en el almacenamiento privado.",
        );
    }
    if (activa) {
      if (!precioMp && !precioTransferencia)
        throw new Error("Definí al menos un precio antes de habilitar ventas.");
      if (o.tipo === "herramienta" && !materiales.length)
        throw new Error("Agregá al menos un archivo privado.");
      if (
        o.tipo === "curso" &&
        !curriculum.modulos.some((m) => m.lecciones.length) &&
        !curriculum.liveUrl
      )
        throw new Error(
          "Agregá clases o la información del encuentro en vivo.",
        );
    }
    await db
      .update(ofertas)
      .set({
        nombre,
        curriculum,
        evaluacion,
        materiales,
        cargaHoraria,
        precioMp,
        precioTransferencia,
        activa,
        updatedAt: new Date(),
      })
      .where(eq(ofertas.id, id));
    revalidatePath("/", "layout");
    return { ok: true, mensaje: "Propuesta guardada." };
  } catch (e) {
    return { error: safeError(e) };
  }
}
export async function cargarMaterial(
  _: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const u = await requerirAdmin();
  try {
    const f = fd.get("archivo");
    if (!(f instanceof File)) throw new Error("Seleccioná un archivo.");
    const datos = await guardarPrivado(f, "material");
    const [a] = await db
      .insert(archivosPrivados)
      .values({ ...datos, propietarioId: u.id, uso: "material" })
      .returning();
    revalidatePath("/admin/academia");
    return { ok: true, mensaje: `Archivo cargado: ${a.nombre}`, id: a.id };
  } catch (e) {
    return { error: safeError(e) };
  }
}
export async function guardarCupon(
  _: ActionState,
  fd: FormData,
): Promise<ActionState> {
  await requerirAdmin();
  try {
    const p = z
      .object({
        codigo: z
          .string()
          .trim()
          .toUpperCase()
          .regex(/^[A-Z0-9_-]{3,40}$/),
        tipo: z.enum(["porcentaje", "fijo"]),
        valor: z.coerce.number().positive(),
        limite: z.coerce.number().int().positive(),
        porUsuario: z.coerce.number().int().positive(),
        desde: z.iso.datetime({ offset: true }),
        hasta: z.iso.datetime({ offset: true }),
      })
      .parse(Object.fromEntries(fd));
    const desde = new Date(p.desde),
      hasta = new Date(p.hasta);
    if (isNaN(desde.getTime()) || isNaN(hasta.getTime()) || hasta <= desde)
      throw new Error("Revisá las fechas.");
    if (p.tipo === "porcentaje" && p.valor >= 100)
      throw new Error("El porcentaje debe ser menor a 100.");
    const valor =
      p.tipo === "fijo" ? Math.round(p.valor * 100) : Math.round(p.valor);
    const ids = fd.getAll("ofertas").map((v) => z.uuid().parse(v));
    await db
      .insert(cupones)
      .values({
        ...p,
        valor,
        desde,
        hasta,
        activo: fd.get("activo") === "on",
        ofertas: ids,
      })
      .onConflictDoUpdate({
        target: cupones.codigo,
        set: {
          tipo: p.tipo,
          valor,
          desde,
          hasta,
          limite: p.limite,
          porUsuario: p.porUsuario,
          activo: fd.get("activo") === "on",
          ofertas: ids,
          updatedAt: new Date(),
        },
      });
    revalidatePath("/admin/cupones");
    return { ok: true, mensaje: "Cupón guardado." };
  } catch (e) {
    return { error: safeError(e) };
  }
}
export async function guardarConfiguracion(
  _: ActionState,
  fd: FormData,
): Promise<ActionState> {
  await requerirAdmin();
  try {
    const values = [
      "transferencia_alias",
      "transferencia_titular",
      "transferencia_cbu",
    ].map((clave) => ({
      clave,
      valor: z
        .string()
        .trim()
        .max(150)
        .parse(fd.get(clave) ?? ""),
    }));
    const cbu = values.find((v) => v.clave === "transferencia_cbu")!.valor;
    if (cbu && !/^\d{22}$/.test(cbu))
      throw new Error("El CBU/CVU debe tener 22 dígitos.");
    await db.transaction(async (tx) => {
      for (const v of values)
        await tx
          .insert(configuracion)
          .values(v)
          .onConflictDoUpdate({
            target: configuracion.clave,
            set: { valor: v.valor, updatedAt: new Date() },
          });
    });
    revalidatePath("/admin/configuracion");
    return { ok: true, mensaje: "Configuración guardada." };
  } catch (e) {
    return { error: safeError(e) };
  }
}
export async function reintentarCorreo(
  _: ActionState,
  fd: FormData,
): Promise<ActionState> {
  await requerirAdmin();
  const clave = z.string().max(200).parse(fd.get("clave"));
  await db
    .update(correos)
    .set({ estado: "pendiente", updatedAt: new Date() })
    .where(
      and(
        eq(correos.clave, clave),
        inArray(correos.estado, ["fallido", "revision"]),
        sql`${correos.intentos}<5`,
      ),
    );
  const ok = await enviarPendiente(clave);
  revalidatePath("/admin/configuracion");
  return {
    ok,
    mensaje: ok
      ? "Correo enviado."
      : "No se envió. Revisá la configuración o el límite de 5 intentos.",
  };
}
