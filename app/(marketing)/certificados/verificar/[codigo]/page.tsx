import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { certificados } from "@/db/schema";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Verificar certificado",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
}: PageProps<"/certificados/verificar/[codigo]">) {
  const { codigo } = await params;
  if (!z.uuid().safeParse(codigo).success) notFound();
  const [c] = await db
    .select({
      nombre: certificados.nombre,
      actividad: certificados.actividad,
      fecha: certificados.createdAt,
    })
    .from(certificados)
    .where(eq(certificados.id, codigo));
  if (!c) notFound();
  return (
    <section className="contenedor py-20 max-w-2xl">
      <p className="eyebrow">ACADEMIA PSICOMAR</p>
      <h1 className="text-4xl mt-5">Certificado válido.</h1>
      <dl className="mt-8 space-y-6">
        <div>
          <dt>Participante</dt>
          <dd className="text-xl">{c.nombre}</dd>
        </div>
        <div>
          <dt>Actividad</dt>
          <dd>{c.actividad}</dd>
        </div>
        <div>
          <dt>Fecha de emisión</dt>
          <dd>{c.fecha.toLocaleDateString("es-AR")}</dd>
        </div>
      </dl>
    </section>
  );
}
