import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ofertas } from "@/db/schema";
import { requerirProfesional } from "@/lib/auth/dal";
import { ActionForm } from "@/components/platform/ActionForm";
import { comprar } from "@/lib/acciones/compras";
import { ajustes } from "@/lib/platform/commerce";
import { mpDisponible } from "@/lib/platform/payments";
import { privadoDisponible } from "@/lib/platform/storage";
import { money } from "@/lib/platform/rules";
import { Header } from "@/components/layout/Header";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
export default async function Page({ searchParams }: PageProps<"/checkout">) {
  await requerirProfesional();
  const { oferta } = await searchParams;
  if (typeof oferta !== "string" || !z.uuid().safeParse(oferta).success)
    notFound();
  const [o] = await db.select().from(ofertas).where(eq(ofertas.id, oferta));
  if (!o || !o.activa) notFound();
  const settings = await ajustes();
  const mp = mpDisponible() && !!o.precioMp;
  const transferencia =
    !!settings.transferencia_alias &&
    !!settings.transferencia_titular &&
    privadoDisponible() &&
    !!o.precioTransferencia;
  return (
    <>
      <Header />
      <main id="contenido" className="contenedor py-16 max-w-3xl">
        <p className="eyebrow">TU PRÓXIMO PASO</p>
        <h1 className="text-4xl my-5">{o.nombre}</h1>
        <p className="mb-8">
          {o.tipo === "curso"
            ? "30 días de acceso desde la compra aprobada."
            : o.tipo === "herramienta"
              ? "Acceso permanente en tu biblioteca."
              : "Coordinación por WhatsApp después de la compra."}
        </p>
        {!mp && !transferencia ? (
          <p className="empty-state">
            Los medios de pago todavía no están habilitados. Consultá al equipo
            antes de realizar un pago.
          </p>
        ) : (
          <ActionForm action={comprar} label="Continuar">
            <input type="hidden" name="ofertaId" value={o.id} />
            <input type="hidden" name="clave" value={randomUUID()} />
            <fieldset>
              <legend className="mb-4">Elegí cómo pagar</legend>
              {transferencia && (
                <label className="check-label py-4">
                  <input
                    name="metodo"
                    type="radio"
                    value="transferencia"
                    required
                  />
                  Transferencia: {money(o.precioTransferencia!)}
                </label>
              )}
              {mp && (
                <label className="check-label py-4">
                  <input
                    name="metodo"
                    type="radio"
                    value="mercadopago"
                    required
                  />
                  Mercado Pago: {money(o.precioMp!)}
                </label>
              )}
            </fieldset>
            <label>
              Cupón (opcional)
              <input name="cupon" maxLength={40} autoComplete="off" />
            </label>
            <p className="text-sm">
              El descuento se valida al continuar. En transferencia, el acceso
              se habilita después de verificar el comprobante.
            </p>
          </ActionForm>
        )}
      </main>
    </>
  );
}
