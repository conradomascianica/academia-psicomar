import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { ofertas, archivosPrivados } from "@/db/schema";
import { requerirAdmin } from "@/lib/auth/dal";
import { ActionForm } from "@/components/platform/ActionForm";
import { ContentEditor } from "@/components/platform/ContentEditor";
import { guardarOferta, cargarMaterial } from "@/lib/acciones/admin-plataforma";
export default async function Page({
  params,
}: PageProps<"/admin/academia/[id]">) {
  await requerirAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [o] = await db.select().from(ofertas).where(eq(ofertas.id, id));
  if (!o) notFound();
  const files = await db
    .select({ id: archivosPrivados.id, nombre: archivosPrivados.nombre })
    .from(archivosPrivados)
    .where(eq(archivosPrivados.uso, "material"))
    .orderBy(desc(archivosPrivados.createdAt));
  return (
    <>
      <h1 className="text-3xl mb-7">{o.nombre}</h1>
      <details className="border rounded-xl p-5 mb-8">
        <summary>Cargar un archivo privado</summary>
        <div className="mt-5">
          <ActionForm action={cargarMaterial} label="Cargar material">
            <label>
              PDF, ZIP, JPG o PNG · hasta 3 MB
              <input type="file" name="archivo" required />
            </label>
            <p className="text-sm">
              Después de cargar, recargá la página para seleccionarlo en la
              clase o pack.
            </p>
          </ActionForm>
        </div>
      </details>
      <ActionForm action={guardarOferta}>
        <input type="hidden" name="id" value={id} />
        <label>
          Nombre de la propuesta
          <input
            name="nombre"
            defaultValue={o.nombre}
            required
            maxLength={200}
          />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label>
            Precio Mercado Pago (ARS)
            <input
              name="precioMp"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={o.precioMp ? o.precioMp / 100 : ""}
            />
          </label>
          <label>
            Precio transferencia (ARS)
            <input
              name="precioTransferencia"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={
                o.precioTransferencia ? o.precioTransferencia / 100 : ""
              }
            />
          </label>
        </div>
        <label>
          Carga horaria para certificado
          <input
            name="cargaHoraria"
            defaultValue={o.cargaHoraria}
            maxLength={200}
          />
        </label>
        <ContentEditor
          tipo={o.tipo}
          initialCurriculum={o.curriculum}
          initialQuiz={o.evaluacion}
          initialMaterials={o.materiales}
          files={files}
        />
        <label className="check-label">
          <input name="activa" type="checkbox" defaultChecked={o.activa} />
          Habilitar ventas de esta propuesta
        </label>
      </ActionForm>
    </>
  );
}
