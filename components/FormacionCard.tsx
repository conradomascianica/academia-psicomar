import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { IconoFlecha } from "@/components/ui/iconos";
import type { Formacion } from "@/content/types";

const ETIQUETA_TIPO: Record<Formacion["tipo"], string> = {
  taller: "Taller",
  curso: "Curso",
  curso_grabado: "Curso grabado",
};

export function etiquetaModalidad(f: Formacion): string {
  if (f.modalidad === "grabado") return "Grabado · a tu ritmo";
  if (f.modalidad === "presencial") return "Presencial";
  return "Online en vivo";
}

export function FormacionCard({ formacion }: { formacion: Formacion }) {
  return (
    <Card href={`/formaciones/${formacion.slug}`} as="li" className="gap-4">
      <div className="flex flex-wrap gap-2">
        <Badge tono="mar">{ETIQUETA_TIPO[formacion.tipo]}</Badge>
        <Badge tono="neutro">{etiquetaModalidad(formacion)}</Badge>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-xl text-tinta">{formacion.nombre}</h3>
        <p className="text-sm leading-relaxed text-tinta-suave">
          {formacion.resumen}
        </p>
      </div>
      <dl className="mt-1 flex flex-col gap-1 text-xs text-tinta-suave">
        <div className="flex gap-1.5">
          <dt className="font-medium text-tinta">Duración:</dt>
          <dd>{formacion.duracion}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="font-medium text-tinta">Inscripción:</dt>
          <dd>Consultá los medios de pago en la propuesta</dd>
        </div>
      </dl>
      <span className="relative z-10 mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-mar-700">
        Ver {formacion.tipo === "taller" ? "el taller" : "más"}
        <IconoFlecha
          width={16}
          height={16}
          className="transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </Card>
  );
}
