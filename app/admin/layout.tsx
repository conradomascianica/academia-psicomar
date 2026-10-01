import type { ReactNode } from "react";
import type { Metadata } from "next";
import { requerirAdmin } from "@/lib/auth/dal";
import { Sidebar } from "@/components/admin/Sidebar";

export const metadata: Metadata = {
  title: "Panel",
  robots: { index: false, follow: false },
};

// El panel siempre se renderiza fresco.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const sesion = await requerirAdmin();

  return (
    <div className="flex min-h-dvh flex-col bg-crema md:flex-row">
      <Sidebar nombre={sesion.nombre} />
      <main className="min-w-0 flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
