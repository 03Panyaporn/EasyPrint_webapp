CREATE TABLE IF NOT EXISTS "cart_item_addons" (
	"cart_item_id" uuid NOT NULL,
	"addon_service_id" uuid NOT NULL,
	CONSTRAINT "cart_item_addons_cart_item_id_addon_service_id_pk" PRIMARY KEY("cart_item_id","addon_service_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"main_service_id" uuid NOT NULL,
	"price_option_id" uuid,
	"area_color" text,
	"area_width_cm" numeric(10, 2),
	"area_height_cm" numeric(10, 2),
	"quantity" integer DEFAULT 1 NOT NULL,
	"file_url" text,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"shop_id" uuid NOT NULL,
	"delivery_option_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "carts_customer_id_unique" UNIQUE("customer_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cart_item_addons" ADD CONSTRAINT "cart_item_addons_cart_item_id_cart_items_id_fk" FOREIGN KEY ("cart_item_id") REFERENCES "public"."cart_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cart_item_addons" ADD CONSTRAINT "cart_item_addons_addon_service_id_addon_services_id_fk" FOREIGN KEY ("addon_service_id") REFERENCES "public"."addon_services"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_main_service_id_main_services_id_fk" FOREIGN KEY ("main_service_id") REFERENCES "public"."main_services"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_price_option_id_main_service_price_options_id_fk" FOREIGN KEY ("price_option_id") REFERENCES "public"."main_service_price_options"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "carts" ADD CONSTRAINT "carts_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "carts" ADD CONSTRAINT "carts_delivery_option_id_delivery_options_id_fk" FOREIGN KEY ("delivery_option_id") REFERENCES "public"."delivery_options"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
