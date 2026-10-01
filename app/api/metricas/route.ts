import { db } from "@/lib/db";
import { metricas } from "@/db/schema";
import { limitarSolicitud } from "@/lib/platform/security";
const allowed = new Set([
  "cta_terapia",
  "cta_academia",
  "formulario_admision_iniciado",
  "checkout_iniciado",
]);
export async function POST(req: Request) {
  try {
    const origin = req.headers.get("origin");
    if (!origin || origin !== new URL(req.url).origin)
      return new Response(null, { status: 403 });
    const text = await req.text();
    if (text.length > 100) return new Response(null, { status: 400 });
    if (!allowed.has(text)) return new Response(null, { status: 400 });
    await limitarSolicitud("metricas", 60);
    await db.insert(metricas).values({ evento: text });
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 429 });
  }
}
