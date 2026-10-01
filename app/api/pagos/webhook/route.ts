import {
  WebhookSignatureValidator,
  InvalidWebhookSignatureError,
} from "mercadopago";
import { z } from "zod";
import { obtenerPago, mpDisponible } from "@/lib/platform/payments";
import {
  aprobarPedido,
  actualizarPagoNoAprobado,
} from "@/lib/platform/commerce";
export async function POST(req: Request) {
  if (!mpDisponible())
    return new Response("Servicio no configurado", { status: 503 });
  const url = new URL(req.url);
  const id = url.searchParams.get("data.id");
  if (!id || !/^\d+$/.test(id))
    return new Response("Notificación inválida", { status: 400 });
  try {
    WebhookSignatureValidator.validate({
      xSignature: req.headers.get("x-signature"),
      xRequestId: req.headers.get("x-request-id"),
      dataId: id,
      secret: process.env.MP_WEBHOOK_SECRET!,
      toleranceSeconds: 300,
    });
  } catch (e) {
    return new Response("Firma inválida", {
      status: e instanceof InvalidWebhookSignatureError ? 401 : 400,
    });
  }
  try {
    const pago = await obtenerPago(id);
    const pedidoId = z.uuid().parse(pago.external_reference);
    if (pago.status === "approved") {
      await aprobarPedido(pedidoId, {
        tipo: "mercadopago",
        paymentId: String(pago.id),
        importe: Math.round((pago.transaction_amount ?? 0) * 100),
        moneda: pago.currency_id ?? "",
        collector: String(pago.collector_id),
        live: pago.live_mode ?? false,
      });
    } else if (
      String(pago.collector_id) === process.env.MP_COLLECTOR_ID &&
      pago.live_mode === (process.env.MP_ENV === "production")
    )
      await actualizarPagoNoAprobado(pedidoId, id, pago.status ?? "pending");
    return Response.json({ received: true });
  } catch {
    console.error("[payments] webhook_processing_failed");
    return new Response("No se pudo verificar el pago", { status: 500 });
  }
}
