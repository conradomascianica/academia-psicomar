ALTER TYPE "public"."rol_usuario" ADD VALUE 'profesional';--> statement-breakpoint
CREATE TABLE "admisiones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"solicitud_key" uuid NOT NULL,
	"nombre" text NOT NULL,
	"apellido" text NOT NULL,
	"email" text NOT NULL,
	"whatsapp" text NOT NULL,
	"pais" text NOT NULL,
	"zona_horaria" text NOT NULL,
	"disponibilidad" text NOT NULL,
	"contacto" text NOT NULL,
	"estado" text DEFAULT 'nueva' NOT NULL,
	"profesional" text,
	"abono_recibido" boolean DEFAULT false NOT NULL,
	"fecha" timestamp with time zone,
	"meet" text,
	"observacion" text DEFAULT '' NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admisiones_solicitud_key_unique" UNIQUE("solicitud_key"),
	CONSTRAINT "admision_confirmacion_abonada" CHECK ("admisiones"."estado" NOT IN ('confirmada','realizada','aceptada') OR ("admisiones"."abono_recibido" AND "admisiones"."profesional" IS NOT NULL AND "admisiones"."fecha" IS NOT NULL AND "admisiones"."meet" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "archivos_privados" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"pathname" text NOT NULL,
	"mime" text NOT NULL,
	"bytes" integer NOT NULL,
	"propietario_id" uuid NOT NULL,
	"uso" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificados" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"oferta_id" uuid NOT NULL,
	"nombre" text NOT NULL,
	"actividad" text NOT NULL,
	"carga_horaria" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "configuracion" (
	"clave" text PRIMARY KEY NOT NULL,
	"valor" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "correos" (
	"clave" text PRIMARY KEY NOT NULL,
	"destinatario" text NOT NULL,
	"asunto" text NOT NULL,
	"html" text NOT NULL,
	"estado" text DEFAULT 'pendiente' NOT NULL,
	"intentos" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cupones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codigo" text NOT NULL,
	"tipo" text NOT NULL,
	"valor" integer NOT NULL,
	"activo" boolean DEFAULT false NOT NULL,
	"desde" timestamp with time zone NOT NULL,
	"hasta" timestamp with time zone NOT NULL,
	"limite" integer NOT NULL,
	"por_usuario" integer DEFAULT 1 NOT NULL,
	"ofertas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cupones_codigo_unique" UNIQUE("codigo"),
	CONSTRAINT "cupon_valido" CHECK ("cupones"."valor">0 AND "cupones"."limite">0 AND "cupones"."por_usuario">0 AND "cupones"."hasta">"cupones"."desde" AND ("cupones"."tipo"='fijo' OR ("cupones"."tipo"='porcentaje' AND "cupones"."valor"<=100)))
);
--> statement-breakpoint
CREATE TABLE "eventos_pedido" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pedido_id" uuid NOT NULL,
	"evento" text NOT NULL,
	"actor" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intentos_evaluacion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"oferta_id" uuid NOT NULL,
	"respuestas" jsonb NOT NULL,
	"porcentaje" integer NOT NULL,
	"aprobado" boolean NOT NULL,
	"feedback" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "limites" (
	"clave" text PRIMARY KEY NOT NULL,
	"cantidad" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "metricas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evento" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ofertas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clave" text NOT NULL,
	"tipo" text NOT NULL,
	"nombre" text NOT NULL,
	"formacion_id" uuid,
	"producto_id" uuid,
	"precio_mp" integer,
	"precio_transferencia" integer,
	"activa" boolean DEFAULT false NOT NULL,
	"curriculum" jsonb DEFAULT '{"modulos":[]}'::jsonb NOT NULL,
	"evaluacion" jsonb DEFAULT '{"preguntas":[],"aprobacion":70,"intentos":3,"requerirContenidos":true}'::jsonb NOT NULL,
	"materiales" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"carga_horaria" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ofertas_clave_unique" UNIQUE("clave"),
	CONSTRAINT "oferta_precios_positivos" CHECK (("ofertas"."precio_mp" IS NULL OR "ofertas"."precio_mp">0) AND ("ofertas"."precio_transferencia" IS NULL OR "ofertas"."precio_transferencia">0))
);
--> statement-breakpoint
CREATE TABLE "pedidos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clave" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"oferta_id" uuid NOT NULL,
	"nombre" text NOT NULL,
	"tipo" text NOT NULL,
	"metodo" text NOT NULL,
	"importe" integer NOT NULL,
	"descuento" integer DEFAULT 0 NOT NULL,
	"cupon_id" uuid,
	"estado" text DEFAULT 'pendiente' NOT NULL,
	"preference_id" text,
	"checkout_url" text,
	"payment_id" text,
	"comprobante_id" uuid,
	"approved_at" timestamp with time zone,
	"access_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pedidos_clave_unique" UNIQUE("clave"),
	CONSTRAINT "pedidos_payment_id_unique" UNIQUE("payment_id"),
	CONSTRAINT "pedido_importe" CHECK ("pedidos"."importe">0 AND "pedidos"."descuento">=0)
);
--> statement-breakpoint
CREATE TABLE "progreso_lecciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"oferta_id" uuid NOT NULL,
	"leccion_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tokens_cuenta" (
	"hash" text PRIMARY KEY NOT NULL,
	"usuario_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "session_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "email_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "archivos_privados" ADD CONSTRAINT "archivos_privados_propietario_id_usuarios_id_fk" FOREIGN KEY ("propietario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificados" ADD CONSTRAINT "certificados_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificados" ADD CONSTRAINT "certificados_oferta_id_ofertas_id_fk" FOREIGN KEY ("oferta_id") REFERENCES "public"."ofertas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventos_pedido" ADD CONSTRAINT "eventos_pedido_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intentos_evaluacion" ADD CONSTRAINT "intentos_evaluacion_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intentos_evaluacion" ADD CONSTRAINT "intentos_evaluacion_oferta_id_ofertas_id_fk" FOREIGN KEY ("oferta_id") REFERENCES "public"."ofertas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ofertas" ADD CONSTRAINT "ofertas_formacion_id_formaciones_id_fk" FOREIGN KEY ("formacion_id") REFERENCES "public"."formaciones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ofertas" ADD CONSTRAINT "ofertas_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_oferta_id_ofertas_id_fk" FOREIGN KEY ("oferta_id") REFERENCES "public"."ofertas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cupon_id_cupones_id_fk" FOREIGN KEY ("cupon_id") REFERENCES "public"."cupones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progreso_lecciones" ADD CONSTRAINT "progreso_lecciones_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progreso_lecciones" ADD CONSTRAINT "progreso_lecciones_oferta_id_ofertas_id_fk" FOREIGN KEY ("oferta_id") REFERENCES "public"."ofertas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tokens_cuenta" ADD CONSTRAINT "tokens_cuenta_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admisiones_estado_fecha" ON "admisiones" USING btree ("estado","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "certificado_unico" ON "certificados" USING btree ("usuario_id","oferta_id");--> statement-breakpoint
CREATE INDEX "intentos_usuario_oferta" ON "intentos_evaluacion" USING btree ("usuario_id","oferta_id");--> statement-breakpoint
CREATE INDEX "pedidos_usuario_fecha" ON "pedidos" USING btree ("usuario_id","created_at");--> statement-breakpoint
CREATE INDEX "pedidos_estado_fecha" ON "pedidos" USING btree ("estado","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "progreso_unico" ON "progreso_lecciones" USING btree ("usuario_id","oferta_id","leccion_id");