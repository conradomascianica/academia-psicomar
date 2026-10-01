import Link from "next/link";
import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { ContactForm } from "@/components/ContactForm";
import { IconoInstagram } from "@/components/ui/iconos";
import { site, instagramUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "¿Querés saber más sobre nuestros talleres, supervisiones o herramientas? Escribinos. Para empezar terapia, completá la solicitud de admisión.",
  alternates: { canonical: "/contacto" },
};

export default function ContactoPage() {
  return (
    <Section fondo="crema" espaciado="amplio">
      <div className="grid gap-12 lg:grid-cols-[1fr_20rem]">
        <div>
          <span className="text-sm font-medium uppercase tracking-[0.14em] text-mar-600">
            Contacto
          </span>
          <h1 className="mt-3 text-4xl text-tinta md:text-5xl">
            ¿Querés saber más? Hablemos.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-tinta-suave">
            Escribinos por consultas sobre talleres, cursos, supervisiones o
            packs de herramientas. Te respondemos al mail que dejes.
          </p>
          <div className="mt-8 max-w-xl">
            <ContactForm />
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-mar-100 bg-white p-6 shadow-suave">
            <h2 className="text-lg text-tinta">¿Vas a empezar terapia?</h2>
            <p className="mt-2 text-sm text-tinta-suave">
              Completá la solicitud de admisión. PSICOMAR asigna profesional y
              coordina el encuentro con vos.
            </p>
            <Link href="/terapia#solicitud" className="btn-primary mt-4">
              Solicitar admisión
            </Link>
          </div>

          <div className="rounded-2xl border border-mar-100 bg-white p-6 shadow-suave">
            <h2 className="text-lg text-tinta">En redes</h2>
            <div className="mt-3 flex flex-col gap-2">
              {[
                site.instagram.academia,
                site.instagram.kiara,
                site.instagram.maite,
              ].map((handle) => (
                <a
                  key={handle}
                  href={instagramUrl(handle)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-mar-700 hover:underline"
                >
                  <IconoInstagram width={16} height={16} />@{handle}
                </a>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </Section>
  );
}
