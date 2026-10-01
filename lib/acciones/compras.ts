"use server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  pedidos,
  ofertas,
  cupones,
  archivosPrivados,
  eventos,
  usuarios,
} from "@/db/schema";
import { requerirProfesional, requerirAdmin } from "@/lib/auth/dal";
import { limitar, safeError } from "@/lib/platform/security";
import {
  ajustes,
  aprobarPedido,
  rechazarPedido,
  reservaCuponActiva,
} from "@/lib/platform/commerce";
import { importeConDescuento } from "@/lib/platform/rules";
import { crearPreferencia, mpDisponible } from "@/lib/platform/payments";
import { guardarPrivado, privadoDisponible } from "@/lib/platform/storage";
import { encolarCorreo, enlaceMail } from "@/lib/platform/mail";
import type { ActionState } from "@/lib/platform/types";
export async function comprar(
  _: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const u = await requerirProfesional();
  let destino = "";
  try {
    await limitar("checkout", u.id, 12);
    const p = z
      .object({
        ofertaId: z.uuid(),
        clave: z.uuid(),
        metodo: z.enum(["mercadopago", "transferencia"]),
        cupon: z.string().trim().max(40),
      })
      .parse(Object.fromEntries(fd));
    const settings = await ajustes();
    if (p.metodo === "mercadopago" && !mpDisponible())
      return { error: "Mercado Pago todavía no está habilitado." };
    if (
      p.metodo === "transferencia" &&
      (!settings.transferencia_alias ||
        !settings.transferencia_titular ||
        !privadoDisponible())
    )
      return { error: "La transferencia todavía no está habilitada." };
    const pedido = await db.transaction(async (tx) => {
      const [anterior] = await tx
        .select()
        .from(pedidos)
        .where(eq(pedidos.clave, p.clave));
      if (anterior) {
        if (
          anterior.usuarioId !== u.id ||
          anterior.ofertaId !== p.ofertaId ||
          anterior.metodo !== p.metodo
        )
          throw new Error("Pedido inválido.");
        return anterior;
      }
      const [o] = await tx
        .select()
        .from(ofertas)
        .where(and(eq(ofertas.id, p.ofertaId), eq(ofertas.activa, true)))
        .for("update");
      if (!o)
        throw new Error("Esta propuesta aún no está disponible para comprar.");
      const base =
        p.metodo === "mercadopago" ? o.precioMp : o.precioTransferencia;
      if (!base) throw new Error("El precio todavía no está definido.");
      if (o.curriculum.cupo) {
        const [c] = await tx
          .select({ n: sql<number>`count(*)::int` })
          .from(pedidos)
          .where(and(eq(pedidos.ofertaId, o.id), reservaCuponActiva));
        if (c.n >= o.curriculum.cupo)
          throw new Error("No hay cupos disponibles en este momento.");
      }
      let importe = base,
        cuponId: string | undefined;
      if (p.cupon) {
        const [c] = await tx
          .select()
          .from(cupones)
          .where(eq(cupones.codigo, p.cupon.toUpperCase()))
          .for("update");
        const now = new Date();
        if (
          !c ||
          !c.activo ||
          c.desde > now ||
          c.hasta < now ||
          (c.ofertas.length && !c.ofertas.includes(o.id))
        )
          throw new Error("El cupón no es válido para esta compra.");
        const usos = await tx
          .select({ usuarioId: pedidos.usuarioId })
          .from(pedidos)
          .where(and(eq(pedidos.cuponId, c.id), reservaCuponActiva));
        if (
          usos.length >= c.limite ||
          usos.filter((x) => x.usuarioId === u.id).length >= c.porUsuario
        )
          throw new Error("El cupón alcanzó su límite de uso.");
        importe = importeConDescuento(base, c.tipo, c.valor);
        cuponId = c.id;
      }
      const [nuevo] = await tx
        .insert(pedidos)
        .values({
          clave: p.clave,
          usuarioId: u.id,
          ofertaId: o.id,
          nombre: o.nombre,
          tipo: o.tipo,
          metodo: p.metodo,
          importe,
          descuento: base - importe,
          cuponId,
        })
        .onConflictDoNothing()
        .returning();
      if (!nuevo)
        throw new Error("El pedido ya está en proceso. Revisá Mis compras.");
      await tx
        .insert(eventos)
        .values({ pedidoId: nuevo.id, evento: "creado", actor: u.id });
      return nuevo;
    });
    if (pedido.estado !== "pendiente") {
      destino = `/cuenta/compras/${pedido.id}`;
    } else if (p.metodo === "mercadopago") {
      if (pedido.checkoutUrl) destino = pedido.checkoutUrl;
      else {
        const pref = await crearPreferencia(pedido);
        await db.update(pedidos).set(pref).where(eq(pedidos.id, pedido.id));
        destino = pref.checkoutUrl;
      }
    } else destino = `/cuenta/compras/${pedido.id}`;
  } catch (e) {
    return { error: safeError(e) };
  }
  redirect(destino);
}
export async function subirComprobante(
  _: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const u = await requerirProfesional();
  try {
    await limitar("comprobante", u.id, 10);
    const id = z.uuid().parse(fd.get("pedidoId"));
    const [p] = await db
      .select()
      .from(pedidos)
      .where(
        and(
          eq(pedidos.id, id),
          eq(pedidos.usuarioId, u.id),
          eq(pedidos.metodo, "transferencia"),
          eq(pedidos.estado, "pendiente"),
        ),
      );
    if (!p) throw new Error("El pedido no admite un comprobante.");
    const f = fd.get("archivo");
    if (!(f instanceof File)) throw new Error("Seleccioná un archivo.");
    const datos = await guardarPrivado(f, "comprobante");
    await db.transaction(async (tx) => {
      const [locked] = await tx
        .select()
        .from(pedidos)
        .where(eq(pedidos.id, id))
        .for("update");
      if (locked.estado !== "pendiente")
        throw new Error("El pedido cambió. Recargá para ver su estado.");
      const [a] = await tx
        .insert(archivosPrivados)
        .values({ ...datos, propietarioId: u.id, uso: "comprobante" })
        .returning();
      await tx
        .update(pedidos)
        .set({
          comprobanteId: a.id,
          estado: "esperando_verificacion",
          updatedAt: new Date(),
        })
        .where(eq(pedidos.id, id));
      await tx
        .insert(eventos)
        .values({ pedidoId: id, evento: "comprobante_recibido", actor: u.id });
    });
    await encolarCorreo(
      `comprobante:${id}`,
      u.email,
      "Recibimos tu comprobante",
      `<p>Lo estamos verificando. El acceso se habilitará cuando se apruebe el pago.</p>${enlaceMail("Ver pedido", `/cuenta/compras/${id}`)}`,
    );
    const [admin] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.rol, "admin"))
      .limit(1);
    if (admin)
      await encolarCorreo(
        `comprobante:${id}:admin`,
        admin.email,
        "Transferencia pendiente de revisión",
        enlaceMail("Revisar pedido", `/admin/ventas/${id}`),
      );
    revalidatePath("/cuenta");
    revalidatePath("/admin/ventas");
    return {
      ok: true,
      mensaje: "Recibimos tu comprobante. Lo estamos verificando.",
    };
  } catch (e) {
    return { error: safeError(e) };
  }
}
export async function revisarTransferencia(
  _: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const u = await requerirAdmin();
  try {
    const id = z.uuid().parse(fd.get("id"));
    if (fd.get("decision") === "aprobar")
      await aprobarPedido(id, { tipo: "transferencia", actor: u.id });
    else if (fd.get("decision") === "rechazar") await rechazarPedido(id, u.id);
    else throw new Error("Elegí una acción.");
    revalidatePath("/admin/ventas");
    revalidatePath(`/admin/ventas/${id}`);
    return {
      ok: true,
      mensaje:
        "Pedido actualizado. Revisá el estado del correo en Configuración.",
    };
  } catch (e) {
    return { error: safeError(e) };
  }
}
export async function cancelarPedido(
  _: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const u = await requerirProfesional();
  const id = z.uuid().parse(fd.get("id"));
  const [p] = await db
    .update(pedidos)
    .set({ estado: "cancelado", updatedAt: new Date() })
    .where(
      and(
        eq(pedidos.id, id),
        eq(pedidos.usuarioId, u.id),
        eq(pedidos.estado, "pendiente"),
        eq(pedidos.metodo, "transferencia"),
      ),
    )
    .returning();
  if (!p) return { error: "Este pedido no puede cancelarse desde aquí." };
  revalidatePath("/cuenta");
  return { ok: true, mensaje: "Pedido cancelado." };
}
