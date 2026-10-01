import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { pedidos } from "@/db/schema";
import { requerirProfesional } from "@/lib/auth/dal";
import { ajustes } from "@/lib/platform/commerce";
import { money } from "@/lib/platform/rules";
import { ActionForm } from "@/components/platform/ActionForm";
import { subirComprobante, cancelarPedido } from "@/lib/acciones/compras";
export default async function Page({
  params,
}: PageProps<"/cuenta/compras/[id]">) {
  const u = await requerirProfesional();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [p] = await db
    .select()
    .from(pedidos)
    .where(and(eq(pedidos.id, id), eq(pedidos.usuarioId, u.id)));
  if (!p) notFound();
  const s = await ajustes();
  return (
    <div className="max-w-2xl">
      <p className="eyebrow break-all">PEDIDO {p.id}</p>
      <h2 className="text-3xl mt-4">{p.nombre}</h2>
      <div className="bg-white border border-mar-200 rounded-xl p-6 my-7">
        <p className="text-3xl">{money(p.importe)}</p>
        <p className="mt-3">
          {p.metodo === "transferencia"
            ? "Transferencia bancaria"
            : "Mercado Pago"}{" "}
          · {p.estado.replaceAll("_", " ")}
        </p>
        {p.descuento > 0 && (
          <p className="mt-3 text-sm">
            Descuento aplicado: {money(p.descuento)}
          </p>
        )}
      </div>
      {p.metodo === "transferencia" && p.estado === "pendiente" && (
        <>
          <h3 className="text-2xl mb-4">Datos para transferir</h3>
          <dl className="space-y-3 mb-8">
            <div>
              <dt>Titular</dt>
              <dd className="font-semibold">{s.transferencia_titular}</dd>
            </div>
            <div>
              <dt>Alias</dt>
              <dd className="font-semibold break-all">
                {s.transferencia_alias}
              </dd>
            </div>
            {s.transferencia_cbu && (
              <div>
                <dt>CBU / CVU</dt>
                <dd className="break-all">{s.transferencia_cbu}</dd>
              </div>
            )}
          </dl>
          <ActionForm
            action={subirComprobante}
            label="Enviar comprobante"
            hideOnSuccess
          >
            <input type="hidden" name="pedidoId" value={id} />
            <label>
              Comprobante · PDF, JPG o PNG · hasta 3 MB
              <input
                type="file"
                name="archivo"
                accept="application/pdf,image/jpeg,image/png"
                required
              />
            </label>
            <p className="text-sm">
              Se guarda de forma privada y el equipo verifica el pago antes de
              habilitar tu acceso.
            </p>
          </ActionForm>
          <div className="mt-8">
            <ActionForm
              action={cancelarPedido}
              label="Cancelar pedido sin pagar"
            >
              <input type="hidden" name="id" value={id} />
            </ActionForm>
          </div>
        </>
      )}
      {p.estado === "esperando_verificacion" && (
        <p className="form-message">
          Recibimos tu comprobante. Lo estamos verificando.
        </p>
      )}
      {p.metodo === "mercadopago" &&
        p.checkoutUrl &&
        p.estado === "pendiente" && (
          <a href={p.checkoutUrl} className="btn-primary">
            Continuar en Mercado Pago
          </a>
        )}
      {p.estado === "aprobado" && (
        <Link href="/cuenta" className="btn-primary">
          Ir a mis contenidos
        </Link>
      )}
    </div>
  );
}
