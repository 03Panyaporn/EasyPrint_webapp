DO $$ BEGIN
 CREATE TYPE "public"."pricing_model" AS ENUM('per_page', 'per_piece', 'per_sqm', 'fixed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."service_option_type" AS ENUM('dropdown', 'radio', 'checkbox', 'number', 'text');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cart_item_option_selections" (
	"cart_item_id" uuid NOT NULL,
	"option_id" uuid NOT NULL,
	"value_id" uuid,
	"text_value" text,
	CONSTRAINT "cart_item_option_selections_cart_item_id_option_id_pk" PRIMARY KEY("cart_item_id","option_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "service_option_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"option_id" uuid NOT NULL,
	"name" text NOT NULL,
	"extra_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "service_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"main_service_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "service_option_type" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_price_option_id_main_service_price_options_id_fk";
--> statement-breakpoint
DROP TABLE "main_service_area_rates";--> statement-breakpoint
DROP TABLE "main_service_page_rates";--> statement-breakpoint
DROP TABLE "main_service_price_options";--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "width_cm" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "height_cm" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "main_services" ADD COLUMN "pricing_model" "pricing_model" DEFAULT 'fixed' NOT NULL;--> statement-breakpoint
ALTER TABLE "main_services" ADD COLUMN "base_price" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "main_services" ADD COLUMN "requires_file_upload" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "main_services" ADD COLUMN "allowed_file_types" text[];--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cart_item_option_selections" ADD CONSTRAINT "cart_item_option_selections_cart_item_id_cart_items_id_fk" FOREIGN KEY ("cart_item_id") REFERENCES "public"."cart_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cart_item_option_selections" ADD CONSTRAINT "cart_item_option_selections_option_id_service_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."service_options"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cart_item_option_selections" ADD CONSTRAINT "cart_item_option_selections_value_id_service_option_values_id_fk" FOREIGN KEY ("value_id") REFERENCES "public"."service_option_values"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_option_values" ADD CONSTRAINT "service_option_values_option_id_service_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."service_options"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_options" ADD CONSTRAINT "service_options_main_service_id_main_services_id_fk" FOREIGN KEY ("main_service_id") REFERENCES "public"."main_services"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "cart_items" DROP COLUMN IF EXISTS "price_option_id";--> statement-breakpoint
ALTER TABLE "cart_items" DROP COLUMN IF EXISTS "area_color";--> statement-breakpoint
ALTER TABLE "cart_items" DROP COLUMN IF EXISTS "area_width_cm";--> statement-breakpoint
ALTER TABLE "cart_items" DROP COLUMN IF EXISTS "area_height_cm";--> statement-breakpoint
ALTER TABLE "main_services" DROP COLUMN IF EXISTS "pricing_mode";