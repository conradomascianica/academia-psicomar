import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { correos } from "@/db/schema";
import { ajustes } from "@/lib/platform/commerce";
import { emailDisponible } from "@/lib/email";
import { mpDisponible } from "@/lib/platform/payments";
import { privadoDisponible } from "@/lib/platform/storage";
import { ActionForm } from "@/components/platform/ActionForm";
import {
  guardarConfiguracion,
  reintentarCorreo,
} from "@/lib/acciones/admin-plataforma";
export default async function Page() {
  const [config, mails] = await Promise.all([
    ajustes(),
    db
      .select({
        clave: correos.clave,
        destinatario: correos.destinatario,
        asunto: correos.asunto,
        estado: correos.estado,
        intentos: correos.intentos,
      })
      .from(correos)
      .orderBy(desc(correos.createdAt))
      .limit(50),
  ]);
  return (
    <>
      <h1 className="text-3xl">Configuración</h1>
      <div className="path-card bg-white my-6">
        <h2 className="text-2xl">Integraciones</h2>
        <ul className="my-4 space-y-2">
          {[
            ["Email", emailDisponible()],
            ["Mercado Pago", mpDisponible()],
            ["Archivos privados", privadoDisponible()],
          ].map(([name, ready]) => (
            <li key={String(name)}>
              {name}:{" "}
              {ready
                ? "Credenciales configuradas · verificar entrega en pruebas"
                : "No configurado"}
            </li>
          ))}
        </ul>
        <p className="text-sm">
          Las credenciales se administran en las variables de entorno del
          proyecto. Nunca las pegues en formularios del sitio. Las suscripciones
          automáticas todavía no están habilitadas.
        </p>
      </div>
      <ActionForm action={guardarConfiguracion}>
        <h2 className="text-2xl">Transferencia bancaria</h2>
        <label>
          Titular
          <input
            name="transferencia_titular"
            defaultValue={config.transferencia_titular ?? ""}
            maxLength={150}
          />
        </label>
        <label>
          Alias
          <input
            name="transferencia_alias"
            defaultValue={config.transferencia_alias ?? ""}
            maxLength={150}
          />
        </label>
        <label>
          CBU / CVU
          <input
            name="transferencia_cbu"
            defaultValue={config.transferencia_cbu ?? ""}
            pattern="[0-9]{22}"
            maxLength={22}
          />
        </label>
        <p className="text-sm">
          La transferencia requiere titular, alias y almacenamiento privado
          configurados.
        </p>
      </ActionForm>
      <h2 className="text-2xl mt-12 mb-5">Últimos correos</h2>
      <p className="text-sm mb-4">
        Se conservan hasta 5 intentos. Un envío interrumpido se marca para
        revisión; confirmá en Gmail antes de reintentarlo para evitar
        duplicados.
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Destino</th>
              <th>Asunto</th>
              <th>Estado</th>
              <th>Intentos</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {mails.map((m) => (
              <tr key={m.clave}>
                <td>{m.destinatario}</td>
                <td>{m.asunto}</td>
                <td>{m.estado}</td>
                <td>{m.intentos}</td>
                <td>
                  {["fallido", "revision"].includes(m.estado) &&
                    m.intentos < 5 && (
                      <ActionForm action={reintentarCorreo} label="Reintentar">
                        <input type="hidden" name="clave" value={m.clave} />
                      </ActionForm>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
