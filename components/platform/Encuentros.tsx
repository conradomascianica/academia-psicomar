import { and, eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { encuentrosAcademia, pedidos } from "@/db/schema";
import { requerirProfesional } from "@/lib/auth/dal";
export async function Encuentros() {
  const u = await requerirProfesional();
  const rows = await db
    .select({ e: encuentrosAcademia, nombre: pedidos.nombre })
    .from(encuentrosAcademia)
    .innerJoin(pedidos, eq(pedidos.id, encuentrosAcademia.pedidoId))
    .where(and(eq(pedidos.usuarioId, u.id), eq(pedidos.estado, "aprobado")))
    .orderBy(asc(encuentrosAcademia.fecha));
  return (
    <section className="mb-10">
      <h2 className="text-3xl mb-5">Próximos encuentros</h2>
      {!rows.length ? (
        <p className="empty-state">
          Los encuentros aparecerán acá después de coordinarlos con el equipo.
        </p>
      ) : (
        <div className="grid gap-4">
          {rows.map(({ e, nombre }) => (
            <article className="path-card bg-white" key={e.id}>
              <h3 className="text-2xl">
                {nombre} · Encuentro {e.numero}
              </h3>
              <p className="my-3">
                {e.fecha.toLocaleString("es-AR", { timeZone: e.zonaHoraria })} (
                {e.zonaHoraria}) · {e.estado}
              </p>
              {e.estado === "confirmado" && (
                <a
                  className="underline"
                  href={e.enlace}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ingresar al encuentro ↗
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
