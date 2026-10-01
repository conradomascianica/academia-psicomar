/**
 * Configuración global del sitio.
 *
 * En la Fase 2 varios de estos valores (WhatsApp, Instagram, textos legales)
 * pasan a `site_settings` en la base y se editan desde /admin. Por ahora viven
 * acá y/o en variables de entorno.
 */

/**
 * URL pública del sitio (sin barra final). Orden de preferencia:
 *  1. NEXT_PUBLIC_SITE_URL — setear cuando haya dominio propio.
 *  2. El dominio de producción que asigna Vercel automáticamente.
 *  3. Fallback fijo (dev / previews).
 */
export const SITE_URL = (
  (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.NEXT_PUBLIC_SITE_URL) ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://academia-psicomar.vercel.app")
).replace(/\/$/, "");

export const site = {
  name: "PSICOMAR",
  shortName: "PSICOMAR",
  tagline: "Psicología & Formación",
  description:
    "PSICOMAR es un espacio de psicología basada en evidencia: terapia online para adultos y formación, supervisión y herramientas concretas para profesionales de salud mental.",
  url: SITE_URL,
  locale: "es_AR",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "psicomar.km@gmail.com",
  instagram: {
    academia: "academia.psicomar",
    kiara: "lic.marrellikiara",
    maite: "lic.maitemartelli",
  },
  /**
   * Números de WhatsApp en formato internacional para wa.me (solo dígitos).
   * Argentina móvil = 54 + 9 + código de área + número.
   *  - Kiara: (0297) 462-1108  ->  54 9 297 462 1108
   *  - Maite: (011) 3465-6167  ->  54 9 11 3465 6167
   */
  whatsapp: {
    kiara: process.env.NEXT_PUBLIC_WHATSAPP_KIARA ?? "5492974621108",
    maite: process.env.NEXT_PUBLIC_WHATSAPP_MAITE ?? "5491134656167",
  },
} as const;

/** Mensaje precargado del CTA de terapia. */
export const MENSAJE_TERAPIA =
  "Hola, quiero más info sobre la terapia online 🌊";

/** Link wa.me con mensaje precargado. */
export function whatsappLink(numeroDigitos: string, mensaje: string): string {
  return `https://wa.me/${numeroDigitos.replace(/\D/g, "")}?text=${encodeURIComponent(
    mensaje,
  )}`;
}

export function instagramUrl(handle: string): string {
  return `https://instagram.com/${handle}`;
}

/** Navegación principal. */
export const navPrincipal = [
  { href: "/", label: "Inicio" },
  { href: "/terapia", label: "Terapia" },
  { href: "/academia", label: "Academia" },
  { href: "/quienes-somos", label: "Quiénes somos" },
  { href: "/blog", label: "Blog" },
  { href: "/contacto", label: "Contacto" },
] as const;

/** Links del footer, agrupados. */
export const footerLinks = [
  {
    titulo: "PSICOMAR",
    links: [
      { href: "/quienes-somos", label: "Quiénes somos" },
      { href: "/terapia", label: "Terapia" },
      { href: "/academia", label: "Academia PsicoMar" },
      { href: "/blog", label: "Blog" },
      { href: "/contacto", label: "Contacto" },
    ],
  },
  {
    titulo: "Formación",
    links: [
      { href: "/formaciones", label: "Todas las formaciones" },
      { href: "/formaciones?tipo=talleres", label: "Talleres y cursos" },
      { href: "/supervisiones", label: "Supervisiones" },
      { href: "/recursos", label: "Packs de herramientas" },
      { href: "/formaciones?tipo=grabados", label: "Cursos grabados" },
    ],
  },
] as const;

export const DISCLAIMER_LEGAL =
  "El contenido educativo de esta web tiene fines informativos y de formación profesional. No constituye asesoramiento clínico individual ni reemplaza la atención profesional cuando esta es necesaria. Ante una urgencia en salud mental, comunicate con los servicios de emergencia de tu zona.";
