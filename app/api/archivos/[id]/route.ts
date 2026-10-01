import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { archivosPrivados, pedidos, ofertas } from "@/db/schema";
import { usuarioActual } from "@/lib/auth/dal";
import { accesoVigente } from "@/lib/platform/rules";
import { leerPrivado } from "@/lib/platform/storage";
export async function GET(
  _: Request,
  { params }: RouteContext<"/api/archivos/[id]">,
) {
  const u = await usuarioActual();
  if (!u) return new Response("Ingresá a tu cuenta", { status: 401 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success)
    return new Response("No disponible", { status: 404 });
  const [f] = await db
    .select()
    .from(archivosPrivados)
    .where(eq(archivosPrivados.id, id));
  if (!f) return new Response("No disponible", { status: 404 });
  let allowed = u.rol === "admin";
  if (!allowed && f.uso === "comprobante") {
    const [p] = await db
      .select({ id: pedidos.id })
      .from(pedidos)
      .where(and(eq(pedidos.usuarioId, u.id), eq(pedidos.comprobanteId, id)));
    allowed = !!p;
  }
  if (!allowed && f.uso === "material") {
    const rows = await db
      .select({ p: pedidos, o: ofertas })
      .from(pedidos)
      .innerJoin(ofertas, eq(ofertas.id, pedidos.ofertaId))
      .where(and(eq(pedidos.usuarioId, u.id), eq(pedidos.estado, "aprobado")));
    allowed = rows.some(
      ({ p, o }) =>
        accesoVigente(p) &&
        [
          ...o.materiales,
          ...o.curriculum.modulos.flatMap((m) =>
            m.lecciones.flatMap((l) => l.materiales),
          ),
        ].some((m) => m.archivoId === id),
    );
  }
  if (!allowed) return new Response("No disponible", { status: 404 });
  const blob = await leerPrivado(f.pathname);
  if (!blob || blob.statusCode !== 200)
    return new Response("Archivo no disponible", { status: 404 });
  return new Response(blob.stream, {
    headers: {
      "Content-Type": f.mime,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(f.nombre)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
