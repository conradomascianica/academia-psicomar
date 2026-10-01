import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { Prosa } from "@/components/ui/Prosa";
import { CompraOferta } from "@/components/platform/CompraOferta";
import { getSupervision } from "@/lib/content";
export const metadata: Metadata = {
  title: "Supervisiones para profesionales",
  description:
    "Supervisión individual de 30 o 60 minutos y encuentros grupales mensuales. Academia PsicoMar.",
  alternates: { canonical: "/supervisiones" },
};
export const dynamic = "force-dynamic";
export default async function Page() {
  const s = await getSupervision();
  return (
    <>
      <Section fondo="bruma" espaciado="amplio">
        <p className="eyebrow">ACADEMIA PSICOMAR · SUPERVISIONES</p>
        <h1 className="text-4xl md:text-6xl max-w-3xl mt-5">
          Pensar la clínica en compañía.
        </h1>
        <p className="text-lg max-w-2xl mt-6">
          Un espacio de trabajo entre profesionales para revisar decisiones,
          compartir herramientas y ampliar la mirada.
        </p>
      </Section>
      <Section fondo="crema" espaciado="amplio">
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            {
              clave: "30",
              titulo: "Individual · 30 minutos",
              texto:
                "Un encuentro para trabajar una consulta concreta de tu práctica.",
            },
            {
              clave: "60",
              titulo: "Individual · 60 minutos",
              texto:
                "Más tiempo para profundizar y pensar alternativas de intervención.",
            },
            {
              clave: "grupal",
              titulo: "Supervisión grupal",
              texto:
                "Dos encuentros de 2 horas por mes. El pago corresponde a un mes, sin renovación automática.",
            },
          ].map((x) => (
            <article
              key={x.clave}
              className="path-card bg-white flex flex-col gap-5"
            >
              <h2 className="text-3xl">{x.titulo}</h2>
              <p className="flex-1">{x.texto}</p>
              <CompraOferta clave={`supervision:${x.clave}`} />
            </article>
          ))}
        </div>
        <div className="mt-14 max-w-3xl">
          <h2 className="text-3xl mb-5">Cómo nos organizamos</h2>
          <p className="mb-6">
            Después de aprobarse el pago, coordinamos fecha y modalidad por
            WhatsApp desde Mi Academia. No cargues historias clínicas ni datos
            identificatorios de pacientes en el sitio.
          </p>
          <Prosa>{s.descripcion}</Prosa>
        </div>
      </Section>
    </>
  );
}
