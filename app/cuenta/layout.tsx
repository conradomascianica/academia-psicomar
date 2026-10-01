import Link from "next/link";
import type { Metadata } from "next";
import { requerirProfesional } from "@/lib/auth/dal";
import { cerrarSesion } from "@/lib/acciones/auth";
import { Logo } from "@/components/Logo";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const u = await requerirProfesional();
  return (
    <>
      <header className="bg-navy text-white">
        <div className="contenedor py-5 flex flex-wrap items-center justify-between gap-4">
          <Logo tono="blanco" />
          <span className="text-sm">Academia PsicoMar</span>
          <form action={cerrarSesion}>
            <button className="text-sm underline min-h-11">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>
      <div className="contenedor py-10">
        <p className="eyebrow">HOLA, {u.nombre}</p>
        <h1 className="text-4xl mt-3">Mi Academia</h1>
        <nav
          aria-label="Mi Academia"
          className="flex overflow-x-auto gap-2 py-7 mb-5 border-b border-mar-200"
        >
          {[
            ["", "Inicio"],
            ["cursos", "Mis cursos"],
            ["herramientas", "Mis herramientas"],
            ["supervisiones", "Supervisiones"],
            ["compras", "Mis compras"],
            ["certificados", "Certificados"],
            ["perfil", "Mi perfil"],
          ].map(([path, label]) => (
            <Link
              className="whitespace-nowrap px-4 py-3 rounded-full border border-mar-200 text-sm hover:bg-mar-100"
              key={path}
              href={`/cuenta${path ? "/" + path : ""}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <main>{children}</main>
      </div>
    </>
  );
}
