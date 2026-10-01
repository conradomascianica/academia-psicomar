import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { Curriculum, Quiz, Material } from "@/lib/platform/types";

// --- Enums ---

export const rolUsuario = pgEnum("rol_usuario", [
  "admin",
  "cliente",
  "profesional",
]);
export const estadoPublicacion = pgEnum("estado_publicacion", [
  "borrador",
  "publicado",
]);
export const tipoFormacion = pgEnum("tipo_formacion", [
  "taller",
  "curso",
  "curso_grabado",
]);
export const modalidadFormacion = pgEnum("modalidad_formacion", [
  "online_vivo",
  "grabado",
  "presencial",
]);
export const tipoConsulta = pgEnum("tipo_consulta", [
  "formacion",
  "supervision",
  "herramientas",
  "otro",
]);
export const estadoConsulta = pgEnum("estado_consulta", [
  "nueva",
  "respondida",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

// --- Usuarios del panel ---

export const usuarios = pgTable("usuarios", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  sessionVersion: integer("session_version").notNull().default(0),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  nombre: text("nombre").notNull(),
  rol: rolUsuario("rol").notNull().default("admin"),
  ...timestamps,
});

// --- Equipo ---

export const equipo = pgTable("equipo", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  nombre: text("nombre").notNull(),
  rol: text("rol").notNull(),
  bio: text("bio").notNull().default(""),
  bioCorta: text("bio_corta").notNull().default(""),
  enfoque: jsonb("enfoque").$type<string[]>().notNull().default([]),
  datoExtra: text("dato_extra").notNull().default(""),
  foto: text("foto"),
  fotoAlt: text("foto_alt").notNull().default(""),
  whatsapp: text("whatsapp"),
  orden: integer("orden").notNull().default(0),
  ...timestamps,
});

// --- Formaciones ---

export const formaciones = pgTable("formaciones", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  nombre: text("nombre").notNull(),
  tipo: tipoFormacion("tipo").notNull(),
  modalidad: modalidadFormacion("modalidad").notNull(),
  resumen: text("resumen").notNull().default(""),
  descripcion: text("descripcion").notNull().default(""),
  paraQuien: text("para_quien").notNull().default(""),
  duracion: text("duracion").notNull().default(""),
  enVivo: boolean("en_vivo").notNull().default(true),
  proximaFecha: text("proxima_fecha"),
  precio: integer("precio"),
  incluye: jsonb("incluye").$type<string[]>().notNull().default([]),
  imagen: text("imagen"),
  imagenAlt: text("imagen_alt").notNull().default(""),
  estado: estadoPublicacion("estado").notNull().default("borrador"),
  destacado: boolean("destacado").notNull().default(false),
  docentes: jsonb("docentes").$type<string[]>().notNull().default([]),
  videoProvider: text("video_provider"),
  videoId: text("video_id"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  ...timestamps,
});

// --- Productos (packs de herramientas) ---

export const productos = pgTable("productos", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  nombre: text("nombre").notNull(),
  resumen: text("resumen").notNull().default(""),
  descripcion: text("descripcion").notNull().default(""),
  incluye: jsonb("incluye").$type<string[]>().notNull().default([]),
  paraQuien: text("para_quien").notNull().default(""),
  precio: integer("precio"),
  imagen: text("imagen"),
  imagenAlt: text("imagen_alt").notNull().default(""),
  estado: estadoPublicacion("estado").notNull().default("borrador"),
  destacado: boolean("destacado").notNull().default(false),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  ...timestamps,
});

// --- Supervisión (fila única) ---

export const supervision = pgTable("supervision", {
  id: uuid("id").defaultRandom().primaryKey(),
  clave: text("clave").notNull().unique().default("principal"),
  frecuencia: text("frecuencia").notNull().default(""),
  modalidad: text("modalidad").notNull().default(""),
  dinamica: text("dinamica").notNull().default(""),
  encuentros: text("encuentros").notNull().default(""),
  incluye: jsonb("incluye").$type<string[]>().notNull().default([]),
  materiales: text("materiales").notNull().default(""),
  precioMensual: integer("precio_mensual"),
  descripcion: text("descripcion").notNull().default(""),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  ...timestamps,
});

// --- Blog ---

export const articulos = pgTable("articulos", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  titulo: text("titulo").notNull(),
  resumen: text("resumen").notNull().default(""),
  cuerpo: text("cuerpo").notNull().default(""),
  cover: text("cover"),
  coverAlt: text("cover_alt").notNull().default(""),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  autor: text("autor").notNull().default("Academia PsicoMar"),
  publicadoEl: timestamp("publicado_el", { withTimezone: true })
    .defaultNow()
    .notNull(),
  estado: estadoPublicacion("estado").notNull().default("borrador"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  ...timestamps,
});

// --- Consultas (formulario de contacto) ---

export const consultas = pgTable("consultas", {
  id: uuid("id").defaultRandom().primaryKey(),
  tipo: tipoConsulta("tipo").notNull(),
  nombre: text("nombre").notNull(),
  email: text("email").notNull(),
  mensaje: text("mensaje").notNull(),
  estado: estadoConsulta("estado").notNull().default("nueva"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// V2: additive entities. Money in integer ARS centavos; legacy prices remain ARS.
export const admisiones = pgTable(
  "admisiones",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    solicitudKey: uuid("solicitud_key").notNull().unique(),
    nombre: text("nombre").notNull(),
    apellido: text("apellido").notNull(),
    email: text("email").notNull(),
    whatsapp: text("whatsapp").notNull(),
    pais: text("pais").notNull(),
    zonaHoraria: text("zona_horaria").notNull(),
    disponibilidad: text("disponibilidad").notNull(),
    contacto: text("contacto").notNull(),
    estado: text("estado").notNull().default("nueva"),
    profesional: text("profesional"),
    abonoRecibido: boolean("abono_recibido").notNull().default(false),
    fecha: timestamp("fecha", { withTimezone: true }),
    meet: text("meet"),
    observacion: text("observacion").notNull().default(""),
    revision: integer("revision").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index("admisiones_estado_fecha").on(t.estado, t.createdAt),
    check(
      "admision_confirmacion_abonada",
      sql`${t.estado} NOT IN ('confirmada','realizada','aceptada') OR (${t.abonoRecibido} AND ${t.profesional} IS NOT NULL AND ${t.fecha} IS NOT NULL AND ${t.meet} IS NOT NULL)`,
    ),
  ],
);

export const ofertas = pgTable(
  "ofertas",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clave: text("clave").notNull().unique(), // curso:<slug>, herramienta:<slug>, supervision:30/60/grupal
    tipo: text("tipo").notNull(),
    nombre: text("nombre").notNull(),
    formacionId: uuid("formacion_id").references(() => formaciones.id),
    productoId: uuid("producto_id").references(() => productos.id),
    precioMp: integer("precio_mp"),
    precioTransferencia: integer("precio_transferencia"),
    activa: boolean("activa").notNull().default(false),
    curriculum: jsonb("curriculum")
      .$type<Curriculum>()
      .notNull()
      .default({ modulos: [] }),
    evaluacion: jsonb("evaluacion").$type<Quiz>().notNull().default({
      preguntas: [],
      aprobacion: 70,
      intentos: 3,
      requerirContenidos: true,
    }),
    materiales: jsonb("materiales").$type<Material[]>().notNull().default([]),
    cargaHoraria: text("carga_horaria").notNull().default(""),
    ...timestamps,
  },
  (t) => [
    check(
      "oferta_precios_positivos",
      sql`(${t.precioMp} IS NULL OR ${t.precioMp}>0) AND (${t.precioTransferencia} IS NULL OR ${t.precioTransferencia}>0)`,
    ),
  ],
);

export const cupones = pgTable(
  "cupones",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    codigo: text("codigo").notNull().unique(),
    tipo: text("tipo").notNull(),
    valor: integer("valor").notNull(),
    activo: boolean("activo").notNull().default(false),
    desde: timestamp("desde", { withTimezone: true }).notNull(),
    hasta: timestamp("hasta", { withTimezone: true }).notNull(),
    limite: integer("limite").notNull(),
    porUsuario: integer("por_usuario").notNull().default(1),
    ofertas: jsonb("ofertas").$type<string[]>().notNull().default([]),
    ...timestamps,
  },
  (t) => [
    check(
      "cupon_valido",
      sql`${t.valor}>0 AND ${t.limite}>0 AND ${t.porUsuario}>0 AND ${t.hasta}>${t.desde} AND (${t.tipo}='fijo' OR (${t.tipo}='porcentaje' AND ${t.valor}<=100))`,
    ),
  ],
);

export const pedidos = pgTable(
  "pedidos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clave: uuid("clave").notNull().unique(),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    ofertaId: uuid("oferta_id")
      .notNull()
      .references(() => ofertas.id),
    nombre: text("nombre").notNull(),
    tipo: text("tipo").notNull(),
    metodo: text("metodo").notNull(),
    importe: integer("importe").notNull(),
    descuento: integer("descuento").notNull().default(0),
    cuponId: uuid("cupon_id").references(() => cupones.id),
    estado: text("estado").notNull().default("pendiente"),
    preferenceId: text("preference_id"),
    checkoutUrl: text("checkout_url"),
    paymentId: text("payment_id").unique(),
    comprobanteId: uuid("comprobante_id"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    accessExpiresAt: timestamp("access_expires_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("pedidos_usuario_fecha").on(t.usuarioId, t.createdAt),
    index("pedidos_estado_fecha").on(t.estado, t.createdAt),
    check("pedido_importe", sql`${t.importe}>0 AND ${t.descuento}>=0`),
  ],
);

export const archivosPrivados = pgTable("archivos_privados", {
  id: uuid("id").defaultRandom().primaryKey(),
  nombre: text("nombre").notNull(),
  pathname: text("pathname").notNull(),
  mime: text("mime").notNull(),
  bytes: integer("bytes").notNull(),
  propietarioId: uuid("propietario_id")
    .notNull()
    .references(() => usuarios.id),
  uso: text("uso").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const progreso = pgTable(
  "progreso_lecciones",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    ofertaId: uuid("oferta_id")
      .notNull()
      .references(() => ofertas.id),
    leccionId: text("leccion_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("progreso_unico").on(t.usuarioId, t.ofertaId, t.leccionId),
  ],
);
export const intentos = pgTable(
  "intentos_evaluacion",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    ofertaId: uuid("oferta_id")
      .notNull()
      .references(() => ofertas.id),
    respuestas: jsonb("respuestas").$type<Record<string, string[]>>().notNull(),
    porcentaje: integer("porcentaje").notNull(),
    aprobado: boolean("aprobado").notNull(),
    feedback: jsonb("feedback").$type<string[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("intentos_usuario_oferta").on(t.usuarioId, t.ofertaId)],
);
export const certificados = pgTable(
  "certificados",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    ofertaId: uuid("oferta_id")
      .notNull()
      .references(() => ofertas.id),
    nombre: text("nombre").notNull(),
    actividad: text("actividad").notNull(),
    cargaHoraria: text("carga_horaria").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("certificado_unico").on(t.usuarioId, t.ofertaId)],
);
export const tokensCuenta = pgTable("tokens_cuenta", {
  hash: text("hash").primaryKey(),
  usuarioId: uuid("usuario_id")
    .notNull()
    .references(() => usuarios.id),
  tipo: text("tipo").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
export const limites = pgTable("limites", {
  clave: text("clave").primaryKey(),
  cantidad: integer("cantidad").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
export const configuracion = pgTable("configuracion", {
  clave: text("clave").primaryKey(),
  valor: text("valor").notNull(),
  ...timestamps,
});
export const eventos = pgTable("eventos_pedido", {
  id: uuid("id").defaultRandom().primaryKey(),
  pedidoId: uuid("pedido_id")
    .notNull()
    .references(() => pedidos.id),
  evento: text("evento").notNull(),
  actor: text("actor").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const correos = pgTable("correos", {
  clave: text("clave").primaryKey(),
  destinatario: text("destinatario").notNull(),
  asunto: text("asunto").notNull(),
  html: text("html").notNull(),
  estado: text("estado").notNull().default("pendiente"),
  intentos: integer("intentos").notNull().default(0),
  ...timestamps,
});
export const metricas = pgTable("metricas", {
  id: uuid("id").defaultRandom().primaryKey(),
  evento: text("evento").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Educational supervision appointments only; never therapy follow-ups. */
export const encuentrosAcademia = pgTable(
  "encuentros_academia",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pedidoId: uuid("pedido_id")
      .notNull()
      .references(() => pedidos.id),
    numero: integer("numero").notNull(),
    fecha: timestamp("fecha", { withTimezone: true }).notNull(),
    zonaHoraria: text("zona_horaria").notNull(),
    enlace: text("enlace").notNull(),
    estado: text("estado").notNull().default("confirmado"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("encuentro_pedido_numero").on(t.pedidoId, t.numero),
    check("encuentro_numero_valido", sql`${t.numero} IN (1,2)`),
  ],
);
