import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { cupones, ofertas } from "@/db/schema";
import { ActionForm } from "@/components/platform/ActionForm";
import { guardarCupon } from "@/lib/acciones/admin-plataforma";
import { money } from "@/lib/platform/rules";
export default async function Page() {
  const [cs, os] = await Promise.all([
    db.select().from(cupones).orderBy(desc(cupones.createdAt)),
    db.select().from(ofertas).where(eq(ofertas.activa, true)),
  ]);
  return (
    <>
      <h1 className="text-3xl">Cupones</h1>
      <p className="my-4">
        Los pedidos pendientes reservan usos. Guardar el mismo código actualiza
        sus condiciones para compras nuevas.
      </p>
      <div className="table-scroll mb-8">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Descuento</th>
              <th>Estado</th>
              <th>Vencimiento</th>
            </tr>
          </thead>
          <tbody>
            {cs.map((c) => (
              <tr key={c.id}>
                <td>{c.codigo}</td>
                <td>{c.tipo === "fijo" ? money(c.valor) : `${c.valor}%`}</td>
                <td>{c.activo ? "Activo" : "Inactivo"}</td>
                <td>
                  {c.hasta.toLocaleDateString("es-AR", {
                    timeZone: "America/Argentina/Buenos_Aires",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ActionForm action={guardarCupon} label="Guardar cupón">
        <h2 className="text-2xl">Crear o actualizar</h2>
        <label>
          Código
          <input name="codigo" pattern="[A-Za-z0-9_-]{3,40}" required />
        </label>
        <label>
          Tipo
          <select name="tipo">
            <option value="porcentaje">Porcentaje</option>
            <option value="fijo">Importe fijo en pesos</option>
          </select>
        </label>
        <label>
          Valor
          <input name="valor" type="number" min="1" step="0.01" required />
        </label>
        <label>
          Desde (fecha y hora con zona)
          <input
            name="desde"
            placeholder="2026-10-01T00:00:00-03:00"
            required
          />
        </label>
        <label>
          Hasta (fecha y hora con zona)
          <input
            name="hasta"
            placeholder="2026-10-31T23:59:59-03:00"
            required
          />
        </label>
        <label>
          Límite total
          <input name="limite" type="number" min="1" required />
        </label>
        <label>
          Usos por persona
          <input
            name="porUsuario"
            type="number"
            min="1"
            defaultValue="1"
            required
          />
        </label>
        <fieldset>
          <legend>Propuestas (sin selección: todas)</legend>
          {os.map((o) => (
            <label className="check-label" key={o.id}>
              <input type="checkbox" name="ofertas" value={o.id} />
              {o.nombre}
            </label>
          ))}
        </fieldset>
        <label className="check-label">
          <input name="activo" type="checkbox" />
          Activo
        </label>
      </ActionForm>
    </>
  );
}
