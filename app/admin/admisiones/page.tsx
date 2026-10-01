import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { admisiones } from "@/db/schema";
import { requerirAdmin } from "@/lib/auth/dal";
import { estadosAdmision } from "@/lib/platform/rules";
export default async function Page({
  searchParams,
}: PageProps<"/admin/admisiones">) {
  await requerirAdmin();
  const { estado } = await searchParams;
  const rows = await db
    .select()
    .from(admisiones)
    .where(
      typeof estado === "string" && estado
        ? eq(admisiones.estado, estado)
        : undefined,
    )
    .orderBy(desc(admisiones.createdAt))
    .limit(200);
  return (
    <>
      <p className="eyebrow">ATENCIÓN CLÍNICA</p>
      <h1 className="text-3xl mt-3">Admisiones</h1>
      <p className="mt-3 text-tinta-suave">
        Coordinación administrativa del encuentro inicial.
      </p>
      <form className="platform-form my-6 flex flex-wrap gap-3">
        <label>
          Estado
          <select
            name="estado"
            defaultValue={typeof estado === "string" ? estado : ""}
          >
            <option value="">Todos</option>
            {estadosAdmision.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
        </label>
        <button className="btn-primary">Filtrar</button>
      </form>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Solicitud</th>
              <th>Nombre</th>
              <th>País</th>
              <th>Profesional</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td>{a.createdAt.toLocaleDateString("es-AR")}</td>
                <td>
                  {a.nombre} {a.apellido}
                </td>
                <td>{a.pais}</td>
                <td>{a.profesional ?? "Sin asignar"}</td>
                <td>{a.estado.replaceAll("_", " ")}</td>
                <td>
                  <Link href={`/admin/admisiones/${a.id}`}>Abrir</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <p className="empty-state">No hay solicitudes en este estado.</p>
      )}
    </>
  );
}
