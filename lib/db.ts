import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "Falta DATABASE_URL. Configurala en .env.local (local) y en Vercel (producción).",
  );
}

if (
  process.env.VERCEL_ENV === "preview" &&
  process.env.PSICOMAR_PREVIEW_DATABASE_CONFIRMED !== "true"
) {
  throw new Error(
    "La preview requiere una base aislada y PSICOMAR_PREVIEW_DATABASE_CONFIRMED=true.",
  );
}

// En serverless conviene reutilizar la conexión entre invocaciones.
// `prepare: false` es necesario con el pooler de Neon (pgbouncer).
const globalForDb = globalThis as unknown as {
  _sql?: ReturnType<typeof postgres>;
};

const client =
  globalForDb._sql ??
  postgres(connectionString, {
    prepare: process.env.PSICOMAR_LOCAL_TEST === "1",
    max: 1,
  });

globalForDb._sql = client;

export const db = drizzle(client, { schema, casing: "snake_case" });
