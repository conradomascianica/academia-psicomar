CREATE TABLE "encuentros_academia" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pedido_id" uuid NOT NULL,
	"numero" integer NOT NULL,
	"fecha" timestamp with time zone NOT NULL,
	"zona_horaria" text NOT NULL,
	"enlace" text NOT NULL,
	"estado" text DEFAULT 'confirmado' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "encuentro_numero_valido" CHECK ("encuentros_academia"."numero" IN (1,2))
);
--> statement-breakpoint
ALTER TABLE "encuentros_academia" ADD CONSTRAINT "encuentros_academia_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "encuentro_pedido_numero" ON "encuentros_academia" USING btree ("pedido_id","numero");