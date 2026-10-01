import Link from "next/link";
import { requerirProfesional } from "@/lib/auth/dal";
import { comprasUsuario } from "@/lib/platform/commerce";
import { accesoVigente } from "@/lib/platform/rules";
export default async function Page() {
  const u = await requerirProfesional();
  const compras = await comprasUsuario(u.id);
  const activos = compras.filter((c) => accesoVigente(c.pedido));
  return (
    <>
      <h2 className="text-3xl">Continuar aprendiendo</h2>
      {!activos.length ? (
        <div className="empty-state">
          <p>Todavía no tenés contenidos activos.</p>
          <Link href="/academia" className="btn-primary mt-5">
            Explorar la academia
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 mt-6">
          {activos.map(({ pedido: p }) => (
            <Link
              className="path-card bg-white"
              key={p.id}
              href={
                p.tipo === "curso"
                  ? `/cuenta/cursos/${p.ofertaId}`
                  : `/cuenta/${p.tipo === "herramienta" ? "herramientas" : "supervisiones"}`
              }
            >
              <span className="eyebrow">{p.tipo}</span>
              <h3 className="text-2xl mt-3">{p.nombre}</h3>
              <p className="mt-4 text-sm">
                {p.accessExpiresAt
                  ? `Acceso hasta ${p.accessExpiresAt.toLocaleDateString("es-AR")}`
                  : p.tipo === "herramienta"
                    ? "Acceso permanente"
                    : "Coordinar encuentro"}{" "}
                ↗
              </p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
