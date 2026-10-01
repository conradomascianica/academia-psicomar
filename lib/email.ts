import "server-only";
import { Resend } from "resend";
import nodemailer from "nodemailer";
import { buffer as streamBuffer } from "node:stream/consumers";
import { escapeHtml } from "./platform/rules";
export interface MailArgs {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}
export interface EmailProvider {
  send(mail: MailArgs): Promise<void>;
}
export function emailDisponible() {
  return !!(
    (process.env.EMAIL_PROVIDER === "gmail" &&
      process.env.GMAIL_CLIENT_ID &&
      process.env.GMAIL_CLIENT_SECRET &&
      process.env.GMAIL_REFRESH_TOKEN &&
      process.env.GMAIL_USER) ||
    (process.env.EMAIL_PROVIDER === "smtp" &&
      process.env.GMAIL_USER &&
      process.env.GMAIL_APP_PASSWORD) ||
    (process.env.EMAIL_PROVIDER === "resend" &&
      process.env.RESEND_API_KEY &&
      process.env.EMAIL_FROM)
  );
}
function provider(): EmailProvider | null {
  if (!emailDisponible()) return null;
  if (process.env.EMAIL_PROVIDER === "gmail")
    return {
      async send(m) {
        const token = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          body: new URLSearchParams({
            client_id: process.env.GMAIL_CLIENT_ID!,
            client_secret: process.env.GMAIL_CLIENT_SECRET!,
            refresh_token: process.env.GMAIL_REFRESH_TOKEN!,
            grant_type: "refresh_token",
          }),
          signal: AbortSignal.timeout(10000),
        });
        if (!token.ok) throw new Error("gmail_auth");
        const auth = await token.json();
        const mime = await nodemailer
          .createTransport({
            streamTransport: true,
            buffer: true,
            newline: "windows",
          })
          .sendMail({ from: `PSICOMAR <${process.env.GMAIL_USER}>`, ...m });
        const sent = await fetch(
          "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${auth.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              raw: (Buffer.isBuffer(mime.message)
                ? mime.message
                : await streamBuffer(mime.message)
              ).toString("base64url"),
            }),
            signal: AbortSignal.timeout(15000),
          },
        );
        if (!sent.ok) throw new Error("gmail_send");
      },
    };
  if (process.env.EMAIL_PROVIDER === "smtp")
    return {
      async send(m) {
        await nodemailer
          .createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
              user: process.env.GMAIL_USER,
              pass: process.env.GMAIL_APP_PASSWORD,
            },
            connectionTimeout: 10000,
            socketTimeout: 15000,
          })
          .sendMail({ from: `PSICOMAR <${process.env.GMAIL_USER}>`, ...m });
      },
    };
  return {
    async send(m) {
      const r = await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: process.env.EMAIL_FROM!,
        ...m,
      });
      if (r.error) throw new Error("resend_send");
    },
  };
}
export async function enviarMail(
  m: MailArgs,
): Promise<{ ok: boolean; error?: string; ambiguo?: boolean }> {
  const p = provider();
  if (!p) return { ok: false, error: "Proveedor de correo sin configurar." };
  try {
    await p.send(m);
    return { ok: true };
  } catch {
    console.error("[email] delivery_failed");
    return { ok: false, error: "No se pudo enviar el correo.", ambiguo: true };
  }
}
export function layoutMail(titulo: string, cuerpo: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#17384b"><div style="background:#17384b;color:white;padding:24px;letter-spacing:3px">PSICOMAR</div><div style="padding:28px"><h1 style="font-family:Georgia;font-size:26px">${escapeHtml(titulo)}</h1>${cuerpo}<hr><p style="font-size:12px">Psicología & Formación</p></div></div>`;
}
