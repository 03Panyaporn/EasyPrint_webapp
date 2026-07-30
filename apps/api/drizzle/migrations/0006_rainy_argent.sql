CREATE TABLE IF NOT EXISTS "main_service_price_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"main_service_id" uuid NOT NULL,
	"paper_size" text NOT NULL,
	"color" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "main_service_price_options_main_service_id_paper_size_color_unique" UNIQUE("main_service_id","paper_size","color")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "main_service_price_options" ADD CONSTRAINT "main_service_price_options_main_service_id_main_services_id_fk" FOREIGN KEY ("main_service_id") REFERENCES "public"."main_services"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
