import "../db/load-env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import {
  usuarios,
  ofertas,
  pedidos,
  archivosPrivados,
  eventos,
  certificados,
  correos,
} from "../db/schema";
import {
  aprobarPedido,
  rechazarPedido,
  actualizarPagoNoAprobado,
  acceso,
} from "../lib/platform/commerce";
import { firmarSesion } from "../lib/auth/jwt";
import { hashearPassword } from "../lib/auth/password";
import { mantenimientoDiario } from "../lib/platform/maintenance";
async function main() {
  if (
    process.env.PSICOMAR_LOCAL_TEST !== "1" ||
    !/^postgres(?:ql)?:\/\/[^/]+@(localhost|127\.0\.0\.1):/.test(
      process.env.DATABASE_URL ?? "",
    )
  )
    throw new Error("Solo se permite una base local aislada");
  process.env.EMAIL_PROVIDER = "disabled";
  process.env.MP_COLLECTOR_ID = "qa-collector";
  process.env.MP_ENV = "test";
  const passwordHash = await hashearPassword("Psicomar-QA-local-2026");
  const ids = {
    owner: randomUUID(),
    other: randomUUID(),
    admin: randomUUID(),
    course: randomUUID(),
    tool: randomUUID(),
    certificate: randomUUID(),
    file: randomUUID(),
    receipt: randomUUID(),
  };
  for (const [id, name, rol] of [
    [ids.owner, "Profesional de prueba", "profesional"],
    [ids.other, "Otra persona", "profesional"],
    [ids.admin, "Admin de prueba", "admin"],
  ] as const)
    await db
      .insert(usuarios)
      .values({
        id,
        nombre: name,
        email: `${id}@example.test`,
        passwordHash,
        rol,
      });
  const material = {
    id: "material-qa",
    archivoId: ids.file,
    nombre: "Material privado QA",
  };
  await db.insert(archivosPrivados).values([
    {
      id: ids.file,
      nombre: "Material QA.pdf",
      pathname: "qa/nonexistent.pdf",
      mime: "application/pdf",
      bytes: 100,
      propietarioId: ids.admin,
      uso: "material",
    },
    {
      id: ids.receipt,
      nombre: "Comprobante QA.pdf",
      pathname: "qa/receipt.pdf",
      mime: "application/pdf",
      bytes: 100,
      propietarioId: ids.owner,
      uso: "comprobante",
    },
  ]);
  await db.insert(ofertas).values([
    {
      id: ids.course,
      clave: `qa:${ids.course}`,
      nombre: "Curso de prueba local",
      tipo: "curso",
      precioMp: 10000,
      precioTransferencia: 9000,
      activa: true,
      cargaHoraria: "2 horas",
      curriculum: {
        modulos: [
          {
            id: "m1",
            titulo: "Módulo de prueba",
            lecciones: [
              {
                id: "l1",
                titulo: "Primera clase",
                texto:
                  "Contenido educativo de prueba. Este contenido no pertenece al catálogo real.",
                materiales: [material],
                requerida: true,
              },
            ],
          },
        ],
      },
      evaluacion: {
        aprobacion: 70,
        intentos: 3,
        requerirContenidos: true,
        preguntas: [
          {
            id: "q1",
            texto: "¿Qué representa este entorno?",
            tipo: "unica",
            opciones: [
              { id: "a", texto: "Una prueba local" },
              { id: "b", texto: "Una compra real" },
            ],
            correctas: ["a"],
            puntos: 1,
            feedback: "Es un entorno de prueba aislado.",
          },
        ],
      },
    },
    {
      id: ids.tool,
      clave: `qa:${ids.tool}`,
      nombre: "Herramienta de prueba local",
      tipo: "herramienta",
      activa: true,
      precioMp: 5000,
      materiales: [material],
    },
  ]);
  const makeOrder = async (
    metodo: string,
    tipo = "curso",
    estado = "pendiente",
    extra: Record<string, unknown> = {},
  ) => {
    const [p] = await db
      .insert(pedidos)
      .values({
        clave: randomUUID(),
        usuarioId: ids.owner,
        ofertaId: tipo === "curso" ? ids.course : ids.tool,
        nombre: `Prueba ${tipo}`,
        tipo,
        metodo,
        importe: 10000,
        estado,
        ...extra,
      })
      .returning();
    return p;
  };
  const transfer = await makeOrder("transferencia");
  assert.equal(await acceso(ids.owner, ids.course), null);
  await assert.rejects(
    () =>
      aprobarPedido(transfer.id, { tipo: "transferencia", actor: ids.admin }),
    /comprobante/,
  );
  await db
    .update(pedidos)
    .set({ estado: "esperando_verificacion", comprobanteId: ids.receipt })
    .where(eq(pedidos.id, transfer.id));
  await aprobarPedido(transfer.id, { tipo: "transferencia", actor: ids.admin });
  const a = await acceso(ids.owner, ids.course);
  assert(a);
  const date = a.accessExpiresAt!.getTime();
  await aprobarPedido(transfer.id, { tipo: "transferencia", actor: ids.admin });
  assert.equal(
    (await acceso(ids.owner, ids.course))!.accessExpiresAt!.getTime(),
    date,
  );
  assert.equal(
    (await db.select().from(eventos).where(eq(eventos.pedidoId, transfer.id)))
      .length,
    1,
  );
  assert.equal(await acceso(ids.other, ids.course), null);
  const bad = await makeOrder(
    "transferencia",
    "herramienta",
    "esperando_verificacion",
    { comprobanteId: ids.receipt },
  );
  await rechazarPedido(bad.id, ids.admin);
  assert.equal(
    (await db.select().from(pedidos).where(eq(pedidos.id, bad.id)))[0].estado,
    "rechazado",
  );
  assert.equal(await acceso(ids.owner, ids.tool), null);
  const mp = await makeOrder("mercadopago", "herramienta");
  const payment = {
    tipo: "mercadopago" as const,
    paymentId: randomUUID(),
    importe: 10000,
    moneda: "ARS",
    collector: "qa-collector",
    live: false,
  };
  for (const change of [
    { importe: 1 },
    { moneda: "USD" },
    { collector: "otra" },
    { live: true },
  ])
    await assert.rejects(
      () => aprobarPedido(mp.id, { ...payment, ...change }),
      /coincide/,
    );
  await aprobarPedido(mp.id, payment);
  await aprobarPedido(mp.id, payment);
  await assert.rejects(
    () => aprobarPedido(mp.id, { ...payment, paymentId: randomUUID() }),
    /duplicado/,
  );
  assert.equal((await acceso(ids.owner, ids.tool))!.accessExpiresAt, null);
  await actualizarPagoNoAprobado(mp.id, payment.paymentId, "pending");
  assert(await acceso(ids.owner, ids.tool));
  await actualizarPagoNoAprobado(mp.id, payment.paymentId, "refunded");
  assert.equal(await acceso(ids.owner, ids.tool), null);
  await actualizarPagoNoAprobado(mp.id, payment.paymentId, "pending");
  assert.equal(
    (await db.select().from(pedidos).where(eq(pedidos.id, mp.id)))[0].estado,
    "reembolsado",
  );
  await db
    .insert(certificados)
    .values({
      id: ids.certificate,
      usuarioId: ids.owner,
      ofertaId: ids.tool,
      nombre: "Profesional de prueba",
      actividad: "Certificado de prueba",
      cargaHoraria: "2 horas",
    });
  assert.equal(
    (
      await db
        .select()
        .from(certificados)
        .where(eq(certificados.id, ids.certificate))
    ).length,
    1,
  );
  const now = new Date();
  await db
    .update(pedidos)
    .set({ accessExpiresAt: new Date(now.getTime() + 6.5 * 86400000) })
    .where(eq(pedidos.id, transfer.id));
  const first = await mantenimientoDiario(now);
  const again = await mantenimientoDiario(now);
  assert(first.reminders >= 1);
  assert.equal(again.reminders, 0);
  assert.equal(
    (
      await db
        .select()
        .from(correos)
        .where(eq(correos.clave, `vencimiento:${transfer.id}:7`))
    ).length,
    1,
  );
  await mkdir("test-results", { recursive: true });
  const tokens = Object.fromEntries(
    await Promise.all(
      ["owner", "other", "admin"].map(async (key) => [
        key,
        await firmarSesion({
          userId: ids[key as keyof typeof ids],
          nombre: "QA",
          rol: key === "admin" ? "admin" : "profesional",
          sessionVersion: 0,
        }),
      ]),
    ),
  );
  await writeFile(
    "test-results/fixtures.json",
    JSON.stringify(
      { ...ids, transfer: transfer.id, mp: mp.id, tokens },
      null,
      2,
    ),
  );
  console.log(
    "PASS: aprobación, monto/moneda/cobrador, idempotencia, titularidad, rechazo, reembolso irreversible, vencimientos y correo sin duplicados.",
  );
}
main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
