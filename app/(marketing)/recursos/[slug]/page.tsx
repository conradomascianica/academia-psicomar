import { CompraOferta } from "@/components/platform/CompraOferta";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";
import { Prosa } from "@/components/ui/Prosa";
import { Placeholder } from "@/components/ui/Placeholder";
import { LinkButton } from "@/components/ui/Button";
import { JsonLd } from "@/components/JsonLd";
import { IconoCheck, IconoFlecha } from "@/components/ui/iconos";
import { site, SITE_URL } from "@/lib/site";
import { getProducto, getSlugsProductos } from "@/lib/content";

export async function generateStaticParams() {
  return (await getSlugsProductos()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/recursos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProducto(slug);
  if (!p) return {};
  return {
    title: p.seo?.title ?? p.nombre,
    description: p.seo?.description ?? p.resumen,
    alternates: { canonical: `/recursos/${p.slug}` },
    openGraph: {
      title: p.seo?.title ?? p.nombre,
      description: p.seo?.description ?? p.resumen,
      url: `${SITE_URL}/recursos/${p.slug}`,
    },
  };
}

export default async function ProductoPage({
  params,
}: PageProps<"/recursos/[slug]">) {
  const { slug } = await params;
  const p = await getProducto(slug);
  if (!p) notFound();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.nombre,
          description: p.seo?.description ?? p.resumen,
          url: `${SITE_URL}/recursos/${p.slug}`,
          brand: { "@type": "Brand", name: site.name },
        }}
      />

      <Section fondo="bruma" espaciado="normal">
        <nav className="mb-6 text-sm text-tinta-suave">
          <Link href="/recursos" className="hover:text-tinta">
            Recursos
          </Link>
          <span className="mx-2">/</span>
          <span className="text-tinta">{p.nombre}</span>
        </nav>
      </Section>

      <Section fondo="crema" espaciado="amplio">
        <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap gap-2">
              <Badge tono="coral">Pack de herramientas</Badge>
              <Badge tono="neutro">Archivos digitales</Badge>
            </div>
            <h1 className="text-4xl text-tinta md:text-5xl">{p.nombre}</h1>
            <Prosa>{p.descripcion}</Prosa>

            <div className="rounded-2xl border border-mar-100 bg-white p-6">
              <h2 className="text-xl text-tinta">Qué incluye</h2>
              <ul className="mt-4 flex flex-col gap-2">
                {p.incluye.map((i) => (
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
              <h2 className="text-lg text-tinta">Para quién está pensado</h2>
              <p className="mt-2 text-sm text-tinta-suave">{p.paraQuien}</p>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="flex flex-col gap-4 rounded-2xl border border-mar-100 bg-white p-6 shadow-suave">
              <Placeholder
                etiqueta="Vista previa del pack"
                ratio="4 / 3"
                className="rounded-xl"
              />
              <CompraOferta clave={`herramienta:${p.slug}`} />
            </div>
          </aside>
        </div>

        <div className="mt-12">
          <LinkButton href="/recursos" variante="fantasma">
            <IconoFlecha width={16} height={16} className="rotate-180" />
            Volver a recursos
          </LinkButton>
        </div>
      </Section>
    </>
  );
}
