import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { admisiones } from "@/db/schema";
import { requerirAdmin } from "@/lib/auth/dal";
import { ActionForm } from "@/components/platform/ActionForm";
import { guardarAdmision } from "@/lib/acciones/plataforma";
import { estadosAdmision } from "@/lib/platform/rules";
import { whatsappLink } from "@/lib/site";
export default async function Page({
  params,
}: PageProps<"/admin/admisiones/[id]">) {
  await requerirAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [a] = await db.select().from(admisiones).where(eq(admisiones.id, id));
  if (!a) notFound();
  return (
    <>
      <h1 className="text-3xl">
        {a.nombre} {a.apellido}
      </h1>
      <div className="my-6 grid gap-3 sm:grid-cols-2">
        <p>{a.email}</p>
        <a
          className="underline"
          href={whatsappLink(
            a.whatsapp,
            `Hola ${a.nombre}, te contactamos de PSICOMAR para coordinar tu admisión.`,
          )}
          target="_blank"
          rel="noreferrer"
        >
          Contactar por WhatsApp
        </a>
        <p>
          {a.pais} · {a.zonaHoraria}
        </p>
        <p>Preferencia: {a.contacto}</p>
        <p className="sm:col-span-2">Disponibilidad: {a.disponibilidad}</p>
      </div>
      <ActionForm key={a.revision} action={guardarAdmision}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="revision" value={a.revision} />
        <label>
          Estado
          <select name="estado" defaultValue={a.estado}>
            {estadosAdmision.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
        </label>
        <label>
          Profesional
          <select name="profesional" defaultValue={a.profesional ?? ""}>
            <option value="">Sin asignar</option>
            <option>Kiara</option>
            <option>Maite</option>
          </select>
        </label>
        <label className="check-label">
          <input
            name="abonoRecibido"
            type="checkbox"
            defaultChecked={a.abonoRecibido}
          />
          Abono recibido, verificado manualmente
        </label>
        <label>
          Fecha y hora UTC (ISO 8601 con zona)
          <input
            name="fecha"
            defaultValue={a.fecha?.toISOString() ?? ""}
            placeholder="2026-10-10T18:00:00-03:00"
          />
        </label>
        <label>
          Zona horaria para comunicar el encuentro
          <input name="zonaHoraria" defaultValue={a.zonaHoraria} required />
        </label>
        <label>
          Enlace de Google Meet
          <input type="url" name="meet" defaultValue={a.meet ?? ""} />
        </label>
        <label>
          Observación administrativa
          <textarea
            name="observacion"
            maxLength={500}
            defaultValue={a.observacion}
          />
        </label>
        <p className="text-sm">
          No guardar diagnósticos, síntomas ni notas clínicas. Al confirmar se
          intenta enviar el correo con los datos del encuentro.
        </p>
      </ActionForm>
    </>
  );
}
