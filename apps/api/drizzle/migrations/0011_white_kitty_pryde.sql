ALTER TYPE "main_service_pricing_mode" ADD VALUE 'per_page';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "main_service_page_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"main_service_id" uuid NOT NULL,
	"color" text NOT NULL,
	"price_per_page" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "main_service_page_rates_main_service_id_color_unique" UNIQUE("main_service_id","color")
);
--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "page_count" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "main_service_page_rates" ADD CONSTRAINT "main_service_page_rates_main_service_id_main_services_id_fk" FOREIGN KEY ("main_service_id") REFERENCES "public"."main_services"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
