import "server-only";
import {
  MercadoPagoConfig,
  Preference,
  Payment,
  PreApproval,
} from "mercadopago";
import { SITE_URL } from "@/lib/site";
export const mpDisponible = () =>
  !!(
    process.env.MP_ACCESS_TOKEN &&
    process.env.MP_WEBHOOK_SECRET &&
    process.env.MP_COLLECTOR_ID &&
    ["test", "production"].includes(process.env.MP_ENV ?? "") &&
    (process.env.VERCEL_ENV !== "preview" || process.env.MP_ENV === "test")
  );
function client() {
  if (!mpDisponible())
    throw new Error("Mercado Pago no está habilitado todavía.");
  if (process.env.VERCEL_ENV === "preview" && process.env.MP_ENV !== "test")
    throw new Error("La preview requiere pagos de prueba.");
  return new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
    options: { timeout: 12000 },
  });
}
export async function crearPreferencia(p: {
  id: string;
  nombre: string;
  importe: number;
}) {
  const r = await new Preference(client()).create({
    body: {
      items: [
        {
          id: p.id,
          title: p.nombre,
          quantity: 1,
          unit_price: p.importe / 100,
          currency_id: "ARS",
        },
      ],
      external_reference: p.id,
      notification_url: `${SITE_URL}/api/pagos/webhook`,
      back_urls: {
        success: `${SITE_URL}/checkout/exito`,
        pending: `${SITE_URL}/checkout/pendiente`,
        failure: `${SITE_URL}/checkout/error`,
      },
      auto_return: "approved",
    },
    requestOptions: { idempotencyKey: p.id },
  });
  const url =
    process.env.MP_ENV === "test" ? r.sandbox_init_point : r.init_point;
  if (!url || !r.id)
    throw new Error("No pudimos abrir Mercado Pago. Tu pedido sigue guardado.");
  return { preferenceId: r.id, checkoutUrl: url };
}
export async function obtenerPago(id: string) {
  return new Payment(client()).get({ id });
}
/** Encapsulated until recurring test credentials and QA are available; no UI promises automatic renewal. */
export async function crearSuscripcionPrueba(
  email: string,
  importe: number,
  referencia: string,
) {
  if (
    process.env.MP_SUBSCRIPTIONS_ENABLED !== "true" ||
    process.env.MP_ENV !== "test"
  )
    throw new Error("Suscripciones automáticas pendientes de validación.");
  return new PreApproval(client()).create({
    body: {
      reason: "Supervisión grupal PSICOMAR",
      external_reference: referencia,
      payer_email: email,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: importe / 100,
        currency_id: "ARS",
      },
      back_url: `${SITE_URL}/cuenta`,
      status: "pending",
    },
  });
}
