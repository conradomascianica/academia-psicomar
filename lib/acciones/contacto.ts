"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { consultas } from "@/db/schema";
import { encolarCorreo } from "@/lib/platform/mail";
import { limitarSolicitud, limitar } from "@/lib/platform/security";
import { escapeHtml } from "@/lib/platform/rules";
import { revalidatePath } from "next/cache";
import { site } from "@/lib/site";

export interface EstadoContacto {
  ok: boolean;
  mensaje?: string;
  errores?: Partial<Record<"nombre" | "email" | "motivo" | "mensaje", string>>;
}

const schema = z.object({
  nombre: z.string().trim().min(2, "Contanos tu nombre.").max(120),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Ingresá un email válido.")
    .max(254),
  motivo: z.enum(["formacion", "supervision", "herramientas", "otro"], {
    message: "Elegí un motivo.",
  }),
  mensaje: z
    .string()
    .trim()
    .min(10, "Escribí un mensaje un poco más largo.")
    .max(3000),
});

const ETIQUETA_MOTIVO: Record<string, string> = {
  formacion: "Talleres y cursos",
  supervision: "Supervisiones grupales",
  herramientas: "Packs de herramientas",
  otro: "Otra consulta",
};

export async function enviarConsulta(
  _prev: EstadoContacto,
  formData: FormData,
): Promise<EstadoContacto> {
  const parsed = schema.safeParse({
    nombre: formData.get("nombre"),
    email: formData.get("email"),
    motivo: formData.get("motivo"),
    mensaje: formData.get("mensaje"),
  });

  if (!parsed.success) {
    const errores: EstadoContacto["errores"] = {};
    for (const issue of parsed.error.issues) {
      const campo = issue.path[0] as keyof NonNullable<
        EstadoContacto["errores"]
      >;
      if (campo && !errores[campo]) errores[campo] = issue.message;
    }
    return { ok: false, errores };
  }

  const { nombre, email, motivo, mensaje } = parsed.data;

  try {
    await limitarSolicitud("contacto", 12);
    await limitar("contacto-email", email, 5, 3600);
  } catch {
    return {
      ok: false,
      mensaje: "Esperá unos minutos antes de enviar otra consulta.",
    };
  }
  const [consulta] = await db
    .insert(consultas)
    .values({ nombre, email, tipo: motivo, mensaje })
    .returning();
  const destino = process.env.EMAIL_CONSULTAS || site.email;
  await encolarCorreo(
    `consulta:${consulta.id}`,
    destino,
    "Nueva consulta desde la web",
    `<p>Nombre: ${escapeHtml(nombre)}</p><p>Email: ${escapeHtml(email)}</p><p>Motivo: ${escapeHtml(ETIQUETA_MOTIVO[motivo])}</p><p style="white-space:pre-wrap">${escapeHtml(mensaje)}</p>`,
  );
  revalidatePath("/admin/consultas");
  return {
    ok: true,
    mensaje:
      "¡Recibimos tu consulta! Te vamos a responder al mail que dejaste dentro de las próximas 48 h hábiles.",
  };
}
