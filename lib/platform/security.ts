import "server-only";
import { ZodError } from "zod";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { limites } from "@/db/schema";
/** Durable atomic limits shared across Vercel instances. Never store raw IP/email. */
export async function limitar(
  accion: string,
  identidad: string,
  max = 8,
  segundos = 900,
) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Servicio temporalmente no disponible.");
  const clave = createHmac("sha256", secret)
    .update(`${accion}:${identidad}`)
    .digest("hex");
  const expiresAt = new Date(Date.now() + segundos * 1000);
  const [r] = await db
    .insert(limites)
    .values({ clave, cantidad: 1, expiresAt })
    .onConflictDoUpdate({
      target: limites.clave,
      set: {
        cantidad: sql`CASE WHEN ${limites.expiresAt}<now() THEN 1 ELSE ${limites.cantidad}+1 END`,
        expiresAt: sql`CASE WHEN ${limites.expiresAt}<now() THEN ${expiresAt.toISOString()}::timestamptz ELSE ${limites.expiresAt} END`,
      },
    })
    .returning();
  if (r.cantidad > max)
    throw new Error(
      "Hubo varios intentos. Esperá unos minutos antes de volver a intentar.",
    );
}
export async function limitarSolicitud(accion: string, max = 20) {
  const h = await headers();
  // Vercel overwrites this header. Do not trust arbitrary x-forwarded-for off Vercel.
  const ip = process.env.VERCEL
    ? (h.get("x-vercel-forwarded-for") ?? "desconocida")
    : "local";
  await limitar(accion, ip, max);
}
export function safeError(e: unknown) {
  if (e instanceof ZodError)
    return "Revisá los campos del formulario y sus formatos.";
  return e instanceof Error &&
    !/query|postgres|sql|token|fetch|database|connection/i.test(e.message)
    ? e.message
    : "No pudimos completar la operación. Intentá nuevamente.";
}
