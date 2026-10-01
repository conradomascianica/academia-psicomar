import Link from "next/link";
import { and, eq, gte, lte, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { pedidos, usuarios } from "@/db/schema";
import { requerirAdmin } from "@/lib/auth/dal";
import { money } from "@/lib/platform/rules";
export default async function Page({
  searchParams,
}: PageProps<"/admin/ventas">) {
  await requerirAdmin();
  const s = await searchParams;
  const desde =
    typeof s.desde === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.desde)
      ? new Date(`${s.desde}T00:00:00-03:00`)
      : null;
  const hasta =
    typeof s.hasta === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.hasta)
      ? new Date(`${s.hasta}T23:59:59-03:00`)
      : null;
  const rows = await db
    .select({ p: pedidos, u: usuarios })
    .from(pedidos)
    .innerJoin(usuarios, eq(pedidos.usuarioId, usuarios.id))
    .where(
      and(
        typeof s.estado === "string" && s.estado
          ? eq(pedidos.estado, s.estado)
          : undefined,
        typeof s.metodo === "string" && s.metodo
          ? eq(pedidos.metodo, s.metodo)
          : undefined,
        desde ? gte(pedidos.createdAt, desde) : undefined,
        hasta ? lte(pedidos.createdAt, hasta) : undefined,
      ),
    )
    .orderBy(desc(pedidos.createdAt))
    .limit(200);
  return (
    <>
      <h1 className="text-3xl">Ventas y transferencias</h1>
      <form className="platform-form my-7">
        <div className="grid gap-4 sm:grid-cols-4">
          <label>
            Desde
            <input name="desde" type="date" />
          </label>
          <label>
            Hasta
            <input name="hasta" type="date" />
          </label>
          <label>
            Método
            <select name="metodo">
              <option value="">Todos</option>
              <option value="mercadopago">Mercado Pago</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </label>
          <label>
            Estado
            <select name="estado">
              <option value="">Todos</option>
              {[
                "pendiente",
                "esperando_verificacion",
                "aprobado",
                "rechazado",
                "reembolsado",
                "cancelado",
              ].map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </label>
        </div>
        <button className="btn-primary">Filtrar</button>
      </form>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Comprador</th>
              <th>Propuesta</th>
              <th>Importe</th>
              <th>Método</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, u }) => (
              <tr key={p.id}>
                <td>{p.createdAt.toLocaleDateString("es-AR")}</td>
                <td>{u.nombre}</td>
                <td>{p.nombre}</td>
                <td>{money(p.importe)}</td>
                <td>{p.metodo}</td>
                <td>{p.estado.replaceAll("_", " ")}</td>
                <td>
                  <Link href={`/admin/ventas/${p.id}`}>Revisar</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <p className="empty-state">No hay ventas para estos filtros.</p>
      )}
    </>
  );
}
