import "server-only";
import { randomUUID } from "node:crypto";
import { put, get } from "@vercel/blob";
export function privadoDisponible() {
  return !!process.env.PRIVATE_BLOB_READ_WRITE_TOKEN;
}
export function mimeArchivo(b: Buffer, permitirZip: boolean) {
  if (b.subarray(0, 5).toString() === "%PDF-") return "application/pdf";
  if (b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
    return "image/png";
  if (b[0] === 255 && b[1] === 216 && b[2] === 255) return "image/jpeg";
  if (permitirZip && b[0] === 80 && b[1] === 75 && b[2] === 3 && b[3] === 4)
    return "application/zip";
  throw new Error("Formato no permitido. Usá PDF, PNG o JPG.");
}
export async function guardarPrivado(file: File, uso: string) {
  if (!privadoDisponible())
    throw new Error("La carga privada de archivos todavía no está habilitada.");
  if (file.size === 0 || file.size > 3 * 1024 * 1024)
    throw new Error("El archivo debe pesar menos de 3 MB.");
  const b = Buffer.from(await file.arrayBuffer());
  const mime = mimeArchivo(b, uso === "material");
  const extension = (
    {
      "application/pdf": "pdf",
      "image/png": "png",
      "image/jpeg": "jpg",
      "application/zip": "zip",
    } as Record<string, string>
  )[mime];
  const nombre =
    file.name.replace(/[^\p{L}\p{N} ._-]/gu, "").slice(0, 120) ||
    `archivo.${extension}`;
  const blob = await put(`${uso}/${randomUUID()}.${extension}`, b, {
    access: "private",
    token: process.env.PRIVATE_BLOB_READ_WRITE_TOKEN,
    contentType: mime,
    addRandomSuffix: false,
  });
  return { nombre, pathname: blob.pathname, mime, bytes: b.length };
}
export async function leerPrivado(pathname: string) {
  return get(pathname, {
    access: "private",
    token: process.env.PRIVATE_BLOB_READ_WRITE_TOKEN,
    useCache: false,
  });
}
