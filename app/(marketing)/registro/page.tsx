import { ActionForm } from "@/components/platform/ActionForm";
import { registrarProfesional } from "@/lib/acciones/plataforma";
export default async function Page({ searchParams }: PageProps<"/registro">) {
  const { volver } = await searchParams;
  const destino = typeof volver === "string" ? volver : "";
  return (
    <section className="contenedor py-16">
      <div className="max-w-lg mx-auto">
        <p className="eyebrow">TU ESPACIO PROFESIONAL</p>
        <h1 className="my-5 text-4xl">Creá tu cuenta.</h1>
        <p className="mb-8">
          Tu nombre completo se usará para emitir tus certificados.
        </p>
        <ActionForm action={registrarProfesional} label="Crear cuenta">
          <input type="hidden" name="volver" value={destino} />
          <label>
            Nombre y apellido
            <input
              name="nombre"
              required
              minLength={3}
              maxLength={120}
              autoComplete="name"
            />
          </label>
          <label>
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            Contraseña · mínimo 12 caracteres
            <input
              name="password"
              type="password"
              required
              minLength={12}
              maxLength={72}
              autoComplete="new-password"
            />
          </label>
          <label className="check-label">
            <input type="checkbox" name="privacidad" required />
            <span>
              Leí los <a href="/terminos">términos</a> y la{" "}
              <a href="/privacidad">política de privacidad</a>.
            </span>
          </label>
        </ActionForm>
      </div>
    </section>
  );
}
