import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { site, SITE_URL } from "@/lib/site";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "psicología online",
    "terapia online",
    "terapia cognitivo conductual",
    "terapia dialéctico conductual",
    "ansiedad",
    "psicólogas online",
    "formación para psicólogos",
    "cursos para psicólogos",
    "supervisión clínica",
    "herramientas para psicólogos",
    "psicofarmacología para psicólogos",
  ],
  authors: [{ name: "Kiara" }, { name: "Maite Martelli" }],
  openGraph: {
    type: "website",
    locale: site.locale,
    url: SITE_URL,
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  robots: {
    index: process.env.VERCEL_ENV !== "preview",
    follow: process.env.VERCEL_ENV !== "preview",
  },
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-AR"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-crema text-tinta">
        {children}
      </body>
    </html>
  );
}
