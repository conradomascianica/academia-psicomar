import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import { AdmisionForm } from "@/components/platform/AdmisionForm";
import { LinkButton } from "@/components/ui/Button";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Terapia online y admisión",
  description:
    "Solicitá una admisión de 45–50 minutos por Google Meet. PSICOMAR asigna profesional y coordina con vos.",
  alternates: { canonical: "/terapia" },
};
export default function Terapia() {
  return (
    <>
      <section className="bg-bruma py-16 md:py-24">
        <div className="contenedor grid gap-10 md:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="eyebrow">PSICOMAR / ATENCIÓN CLÍNICA</p>
            <h1 className="mt-6 text-5xl md:text-6xl">
              Un primer paso.
              <br />
              <em className="text-mar-600">A tu ritmo.</em>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed">
              Terapia online para adultos, con una mirada cercana y basada en
              evidencia. Empezamos por conocernos en una admisión.
            </p>
            <LinkButton href="#solicitud" className="mt-8" tamano="lg">
              Solicitar una admisión
            </LinkButton>
          </div>
          <div className="border-l border-mar-300 p-6 md:self-center">
            <p className="eyebrow">ASÍ EMPEZAMOS</p>
            <ol className="mt-6 space-y-5 leading-relaxed">
              <li>
                <b>01 / Completás la solicitud.</b>
                <br />
                Solo datos de contacto y disponibilidad.
              </li>
              <li>
                <b>02 / Coordinamos con vos.</b>
                <br />
                El equipo asigna profesional y acuerdan el encuentro.
              </li>
              <li>
                <b>03 / Confirmamos la admisión.</b>
                <br />
                Después del abono, recibís los datos de Google Meet.
              </li>
            </ol>
          </div>
        </div>
      </section>
      <section className="contenedor py-16 grid gap-12 lg:grid-cols-[.85fr_1.15fr]">
        <div>
          <p className="eyebrow">ACOMPAÑAMIENTO HUMANO</p>
          <h2 className="mt-4 text-4xl">Conocer tu punto de partida.</h2>
          <p className="mt-6 leading-relaxed">
            Trabajamos desde la Terapia Cognitivo Conductual (TCC) y la Terapia
            Dialéctico Conductual (DBT). La admisión permite conversar con la
            profesional y evaluar cómo continuar.
          </p>
          <dl className="my-8 divide-y divide-mar-200">
            <div className="py-4">
              <dt className="text-sm text-tinta-suave">Duración</dt>
              <dd>45–50 minutos</dd>
            </div>
            <div className="py-4">
              <dt className="text-sm text-tinta-suave">Modalidad</dt>
              <dd>Online · Google Meet</dd>
            </div>
            <div className="py-4">
              <dt className="text-sm text-tinta-suave">Abono</dt>
              <dd>Se coordina con la profesional antes de confirmar.</dd>
            </div>
          </dl>
          <h3 className="text-2xl">¿Y después?</h3>
          <p className="mt-3 leading-relaxed">
            Si acordamos iniciar el proceso, los siguientes encuentros se
            coordinan directamente con tu profesional. Esta web gestiona
            solamente la admisión inicial.
          </p>
          <p className="mt-6 text-sm text-tinta-suave">
            La atención fuera de Argentina depende de las condiciones
            profesionales y legales del lugar donde te encuentres. Este canal no
            atiende urgencias.
          </p>
        </div>
        <div
          id="solicitud"
          className="scroll-mt-24 rounded-2xl border border-mar-200 bg-white p-6 md:p-9"
        >
          <p className="eyebrow">SOLICITUD DE ADMISIÓN</p>
          <h2 className="mt-3 mb-8 text-3xl">Contanos cómo contactarte.</h2>
          <AdmisionForm solicitudKey={randomUUID()} />
        </div>
      </section>
    </>
  );
}
