DO $$ BEGIN
 CREATE TYPE "public"."option_price_category" AS ENUM('paper', 'printing_side', 'size', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."page_counting_mode" AS ENUM('by_file_page', 'by_sheet');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."price_scope" AS ENUM('per_item', 'per_page', 'per_piece', 'per_sqm');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "service_color_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"main_service_id" uuid NOT NULL,
	"label" text NOT NULL,
	"price_per_unit" numeric(10, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "service_quantity_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"main_service_id" uuid NOT NULL,
	"min_qty" integer NOT NULL,
	"max_qty" integer,
	"unit_price" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "file_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "addon_services" ADD COLUMN "scope" "price_scope" DEFAULT 'per_item' NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "color_tier_id" uuid;--> statement-breakpoint
ALTER TABLE "main_services" ADD COLUMN "page_counting_mode" "page_counting_mode" DEFAULT 'by_file_page' NOT NULL;--> statement-breakpoint
ALTER TABLE "main_services" ADD COLUMN "min_area" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "main_services" ADD COLUMN "area_rounding_increment" numeric(10, 2) DEFAULT '0.1' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cart_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "service_option_values" ADD COLUMN "price_scope" "price_scope" DEFAULT 'per_item' NOT NULL;--> statement-breakpoint
ALTER TABLE "service_options" ADD COLUMN "price_category" "option_price_category" DEFAULT 'other' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_color_tiers" ADD CONSTRAINT "service_color_tiers_main_service_id_main_services_id_fk" FOREIGN KEY ("main_service_id") REFERENCES "public"."main_services"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_quantity_tiers" ADD CONSTRAINT "service_quantity_tiers_main_service_id_main_services_id_fk" FOREIGN KEY ("main_service_id") REFERENCES "public"."main_services"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_color_tier_id_service_color_tiers_id_fk" FOREIGN KEY ("color_tier_id") REFERENCES "public"."service_color_tiers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "service_options_category_unique" ON "service_options" USING btree ("main_service_id","price_category") WHERE "service_options"."price_category" != 'other';