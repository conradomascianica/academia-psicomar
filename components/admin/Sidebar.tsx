"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { cerrarSesion } from "@/lib/acciones/auth";

const LINKS = [
  { href: "/admin", label: "Inicio", exact: true },
  { href: "/admin/admisiones", label: "Admisiones" },
  { href: "/admin/profesionales", label: "Profesionales" },
  { href: "/admin/ventas", label: "Ventas y transferencias" },
  { href: "/admin/academia", label: "Cursos y contenidos" },
  { href: "/admin/cupones", label: "Cupones" },
  { href: "/admin/certificados", label: "Certificados" },
  { href: "/admin/configuracion", label: "Configuración y correos" },
  { href: "/admin/formaciones", label: "Formaciones" },
  { href: "/admin/productos", label: "Packs de herramientas" },
  { href: "/admin/supervision", label: "Supervisión" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/equipo", label: "Equipo" },
  { href: "/admin/consultas", label: "Consultas" },
];

export function Sidebar({ nombre }: { nombre: string }) {
  const pathname = usePathname();
  const activo = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="flex shrink-0 flex-col gap-1 border-b border-mar-100 bg-white p-4 md:h-dvh md:w-60 md:border-b-0 md:border-r">
      <div className="mb-4 px-2">
        <p className="font-display text-lg font-semibold text-tinta">
          PsicoMar <span className="text-mar-500">·</span> panel
        </p>
        <p className="text-xs text-tinta-suave">Hola, {nombre}</p>
      </div>

      <nav className="flex flex-wrap gap-1 md:flex-col">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm transition-colors",
              activo(l.href, l.exact)
                ? "bg-mar-50 font-medium text-mar-800"
                : "text-tinta-suave hover:bg-mar-50/60 hover:text-tinta",
            )}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1 pt-4">
        <Link
          href="/"
          target="_blank"
          className="rounded-lg px-3 py-2 text-sm text-tinta-suave hover:bg-mar-50/60"
        >
          Ver el sitio ↗
        </Link>
        <form action={cerrarSesion}>
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-coral-600 hover:bg-coral-50"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
