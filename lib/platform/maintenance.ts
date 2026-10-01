import "server-only";
import { and, eq, lt, gt, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  pedidos,
  usuarios,
  correos,
  limites,
  tokensCuenta,
  encuentrosAcademia,
} from "@/db/schema";
import { layoutMail, emailDisponible } from "@/lib/email";
import { enlaceMail, enviarPendiente } from "./mail";
import { escapeHtml } from "./rules";
/** Daily, idempotent reminders. No personal content is returned to the caller. */
export async function mantenimientoDiario(now = new Date()) {
  let reminders = 0,
    sent = 0;
  for (const days of [7, 3, 1]) {
    const lower = new Date(now.getTime() + (days - 1) * 86400000),
      upper = new Date(now.getTime() + days * 86400000);
    const rows = await db
      .select({
        id: pedidos.id,
        nombre: pedidos.nombre,
        email: usuarios.email,
        vence: pedidos.accessExpiresAt,
      })
      .from(pedidos)
      .innerJoin(usuarios, eq(pedidos.usuarioId, usuarios.id))
      .where(
        and(
          eq(pedidos.estado, "aprobado"),
          eq(pedidos.tipo, "curso"),
          gt(pedidos.accessExpiresAt, lower),
          lte(pedidos.accessExpiresAt, upper),
        ),
      );
    for (const p of rows) {
      const inserted = await db
        .insert(correos)
        .values({
          clave: `vencimiento:${p.id}:${days}`,
          destinatario: p.email,
          asunto: `Tu acceso vence en ${days} ${days === 1 ? "día" : "días"}`,
          html: layoutMail(
            "Tu curso sigue disponible",
            `<p>Tu acceso a ${escapeHtml(p.nombre)} vence el ${p.vence!.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}. Aprovechá estos días para completar las clases y la evaluación.</p><p>Los certificados ya emitidos permanecerán en tu cuenta.</p>${enlaceMail("Ir a mis cursos", "/cuenta/cursos")}`,
          ),
        })
        .onConflictDoNothing()
        .returning({ clave: correos.clave });
      reminders += inserted.length;
    }
  }
  const meetings = await db
    .select({
      e: encuentrosAcademia,
      email: usuarios.email,
      nombre: pedidos.nombre,
    })
    .from(encuentrosAcademia)
    .innerJoin(pedidos, eq(encuentrosAcademia.pedidoId, pedidos.id))
    .innerJoin(usuarios, eq(pedidos.usuarioId, usuarios.id))
    .where(
      and(
        eq(encuentrosAcademia.estado, "confirmado"),
        eq(pedidos.estado, "aprobado"),
        gt(encuentrosAcademia.fecha, now),
        lte(encuentrosAcademia.fecha, new Date(now.getTime() + 86400000)),
      ),
    );
  for (const { e, email, nombre } of meetings)
    await db
      .insert(correos)
      .values({
        clave: `recordatorio:${e.id}:${e.fecha.getTime()}`,
        destinatario: email,
        asunto: "Recordatorio de supervisión",
        html: layoutMail(
          "Tu próximo encuentro",
          `<p>${escapeHtml(nombre)}: ${escapeHtml(e.fecha.toLocaleString("es-AR", { timeZone: e.zonaHoraria }))} (${escapeHtml(e.zonaHoraria)}).</p>${enlaceMail("Ver encuentro", "/cuenta/supervisiones")}`,
        ),
      })
      .onConflictDoNothing();
  // An ambiguous provider timeout must be reviewed manually: never blindly resend.
  await db
    .update(correos)
    .set({ estado: "revision", updatedAt: now })
    .where(
      and(
        eq(correos.estado, "enviando"),
        lt(correos.updatedAt, new Date(now.getTime() - 3600000)),
      ),
    );
  if (emailDisponible()) {
    await db
      .update(correos)
      .set({ estado: "pendiente", updatedAt: now })
      .where(
        and(
          eq(correos.estado, "fallido"),
          lt(correos.intentos, 5),
          lt(correos.updatedAt, new Date(now.getTime() - 3600000)),
        ),
      );
    const pending = await db
      .select({ clave: correos.clave })
      .from(correos)
      .where(and(eq(correos.estado, "pendiente"), lt(correos.intentos, 5)))
      .limit(25);
    const start = Date.now();
    for (let i = 0; i < pending.length; i += 5) {
      if (Date.now() - start > 20000) break;
      const batch = await Promise.all(
        pending.slice(i, i + 5).map((m) => enviarPendiente(m.clave)),
      );
      sent += batch.filter(Boolean).length;
    }
  }
  await db.delete(limites).where(lt(limites.expiresAt, now));
  await db.delete(tokensCuenta).where(lt(tokensCuenta.expiresAt, now));
  return { reminders, sent };
}
