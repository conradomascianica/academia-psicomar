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
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const menu = dialog.current;
    if (!menu) return;
    if (!open) {
      menu.close();
      return;
    }
    menu.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", onResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      desktop.removeEventListener("change", onResize);
      menu.close();
    };
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
            className="lg:hidden inline-flex items-center justify-center gap-2 min-h-12 px-4 rounded-full bg-navy text-white font-semibold shadow-suave"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
          >
            <span aria-hidden="true">☰</span>
            <span>Menú</span>
          </button>
        </div>
      </div>
      <dialog
        ref={dialog}
        className="mobile-menu"
        aria-labelledby="mobile-menu-title"
        onCancel={() => setOpen(false)}
        onClose={() => {
          setOpen(false);
          button.current?.focus();
        }}
      >
        <div className="flex items-center justify-between gap-4 border-b border-mar-200 pb-5">
          <h2 id="mobile-menu-title" className="text-2xl">
            Menú
          </h2>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setOpen(false)}
          >
            Cerrar <span aria-hidden="true">×</span>
          </button>
        </div>
        <nav id="menu-mobile" aria-label="Menú móvil" className="py-4">
          {[
            ...navPrincipal,
            { href: "/cuenta", label: "Ingresar a Mi Academia" },
          ].map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-4 border-b border-mar-200 text-lg font-semibold hover:bg-mar-100"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/terapia"
          className="btn-primary w-full"
          onClick={() => setOpen(false)}
        >
          Quiero comenzar terapia ↗
        </Link>
      </dialog>
    </header>
  );
}
