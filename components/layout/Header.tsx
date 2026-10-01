"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { navPrincipal } from "@/lib/site";
import { Logo } from "@/components/Logo";
export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <header className="sticky top-0 z-40 bg-crema border-b border-mar-200">
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      <div className="contenedor flex min-h-20 items-center justify-between gap-4">
        <Logo alto={40} />
        <nav
          aria-label="Navegación principal"
          className="hidden lg:flex gap-6 text-sm"
        >
          {navPrincipal
            .filter((n) => n.href !== "/")
            .map((n) => (
              <Link
                aria-current={pathname === n.href ? "page" : undefined}
                className={
                  pathname === n.href
                    ? "font-semibold underline underline-offset-8"
                    : "hover:text-mar-600"
                }
                key={n.href}
                href={n.href}
              >
                {n.label}
              </Link>
            ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link
            href="/cuenta"
            className="hidden sm:block text-sm underline underline-offset-4"
          >
            Ingresar
          </Link>
          <Link
            href="/terapia#solicitud"
            className="hidden lg:inline-flex btn-primary"
          >
            Solicitar admisión
          </Link>
          <button
            ref={button}
            type="button"
            className="lg:hidden min-w-12 min-h-12 border rounded-full"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
          >
            {open ? "×" : "☰"}
          </button>
        </div>
      </div>
      {open && (
        <nav
          id="menu-mobile"
          aria-label="Menú móvil"
          className="lg:hidden max-h-[75dvh] overflow-y-auto border-t border-mar-200 px-5 py-5 bg-crema"
        >
          {[
            ...navPrincipal,
            { href: "/cuenta", label: "Ingresar a Mi Academia" },
          ].map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="block py-3 border-b border-mar-100"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
