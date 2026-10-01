import { z } from "zod";
const material = z.object({
  id: z.string().min(1).max(100),
  nombre: z.string().min(1).max(150),
  archivoId: z.uuid(),
});
const leccion = z.object({
  id: z.string().min(1).max(100),
  titulo: z.string().min(1).max(200),
  texto: z.string().max(30000),
  videoProvider: z.enum(["youtube", "vimeo"]).optional(),
  videoId: z
    .string()
    .regex(/^[a-zA-Z0-9_-]*$/)
    .max(100)
    .optional(),
  requerida: z.boolean(),
  materiales: z.array(material).max(30),
});
export const curriculumSchema = z
  .object({
    modulos: z
      .array(
        z.object({
          id: z.string().min(1),
          titulo: z.string().min(1).max(200),
          lecciones: z.array(leccion).max(100),
        }),
      )
      .max(50),
    liveUrl: z
      .string()
      .url()
      .refine((v) => {
        const u = new URL(v);
        return (
          u.protocol === "https:" &&
          (u.hostname === "meet.google.com" ||
            u.hostname === "zoom.us" ||
            u.hostname.endsWith(".zoom.us"))
        );
      })
      .optional(),
    liveAt: z.iso.datetime({ offset: true }).optional(),
    timezone: z.string().max(100).optional(),
    cupo: z.number().int().min(1).max(10000).optional(),
  })
  .refine((c) => {
    const ids = c.modulos.flatMap((m) => m.lecciones.map((l) => l.id));
    return new Set(ids).size === ids.length;
  }, "Cada clase debe tener un identificador único.");
export const quizSchema = z
  .object({
    aprobacion: z.number().min(1).max(100),
    intentos: z.number().int().min(1).max(20),
    requerirContenidos: z.boolean(),
    preguntas: z
      .array(
        z
          .object({
            id: z.string().min(1).max(100),
            texto: z.string().min(1).max(1000),
            tipo: z.enum(["unica", "multiple", "vf"]),
            opciones: z
              .array(
                z.object({
                  id: z.string().min(1),
                  texto: z.string().min(1).max(500),
                }),
              )
              .min(2)
              .max(10),
            correctas: z.array(z.string()).min(1),
            puntos: z.number().int().min(1).max(100),
            feedback: z.string().max(1000),
          })
          .refine(
            (q) =>
              new Set(q.opciones.map((o) => o.id)).size === q.opciones.length &&
              new Set(q.correctas).size === q.correctas.length &&
              q.correctas.every((id) => q.opciones.some((o) => o.id === id)) &&
              (q.tipo === "multiple" || q.correctas.length === 1) &&
              (q.tipo !== "vf" || q.opciones.length === 2),
            "Revisá las respuestas correctas.",
          ),
      )
      .max(100),
  })
  .refine(
    (q) => new Set(q.preguntas.map((p) => p.id)).size === q.preguntas.length,
    "Cada pregunta debe tener un identificador único.",
  );
export const materialesSchema = z.array(material).max(100);
