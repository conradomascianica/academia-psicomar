import { coordinarSupervision } from "@/lib/acciones/supervisiones";
import { encuentrosAcademia } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { pedidos, eventos } from "@/db/schema";
import { requerirAdmin } from "@/lib/auth/dal";
import { money } from "@/lib/platform/rules";
import { revisarTransferencia } from "@/lib/acciones/compras";
import { ActionForm } from "@/components/platform/ActionForm";
export default async function Page({
  params,
}: PageProps<"/admin/ventas/[id]">) {
  await requerirAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [p] = await db.select().from(pedidos).where(eq(pedidos.id, id));
  if (!p) notFound();
  const es = await db
    .select()
    .from(eventos)
    .where(eq(eventos.pedidoId, id))
    .orderBy(asc(eventos.createdAt));
  const encuentros = await db
    .select()
    .from(encuentrosAcademia)
    .where(eq(encuentrosAcademia.pedidoId, id));
  return (
    <>
      <p className="eyebrow break-all">PEDIDO {id}</p>
      <h1 className="text-3xl mt-4">{p.nombre}</h1>
      <p className="text-2xl mt-5">{money(p.importe)}</p>
      <p className="my-5">
        {p.metodo} · {p.estado.replaceAll("_", " ")}
      </p>
      {p.comprobanteId && (
        <a
          className="underline block mb-7"
          href={`/api/archivos/${p.comprobanteId}`}
        >
          Descargar comprobante privado
        </a>
      )}
      {p.estado === "esperando_verificacion" && (
        <ActionForm action={revisarTransferencia} label="Aplicar decisión">
          <input type="hidden" name="id" value={id} />
          <label>
            Resultado de la revisión
            <select name="decision" required defaultValue="">
              <option value="" disabled>
                Elegí una acción
              </option>
              <option value="aprobar">
                Aprobar transferencia y habilitar acceso
              </option>
              <option value="rechazar">Rechazar comprobante</option>
            </select>
          </label>
        </ActionForm>
      )}
      {p.tipo === "supervision" && p.estado === "aprobado" && (
        <section className="mt-10">
          <h2 className="text-2xl mb-5">Coordinar supervisión</h2>
          <ul>
            {encuentros.map((e) => (
              <li key={e.id}>
                Encuentro {e.numero}: {e.fecha.toISOString()} · {e.estado}
              </li>
            ))}
          </ul>
          <ActionForm action={coordinarSupervision} label="Guardar encuentro">
            <input type="hidden" name="pedidoId" value={id} />
            <label>
              Número de encuentro
              <select name="numero">
                <option value="1">1</option>
                <option value="2">2 (solo grupal)</option>
              </select>
            </label>
            <label>
              Fecha y hora con zona
              <input
                name="fecha"
                placeholder="2026-10-10T18:00:00-03:00"
                required
              />
            </label>
            <label>
              Zona horaria
              <input
                name="zonaHoraria"
                defaultValue="America/Argentina/Buenos_Aires"
                required
              />
            </label>
            <label>
              Google Meet o Zoom
              <input name="enlace" type="url" required />
            </label>
            <label>
              Estado
              <select name="estado">
                <option value="confirmado">Confirmado</option>
                <option value="realizado">Realizado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </label>
          </ActionForm>
        </section>
      )}
      <h2 className="text-2xl mt-10">Historial del pedido</h2>
      <ol className="mt-5 space-y-4">
        {es.map((e) => (
          <li key={e.id}>
            {e.createdAt.toLocaleString("es-AR")} ·{" "}
            {e.evento.replaceAll("_", " ")}
          </li>
        ))}
      </ol>
    </>
  );
}
