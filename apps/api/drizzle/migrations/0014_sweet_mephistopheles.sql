CREATE TYPE "public"."option_price_category" AS ENUM('paper', 'printing_side', 'size', 'other');--> statement-breakpoint
CREATE TYPE "public"."page_counting_mode" AS ENUM('by_file_page', 'by_sheet');--> statement-breakpoint
CREATE TYPE "public"."price_scope" AS ENUM('per_item', 'per_page', 'per_piece', 'per_sqm');--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"service_name_snapshot" text NOT NULL,
	"pricing_type_snapshot" text NOT NULL,
	"base_rate_snapshot" numeric(10, 2) NOT NULL,
	"color_tier_label_snapshot" text,
	"color_tier_price_snapshot" numeric(10, 2),
	"quantity" integer NOT NULL,
	"page_count" integer,
	"width_cm" numeric(10, 2),
	"height_cm" numeric(10, 2),
	"options_snapshot_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"addon_services_snapshot_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"item_subtotal" numeric(10, 2) NOT NULL,
	"file_url" text,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_color_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"main_service_id" uuid NOT NULL,
	"label" text NOT NULL,
	"price_per_unit" numeric(10, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_quantity_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"main_service_id" uuid NOT NULL,
	"min_qty" integer NOT NULL,
	"max_qty" integer,
	"unit_price" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "service_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "pages" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "copies" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "copies" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "color_mode" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "color_mode" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "paper_size" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "paper_size" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "binding" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "binding" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "lamination" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "lamination" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "file_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "total_price" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "total_price" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "addon_services" ADD COLUMN "scope" "price_scope" DEFAULT 'per_item' NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "color_tier_id" uuid;--> statement-breakpoint
ALTER TABLE "main_services" ADD COLUMN "page_counting_mode" "page_counting_mode" DEFAULT 'by_file_page' NOT NULL;--> statement-breakpoint
ALTER TABLE "main_services" ADD COLUMN "min_area" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "main_services" ADD COLUMN "area_rounding_increment" numeric(10, 2) DEFAULT '0.1' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "subtotal" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_fee_snapshot" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "service_option_values" ADD COLUMN "price_scope" "price_scope" DEFAULT 'per_item' NOT NULL;--> statement-breakpoint
ALTER TABLE "service_options" ADD COLUMN "price_category" "option_price_category" DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_color_tiers" ADD CONSTRAINT "service_color_tiers_main_service_id_main_services_id_fk" FOREIGN KEY ("main_service_id") REFERENCES "public"."main_services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_quantity_tiers" ADD CONSTRAINT "service_quantity_tiers_main_service_id_main_services_id_fk" FOREIGN KEY ("main_service_id") REFERENCES "public"."main_services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_color_tier_id_service_color_tiers_id_fk" FOREIGN KEY ("color_tier_id") REFERENCES "public"."service_color_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "service_options_category_unique" ON "service_options" USING btree ("main_service_id","price_category") WHERE "service_options"."price_category" != 'other';