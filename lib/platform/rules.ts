import { z } from "zod";
import type { Quiz } from "./types";
export const estadosAdmision = [
  "nueva",
  "contactada",
  "esperando_coordinacion",
  "esperando_abono",
  "abonada",
  "confirmada",
  "realizada",
  "aceptada",
  "derivada",
  "lista_espera",
  "cerrada",
] as const;
export const zonaHoraria = z
  .string()
  .max(100)
  .refine((v) => {
    try {
      new Intl.DateTimeFormat("es", { timeZone: v });
      return true;
    } catch {
      return false;
    }
  }, "Ingresá una zona horaria válida, por ejemplo America/Argentina/Buenos_Aires.");
export const admisionSchema = z.object({
  solicitudKey: z.uuid(),
  nombre: z.string().trim().min(2).max(80),
  apellido: z.string().trim().min(2).max(80),
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  whatsapp: z
    .string()
    .trim()
    .regex(
      /^\+?[\d ()-]{8,25}$/,
      "Ingresá un WhatsApp válido con código de país.",
    ),
  pais: z.string().trim().min(2).max(80),
  zonaHoraria,
  disponibilidad: z.string().trim().min(3).max(300),
  contacto: z.enum(["whatsapp", "email"]),
  mayor: z.literal("on"),
  privacidad: z.literal("on"),
});
export const passwordSchema = z
  .string()
  .min(12, "Usá al menos 12 caracteres.")
  .max(72)
  .refine(
    (v) => Buffer.byteLength(v, "utf8") <= 72,
    "La contraseña es demasiado larga.",
  );
export function validarConfirmacion(a: {
  estado: string;
  abonoRecibido: boolean;
  profesional: string | null;
  fecha: Date | null;
  meet: string | null;
}) {
  if (
    ["confirmada", "realizada", "aceptada"].includes(a.estado) &&
    (!a.abonoRecibido || !a.profesional || !a.fecha || !a.meet)
  )
    throw new Error(
      "Para confirmar necesitás abono recibido, profesional, fecha y enlace de Meet.",
    );
  if (a.estado === "abonada" && !a.abonoRecibido)
    throw new Error("Marcá primero el abono recibido.");
}
export function accesoVigente(
  p: {
    estado: string;
    tipo: string;
    approvedAt: Date | null;
    accessExpiresAt: Date | null;
  },
  now = new Date(),
) {
  return (
    p.estado === "aprobado" &&
    !!p.approvedAt &&
    (p.tipo === "herramienta" ||
      p.tipo === "supervision" ||
      (!!p.accessExpiresAt && p.accessExpiresAt > now))
  );
}
export function vencimiento(tipo: string, desde: Date) {
  return tipo === "curso" ? new Date(desde.getTime() + 30 * 86400000) : null;
}
export function calificar(q: Quiz, respuestas: Record<string, string[]>) {
  if (!q.preguntas.length) throw new Error("La evaluación no está disponible.");
  let total = 0,
    logrado = 0;
  const feedback: string[] = [];
  for (const p of q.preguntas) {
    total += p.puntos;
    const r = [...new Set(respuestas[p.id] ?? [])].sort();
    const correcta = [...p.correctas].sort();
    const ok = JSON.stringify(r) === JSON.stringify(correcta);
    if (ok) logrado += p.puntos;
    feedback.push(
      `${p.texto}: ${ok ? "Correcto" : "Revisá esta respuesta"}. ${p.feedback}`,
    );
  }
  const porcentaje = Math.round((logrado / total) * 100);
  return {
    porcentaje,
    aprobado: (logrado / total) * 100 >= q.aprobacion,
    feedback,
  };
}
export function importeConDescuento(base: number, tipo: string, valor: number) {
  const result =
    base - (tipo === "porcentaje" ? Math.floor((base * valor) / 100) : valor);
  if (result <= 0)
    throw new Error(
      "El cupón debe dejar un importe mayor a cero. Contactá al equipo.",
    );
  return result;
}
export function escapeHtml(v: string) {
  return v.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
export const money = (centavos: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    centavos / 100,
  );
export function meetValido(v: string) {
  try {
    const u = new URL(v);
    return (
      u.protocol === "https:" &&
      u.hostname === "meet.google.com" &&
      !u.username &&
      !u.password
    );
  } catch {
    return false;
  }
}

export function destinoSeguro(value: unknown) {
  if (typeof value !== "string") return "";
  try {
    const u = new URL(value, "https://psicomar.invalid");
    return u.origin === "https://psicomar.invalid" &&
      (u.pathname === "/checkout" || u.pathname.startsWith("/cuenta"))
      ? u.pathname + u.search
      : "";
  } catch {
    return "";
  }
}
