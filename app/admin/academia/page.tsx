import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { ofertas } from "@/db/schema";
import { requerirAdmin } from "@/lib/auth/dal";
import { prepararCatalogo } from "@/lib/acciones/admin-plataforma";
import { ActionForm } from "@/components/platform/ActionForm";
import { money } from "@/lib/platform/rules";
export default async function Page() {
  await requerirAdmin();
  const rows = await db.select().from(ofertas).orderBy(asc(ofertas.nombre));
  return (
    <>
      <h1 className="text-3xl">Academia · contenidos y ventas</h1>
      <p className="mt-4 mb-6">
        Prepará las ofertas desde los cursos y packs que ya cargaste. Esta
        acción agrega lo que falta sin reemplazar configuraciones existentes.
      </p>
      <ActionForm
        action={prepararCatalogo}
        label="Preparar ofertas del catálogo"
      />
      <div className="table-scroll mt-8">
        <table>
          <thead>
            <tr>
              <th>Propuesta</th>
              <th>Tipo</th>
              <th>Mercado Pago</th>
              <th>Transferencia</th>
              <th>Ventas</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td>{o.nombre}</td>
                <td>{o.tipo}</td>
                <td>{o.precioMp ? money(o.precioMp) : "A definir"}</td>
                <td>
                  {o.precioTransferencia
                    ? money(o.precioTransferencia)
                    : "A definir"}
                </td>
                <td>{o.activa ? "Habilitadas" : "Inactivas"}</td>
                <td>
                  <Link href={`/admin/academia/${o.id}`}>Editar</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
