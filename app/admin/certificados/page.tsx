import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { certificados } from "@/db/schema";
import { requerirAdmin } from "@/lib/auth/dal";
export default async function Page() {
  await requerirAdmin();
  const rows = await db
    .select()
    .from(certificados)
    .orderBy(desc(certificados.createdAt))
    .limit(200);
  return (
    <>
      <h1 className="text-3xl mb-6">Certificados emitidos</h1>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Actividad</th>
              <th>Fecha</th>
              <th>Archivo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>{c.nombre}</td>
                <td>{c.actividad}</td>
                <td>{c.createdAt.toLocaleDateString("es-AR")}</td>
                <td>
                  <a href={`/api/certificados/${c.id}`}>Descargar PDF</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
