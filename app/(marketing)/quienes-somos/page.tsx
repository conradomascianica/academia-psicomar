import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { TeamCard } from "@/components/TeamCard";
import { Foto } from "@/components/ui/Foto";
import { Prosa } from "@/components/ui/Prosa";
import { PilaresPsicoMar } from "@/components/PilaresPsicoMar";
import { LinkButton } from "@/components/ui/Button";
import { TerapiaPopover } from "@/components/TerapiaPopover";
import { getEquipo } from "@/lib/content";
import { historiaEquipo, fotoAmbas } from "@/content/equipo";

export const metadata: Metadata = {
  title: "Quiénes somos",
  description:
    "Kiara y Maite, psicólogas y fundadoras de Academia PsicoMar. Nuestra historia, nuestra forma de trabajar y por qué creamos este espacio.",
  alternates: { canonical: "/quienes-somos" },
};

export default async function QuienesSomosPage() {
  const equipo = await getEquipo();

  return (
    <>
      <Section fondo="bruma" espaciado="amplio">
        <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <span className="text-sm font-medium uppercase tracking-[0.14em] text-mar-600">
              Quiénes somos
            </span>
            <h1 className="mt-3 text-4xl text-tinta md:text-5xl">
              Dos psicólogas. Una misma idea: hacer de la psicología algo un
              poco más cercano.
            </h1>
            <Prosa className="mt-5 text-[17px]">{historiaEquipo}</Prosa>
          </div>
          <Foto
            src={fotoAmbas.src}
            alt={fotoAmbas.alt}
            etiqueta="Foto de Kiara y Maite"
            ratio="1 / 1"
            priority
            sizes="(max-width: 768px) 92vw, 440px"
            className="mx-auto max-w-md"
          />
        </div>
      </Section>

      <Section fondo="crema" espaciado="amplio">
        <div className="flex flex-col gap-8">
          {equipo.map((m) => (
            <TeamCard key={m.slug} miembro={m} />
          ))}
        </div>
        <p className="mt-8 rounded-2xl bg-arena px-6 py-5 text-center text-tinta-suave">
          Dos perfiles complementarios, una misma manera de entender el
          acompañamiento: con evidencia, con vínculo y con objetivos claros.
        </p>
      </Section>

      <PilaresPsicoMar fondo="bruma" />

      <Section fondo="mar" espaciado="amplio">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
          <h2 className="text-3xl text-white">¿Empezamos?</h2>
          <p className="text-white/80">
            Si querés iniciar un proceso, solicitá una admisión. Si sos
            profesional, mirá las formaciones que tenemos abiertas.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <TerapiaPopover
              alineacion="centro"
              etiqueta="Quiero comenzar terapia"
            />
            <LinkButton
              href="/formaciones"
              variante="contorno"
              className="border-white/40 text-white hover:bg-white/10"
            >
              Ver formaciones
            </LinkButton>
          </div>
        </div>
      </Section>
    </>
  );
}
