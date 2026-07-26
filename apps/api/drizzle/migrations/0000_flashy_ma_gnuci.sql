DO $$ BEGIN
 CREATE TYPE "public"."order_status" AS ENUM('pending_payment', 'in_progress', 'completed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."user_role" AS ENUM('shop_owner', 'customer', 'admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "addon_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"unit" text NOT NULL,
	"estimated_time" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "delivery_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"logo_url" text,
	"base_fee" numeric(10, 2) NOT NULL,
	"free_shipping_threshold" numeric(10, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "main_service_addons" (
	"main_service_id" uuid NOT NULL,
	"addon_service_id" uuid NOT NULL,
	"extra_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	CONSTRAINT "main_service_addons_main_service_id_addon_service_id_pk" PRIMARY KEY("main_service_id","addon_service_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "main_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"paper_sizes" text[] NOT NULL,
	"custom_paper_size" text,
	"colors" text[] NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"unit" text NOT NULL,
	"estimated_time" text,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"service_type" text NOT NULL,
	"pages" integer NOT NULL,
	"copies" integer DEFAULT 1 NOT NULL,
	"color_mode" text DEFAULT 'bw' NOT NULL,
	"paper_size" text DEFAULT 'A4' NOT NULL,
	"binding" boolean DEFAULT false NOT NULL,
	"lamination" boolean DEFAULT false NOT NULL,
	"file_url" text NOT NULL,
	"total_price" integer NOT NULL,
	"status" "order_status" DEFAULT 'pending_payment' NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"address" text,
	"delivery_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- "shops" มีอยู่แล้วก่อนไฟล์ migration นี้ (สร้างครั้งแรกด้วยมือ ไม่ผ่าน drizzle migration)
-- CREATE TABLE ด้านบนจะ no-op เพราะ IF NOT EXISTS จึงต้องเพิ่มคอลัมน์ใหม่แยกต่างหากตรงนี้
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "delivery_enabled" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "addon_services" ADD CONSTRAINT "addon_services_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "delivery_options" ADD CONSTRAINT "delivery_options_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "main_service_addons" ADD CONSTRAINT "main_service_addons_main_service_id_main_services_id_fk" FOREIGN KEY ("main_service_id") REFERENCES "public"."main_services"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "main_service_addons" ADD CONSTRAINT "main_service_addons_addon_service_id_addon_services_id_fk" FOREIGN KEY ("addon_service_id") REFERENCES "public"."addon_services"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "main_services" ADD CONSTRAINT "main_services_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shops" ADD CONSTRAINT "shops_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
