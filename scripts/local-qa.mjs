/** Disposable local database; never reads production connection settings. */
import { spawn } from "node:child_process";
import { mkdtemp, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
const root = process.cwd(),
  temp = await mkdtemp(path.join(tmpdir(), "psicomar-qa-"));
await mkdir("test-results", { recursive: true });
const env = {
  ...process.env,
  PSICOMAR_LOCAL_TEST: "1",
  VERCEL_ENV: "development",
  AUTH_SECRET: randomBytes(48).toString("hex"),
  EMAIL_PROVIDER: "disabled",
  MP_ACCESS_TOKEN: "",
  MP_WEBHOOK_SECRET: "",
  MP_COLLECTOR_ID: "",
  PRIVATE_BLOB_READ_WRITE_TOKEN: "",
  NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3001",
  SEED_KIARA_EMAIL: "",
  SEED_MAITE_EMAIL: "",
  NEXT_TELEMETRY_DISABLED: "1",
};
const bin = (name) => path.join(root, "node_modules", ".bin", name);
let server;
const pg = spawn(
  bin("pglite-server"),
  [`--db=${temp}/db`, "--port=0", "--max-connections=20"],
  { env, stdio: ["ignore", "pipe", "inherit"] },
);
const stop = () => {
  server?.kill("SIGTERM");
  pg.kill("SIGTERM");
};
process.once("SIGINT", () => {
  stop();
  process.exit(130);
});
process.once("SIGTERM", () => {
  stop();
  process.exit(143);
});
function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} terminó con ${code}`)),
    );
  });
}
try {
  const port = await new Promise((resolve, reject) => {
    let buffer = "";
    const timer = setTimeout(
      () => reject(new Error("La base local no inició")),
      20000,
    );
    pg.stdout.on("data", (data) => {
      buffer += data;
      const found = buffer.match(/listening on .*?"port":(\d+)/);
      if (found) {
        clearTimeout(timer);
        resolve(Number(found[1]));
      }
    });
    pg.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Base local terminó: ${code}`));
    });
  });
  env.DATABASE_URL = `postgresql://postgres:postgres@127.0.0.1:${port}/postgres`;
  await run("npm", ["run", "db:migrate"]);
  await run(process.execPath, ["--import", "tsx", "db/seed.ts"]);
  await run("npm", ["run", "test"]);
  await run("npm", ["run", "lint"]);
  await run("npm", ["run", "build"]);
  await run(process.execPath, [
    "--conditions=react-server",
    "--import",
    "tsx",
    "tests/commerce.integration.ts",
  ]);
  server = spawn(
    bin("next"),
    ["start", "--hostname", "127.0.0.1", "--port", "3001"],
    { env, stdio: ["ignore", "pipe", "inherit"] },
  );
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("El servidor no inició")),
      20000,
    );
    server.stdout.on("data", (data) => {
      process.stdout.write(data);
      if (String(data).includes("Ready")) {
        clearTimeout(timer);
        resolve();
      }
    });
    server.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Servidor terminó: ${code}`));
    });
  });
  await run(process.execPath, [
    "--conditions=react-server",
    "--import",
    "tsx",
    "tests/http.integration.ts",
  ]);
  console.log("QA local completa. La base desechable queda en", temp);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  stop();
}
