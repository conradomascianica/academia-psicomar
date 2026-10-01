import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import path from "node:path";
export type CertificateData = {
  id: string;
  nombre: string;
  actividad: string;
  cargaHoraria: string;
  createdAt: Date;
};
/** Replace this renderer when the definitive certificate arrives; issuance rules are independent. */
export async function renderCertificate(c: CertificateData) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const page = pdf.addPage([842, 595]);
  const serif = await pdf.embedFont(
    await readFile(path.join(process.cwd(), "assets/fonts/DejaVuSerif.ttf")),
    { subset: true },
  );
  const sans = await pdf.embedFont(
    await readFile(path.join(process.cwd(), "assets/fonts/DejaVuSans.ttf")),
    { subset: true },
  );
  const white = rgb(0.96, 0.97, 0.96),
    soft = rgb(0.7, 0.83, 0.88);
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 842,
    height: 595,
    color: rgb(0.09, 0.22, 0.3),
  });
  for (const inset of [25, 31])
    page.drawRectangle({
      x: inset,
      y: inset,
      width: 842 - inset * 2,
      height: 595 - inset * 2,
      borderColor: rgb(0.33, 0.48, 0.57),
      borderWidth: 0.5,
    });
  const logo = await pdf.embedPng(
    await readFile(path.join(process.cwd(), "public/logo-psicomar-blanco.png")),
  );
  const lh = 38,
    lw = (logo.width / logo.height) * lh;
  page.drawImage(logo, { x: (842 - lw) / 2, y: 510, width: lw, height: lh });
  function centered(
    text: string,
    y: number,
    size: number,
    font = sans,
    color = white,
  ) {
    page.drawText(text, {
      x: (842 - font.widthOfTextAtSize(text, size)) / 2,
      y,
      size,
      font,
      color,
    });
  }
  function lines(text: string, maxWidth: number, size: number, font = serif) {
    const out: string[] = [];
    let line = "";
    for (const word of text.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
        out.push(line);
        line = word;
      } else line = next;
    }
    if (line) out.push(line);
    return out;
  }
  centered("CERTIFICADO DE PARTICIPACIÓN", 463, 16);
  centered("Academia PsicoMar certifica que", 414, 12, sans, soft);
  let nameSize = 30;
  while (lines(c.nombre, 690, nameSize).length > 2 && nameSize > 16) nameSize--;
  const names = lines(c.nombre, 690, nameSize);
  names.forEach((line, i) =>
    centered(line, 360 - i * (nameSize + 8), nameSize, serif),
  );
  page.drawLine({
    start: { x: 100, y: 286 },
    end: { x: 742, y: 286 },
    color: soft,
    thickness: 0.5,
  });
  centered("Completó la actividad", 257, 12, sans, soft);
  let activitySize = 18;
  while (lines(c.actividad, 670, activitySize).length > 3 && activitySize > 11)
    activitySize--;
  lines(c.actividad, 670, activitySize).forEach((line, i) =>
    centered(line, 230 - i * (activitySize + 5), activitySize, serif),
  );
  centered(`Carga horaria: ${c.cargaHoraria}`, 143, 11, sans, soft);
  centered(
    `Fecha de emisión: ${c.createdAt.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}`,
    123,
    11,
    sans,
    soft,
  );
  centered("PSICOMAR", 95, 14);
  centered(`Identificador: ${c.id}`, 70, 8, sans, soft);
  for (let n = 0; n < 5; n++) {
    const pts = [];
    for (let x = 0; x <= 842; x += 4)
      pts.push({ x, y: 35 + n * 5 + Math.sin(x / 33 + n * 0.45) * 6 });
    for (let i = 1; i < pts.length; i++)
      page.drawLine({
        start: pts[i - 1],
        end: pts[i],
        color: soft,
        thickness: 0.5,
      });
  }
  pdf.setTitle(`Certificado - ${c.actividad}`);
  pdf.setAuthor("PSICOMAR");
  return pdf.save();
}
