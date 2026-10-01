import { and, eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { ofertas, progreso, intentos } from "@/db/schema";
import { requerirProfesional } from "@/lib/auth/dal";
import { acceso } from "@/lib/platform/commerce";
import { ActionForm } from "@/components/platform/ActionForm";
import { completarLeccion, enviarEvaluacion } from "@/lib/acciones/aprendizaje";
export default async function Page({
  params,
  searchParams,
}: PageProps<"/cuenta/cursos/[id]">) {
  const u = await requerirProfesional();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const a = await acceso(u.id, id);
  if (!a)
    return (
      <div className="empty-state">
        <h2 className="text-2xl">Tu acceso no está activo.</h2>
        <p className="mt-3">
          Los cursos están disponibles 30 días desde la compra aprobada. Tus
          certificados permanecen disponibles.
        </p>
      </div>
    );
  const [o] = await db.select().from(ofertas).where(eq(ofertas.id, id));
  if (!o || o.tipo !== "curso") notFound();
  const { clase } = await searchParams;
  const lecciones = o.curriculum.modulos.flatMap((m) => m.lecciones);
  const l = lecciones.find((l) => l.id === clase) ?? lecciones[0];
  const [ps, rs] = await Promise.all([
    db
      .select()
      .from(progreso)
      .where(and(eq(progreso.usuarioId, u.id), eq(progreso.ofertaId, id))),
    db
      .select()
      .from(intentos)
      .where(and(eq(intentos.usuarioId, u.id), eq(intentos.ofertaId, id)))
      .orderBy(desc(intentos.createdAt)),
  ]);
  const completos = ps.filter((p) =>
    lecciones.some((l) => l.id === p.leccionId),
  ).length;
  return (
    <>
      <p className="eyebrow">
        CURSO / {completos} DE {lecciones.length} CLASES COMPLETADAS
      </p>
      <h2 className="text-4xl my-4">{o.nombre}</h2>
      <p className="text-sm mb-6">
        Acceso hasta {a.accessExpiresAt?.toLocaleDateString("es-AR")} ·{" "}
        {Math.ceil(
          (a.accessExpiresAt!.getTime() - new Date().getTime()) / 86400000,
        )}{" "}
        días restantes.
      </p>
      <progress
        className="w-full mb-8 accent-mar-600"
        value={completos}
        max={Math.max(1, lecciones.length)}
        aria-label="Progreso del curso"
      />
      {o.curriculum.liveUrl && (
        <a
          href={o.curriculum.liveUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-primary mb-8"
        >
          Ingresar al encuentro en vivo ↗
        </a>
      )}
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <details
          open
          className="border border-mar-200 rounded-xl p-5 self-start"
        >
          <summary className="font-semibold cursor-pointer">
            Índice del curso
          </summary>
          {o.curriculum.modulos.map((m) => (
            <div key={m.id} className="mt-5">
              <h3 className="font-sans text-base font-semibold">{m.titulo}</h3>
              <ul className="mt-2 space-y-3">
                {m.lecciones.map((item) => (
                  <li key={item.id}>
                    <a
                      className="text-sm underline underline-offset-4"
                      href={`?clase=${encodeURIComponent(item.id)}`}
                    >
                      {ps.some((p) => p.leccionId === item.id) ? "✓ " : ""}
                      {item.titulo}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </details>
        <div>
          {l ? (
            <>
              <h3 className="text-3xl mb-6">{l.titulo}</h3>
              {l.videoId && l.videoProvider && (
                <iframe
                  className="w-full aspect-video rounded-xl"
                  title={l.titulo}
                  src={
                    l.videoProvider === "youtube"
                      ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(l.videoId)}`
                      : `https://player.vimeo.com/video/${encodeURIComponent(l.videoId)}`
                  }
                  allow="fullscreen; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              )}
              <div className="whitespace-pre-wrap leading-relaxed mt-6">
                {l.texto}
              </div>
              <ul className="my-6 space-y-3">
                {l.materiales.map((m) => (
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
              {ps.some((p) => p.leccionId === l.id) ? (
                <p className="form-message">Clase completada.</p>
              ) : (
                <ActionForm
                  action={completarLeccion}
                  label="Marcar clase como completada"
                >
                  <input type="hidden" name="ofertaId" value={id} />
                  <input type="hidden" name="leccionId" value={l.id} />
                </ActionForm>
              )}
            </>
          ) : (
            <p className="empty-state">
              Las clases todavía no están publicadas.
            </p>
          )}
        </div>
      </div>
      {o.evaluacion.preguntas.length > 0 && (
        <section className="mt-14 border-t border-mar-200 pt-10">
          <h3 className="text-3xl mb-4">Evaluación final</h3>
          <p className="mb-6">
            Aprobación: {o.evaluacion.aprobacion}%. Intentos: {rs.length}/
            {o.evaluacion.intentos}.
          </p>
          {rs.length < o.evaluacion.intentos && !rs.some((r) => r.aprobado) && (
            <ActionForm action={enviarEvaluacion} label="Entregar evaluación">
              <input type="hidden" name="ofertaId" value={id} />
              {o.evaluacion.preguntas.map((q, i) => (
                <fieldset
                  key={q.id}
                  className="border border-mar-200 p-5 rounded-xl"
                >
                  <legend className="font-medium px-2">
                    {i + 1}. {q.texto}
                  </legend>
                  {q.opciones.map((opt) => (
                    <label className="check-label py-2" key={opt.id}>
                      <input
                        type={q.tipo === "multiple" ? "checkbox" : "radio"}
                        name={`q_${q.id}`}
                        value={opt.id}
                        required={q.tipo !== "multiple"}
                      />
                      {opt.texto}
                    </label>
                  ))}
                </fieldset>
              ))}
            </ActionForm>
          )}
          {rs.map((r, i) => (
            <details
              key={r.id}
              className="mt-5 border border-mar-200 p-5 rounded-lg"
            >
              <summary>
                Intento {rs.length - i} · {r.porcentaje}% ·{" "}
                {r.aprobado ? "Aprobado" : "No aprobado"}
              </summary>
              <ul className="mt-4 space-y-2">
                {r.feedback.map((f, j) => (
                  <li key={j}>{f}</li>
                ))}
              </ul>
            </details>
          ))}
        </section>
      )}
    </>
  );
}
