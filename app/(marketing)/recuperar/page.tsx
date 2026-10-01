import { ActionForm } from "@/components/platform/ActionForm";
import { recuperarCuenta } from "@/lib/acciones/plataforma";
export default function Page() {
  return (
    <section className="contenedor py-16 max-w-xl">
      <h1 className="text-4xl mb-8">Recuperá tu acceso.</h1>
      <ActionForm
        action={recuperarCuenta}
        label="Enviar instrucciones"
        hideOnSuccess
      >
        <label>
          Email de tu cuenta
          <input name="email" type="email" required autoComplete="email" />
        </label>
      </ActionForm>
    </section>
  );
}
