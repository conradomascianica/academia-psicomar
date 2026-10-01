import { timingSafeEqual } from "node:crypto";
import { mantenimientoDiario } from "@/lib/platform/maintenance";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const got = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  if (
    !secret ||
    got.length !== expected.length ||
    !timingSafeEqual(got, expected)
  )
    return new Response("Unauthorized", { status: 401 });
  return Response.json(await mantenimientoDiario(), {
    headers: { "Cache-Control": "no-store" },
  });
}
