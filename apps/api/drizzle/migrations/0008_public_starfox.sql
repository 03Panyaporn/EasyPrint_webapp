DO $$ BEGIN
 CREATE TYPE "public"."main_service_pricing_mode" AS ENUM('fixed', 'area');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "main_service_area_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"main_service_id" uuid NOT NULL,
	"color" text NOT NULL,
	"rate_per_sqm" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "main_service_area_rates_main_service_id_color_unique" UNIQUE("main_service_id","color")
);
--> statement-breakpoint
ALTER TABLE "main_services" ADD COLUMN "pricing_mode" "main_service_pricing_mode" DEFAULT 'fixed' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "main_service_area_rates" ADD CONSTRAINT "main_service_area_rates_main_service_id_main_services_id_fk" FOREIGN KEY ("main_service_id") REFERENCES "public"."main_services"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
