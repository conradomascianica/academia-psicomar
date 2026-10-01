import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { usuarios } from "@/db/schema";
import { requerirAdmin } from "@/lib/auth/dal";
export default async function Page() {
  await requerirAdmin();
  const rows = await db
    .select({
      id: usuarios.id,
      nombre: usuarios.nombre,
      email: usuarios.email,
      createdAt: usuarios.createdAt,
    })
    .from(usuarios)
    .where(eq(usuarios.rol, "profesional"))
    .orderBy(desc(usuarios.createdAt))
    .limit(200);
  return (
    <>
      <h1 className="text-3xl mb-6">Profesionales</h1>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Registro</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td>{u.nombre}</td>
                <td>{u.email}</td>
                <td>{u.createdAt.toLocaleDateString("es-AR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <p className="empty-state">Todavía no hay cuentas profesionales.</p>
      )}
    </>
  );
}
