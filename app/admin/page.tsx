import Link from "next/link";
import { and, count, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  admisiones,
  pedidos,
  usuarios,
  certificados,
  metricas,
  ofertas,
  progreso,
} from "@/db/schema";
import { money } from "@/lib/platform/rules";
export default async function Page({ searchParams }: PageProps<"/admin">) {
  const sp = await searchParams;
  const dias = ["7", "30", "90"].includes(String(sp.dias))
    ? Number(sp.dias)
    : 30;
  const desde = new Date(new Date().getTime() - dias * 86400000);
  const now = new Date();
  const [ad, ps, us, cs, ms, activas, vencidos, top, classes] =
    await Promise.all([
      db
        .select({ estado: admisiones.estado, n: count() })
        .from(admisiones)
        .where(gte(admisiones.createdAt, desde))
        .groupBy(admisiones.estado),
      db
        .select({
          estado: pedidos.estado,
          tipo: pedidos.tipo,
          n: count(),
          importe: sql<number>`coalesce(sum(${pedidos.importe}),0)::bigint`,
        })
        .from(pedidos)
        .where(gte(pedidos.createdAt, desde))
        .groupBy(pedidos.estado, pedidos.tipo),
      db
        .select({ n: count() })
        .from(usuarios)
        .where(
          and(eq(usuarios.rol, "profesional"), gte(usuarios.createdAt, desde)),
        ),
      db
        .select({ n: count() })
        .from(certificados)
        .where(gte(certificados.createdAt, desde)),
      db
        .select({ evento: metricas.evento, n: count() })
        .from(metricas)
        .where(gte(metricas.createdAt, desde))
        .groupBy(metricas.evento),
      db
        .select({ n: count() })
        .from(pedidos)
        .where(
          and(
            eq(pedidos.tipo, "curso"),
            eq(pedidos.estado, "aprobado"),
            gte(pedidos.accessExpiresAt, now),
          ),
        ),
      db
        .select({ n: count() })
        .from(pedidos)
        .where(
          and(
            eq(pedidos.tipo, "curso"),
            eq(pedidos.estado, "aprobado"),
            lt(pedidos.accessExpiresAt, now),
          ),
        ),
      db
        .select({ nombre: ofertas.nombre, n: count() })
        .from(pedidos)
        .innerJoin(ofertas, eq(pedidos.ofertaId, ofertas.id))
        .where(
          and(eq(pedidos.estado, "aprobado"), gte(pedidos.createdAt, desde)),
        )
        .groupBy(ofertas.nombre)
        .orderBy(sql`count(*) desc`)
        .limit(5),
      db
        .select({ n: count() })
        .from(progreso)
        .where(gte(progreso.createdAt, desde)),
    ]);
  const nAd = (s: string) => ad.find((x) => x.estado === s)?.n ?? 0;
  const ventas = ps.filter((p) => p.estado === "aprobado");
  const total = ventas.reduce((n, p) => n + Number(p.importe), 0);
  const clicks = ms.find((m) => m.evento === "cta_terapia")?.n ?? 0;
  const solicitudes = ad.reduce((n, a) => n + a.n, 0);
  const cards = [
    ["Solicitudes de admisión", solicitudes, "/admin/admisiones"],
    [
      "Admisiones confirmadas",
      nAd("confirmada"),
      "/admin/admisiones?estado=confirmada",
    ],
    [
      "Admisiones realizadas",
      nAd("realizada"),
      "/admin/admisiones?estado=realizada",
    ],
    [
      "Abono pendiente",
      nAd("esperando_abono"),
      "/admin/admisiones?estado=esperando_abono",
    ],
    ["Profesionales registrados", us[0].n, "/admin/profesionales"],
    ["Ventas aprobadas", ventas.reduce((n, p) => n + p.n, 0), "/admin/ventas"],
    ["Ingresos de pedidos del período", money(total), "/admin/ventas"],
    [
      "Transferencias por revisar",
      ps
        .filter((p) => p.estado === "esperando_verificacion")
        .reduce((n, p) => n + p.n, 0),
      "/admin/ventas?estado=esperando_verificacion",
    ],
    ["Accesos a cursos activos (total)", activas[0].n, "/admin/profesionales"],
    ["Accesos vencidos (total)", vencidos[0].n, "/admin/profesionales"],
    ["Clases completadas", classes[0].n, "/admin/academia"],
    ["Certificados emitidos", cs[0].n, "/admin/certificados"],
  ];
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl">Panel PSICOMAR</h1>
        <form className="flex gap-3">
          <label>
            Período{" "}
            <select
              name="dias"
              defaultValue={dias}
              className="border rounded p-2"
            >
              <option value="7">7 días</option>
              <option value="30">30 días</option>
              <option value="90">90 días</option>
            </select>
          </label>
          <button className="btn-secondary">Aplicar</button>
        </form>
      </div>
      <p className="mt-4 text-sm">
        Indicadores administrativos y educativos. Las admisiones se agrupan por
        su estado actual dentro del período de recepción.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 my-8">
        {cards.map(([label, value, href]) => (
          <Link
            className="path-card bg-white"
            key={String(label)}
            href={String(href)}
          >
            <p className="text-sm">{label}</p>
            <p className="text-3xl mt-3 font-semibold">{value}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="path-card bg-white">
          <h2 className="text-2xl">Propuestas más vendidas</h2>
          {!top.length ? (
            <p className="mt-4">
              Todavía no hay ventas aprobadas en este período.
            </p>
          ) : (
            <ol className="mt-4 space-y-3">
              {top.map((t) => (
                <li key={t.nombre}>
                  {t.nombre} · {t.n}
                </li>
              ))}
            </ol>
          )}
        </section>
        <section className="path-card bg-white">
          <h2 className="text-2xl">Actividad del sitio</h2>
          <p className="my-3">
            Clicks en Busco terapia: {clicks}. Solicitudes: {solicitudes}.
          </p>
          <p className="text-sm">
            Conteos agregados, sin identificar visitantes. No equivalen a
            personas únicas ni permiten atribuir conversiones individuales.
          </p>
          <ul className="mt-4 space-y-2">
            {ms
              .filter((m) => m.evento !== "cta_terapia")
              .map((m) => (
                <li key={m.evento}>
                  {m.evento.replaceAll("_", " ")}: {m.n}
                </li>
              ))}
          </ul>
        </section>
      </div>
    </>
  );
}
