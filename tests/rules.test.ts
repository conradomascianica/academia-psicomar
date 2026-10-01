import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID, createHmac } from "node:crypto";
import {
  admisionSchema,
  validarConfirmacion,
  accesoVigente,
  vencimiento,
  calificar,
  importeConDescuento,
  destinoSeguro,
  passwordSchema,
  meetValido,
} from "../lib/platform/rules";
import { quizSchema } from "../lib/platform/content-schema";
import { firmarSesion, verificarToken } from "../lib/auth/jwt";
import { WebhookSignatureValidator } from "mercadopago";
const quiz = {
  aprobacion: 70,
  intentos: 3,
  requerirContenidos: true,
  preguntas: [
    {
      id: "a",
      texto: "Pregunta",
      tipo: "multiple" as const,
      opciones: [
        { id: "x", texto: "X" },
        { id: "y", texto: "Y" },
        { id: "z", texto: "Z" },
      ],
      correctas: ["x", "y"],
      puntos: 7,
      feedback: "Explicación",
    },
    {
      id: "b",
      texto: "V/F",
      tipo: "vf" as const,
      opciones: [
        { id: "v", texto: "V" },
        { id: "f", texto: "F" },
      ],
      correctas: ["v"],
      puntos: 3,
      feedback: "",
    },
  ],
};
test("admisión administrativa: consentimiento adulto, zona válida y sin campos clínicos", () => {
  const data = {
    solicitudKey: randomUUID(),
    nombre: "Ana",
    apellido: "Pérez",
    email: "ana@example.test",
    whatsapp: "+5491100000000",
    pais: "Argentina",
    zonaHoraria: "America/Argentina/Buenos_Aires",
    disponibilidad: "Lunes por la tarde",
    contacto: "email",
    mayor: "on",
    privacidad: "on",
    diagnostico: "no debe persistirse",
  };
  const valid = admisionSchema.parse(data);
  assert.equal("diagnostico" in valid, false);
  assert.equal(
    admisionSchema.safeParse({ ...data, mayor: undefined }).success,
    false,
  );
  assert.equal(
    admisionSchema.safeParse({ ...data, zonaHoraria: "inventada" }).success,
    false,
  );
});
test("confirmación rechaza falta de abono o datos de encuentro", () => {
  const base = {
    estado: "confirmada",
    abonoRecibido: true,
    profesional: "Maite",
    fecha: new Date(),
    meet: "https://meet.google.com/abc-defg-hij",
  };
  assert.doesNotThrow(() => validarConfirmacion(base));
  assert.throws(() => validarConfirmacion({ ...base, abonoRecibido: false }));
  assert.throws(() => validarConfirmacion({ ...base, profesional: null }));
  assert.equal(meetValido("https://meet.google.com.evil.test/a"), false);
});
test("curso: 30 días desde aprobación, frontera exacta bloqueada; herramientas permanentes", () => {
  const approvedAt = new Date("2026-01-01T12:00:00Z"),
    expires = vencimiento("curso", approvedAt)!;
  const p = {
    estado: "aprobado",
    tipo: "curso",
    approvedAt,
    accessExpiresAt: expires,
  };
  assert.equal(expires.toISOString(), "2026-01-31T12:00:00.000Z");
  assert.equal(accesoVigente(p, new Date(expires.getTime() - 1)), true);
  assert.equal(accesoVigente(p, expires), false);
  assert.equal(accesoVigente({ ...p, estado: "pendiente" }, approvedAt), false);
  assert.equal(
    accesoVigente(
      { ...p, tipo: "herramienta", accessExpiresAt: null },
      new Date("2035-01-01"),
    ),
    true,
  );
  assert.equal(
    accesoVigente(
      { ...p, tipo: "herramienta", estado: "reembolsado" },
      approvedAt,
    ),
    false,
  );
});
test("evaluación ponderada: conjunto exacto, orden irrelevante y aprobación en 70%", () => {
  assert.equal(calificar(quiz, { a: ["y", "x"], b: ["f"] }).porcentaje, 70);
  assert.equal(calificar(quiz, { a: ["y", "x"], b: ["f"] }).aprobado, true);
  assert.equal(calificar(quiz, { a: ["x"], b: ["v"] }).porcentaje, 30);
  assert.equal(
    calificar(quiz, { a: ["x", "y", "z"], b: ["v"] }).aprobado,
    false,
  );
  assert.equal(
    quizSchema.safeParse({
      ...quiz,
      preguntas: [quiz.preguntas[0], quiz.preguntas[0]],
    }).success,
    false,
  );
});
test("descuentos y retorno no aceptan redirecciones externas", () => {
  assert.equal(importeConDescuento(10000, "porcentaje", 15), 8500);
  assert.equal(importeConDescuento(10000, "fijo", 2000), 8000);
  assert.throws(() => importeConDescuento(10000, "fijo", 20000));
  assert.equal(destinoSeguro("//evil.test"), "");
  assert.equal(destinoSeguro("/\\evil.test"), "");
  assert.equal(destinoSeguro("/checkout?oferta=x"), "/checkout?oferta=x");
  assert.equal(destinoSeguro("/admin"), "");
});
test("contraseñas respetan límite bcrypt en bytes", () => {
  assert.equal(passwordSchema.safeParse("abcdef").success, false);
  assert.equal(passwordSchema.safeParse("🔒".repeat(20)).success, false);
  assert.equal(passwordSchema.safeParse("prueba-segura-2026").success, true);
});
test("sesión: firma íntegra, rol explícito y versión", async () => {
  process.env.AUTH_SECRET = "solo-pruebas-locales-" + randomUUID();
  const t = await firmarSesion({
    userId: randomUUID(),
    rol: "profesional",
    nombre: "Prueba",
    sessionVersion: 3,
  });
  assert.equal((await verificarToken(t))?.sessionVersion, 3);
  assert.equal(await verificarToken(t + "modificado"), null);
  assert.equal(await verificarToken(undefined), null);
});
test("webhook MP: firma correcta, manipulación y antigüedad", () => {
  const secret = "prueba-no-credencial",
    id = "123",
    request = "request-test",
    ts = String(Math.floor(Date.now() / 1000));
  const hash = createHmac("sha256", secret)
    .update(`id:${id};request-id:${request};ts:${ts};`)
    .digest("hex");
  assert.doesNotThrow(() =>
    WebhookSignatureValidator.validate({
      xSignature: `ts=${ts},v1=${hash}`,
      xRequestId: request,
      dataId: id,
      secret,
      toleranceSeconds: 300,
    }),
  );
  assert.throws(() =>
    WebhookSignatureValidator.validate({
      xSignature: `ts=${ts},v1=${hash}`,
      xRequestId: request,
      dataId: "999",
      secret,
      toleranceSeconds: 300,
    }),
  );
  assert.throws(() =>
    WebhookSignatureValidator.validate({
      xSignature: `ts=1,v1=${hash}`,
      xRequestId: request,
      dataId: id,
      secret,
      toleranceSeconds: 300,
    }),
  );
});
