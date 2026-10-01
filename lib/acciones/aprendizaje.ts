"use server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  ofertas,
  progreso,
  intentos,
  certificados,
  usuarios,
  pedidos,
  correos,
} from "@/db/schema";
import { requerirProfesional } from "@/lib/auth/dal";
import { accesoVigente, calificar, escapeHtml } from "@/lib/platform/rules";
import { limitar, safeError } from "@/lib/platform/security";
import { enlaceMail, enviarPendiente } from "@/lib/platform/mail";
import { layoutMail } from "@/lib/email";
import type { ActionState } from "@/lib/platform/types";
async function lockAcceso(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  uid: string,
  oid: string,
) {
  await tx.select().from(usuarios).where(eq(usuarios.id, uid)).for("update");
  const ps = await tx
    .select()
    .from(pedidos)
    .where(
      and(
        eq(pedidos.usuarioId, uid),
        eq(pedidos.ofertaId, oid),
        eq(pedidos.estado, "aprobado"),
      ),
    )
    .for("update");
  if (!ps.some((p) => accesoVigente(p)))
    throw new Error("Tu acceso no está activo.");
}
async function emitir(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  uid: string,
  oferta: typeof ofertas.$inferSelect,
) {
  const completadas = await tx
    .select()
    .from(progreso)
    .where(and(eq(progreso.usuarioId, uid), eq(progreso.ofertaId, oferta.id)));
  const requeridas = oferta.curriculum.modulos
    .flatMap((m) => m.lecciones)
    .filter((l) => l.requerida);
  if (!requeridas.length && !oferta.evaluacion.preguntas.length) return;
  if (
    oferta.evaluacion.requerirContenidos &&
    !requeridas.every((l) => completadas.some((p) => p.leccionId === l.id))
  )
    return;
  const aprobadas = await tx
    .select()
    .from(intentos)
    .where(
      and(
        eq(intentos.usuarioId, uid),
        eq(intentos.ofertaId, oferta.id),
        eq(intentos.aprobado, true),
      ),
    );
  if (oferta.evaluacion.preguntas.length && !aprobadas.length) return;
  if (!oferta.cargaHoraria) return;
  const [u] = await tx.select().from(usuarios).where(eq(usuarios.id, uid));
  const [c] = await tx
    .insert(certificados)
    .values({
      usuarioId: uid,
      ofertaId: oferta.id,
      nombre: u.nombre,
      actividad: oferta.nombre,
      cargaHoraria: oferta.cargaHoraria,
    })
    .onConflictDoNothing()
    .returning();
  if (c)
    await tx
      .insert(correos)
      .values({
        clave: `certificado:${c.id}`,
        destinatario: u.email,
        asunto: "Tu certificado está disponible",
        html: layoutMail(
          "Tu certificado está disponible",
          `<p>Completaste ${escapeHtml(oferta.nombre)}.</p>${enlaceMail("Ver certificados", "/cuenta/certificados")}`,
        ),
      })
      .onConflictDoNothing();
  return c?.id;
}
export async function completarLeccion(
  _: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const u = await requerirProfesional();
  try {
    const id = z.uuid().parse(fd.get("ofertaId"));
    const leccionId = z.string().max(100).parse(fd.get("leccionId"));
    const c = await db.transaction(async (tx) => {
      await lockAcceso(tx, u.id, id);
      const [o] = await tx.select().from(ofertas).where(eq(ofertas.id, id));
      if (
        !o ||
        !o.curriculum.modulos.some((m) =>
          m.lecciones.some((l) => l.id === leccionId),
        )
      )
        throw new Error("Clase no disponible.");
      await tx
        .insert(progreso)
        .values({ usuarioId: u.id, ofertaId: id, leccionId })
        .onConflictDoNothing();
      return emitir(tx, u.id, o);
    });
    if (c) await enviarPendiente(`certificado:${c}`);
    revalidatePath(`/cuenta/cursos/${id}`);
    return { ok: true, mensaje: "Progreso guardado." };
  } catch (e) {
    return { error: safeError(e) };
  }
}
export async function enviarEvaluacion(
  _: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const u = await requerirProfesional();
  try {
    await limitar("evaluacion", u.id, 15);
    const id = z.uuid().parse(fd.get("ofertaId"));
    const result = await db.transaction(async (tx) => {
      await lockAcceso(tx, u.id, id);
      const [o] = await tx.select().from(ofertas).where(eq(ofertas.id, id));
      if (!o) throw new Error("Evaluación no disponible.");
      const [n] = await tx
        .select({ n: sql<number>`count(*)::int` })
        .from(intentos)
        .where(and(eq(intentos.usuarioId, u.id), eq(intentos.ofertaId, id)));
      if (n.n >= o.evaluacion.intentos)
        throw new Error("Alcanzaste el máximo de intentos.");
      const respuestas = Object.fromEntries(
        o.evaluacion.preguntas.map((p) => [
          p.id,
          fd.getAll(`q_${p.id}`).map(String),
        ]),
      );
      const resultado = calificar(o.evaluacion, respuestas);
      await tx
        .insert(intentos)
        .values({ usuarioId: u.id, ofertaId: id, respuestas, ...resultado });
      const cert = await emitir(tx, u.id, o);
      return { ...resultado, cert };
    });
    if (result.cert) await enviarPendiente(`certificado:${result.cert}`);
    revalidatePath(`/cuenta/cursos/${id}`);
    return {
      ok: true,
      mensaje: `Resultado: ${result.porcentaje}%. ${result.aprobado ? "Evaluación aprobada." : "Todavía no alcanzaste la nota de aprobación."}`,
    };
  } catch (e) {
    return { error: safeError(e) };
  }
}
