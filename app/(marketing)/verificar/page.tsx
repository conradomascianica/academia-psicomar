import { ActionForm } from "@/components/platform/ActionForm";
import { verificarEmail } from "@/lib/acciones/plataforma";
export default async function Page({ searchParams }: PageProps<"/verificar">) {
  const { token } = await searchParams;
  return (
    <section className="contenedor py-16 max-w-xl">
      <h1 className="text-4xl mb-8">Verificá tu email.</h1>
      <ActionForm
        action={verificarEmail}
        label="Confirmar mi email"
        hideOnSuccess
      >
        <input
          type="hidden"
          name="token"
          value={typeof token === "string" ? token : ""}
        />
      </ActionForm>
    </section>
  );
}
