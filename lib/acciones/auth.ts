"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { usuarios } from "@/db/schema";
import { verificarPassword } from "@/lib/auth/password";
import { limitar, limitarSolicitud, safeError } from "@/lib/platform/security";
import { destinoSeguro } from "@/lib/platform/rules";
import { crearSesion, borrarSesion } from "@/lib/auth/session";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Ingresá un email válido."),
  password: z.string().min(1, "Ingresá tu contraseña."),
});

export interface EstadoLogin {
  error?: string;
}

export async function iniciarSesion(
  _prev: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { email, password } = parsed.data;
  try { await limitarSolicitud("login", 30); await limitar("login-email",email,8); } catch(e) { return {error:safeError(e)}; }

  const filas = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.email, email))
    .limit(1);
  const usuario = filas[0];

  // Mensaje genérico para no revelar si el email existe.
  const generico = { error: "Email o contraseña incorrectos." };


  const ok = await verificarPassword(password, usuario?.passwordHash ?? "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxI3W/QXAELJBdgQr.j.Gt0TPfy");
  if (!usuario || !ok) return generico;

  await crearSesion({
    userId: usuario.id,
    rol: usuario.rol,
    nombre: usuario.nombre,
    sessionVersion: usuario.sessionVersion,
  });

  const volver = destinoSeguro(formData.get("volver"));
  redirect(usuario.rol === "admin" ? "/admin" : volver || "/cuenta");
}

export async function cerrarSesion(): Promise<void> {
  await borrarSesion();
  redirect("/acceso");
}
