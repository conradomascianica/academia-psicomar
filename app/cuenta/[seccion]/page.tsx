import { Encuentros } from "@/components/platform/Encuentros";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { certificados } from "@/db/schema";
import { requerirProfesional } from "@/lib/auth/dal";
import { comprasUsuario } from "@/lib/platform/commerce";
import { accesoVigente, money } from "@/lib/platform/rules";
import { site, whatsappLink } from "@/lib/site";
import { ActionForm } from "@/components/platform/ActionForm";
import { guardarPerfil, reenviarVerificacion } from "@/lib/acciones/plataforma";
export default async function Page({ params }: PageProps<"/cuenta/[seccion]">) {
  const u = await requerirProfesional();
  const { seccion } = await params;
  if (seccion === "perfil")
    return (
      <>
        <ActionForm action={guardarPerfil}>
          <h2 className="text-3xl">Mi perfil</h2>
          <label>
            Nombre y apellido
            <input
              name="nombre"
              defaultValue={u.nombre}
              minLength={3}
              maxLength={120}
              required
            />
          </label>
          <p>
            {u.email} ·{" "}
            {u.emailVerifiedAt
              ? "Email verificado"
              : "Email pendiente de verificación"}
          </p>
        </ActionForm>
        {!u.emailVerifiedAt && (
          <ActionForm
            className="mt-5"
            action={reenviarVerificacion}
            label="Reenviar verificación"
          />
        )}
      </>
    );
  if (seccion === "certificados") {
    const cs = await db
      .select()
      .from(certificados)
      .where(eq(certificados.usuarioId, u.id));
    return (
      <>
        <h2 className="text-3xl">Mis certificados</h2>
        <p className="mt-3">
          Permanecen disponibles aunque termine tu acceso al curso.
        </p>
        {!cs.length && (
          <p className="empty-state">
            Completá un curso y sus requisitos para obtener tu certificado.
          </p>
        )}
        <div className="grid gap-4 mt-6">
          {cs.map((c) => (
            <div className="path-card bg-white" key={c.id}>
              <h3 className="text-2xl">{c.actividad}</h3>
              <p className="my-3">{c.createdAt.toLocaleDateString("es-AR")}</p>
              <a className="underline" href={`/api/certificados/${c.id}`}>
                Descargar PDF
              </a>
            </div>
          ))}
        </div>
      </>
    );
  }
  if (!["cursos", "herramientas", "compras", "supervisiones"].includes(seccion))
    notFound();
  const rows = await comprasUsuario(u.id);
  if (seccion === "compras")
    return (
      <>
        <h2 className="text-3xl mb-6">Mis compras</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Propuesta</th>
                <th>Importe</th>
                <th>Método</th>
                <th>Estado</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ pedido: p }) => (
                <tr key={p.id}>
                  <td>{p.nombre}</td>
                  <td>{money(p.importe)}</td>
                  <td>{p.metodo}</td>
                  <td>{p.estado.replaceAll("_", " ")}</td>
                  <td>
                    <Link href={`/cuenta/compras/${p.id}`}>Ver pedido</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && <p className="empty-state">Todavía no hay compras.</p>}
      </>
    );
  const tipo =
    seccion === "cursos"
      ? "curso"
      : seccion === "herramientas"
        ? "herramienta"
        : "supervision";
  const items = rows.filter(
    (c) => c.pedido.tipo === tipo && c.pedido.approvedAt,
  );
  return (
    <>
      {seccion === "supervisiones" && <Encuentros />}
      <h2 className="text-3xl">
        {seccion === "cursos"
          ? "Mis cursos"
          : seccion === "herramientas"
            ? "Mis herramientas"
            : "Mis supervisiones"}
      </h2>
      {!items.length && (
        <div className="empty-state">
          <p>Todavía no tenés {seccion}.</p>
          <Link href="/academia" className="underline mt-4 block">
            Explorar propuestas
          </Link>
        </div>
      )}
      <div className="grid gap-5 md:grid-cols-2 mt-6">
        {items.map(({ pedido: p, oferta: o }) => (
          <article key={p.id} className="path-card bg-white">
            <h3 className="text-2xl">{p.nombre}</h3>
            {p.accessExpiresAt && (
              <p className="my-3 text-sm">
                Tu acceso vence el{" "}
                {p.accessExpiresAt.toLocaleDateString("es-AR")}.{" "}
                {accesoVigente(p)
                  ? `Te quedan ${Math.ceil((p.accessExpiresAt.getTime() - new Date().getTime()) / 86400000)} días.`
                  : "Acceso vencido."}
              </p>
            )}
            {!accesoVigente(p) ? (
              <p>
                El contenido está bloqueado. Tus certificados emitidos se
                conservan.
              </p>
            ) : tipo === "curso" ? (
              <Link
                className="btn-primary mt-5"
                href={`/cuenta/cursos/${o.id}`}
              >
                Continuar curso
              </Link>
            ) : tipo === "herramienta" ? (
              <ul className="mt-5 space-y-4">
                {o.materiales.map((m) => (
                  <li key={m.id}>
                    <a
                      className="underline"
                      href={`/api/archivos/${m.archivoId}`}
                    >
                      {m.nombre} ↓
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <a
                className="btn-primary mt-5"
                href={whatsappLink(
                  site.whatsapp.maite,
                  `Hola, soy ${u.nombre}. Quiero coordinar ${p.nombre}. Pedido ${p.id}.`,
                )}
                target="_blank"
                rel="noreferrer"
              >
                Coordinar por WhatsApp
              </a>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
