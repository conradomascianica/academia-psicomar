import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { certificados } from "@/db/schema";
import { usuarioActual } from "@/lib/auth/dal";
import { renderCertificate } from "@/lib/platform/certificate";
export async function GET(
  _: Request,
  { params }: RouteContext<"/api/certificados/[id]">,
) {
  const u = await usuarioActual();
  if (!u) return new Response("Ingresá a tu cuenta", { status: 401 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success)
    return new Response("No disponible", { status: 404 });
  const [c] = await db
    .select()
    .from(certificados)
    .where(eq(certificados.id, id));
  if (!c || (c.usuarioId !== u.id && u.rol !== "admin"))
    return new Response("No disponible", { status: 404 });
  const pdf = await renderCertificate(c);
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificado-psicomar-${id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
