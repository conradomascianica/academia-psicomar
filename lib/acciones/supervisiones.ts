"use server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  encuentrosAcademia,
  pedidos,
  ofertas,
  usuarios,
  correos,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth/dal";
import { zonaHoraria, escapeHtml } from "@/lib/platform/rules";
import { safeError } from "@/lib/platform/security";
import { layoutMail } from "@/lib/email";
import { enlaceMail, enviarPendiente } from "@/lib/platform/mail";
import type { ActionState } from "@/lib/platform/types";
export async function coordinarSupervision(
  _: ActionState,
  fd: FormData,
): Promise<ActionState> {
  await requerirAdmin();
  try {
    const p = z
      .object({
        pedidoId: z.uuid(),
        numero: z.coerce.number().int().min(1).max(2),
        fecha: z.iso.datetime({ offset: true }),
        zonaHoraria,
        enlace: z.url().refine((v) => {
          const u = new URL(v);
          return (
            u.protocol === "https:" &&
            (u.hostname === "meet.google.com" ||
              u.hostname === "zoom.us" ||
              u.hostname.endsWith(".zoom.us"))
          );
        }),
        estado: z.enum(["confirmado", "realizado", "cancelado"]),
      })
      .parse(Object.fromEntries(fd));
    const fecha = new Date(p.fecha);
    const key = await db.transaction(async (tx) => {
      const [order] = await tx
        .select({ p: pedidos, o: ofertas })
        .from(pedidos)
        .innerJoin(ofertas, eq(ofertas.id, pedidos.ofertaId))
        .where(
          and(
            eq(pedidos.id, p.pedidoId),
            eq(pedidos.estado, "aprobado"),
            eq(pedidos.tipo, "supervision"),
          ),
        );
      if (!order)
        throw new Error("Se requiere una supervisión con pago aprobado.");
      if (order.o.clave !== "supervision:grupal" && p.numero !== 1)
        throw new Error("La supervisión individual incluye un encuentro.");
      const [e] = await tx
        .insert(encuentrosAcademia)
        .values({ ...p, fecha })
        .onConflictDoUpdate({
          target: [encuentrosAcademia.pedidoId, encuentrosAcademia.numero],
          set: {
            fecha,
            zonaHoraria: p.zonaHoraria,
            enlace: p.enlace,
            estado: p.estado,
            updatedAt: new Date(),
          },
        })
        .returning();
      const [u] = await tx
        .select()
        .from(usuarios)
        .where(eq(usuarios.id, order.p.usuarioId));
      const clave = `encuentro:${e.id}:${e.updatedAt.getTime()}`;
      const when = fecha.toLocaleString("es-AR", { timeZone: p.zonaHoraria });
      await tx
        .insert(correos)
        .values({
          clave,
          destinatario: u.email,
          asunto: "Actualización de tu supervisión",
          html: layoutMail(
            "Tu supervisión",
            `<p>${escapeHtml(order.p.nombre)} · Encuentro ${p.numero}: ${escapeHtml(p.estado)}.</p><p>${escapeHtml(when)} (${escapeHtml(p.zonaHoraria)}).</p>${p.estado === "confirmado" ? `<p><a href="${escapeHtml(p.enlace)}">Ingresar al encuentro</a></p>` : ""}${enlaceMail("Ver mis supervisiones", "/cuenta/supervisiones")}`,
          ),
        });
      return clave;
    });
    const sent = await enviarPendiente(key);
    revalidatePath("/cuenta");
    revalidatePath(`/admin/ventas/${p.pedidoId}`);
    return {
      ok: true,
      mensaje: sent
        ? "Encuentro guardado y correo enviado."
        : "Encuentro guardado. El correo no se envió; revisá Configuración.",
    };
  } catch (e) {
    return { error: safeError(e) };
  }
}
