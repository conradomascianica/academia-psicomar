import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileCtaBar } from "@/components/layout/MobileCtaBar";
import { OrganizationJsonLd } from "@/components/JsonLd";

// ISR: las páginas se regeneran como máximo cada 60 s. Las ediciones desde
// /admin además fuerzan la actualización al instante (revalidatePath).
export const revalidate = 60;

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <OrganizationJsonLd />
      <Header />
      {/* pb-24 en mobile deja aire para la MobileCtaBar fija */}
      <main id="contenido" className="flex-1 pb-24 md:pb-0">
        {children}
      </main>
      <Footer />
      <MobileCtaBar />
    </>
  );
}
