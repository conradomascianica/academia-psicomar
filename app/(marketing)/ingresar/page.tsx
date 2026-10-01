import Link from "next/link";
import { ActionForm } from "@/components/platform/ActionForm";
import { iniciarSesion } from "@/lib/acciones/auth";
export default async function Page({ searchParams }: PageProps<"/ingresar">) {
  const { volver } = await searchParams;
  const destino = typeof volver === "string" ? volver : "";
  return (
    <section className="contenedor py-16">
      <div className="max-w-lg mx-auto">
        <p className="eyebrow">ACADEMIA PSICOMAR</p>
        <h1 className="my-5 text-4xl">Qué bueno verte de nuevo.</h1>
        <p className="mb-8">
          Ingresá a tus cursos, herramientas y certificados.
        </p>
        <ActionForm action={iniciarSesion} label="Ingresar">
          <input type="hidden" name="volver" value={destino} />
          <label>
            Email
            <input name="email" type="email" autoComplete="username" required />
          </label>
          <label>
            Contraseña
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
        </ActionForm>
        <div className="mt-6 flex flex-wrap gap-5 underline">
          <Link
            href={
              destino
                ? `/registro?volver=${encodeURIComponent(destino)}`
                : "/registro"
            }
          >
            Crear una cuenta
          </Link>
          <Link href="/recuperar">Olvidé mi contraseña</Link>
        </div>
      </div>
    </section>
  );
}
