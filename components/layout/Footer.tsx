import Link from "next/link";
import { Logo } from "@/components/Logo";
import { IconoInstagram } from "@/components/ui/iconos";
import {
  site,
  footerLinks,
  instagramUrl,
  DISCLAIMER_LEGAL,
} from "@/lib/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-mar-900 text-mar-100">
      <div className="contenedor grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Logo tono="blanco" alto={40} />
          <p className="max-w-xs text-sm text-mar-200">{site.tagline}</p>
          <div className="flex flex-wrap gap-2">
            {[
              site.instagram.academia,
              site.instagram.kiara,
              site.instagram.maite,
            ].map((handle) => (
              <a
                key={handle}
                href={instagramUrl(handle)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs text-mar-100 transition-colors hover:bg-white/10"
              >
                <IconoInstagram width={16} height={16} />@{handle}
              </a>
            ))}
          </div>
        </div>

        {footerLinks.map((grupo) => (
          <nav key={grupo.titulo} aria-label={grupo.titulo}>
            <h2 className="text-sm font-semibold text-white">{grupo.titulo}</h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {grupo.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-mar-200 transition-colors hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="contenedor flex flex-col gap-4 py-6 text-xs text-mar-300 md:flex-row md:items-start md:justify-between">
          <p className="max-w-2xl">{DISCLAIMER_LEGAL}</p>
          <div className="flex shrink-0 flex-col gap-1 md:items-end">
            <p>
              © {year} PSICOMAR · Psicología &amp; Formación
            </p>
            <p className="flex gap-3">
              <Link href="/terminos" className="hover:text-white">
                Términos
              </Link>
              <Link href="/privacidad" className="hover:text-white">
                Privacidad
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
