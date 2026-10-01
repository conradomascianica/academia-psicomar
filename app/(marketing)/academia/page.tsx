import type { Metadata } from "next";
import Link from "next/link";
import { getFormaciones, getProductos } from "@/lib/content";
import { FormacionCard } from "@/components/FormacionCard";
import { ProductoCard } from "@/components/ProductoCard";
export const metadata: Metadata = {
  title: "Academia PsicoMar — Formación clínica",
  alternates: { canonical: "/academia" },
  description:
    "Cursos, herramientas y supervisión para acompañar tu práctica profesional.",
};
export default async function Page() {
  const [cursos, herramientas] = await Promise.all([
    getFormaciones(),
    getProductos(),
  ]);
  return (
    <>
      <section className="bg-navy text-white py-20">
        <div className="contenedor">
          <p className="eyebrow text-cyan-soft">ACADEMIA PSICOMAR</p>
          <h1 className="mt-6 text-5xl md:text-7xl max-w-4xl">
            Tu práctica también
            <br />
            se aprende <em className="text-cyan-soft">haciendo.</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed">
            Formación, herramientas clínicas y una comunidad de colegas para
            seguir creciendo con criterio.
          </p>
          <nav className="mt-10 flex flex-wrap gap-5" aria-label="Academia">
            <Link href="#cursos" className="underline underline-offset-8">
              Cursos y talleres ↗
            </Link>
            <Link href="#herramientas" className="underline underline-offset-8">
              Herramientas ↗
            </Link>
            <Link
              href="/supervisiones"
              className="underline underline-offset-8"
            >
              Supervisiones ↗
            </Link>
            <Link href="/cuenta" className="underline underline-offset-8">
              Mi Academia ↗
            </Link>
          </nav>
        </div>
      </section>
      <section id="cursos" className="contenedor py-16 scroll-mt-24">
        <p className="eyebrow">FORMACIÓN CON CRITERIO</p>
        <h2 className="mt-4 text-4xl">Una nueva mirada para tu clínica.</h2>
        <p className="mt-4 text-tinta-suave">
          En vivo y a tu ritmo. Los contenidos digitales tienen 30 días de
          acceso desde la compra aprobada.
        </p>
        <ul className="grid gap-6 md:grid-cols-3 mt-8">
          {cursos.map((f) => (
            <FormacionCard key={f.slug} formacion={f} />
          ))}
        </ul>
      </section>
      <section className="bg-bruma py-16">
        <div className="contenedor md:flex justify-between items-center gap-10">
          <div>
            <p className="eyebrow">SUPERVISIÓN CLÍNICA</p>
            <h2 className="mt-4 text-4xl max-w-xl">
              Hay casos que necesitan
              <br />
              <em>otra mirada.</em>
            </h2>
            <p className="mt-5">
              Encuentros individuales de 30 o 60 minutos y supervisión grupal
              mensual.
            </p>
          </div>
          <Link href="/supervisiones" className="btn-primary mt-6">
            Conocer las supervisiones ↗
          </Link>
        </div>
      </section>
      <section id="herramientas" className="contenedor py-16 scroll-mt-24">
        <p className="eyebrow">TU BIBLIOTECA CLÍNICA</p>
        <h2 className="mt-4 text-4xl">Herramientas que se quedan con vos.</h2>
        <p className="mt-4 text-tinta-suave">
          Packs y recursos con acceso permanente después de la compra aprobada.
        </p>
        <ul className="grid gap-6 md:grid-cols-3 mt-8">
          {herramientas.map((p) => (
            <ProductoCard key={p.slug} producto={p} />
          ))}
        </ul>
      </section>
    </>
  );
}
