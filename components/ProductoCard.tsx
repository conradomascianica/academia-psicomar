import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { IconoFlecha } from "@/components/ui/iconos";
import type { Producto } from "@/content/types";

export function ProductoCard({ producto }: { producto: Producto }) {
  return (
    <Card href={`/recursos/${producto.slug}`} as="li" className="gap-4">
      <div className="flex flex-wrap gap-2">
        <Badge tono="coral">Pack de herramientas</Badge>
        <Badge tono="neutro">Acceso permanente</Badge>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-xl text-tinta">{producto.nombre}</h3>
        <p className="text-sm leading-relaxed text-tinta-suave">
          {producto.resumen}
        </p>
      </div>
      <p className="mt-1 text-sm font-medium text-tinta">
        Ver precios y medios de pago
      </p>
      <span className="relative z-10 mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-mar-700">
        Ver el pack
        <IconoFlecha
          width={16}
          height={16}
          className="transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </Card>
  );
}
