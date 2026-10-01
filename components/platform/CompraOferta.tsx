import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ofertas } from "@/db/schema";
import { money } from "@/lib/platform/rules";
export async function CompraOferta({ clave }: { clave: string }) {
  const [o] = await db.select().from(ofertas).where(eq(ofertas.clave, clave));
  if (!o?.activa)
    return (
      <div className="space-y-3">
        <p className="text-sm">Inscripciones no disponibles por el momento.</p>
        <Link className="btn-secondary" href="/contacto">
          Consultar al equipo
        </Link>
      </div>
    );
  return (
    <div className="space-y-4">
      <dl className="space-y-2">
        {o.precioTransferencia && (
          <div>
            <dt className="text-sm">Transferencia</dt>
            <dd className="text-xl font-semibold">
              {money(o.precioTransferencia)}
            </dd>
          </div>
        )}
        {o.precioMp && (
          <div>
            <dt className="text-sm">Mercado Pago</dt>
            <dd className="text-xl font-semibold">{money(o.precioMp)}</dd>
          </div>
        )}
      </dl>
      <Link className="btn-primary w-full" href={`/checkout?oferta=${o.id}`}>
        Comprar{" "}
        {o.tipo === "curso"
          ? "curso"
          : o.tipo === "herramienta"
            ? "herramienta"
            : "supervisión"}
      </Link>
      <p className="text-xs text-tinta-suave">
        {o.tipo === "curso"
          ? "30 días de acceso desde la aprobación del pago. Certificado permanente al completar los requisitos."
          : o.tipo === "herramienta"
            ? "Archivos disponibles en tu cuenta, con acceso permanente después de aprobarse el pago."
            : "La coordinación se realiza por WhatsApp luego del pago. No incluye renovación automática."}
      </p>
    </div>
  );
}
