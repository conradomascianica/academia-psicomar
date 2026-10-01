import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { usuarios } from "@/db/schema";
import { leerSesion } from "./session";
export const usuarioActual = cache(async () => {
  const s = await leerSesion();
  if (!s) return null;
  const [u] = await db
    .select({
      id: usuarios.id,
      email: usuarios.email,
      nombre: usuarios.nombre,
      rol: usuarios.rol,
      sessionVersion: usuarios.sessionVersion,
      emailVerifiedAt: usuarios.emailVerifiedAt,
    })
    .from(usuarios)
    .where(eq(usuarios.id, s.userId))
    .limit(1);
  if (!u || u.rol !== s.rol || u.sessionVersion !== (s.sessionVersion ?? 0))
    return null;
  return u;
});
export const verificarSesion = cache(async () => {
  const u = await usuarioActual();
  if (!u) redirect("/acceso");
  return { ...u, userId: u.id };
});
export const requerirAdmin = cache(async () => {
  const u = await verificarSesion();
  if (u.rol !== "admin") redirect("/cuenta");
  return u;
});
export const requerirProfesional = cache(async () => {
  const u = await usuarioActual();
  if (!u) redirect("/ingresar");
  if (u.rol === "admin") redirect("/admin");
  if (u.rol !== "profesional") redirect("/");
  return u;
});
