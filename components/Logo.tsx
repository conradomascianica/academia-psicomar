import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/cn";
import logoColor from "@/public/logo-psicomar.png";
import logoBlanco from "@/public/logo-psicomar-blanco.png";

/**
 * Logotipo oficial de Academia PsicoMar (marca "PsicoMar" con la ola).
 * Archivos en /public: logo-psicomar.png (color) y logo-psicomar-blanco.png
 * (para fondos oscuros, p. ej. el footer). El isotipo suelto está en
 * /public/logo-icono.png.
 */
export function Logo({
  className,
  tono = "tinta",
  alto = 32,
}: {
  className?: string;
  tono?: "tinta" | "blanco";
  alto?: number;
}) {
  const src = tono === "blanco" ? logoBlanco : logoColor;

  return (
    <Link
      href="/"
      className={cn("inline-flex items-center", className)}
      aria-label="PSICOMAR — inicio"
    >
      <Image
        src={src}
        alt="PSICOMAR"
        priority
        sizes="180px"
        style={{ height: alto, width: "auto" }}
      />
    </Link>
  );
}
