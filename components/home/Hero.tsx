import { TrackLink } from "@/components/platform/TrackLink";
import { EquipoInicio } from "@/components/home/EquipoInicio";
import type { MiembroEquipo } from "@/content/types";
export function Hero({ equipo }: { equipo: MiembroEquipo[] }) {
  return (
    <section className="bg-bruma relative overflow-hidden">
      <div className="contenedor grid gap-10 pt-12 pb-14 lg:grid-cols-2 lg:items-center lg:py-20">
        <div>
          <p className="eyebrow">PSICOMAR · PSICOLOGÍA & FORMACIÓN</p>
          <h1 className="mt-6 text-[2.8rem] leading-[1.06] sm:text-6xl lg:text-[4.35rem]">
            Psicología para
            <br />
            la vida real.
            <br />
            <em className="text-mar-600">Un espacio para vos.</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-tinta-suave">
            Acompañamiento humano y formación clínica.
            <br className="hidden sm:block" /> Dos caminos, una misma mirada
            basada en evidencia.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <TrackLink
              evento="cta_terapia"
              className="path-card bg-white"
              href="/terapia"
            >
              <span className="eyebrow">01 / ATENCIÓN CLÍNICA</span>
              <strong className="text-xl mt-3">Busco terapia</strong>
              <span className="text-sm mt-2">
                Quiero conocer cómo comenzar.
              </span>
              <span className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-navy px-4 py-3 text-center text-sm font-semibold text-white shadow-suave">
                Quiero comenzar terapia ↗
              </span>
            </TrackLink>
            <TrackLink
              evento="cta_academia"
              className="path-card bg-navy text-white"
              href="/academia"
            >
              <span className="eyebrow text-cyan-soft">
                02 / ACADEMIA PSICOMAR
              </span>
              <strong className="text-xl mt-3">
                Soy profesional de salud mental
              </strong>
              <span className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-white px-4 py-3 text-center text-sm font-semibold text-navy shadow-suave">
                Explorar la academia ↗
              </span>
            </TrackLink>
          </div>
        </div>
        <EquipoInicio equipo={equipo} />
      </div>
    </section>
  );
}
