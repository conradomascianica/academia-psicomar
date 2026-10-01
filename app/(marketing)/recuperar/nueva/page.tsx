import { ActionForm } from "@/components/platform/ActionForm";
import { restablecerCuenta } from "@/lib/acciones/plataforma";
export default async function Page({
  searchParams,
}: PageProps<"/recuperar/nueva">) {
  const { token } = await searchParams;
  return (
    <section className="contenedor py-16 max-w-xl">
      <h1 className="text-4xl mb-8">Nueva contraseña.</h1>
      <ActionForm
        action={restablecerCuenta}
        label="Actualizar contraseña"
        hideOnSuccess
      >
        <input
          type="hidden"
          name="token"
          value={typeof token === "string" ? token : ""}
        />
        <label>
          Al menos 12 caracteres
          <input
            name="password"
            type="password"
            minLength={12}
            maxLength={72}
            required
            autoComplete="new-password"
          />
        </label>
      </ActionForm>
      <a href="/ingresar" className="mt-6 block underline">
        Volver a ingresar
      </a>
    </section>
  );
}
