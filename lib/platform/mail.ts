import "server-only";
import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { correos } from "@/db/schema";
import { enviarMail, layoutMail } from "@/lib/email";
import { escapeHtml } from "./rules";
import { SITE_URL } from "@/lib/site";
export async function encolarCorreo(
  clave: string,
  destinatario: string,
  asunto: string,
  contenido: string,
) {
  await db
    .insert(correos)
    .values({
      clave,
      destinatario,
      asunto,
      html: layoutMail(asunto, contenido),
    })
    .onConflictDoNothing();
  return enviarPendiente(clave);
}
export async function enviarPendiente(clave: string) {
  const [m] = await db
    .update(correos)
    .set({
      estado: "enviando",
      intentos: sql`${correos.intentos}+1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(correos.clave, clave),
        eq(correos.estado, "pendiente"),
        lt(correos.intentos, 5),
      ),
    )
    .returning();
  if (!m) {
    const [sent] = await db
      .select({ estado: correos.estado })
      .from(correos)
      .where(eq(correos.clave, clave));
    return sent?.estado === "enviado";
  }
  const r = await enviarMail({
    to: m.destinatario,
    subject: m.asunto,
    html: m.html,
  });
  await db
    .update(correos)
    .set({
      estado: r.ok ? "enviado" : r.ambiguo ? "revision" : "fallido",
      updatedAt: new Date(),
    })
    .where(eq(correos.clave, clave));
  return r.ok;
}
export function enlaceMail(texto: string, path: string) {
  return `<p><a href="${escapeHtml(`${SITE_URL}${path}`)}">${escapeHtml(texto)}</a></p>`;
}
