import "../db/load-env";
import { readFile, writeFile } from "node:fs/promises";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import assert from "node:assert/strict";
import { and, eq } from "drizzle-orm";
import { db } from "../lib/db";
import {
  admisiones,
  usuarios,
  tokensCuenta,
  certificados,
  ofertas,
  encuentrosAcademia,
  pedidos,
} from "../db/schema";
const base = "http://127.0.0.1:3001";
const results: string[] = [];
let f: {
  owner: string;
  other: string;
  admin: string;
  course: string;
  tool: string;
  certificate: string;
  file: string;
  receipt: string;
  transfer: string;
  mp: string;
  tokens: Record<string, string>;
};
const unescape = (s: string) =>
  s
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
async function get(path: string, who?: string) {
  return fetch(base + path, {
    headers: who ? { cookie: `psicomar_sesion=${f.tokens[who]}` } : {},
    redirect: "manual",
  });
}
async function submit(
  path: string,
  label: string,
  values: Record<string, string | string[]>,
  who?: string,
  old?: FormData,
) {
  let fd = old;
  if (!fd) {
    const r = await get(path, who);
    const html = await r.text();
    const forms = html.match(/<form[\s\S]*?<\/form>/g) ?? [];
    const form = forms.find((x) => x.includes(label));
    assert(form, `Formulario ${label} en ${path}`);
    fd = new FormData();
    for (const input of form.match(/<input\b[^>]*>/g) ?? []) {
      if (!input.includes('type="hidden"')) continue;
      const name = input.match(/\bname="([^"]*)"/)?.[1];
      if (name)
        fd.append(
          unescape(name),
          unescape(input.match(/\bvalue="([^"]*)"/)?.[1] ?? ""),
        );
    }
  }
  for (const [key, value] of Object.entries(values)) {
    fd.delete(key);
    for (const v of Array.isArray(value) ? value : [value]) fd.append(key, v);
  }
  const res = await fetch(base + path, {
    method: "POST",
    body: fd,
    headers: {
      origin: base,
      ...(who ? { cookie: `psicomar_sesion=${f.tokens[who]}` } : {}),
    },
    redirect: "manual",
  });
  return { res, html: await res.text(), fd };
}
function pass(name: string) {
  results.push(name);
  console.log("PASS:", name);
}
async function main() {
  if (process.env.PSICOMAR_LOCAL_TEST !== "1") throw new Error("Solo local");
  f = JSON.parse(await readFile("test-results/fixtures.json", "utf8"));
  for (const path of [
    "/",
    "/terapia",
    "/academia",
    "/quienes-somos",
    "/formaciones",
    "/recursos",
    "/supervisiones",
    "/blog",
    "/contacto",
    "/privacidad",
    "/terminos",
    "/registro",
    "/ingresar",
    "/recuperar",
  ])
    assert.equal((await get(path)).status, 200, path);
  for (const path of ["/atencion-clinica", "/para-profesionales"])
    assert.equal((await get(path)).status, 308);
  pass("Marketing, legales, auth y redirecciones responden");
  assert.equal((await get("/cuenta")).status, 307);
  assert.equal((await get("/admin", "owner")).status, 307);
  for (const path of [
    "/admin",
    "/admin/admisiones",
    "/admin/academia",
    "/admin/ventas",
    "/admin/cupones",
    "/admin/configuracion",
    "/admin/profesionales",
    "/admin/certificados",
  ])
    assert.equal((await get(path, "admin")).status, 200, path);
  pass("Panel completo y protección por rol");
  assert.equal((await get(`/api/certificados/${f.certificate}`)).status, 401);
  assert.equal(
    (await get(`/api/certificados/${f.certificate}`, "other")).status,
    404,
  );
  const pdf = await get(`/api/certificados/${f.certificate}`, "owner");
  assert.equal(pdf.status, 200);
  assert.equal(pdf.headers.get("content-type"), "application/pdf");
  assert.equal((await get(`/api/archivos/${f.receipt}`, "other")).status, 404);
  assert.equal((await get(`/api/archivos/${f.file}`)).status, 401);
  const foreignOrder = await (
    await get(`/cuenta/compras/${f.transfer}`, "other")
  ).text();
  assert(
    foreignOrder.includes("NEXT_HTTP_ERROR_FALLBACK;404") ||
      foreignOrder.includes("no encontramos"),
  );
  assert(!foreignOrder.includes("Prueba curso"));
  pass("PDF, comprobantes y pedidos aislados por titular");
  const admission = {
    nombre: "Ana QA",
    apellido: "Prueba local",
    email: `qa-${randomUUID()}@example.test`,
    whatsapp: "+5491100000000",
    pais: "Argentina",
    zonaHoraria: "America/Argentina/Buenos_Aires",
    disponibilidad: "Lunes por la tarde",
    contacto: "email",
    mayor: "on",
    privacidad: "on",
  };
  const request = await submit("/terapia", "Enviar solicitud", admission);
  assert(
    request.html.includes("Recibimos tu solicitud"),
    request.html.slice(-600),
  );
  const duplicate = await submit(
    "/terapia",
    "Enviar solicitud",
    admission,
    undefined,
    request.fd,
  );
  assert(duplicate.html.includes("ya fue recibida"));
  const [adm] = await db
    .select()
    .from(admisiones)
    .where(eq(admisiones.email, admission.email));
  assert(adm);
  const denied = await submit(
    `/admin/admisiones/${adm.id}`,
    "Guardar",
    {
      id: adm.id,
      revision: "0",
      estado: "confirmada",
      profesional: "Maite",
      zonaHoraria: admission.zonaHoraria,
      fecha: "2026-10-01T15:00:00-03:00",
      meet: "https://meet.google.com/abc-defg-hij",
      observacion: "",
    },
    "admin",
  );
  assert(denied.html.includes("abono recibido"));
  assert.equal(
    (await db.select().from(admisiones).where(eq(admisiones.id, adm.id)))[0]
      .estado,
    "nueva",
  );
  const confirmed = await submit(
    `/admin/admisiones/${adm.id}`,
    "Guardar",
    {
      id: adm.id,
      revision: "0",
      estado: "confirmada",
      profesional: "Maite",
      zonaHoraria: admission.zonaHoraria,
      fecha: "2026-10-01T15:00:00-03:00",
      meet: "https://meet.google.com/abc-defg-hij",
      observacion: "Coordinación de prueba",
      abonoRecibido: "on",
    },
    "admin",
  );
  assert(confirmed.html.includes("Cambios guardados"));
  pass("Admisión idempotente y confirmación exige abono");
  const login = await submit("/ingresar", "Ingresar", {
    email: `${f.owner}@example.test`,
    password: "Psicomar-QA-local-2026",
    volver: `/checkout?oferta=${f.course}`,
  });
  assert.equal(login.res.status, 303);
  assert.equal(
    login.res.headers.get("location"),
    `/checkout?oferta=${f.course}`,
  );
  assert(login.res.headers.get("set-cookie")?.includes("HttpOnly"));
  pass("Ingreso devuelve al checkout y crea cookie HttpOnly");
  const course = await get(`/cuenta/cursos/${f.course}`, "owner");
  const courseHtml = await course.text();
  assert(!courseHtml.includes('"correctas"'));
  assert(courseHtml.includes("Primera clase"));
  const completed = await submit(
    `/cuenta/cursos/${f.course}`,
    "Marcar clase como completada",
    {},
    "owner",
  );
  assert(completed.html.includes("Clase completada"));
  const approved = await submit(
    `/cuenta/cursos/${f.course}`,
    "Entregar evaluación",
    { q_q1: "a" },
    "owner",
  );
  assert(approved.html.includes("Evaluación aprobada"));
  const certs = await db
    .select()
    .from(certificados)
    .where(
      and(
        eq(certificados.usuarioId, f.owner),
        eq(certificados.ofertaId, f.course),
      ),
    );
  assert.equal(certs.length, 1);
  pass("Progreso, examen corregido en servidor y certificado único");
  await db
    .update(pedidos)
    .set({ accessExpiresAt: new Date(Date.now() - 1) })
    .where(eq(pedidos.id, f.transfer));
  const expired = await (
    await get(`/cuenta/cursos/${f.course}`, "owner")
  ).text();
  assert(expired.includes("Tu acceso no está activo"));
  assert(!expired.includes("Contenido educativo de prueba"));
  assert.equal(
    (await get(`/api/certificados/${certs[0].id}`, "owner")).status,
    200,
  );
  pass("Vencimiento bloquea contenido, mantiene PDF emitido");
  const email = `registro-${randomUUID()}@example.test`;
  const registration = await submit("/registro", "Crear cuenta", {
    nombre: "Registro prueba",
    email,
    password: "Prueba-registro-2026",
    privacidad: "on",
    rol: "admin",
  });
  assert.equal(registration.res.status, 303);
  const [newUser] = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.email, email));
  assert.equal(newUser.rol, "profesional");
  assert.notEqual(newUser.passwordHash, "Prueba-registro-2026");
  pass("Registro impide escalamiento de rol");
  // A second entitled user consumes all allowed attempts, then replays the old form.
  await db
    .insert(pedidos)
    .values({
      clave: randomUUID(),
      usuarioId: f.other,
      ofertaId: f.course,
      nombre: "Curso de prueba local",
      tipo: "curso",
      metodo: "transferencia",
      importe: 10000,
      estado: "aprobado",
      approvedAt: new Date(),
      accessExpiresAt: new Date(Date.now() + 86400000),
    });
  let stale: FormData | undefined;
  for (let n = 0; n < 3; n++) {
    const attempt = await submit(
      `/cuenta/cursos/${f.course}`,
      "Entregar evaluación",
      { q_q1: "b" },
      "other",
    );
    stale = attempt.fd;
    assert(attempt.html.includes("Todavía no alcanzaste"));
  }
  const fourth = await submit(
    `/cuenta/cursos/${f.course}`,
    "Entregar evaluación",
    { q_q1: "a" },
    "other",
    stale,
  );
  assert(fourth.html.includes("máximo de intentos"));
  pass("Tres intentos máximos y rechazo de replay de examen");
  const verifyToken = randomBytes(32).toString("hex");
  await db
    .insert(tokensCuenta)
    .values({
      hash: createHash("sha256").update(verifyToken).digest("hex"),
      usuarioId: f.other,
      tipo: "verificacion",
      expiresAt: new Date(Date.now() + 60000),
    });
  const verify = await submit(
    `/verificar?token=${verifyToken}`,
    "Confirmar mi email",
    { token: verifyToken },
  );
  assert(verify.html.includes("Tu email está verificado"));
  const verifiedAgain = await submit(
    `/verificar?token=${verifyToken}`,
    "Confirmar mi email",
    { token: verifyToken },
  );
  assert(verifiedAgain.html.includes("ya fue utilizado"));
  pass("Verificación de email de un solo uso");
  const [supervision] = await db
    .insert(ofertas)
    .values({
      clave: `qa-supervision:${randomUUID()}`,
      nombre: "Supervisión QA individual",
      tipo: "supervision",
      activa: true,
      precioMp: 10000,
    })
    .returning();
  const [superOrder] = await db
    .insert(pedidos)
    .values({
      clave: randomUUID(),
      usuarioId: f.other,
      ofertaId: supervision.id,
      nombre: supervision.nombre,
      tipo: "supervision",
      metodo: "transferencia",
      importe: 10000,
      estado: "aprobado",
      approvedAt: new Date(),
    })
    .returning();
  const meeting = await submit(
    `/admin/ventas/${superOrder.id}`,
    "Guardar encuentro",
    {
      pedidoId: superOrder.id,
      numero: "1",
      fecha: "2026-10-05T15:00:00-03:00",
      zonaHoraria: "America/Argentina/Buenos_Aires",
      enlace: "https://meet.google.com/abc-defg-hij",
      estado: "confirmado",
    },
    "admin",
  );
  assert(meeting.html.includes("Encuentro guardado"));
  assert.equal(
    (
      await db
        .select()
        .from(encuentrosAcademia)
        .where(eq(encuentrosAcademia.pedidoId, superOrder.id))
    ).length,
    1,
  );
  assert(
    (await (await get("/cuenta/supervisiones", "other")).text()).includes(
      "Ingresar al encuentro",
    ),
  );
  const doubleMeeting = await submit(
    `/admin/ventas/${superOrder.id}`,
    "Guardar encuentro",
    {
      pedidoId: superOrder.id,
      numero: "2",
      fecha: "2026-10-06T15:00:00-03:00",
      zonaHoraria: "America/Argentina/Buenos_Aires",
      enlace: "https://meet.google.com/abc-defg-hij",
      estado: "confirmado",
    },
    "admin",
  );
  assert(doubleMeeting.html.includes("incluye un encuentro"));
  pass(
    "Coordinación educativa visible al titular, sin segunda sesión individual",
  );
  const token = randomBytes(32).toString("hex");
  await db.insert(tokensCuenta).values({
    hash: createHash("sha256").update(token).digest("hex"),
    usuarioId: f.owner,
    tipo: "reset",
    expiresAt: new Date(Date.now() + 60000),
  });
  const reset = await submit(
    `/recuperar/nueva?token=${token}`,
    "Actualizar contraseña",
    {
      token,
      password: "Otra-password-QA-2026",
    },
  );
  assert(reset.html.includes("Contraseña actualizada"));
  const oldSession = await get("/cuenta", "owner");
  assert(
    oldSession.status === 307 ||
      (await oldSession.text()).includes("NEXT_REDIRECT"),
  );
  const replay = await submit(
    `/recuperar/nueva?token=${token}`,
    "Actualizar contraseña",
    {
      token,
      password: "Otra-password-QA-2027",
    },
  );
  assert(replay.html.includes("ya fue utilizado"));
  pass("Reset de un uso invalida sesiones anteriores");
  assert.equal((await fetch(base + "/api/cron/diario")).status, 401);
  assert.equal(
    (await fetch(base + "/api/pagos/webhook", { method: "POST" })).status,
    503,
  );
  pass("Cron protegido y pago no configurado no simula aprobación");
  await writeFile(
    "test-results/http-report.json",
    JSON.stringify({ passed: results, date: new Date() }, null, 2),
  );
}
main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
