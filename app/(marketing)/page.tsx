import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { InstagramStrip } from "@/components/InstagramStrip";
import { Section, EncabezadoSeccion } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/Button";
import { Foto } from "@/components/ui/Foto";
import { FormacionCard } from "@/components/FormacionCard";
import { IconoFlecha } from "@/components/ui/iconos";
import { TerapiaPopover } from "@/components/TerapiaPopover";
import {
  getEquipo,
  getFormacionesDestacadas,
  getArticulos,
  fechaLegible,
} from "@/lib/content";

export const metadata: Metadata = {
  description:
    "Psicología online basada en evidencia. Terapia para adultos con Kiara y Maite, y formación, supervisión y herramientas para profesionales de salud mental.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [equipo, destacadas, articulos] = await Promise.all([
    getEquipo(),
    getFormacionesDestacadas(3),
    getArticulos(),
  ]);
  const ultimos = articulos.slice(0, 2);

  return (
    <>
      <Hero />

      {/* Quiénes somos — preview */}
      <Section fondo="crema" espaciado="amplio">
        <div className="grid gap-10 md:grid-cols-[1fr_1.1fr] md:items-center">
          <div className="grid grid-cols-2 gap-4">
            {equipo.map((m) => (
              <Foto
                key={m.slug}
                src={m.foto}
                alt={m.fotoAlt}
                etiqueta={`Foto de ${m.nombre.split(" ")[0]}`}
                ratio="3 / 4"
              />
            ))}
          </div>
          <div className="flex flex-col gap-5">
            <EncabezadoSeccion
              sobretitulo="Quiénes somos"
              titulo="Dos psicólogas. Una misma idea: hacer de la psicología algo un poco más cercano."
            />
            <div className="flex flex-col gap-4">
              {equipo.map((m) => (
                <div key={m.slug}>
                  <p className="font-medium text-tinta">{m.nombre}</p>
                  <p className="text-sm text-tinta-suave">{m.bioCorta}</p>
                </div>
              ))}
            </div>
            <LinkButton href="/quienes-somos" variante="contorno">
              Conocé al equipo
            </LinkButton>
          </div>
        </div>
      </Section>

      {/* Formaciones destacadas */}
      <Section fondo="crema" espaciado="amplio">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <EncabezadoSeccion
            sobretitulo="Formaciones"
            titulo="Seguí construyendo tu práctica"
          />
          <LinkButton href="/formaciones" variante="fantasma">
            Ver todas
            <IconoFlecha width={16} height={16} />
          </LinkButton>
        </div>
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {destacadas.map((f) => (
            <FormacionCard key={f.slug} formacion={f} />
          ))}
        </ul>
      </Section>

      {/* Blog */}
      {ultimos.length > 0 && (
        <Section fondo="bruma" espaciado="amplio">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <EncabezadoSeccion sobretitulo="Del blog" titulo="Para leer" />
            <LinkButton href="/blog" variante="fantasma">
              Ver el blog
              <IconoFlecha width={16} height={16} />
            </LinkButton>
          </div>
          <ul className="mt-10 grid gap-5 md:grid-cols-2">
            {ultimos.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/blog/${a.slug}`}
                  className="group flex h-full flex-col gap-3 rounded-2xl border border-mar-100 bg-white p-6 shadow-suave transition-shadow hover:shadow-tarjeta"
                >
                  <span className="text-xs uppercase tracking-wide text-mar-600">
                    {fechaLegible(a.publicadoEl)}
                  </span>
                  <h3 className="text-xl text-tinta">{a.titulo}</h3>
                  <p className="text-sm text-tinta-suave">{a.resumen}</p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-medium text-mar-700">
                    Leer la nota
                    <IconoFlecha
                      width={16}
                      height={16}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Cierre humano */}
      <Section fondo="mar" espaciado="amplio">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
          <p className="font-display text-2xl leading-snug text-white md:text-3xl">
            Sí, somos psicólogas. Pero también somos dos personas que aman
            aprender, compartir herramientas y hablar de clínica.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <TerapiaPopover
              alineacion="centro"
              etiqueta="Quiero comenzar terapia"
            />
            <LinkButton
              href="/academia"
              variante="contorno"
              className="border-white/40 text-white hover:bg-white/10"
            >
              Ver formaciones
            </LinkButton>
          </div>
        </div>
      </Section>

      <InstagramStrip />
    </>
  );
}
