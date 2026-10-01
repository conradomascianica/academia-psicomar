import "server-only";
import { and, eq, desc, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  pedidos,
  ofertas,
  usuarios,
  eventos,
  correos,
  configuracion,
} from "@/db/schema";
import { accesoVigente, vencimiento, escapeHtml } from "./rules";
import { layoutMail } from "@/lib/email";
import { enlaceMail, enviarPendiente } from "./mail";
export async function ajustes() {
  const rows = await db.select().from(configuracion);
  return Object.fromEntries(rows.map((r) => [r.clave, r.valor]));
}
export async function acceso(usuarioId: string, ofertaId: string) {
  const rows = await db
    .select()
    .from(pedidos)
    .where(
      and(
        eq(pedidos.usuarioId, usuarioId),
        eq(pedidos.ofertaId, ofertaId),
        eq(pedidos.estado, "aprobado"),
      ),
    )
    .orderBy(desc(pedidos.approvedAt));
  return rows.find((p) => accesoVigente(p)) ?? null;
}
export async function aprobarPedido(
  id: string,
  origen:
    | { tipo: "transferencia"; actor: string }
    | {
        tipo: "mercadopago";
        paymentId: string;
        importe: number;
        moneda: string;
        collector: string;
        live: boolean;
      },
) {
  const clave = await db.transaction(async (tx) => {
    const [p] = await tx
      .select()
      .from(pedidos)
      .where(eq(pedidos.id, id))
      .for("update");
    if (!p) throw new Error("Pedido inexistente.");
    if (p.metodo !== origen.tipo) throw new Error("Método de pago inválido.");
    if (
      origen.tipo === "mercadopago" &&
      (p.importe !== origen.importe ||
        origen.moneda !== "ARS" ||
        origen.collector !== process.env.MP_COLLECTOR_ID ||
        origen.live !== (process.env.MP_ENV === "production"))
    )
      throw new Error("El pago no coincide con el pedido.");
    if (p.estado === "aprobado") {
      if (origen.tipo === "mercadopago" && p.paymentId !== origen.paymentId)
        throw new Error("Pago duplicado distinto: requiere revisión.");
      return `compra:${id}:aprobada`;
    }
    if (
      origen.tipo === "transferencia" &&
      (p.estado !== "esperando_verificacion" || !p.comprobanteId)
    )
      throw new Error("Primero debe recibirse un comprobante.");
    if (["reembolsado", "cancelado"].includes(p.estado))
      throw new Error("El pedido está cerrado.");
    const [o] = await tx
      .select()
      .from(ofertas)
      .where(eq(ofertas.id, p.ofertaId));
    if (!o) throw new Error("Oferta inexistente.");
    const fecha = new Date();
    await tx
      .update(pedidos)
      .set({
        estado: "aprobado",
        approvedAt: fecha,
        accessExpiresAt: vencimiento(p.tipo, fecha),
        paymentId: origen.tipo === "mercadopago" ? origen.paymentId : null,
        updatedAt: fecha,
      })
      .where(eq(pedidos.id, id));
    await tx
      .insert(eventos)
      .values({
        pedidoId: id,
        evento: "aprobado",
        actor: origen.tipo === "transferencia" ? origen.actor : "mercadopago",
      });
    const [u] = await tx
      .select()
      .from(usuarios)
      .where(eq(usuarios.id, p.usuarioId));
    const key = `compra:${id}:aprobada`;
    await tx
      .insert(correos)
      .values({
        clave: key,
        destinatario: u.email,
        asunto: "Tu compra está aprobada",
        html: layoutMail(
          "Tu compra está aprobada",
          `<p>Ya tenés acceso a ${escapeHtml(p.nombre)}.</p><p>${p.tipo === "curso" ? "Tu acceso a los contenidos digitales dura 30 días desde hoy." : p.tipo === "herramienta" ? "Tu herramienta queda disponible permanentemente en tu biblioteca." : "Coordiná tu encuentro desde Mi Academia por WhatsApp."}</p>${enlaceMail("Ir a Mi Academia", "/cuenta")}`,
        ),
      })
      .onConflictDoNothing();
    return key;
  });
  await enviarPendiente(clave);
}
export async function rechazarPedido(id: string, actor: string) {
  await db.transaction(async (tx) => {
    const [p] = await tx
      .update(pedidos)
      .set({ estado: "rechazado", updatedAt: new Date() })
      .where(
        and(
          eq(pedidos.id, id),
          eq(pedidos.metodo, "transferencia"),
          eq(pedidos.estado, "esperando_verificacion"),
        ),
      )
      .returning();
    if (!p) throw new Error("El pedido no está pendiente de revisión.");
    await tx
      .insert(eventos)
      .values({ pedidoId: id, evento: "transferencia_rechazada", actor });
    const [u] = await tx
      .select()
      .from(usuarios)
      .where(eq(usuarios.id, p.usuarioId));
    await tx
      .insert(correos)
      .values({
        clave: `compra:${id}:rechazada`,
        destinatario: u.email,
        asunto: "Revisá tu transferencia",
        html: layoutMail(
          "Revisá tu transferencia",
          `<p>No pudimos aprobar el comprobante de ${escapeHtml(p.nombre)}. Contactá a PSICOMAR para revisarlo.</p>${enlaceMail("Ver pedido", `/cuenta/compras/${id}`)}`,
        ),
      })
      .onConflictDoNothing();
  });
  await enviarPendiente(`compra:${id}:rechazada`);
}
export async function actualizarPagoNoAprobado(
  id: string,
  paymentId: string,
  estado: string,
) {
  const nuevo = ["refunded", "charged_back"].includes(estado)
    ? "reembolsado"
    : estado === "rejected"
      ? "rechazado"
      : "pendiente";
  await db.transaction(async (tx) => {
    const [p] = await tx
      .select()
      .from(pedidos)
      .where(eq(pedidos.id, id))
      .for("update");
    if (
      !p ||
      p.metodo !== "mercadopago" ||
      ["reembolsado", "cancelado"].includes(p.estado)
    )
      return;
    if (p.estado === "aprobado" && nuevo !== "reembolsado") return;
    if (nuevo === "reembolsado" && p.paymentId !== paymentId) return;
    if (p.estado === nuevo) return;
    await tx
      .update(pedidos)
      .set({ estado: nuevo, updatedAt: new Date() })
      .where(eq(pedidos.id, id));
    await tx
      .insert(eventos)
      .values({ pedidoId: id, evento: nuevo, actor: "mercadopago" });
  });
}
export const reservaCuponActiva = sql`${pedidos.estado} IN ('pendiente','esperando_verificacion','aprobado')`;
export async function comprasUsuario(id: string) {
  return db
    .select({ pedido: pedidos, oferta: ofertas })
    .from(pedidos)
    .innerJoin(ofertas, eq(pedidos.ofertaId, ofertas.id))
    .where(
      and(
        eq(pedidos.usuarioId, id),
        inArray(pedidos.estado, [
          "aprobado",
          "pendiente",
          "esperando_verificacion",
          "rechazado",
          "reembolsado",
          "cancelado",
        ]),
      ),
    )
    .orderBy(desc(pedidos.createdAt));
}
