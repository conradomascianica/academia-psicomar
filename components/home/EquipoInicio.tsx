import type { MiembroEquipo } from "@/content/types";
import { Foto } from "@/components/ui/Foto";
import { LinkButton } from "@/components/ui/Button";

export function EquipoInicio({ equipo }: { equipo: MiembroEquipo[] }) {
  return (
    <div className="rounded-2xl border border-mar-200 bg-white p-5 shadow-tarjeta sm:p-7">
      <p className="eyebrow">CONOCÉ A QUIENES TE ACOMPAÑAN</p>
      <h2 className="mt-3 text-3xl">Kiara y Maite</h2>
      <p className="mt-3 text-sm leading-relaxed text-tinta-suave">
        Una mirada cercana y basada en evidencia, desde la Terapia Cognitivo
        Conductual (TCC) y la Terapia Dialéctico Conductual (DBT).
      </p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {equipo.map((m) => (
          <article key={m.slug}>
            <Foto
              src={m.foto}
              alt={m.fotoAlt}
              etiqueta={`Foto de ${m.nombre}`}
              ratio="4 / 5"
              className="[&_img]:object-top"
              priority
              sizes="(max-width: 640px) 85vw, 260px"
            />
            <h3 className="mt-4 text-2xl">{m.nombre}</h3>
            <p className="mt-2 text-xs font-semibold text-mar-700">{m.rol}</p>
            <p className="mt-3 text-sm leading-relaxed text-tinta-suave">
              {m.bioCorta}
            </p>
          </article>
        ))}
      </div>
      <LinkButton
        href="/quienes-somos"
        variante="contorno"
        className="mt-6 w-full"
      >
        Conocé más sobre nosotras ↗
      </LinkButton>
    </div>
  );
}
