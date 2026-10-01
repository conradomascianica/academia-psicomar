import { CompraOferta } from "@/components/platform/CompraOferta";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";
import { Prosa } from "@/components/ui/Prosa";
import { LinkButton } from "@/components/ui/Button";
import { JsonLd } from "@/components/JsonLd";
import { etiquetaModalidad } from "@/components/FormacionCard";
import { IconoCheck, IconoFlecha } from "@/components/ui/iconos";
import { site, SITE_URL } from "@/lib/site";
import { getFormacion, getSlugsFormaciones } from "@/lib/content";

export async function generateStaticParams() {
  return (await getSlugsFormaciones()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/formaciones/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const f = await getFormacion(slug);
  if (!f) return {};
  return {
    title: f.seo?.title ?? f.nombre,
    description: f.seo?.description ?? f.resumen,
    alternates: { canonical: `/formaciones/${f.slug}` },
    openGraph: {
      title: f.seo?.title ?? f.nombre,
      description: f.seo?.description ?? f.resumen,
      url: `${SITE_URL}/formaciones/${f.slug}`,
    },
  };
}

const ETIQUETA_TIPO = {
  taller: "Taller",
  curso: "Curso",
  curso_grabado: "Curso grabado",
} as const;

export default async function FormacionPage({
  params,
}: PageProps<"/formaciones/[slug]">) {
  const { slug } = await params;
  const f = await getFormacion(slug);
  if (!f) notFound();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: f.nombre,
          description: f.seo?.description ?? f.resumen,
          url: `${SITE_URL}/formaciones/${f.slug}`,
          provider: {
            "@type": "Organization",
            name: site.name,
            url: SITE_URL,
          },
        }}
      />

      <Section fondo="bruma" espaciado="normal">
        <nav className="mb-6 text-sm text-tinta-suave">
          <Link href="/formaciones" className="hover:text-tinta">
            Formaciones
          </Link>
          <span className="mx-2">/</span>
          <span className="text-tinta">{f.nombre}</span>
        </nav>
        <div className="flex flex-wrap gap-2">
          <Badge tono="mar">{ETIQUETA_TIPO[f.tipo]}</Badge>
          <Badge tono="neutro">{etiquetaModalidad(f)}</Badge>
          {f.destacado && <Badge tono="coral">Destacado</Badge>}
        </div>
        <h1 className="mt-4 max-w-3xl text-4xl text-tinta md:text-5xl">
          {f.nombre}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-tinta-suave">{f.resumen}</p>
      </Section>

      <Section fondo="crema" espaciado="amplio">
        <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
          <div className="flex flex-col gap-8">
            <Prosa>{f.descripcion}</Prosa>

            <div className="rounded-2xl border border-mar-100 bg-white p-6">
              <h2 className="text-xl text-tinta">Qué incluye</h2>
              <ul className="mt-4 flex flex-col gap-2">
                {f.incluye.map((i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-tinta-suave"
                  >
                    <IconoCheck
                      width={18}
                      height={18}
                      className="mt-0.5 shrink-0 text-mar-500"
                    />
                    {i}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-arena p-6">
              <h2 className="text-lg text-tinta">Para quién es</h2>
              <p className="mt-2 text-sm text-tinta-suave">{f.paraQuien}</p>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="flex flex-col gap-4 rounded-2xl border border-mar-100 bg-white p-6 shadow-suave">
              <dl className="flex flex-col divide-y divide-mar-100 text-sm">
                <div className="flex flex-col gap-0.5 pb-3">
                  <dt className="text-tinta-suave">Modalidad</dt>
                  <dd className="font-medium text-tinta">
                    {etiquetaModalidad(f)}
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5 py-3">
                  <dt className="text-tinta-suave">Duración</dt>
                  <dd className="font-medium text-tinta">{f.duracion}</dd>
                </div>
                {f.enVivo && f.proximaFecha && (
                  <div className="flex flex-col gap-0.5 py-3">
                    <dt className="text-tinta-suave">Próxima fecha</dt>
                    <dd className="font-medium text-tinta">{f.proximaFecha}</dd>
                  </div>
                )}
                <div className="flex flex-col gap-0.5 py-3">
                  <dt className="text-tinta-suave">Docentes</dt>
                  <dd className="font-medium text-tinta">
                    {f.docentes.join(" · ")}
                  </dd>
                </div>
              </dl>
              <CompraOferta clave={`curso:${f.slug}`} />
            </div>
          </aside>
        </div>

        <div className="mt-12">
          <LinkButton href="/formaciones" variante="fantasma">
            <IconoFlecha width={16} height={16} className="rotate-180" />
            Volver a formaciones
          </LinkButton>
        </div>
      </Section>
    </>
  );
}
