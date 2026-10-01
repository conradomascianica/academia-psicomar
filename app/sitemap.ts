import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import {
  getSlugsFormaciones,
  getSlugsProductos,
  getSlugsArticulos,
} from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [formaciones, productos, articulos] = await Promise.all([
    getSlugsFormaciones(),
    getSlugsProductos(),
    getSlugsArticulos(),
  ]);

  const estaticas = [
    "",
    "/quienes-somos",
    "/terapia",
    "/academia",
    "/formaciones",
    "/supervisiones",
    "/recursos",
    "/blog",
    "/contacto",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const dinamicas = [
    ...formaciones.map((s) => `/formaciones/${s}`),
    ...productos.map((s) => `/recursos/${s}`),
    ...articulos.map((s) => `/blog/${s}`),
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...estaticas, ...dinamicas];
}
