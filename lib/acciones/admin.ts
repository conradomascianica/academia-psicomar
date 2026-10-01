"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  articulos,
  consultas,
  equipo,
  formaciones,
  productos,
  supervision,
  ofertas,
} from "@/db/schema";
import { requerirAdmin } from "@/lib/auth/dal";
import { str, bool, num, opt, parseLista, slugify } from "@/lib/admin/form";

/** Revalida todo el sitio público. Sencillo y a prueba de olvidos. */
function revalidarSitio() {
  revalidatePath("/", "layout");
}

// ============ FORMACIONES ============

export async function guardarFormacion(id: string, fd: FormData) {
  await requerirAdmin();
  const nombre = str(fd, "nombre");
  const slug = str(fd, "slug") || slugify(nombre);
  const datos = {
    nombre,
    slug,
    tipo: str(fd, "tipo") as "taller" | "curso" | "curso_grabado",
    modalidad: str(fd, "modalidad") as "online_vivo" | "grabado" | "presencial",
    resumen: str(fd, "resumen"),
    descripcion: str(fd, "descripcion"),
    paraQuien: str(fd, "paraQuien"),
    duracion: str(fd, "duracion"),
    enVivo: bool(fd, "enVivo"),
    proximaFecha: opt(str(fd, "proximaFecha")),
    precio: num(fd, "precio"),
    incluye: parseLista(fd.get("incluye")),
    docentes: parseLista(fd.get("docentes")),
    imagen: opt(str(fd, "imagen")),
    imagenAlt: str(fd, "imagenAlt"),
    estado: str(fd, "estado") as "borrador" | "publicado",
    destacado: bool(fd, "destacado"),
    videoProvider: opt(str(fd, "videoProvider")),
    videoId: opt(str(fd, "videoId")),
    seoTitle: opt(str(fd, "seoTitle")),
    seoDescription: opt(str(fd, "seoDescription")),
    updatedAt: new Date(),
  };

  if (id === "nuevo") {
    await db.insert(formaciones).values(datos);
  } else {
    await db.transaction(async (tx) => {
      await tx.update(formaciones).set(datos).where(eq(formaciones.id, id));
      await tx
        .update(ofertas)
        .set({
          clave: `curso:${slug}`,
          nombre,
          ...(datos.estado === "borrador" ? { activa: false } : {}),
        })
        .where(eq(ofertas.formacionId, id));
    });
  }
  revalidarSitio();
  redirect("/admin/formaciones");
}

export async function borrarFormacion(id: string) {
  await requerirAdmin();
  const linked = await db
    .select({ id: ofertas.id })
    .from(ofertas)
    .where(eq(ofertas.formacionId, id));
  if (linked.length) {
    await db.transaction(async (tx) => {
      await tx
        .update(formaciones)
        .set({ estado: "borrador" })
        .where(eq(formaciones.id, id));
      await tx
        .update(ofertas)
        .set({ activa: false })
        .where(eq(ofertas.formacionId, id));
    });
  } else await db.delete(formaciones).where(eq(formaciones.id, id));
  revalidarSitio();
  redirect("/admin/formaciones");
}

// ============ PRODUCTOS ============

export async function guardarProducto(id: string, fd: FormData) {
  await requerirAdmin();
  const nombre = str(fd, "nombre");
  const datos = {
    nombre,
    slug: str(fd, "slug") || slugify(nombre),
    resumen: str(fd, "resumen"),
    descripcion: str(fd, "descripcion"),
    incluye: parseLista(fd.get("incluye")),
    paraQuien: str(fd, "paraQuien"),
    precio: num(fd, "precio"),
    imagen: opt(str(fd, "imagen")),
    imagenAlt: str(fd, "imagenAlt"),
    estado: str(fd, "estado") as "borrador" | "publicado",
    destacado: bool(fd, "destacado"),
    seoTitle: opt(str(fd, "seoTitle")),
    seoDescription: opt(str(fd, "seoDescription")),
    updatedAt: new Date(),
  };
  if (id === "nuevo") {
    await db.insert(productos).values(datos);
  } else {
    await db.transaction(async (tx) => {
      await tx.update(productos).set(datos).where(eq(productos.id, id));
      await tx
        .update(ofertas)
        .set({
          clave: `herramienta:${datos.slug}`,
          nombre,
          ...(datos.estado === "borrador" ? { activa: false } : {}),
        })
        .where(eq(ofertas.productoId, id));
    });
  }
  revalidarSitio();
  redirect("/admin/productos");
}

export async function borrarProducto(id: string) {
  await requerirAdmin();
  const linked = await db
    .select({ id: ofertas.id })
    .from(ofertas)
    .where(eq(ofertas.productoId, id));
  if (linked.length) {
    await db.transaction(async (tx) => {
      await tx
        .update(productos)
        .set({ estado: "borrador" })
        .where(eq(productos.id, id));
      await tx
        .update(ofertas)
        .set({ activa: false })
        .where(eq(ofertas.productoId, id));
    });
  } else await db.delete(productos).where(eq(productos.id, id));
  revalidarSitio();
  redirect("/admin/productos");
}

// ============ SUPERVISIÓN ============

export async function guardarSupervision(fd: FormData) {
  await requerirAdmin();
  const datos = {
    frecuencia: str(fd, "frecuencia"),
    modalidad: str(fd, "modalidad"),
    dinamica: str(fd, "dinamica"),
    encuentros: str(fd, "encuentros"),
    incluye: parseLista(fd.get("incluye")),
    materiales: str(fd, "materiales"),
    precioMensual: num(fd, "precioMensual"),
    descripcion: str(fd, "descripcion"),
    seoTitle: opt(str(fd, "seoTitle")),
    seoDescription: opt(str(fd, "seoDescription")),
    updatedAt: new Date(),
  };
  await db
    .insert(supervision)
    .values({ clave: "principal", ...datos })
    .onConflictDoUpdate({ target: supervision.clave, set: datos });
  revalidarSitio();
  redirect("/admin/supervision");
}

// ============ BLOG ============

export async function guardarArticulo(id: string, fd: FormData) {
  await requerirAdmin();
  const titulo = str(fd, "titulo");
  const fecha = str(fd, "publicadoEl");
  const datos = {
    titulo,
    slug: str(fd, "slug") || slugify(titulo),
    resumen: str(fd, "resumen"),
    cuerpo: str(fd, "cuerpo"),
    cover: opt(str(fd, "cover")),
    coverAlt: str(fd, "coverAlt"),
    tags: parseLista(fd.get("tags")),
    autor: str(fd, "autor") || "Academia PsicoMar",
    publicadoEl: fecha ? new Date(fecha) : new Date(),
    estado: str(fd, "estado") as "borrador" | "publicado",
    seoTitle: opt(str(fd, "seoTitle")),
    seoDescription: opt(str(fd, "seoDescription")),
    updatedAt: new Date(),
  };
  if (id === "nuevo") {
    await db.insert(articulos).values(datos);
  } else {
    await db.update(articulos).set(datos).where(eq(articulos.id, id));
  }
  revalidarSitio();
  redirect("/admin/blog");
}

export async function borrarArticulo(id: string) {
  await requerirAdmin();
  await db.delete(articulos).where(eq(articulos.id, id));
  revalidarSitio();
  redirect("/admin/blog");
}

// ============ EQUIPO ============

export async function guardarMiembro(id: string, fd: FormData) {
  await requerirAdmin();
  const nombre = str(fd, "nombre");
  const datos = {
    nombre,
    slug: str(fd, "slug") || slugify(nombre),
    rol: str(fd, "rol"),
    bio: str(fd, "bio"),
    bioCorta: str(fd, "bioCorta"),
    enfoque: parseLista(fd.get("enfoque")),
    datoExtra: str(fd, "datoExtra"),
    foto: opt(str(fd, "foto")),
    fotoAlt: str(fd, "fotoAlt"),
    whatsapp: opt(str(fd, "whatsapp")),
    orden: num(fd, "orden") ?? 0,
    updatedAt: new Date(),
  };
  if (id === "nuevo") {
    await db.insert(equipo).values(datos);
  } else {
    await db.update(equipo).set(datos).where(eq(equipo.id, id));
  }
  revalidarSitio();
  redirect("/admin/equipo");
}

export async function borrarMiembro(id: string) {
  await requerirAdmin();
  await db.delete(equipo).where(eq(equipo.id, id));
  revalidarSitio();
  redirect("/admin/equipo");
}

// ============ CONSULTAS ============

export async function marcarConsulta(
  id: string,
  estado: "nueva" | "respondida",
) {
  await requerirAdmin();
  await db.update(consultas).set({ estado }).where(eq(consultas.id, id));
  revalidatePath("/admin/consultas");
}

export async function borrarConsulta(id: string) {
  await requerirAdmin();
  await db.delete(consultas).where(eq(consultas.id, id));
  revalidatePath("/admin/consultas");
}
