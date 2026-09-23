-- ประกาศจากระบบ (แอดมิน) — เดิมหน้าแดชบอร์ดแอดมินเป็น mock ในหน้าเว็บ ไม่มีที่เก็บจริง
CREATE TYPE "public"."announcement_category" AS ENUM('update', 'feature', 'security');
--> statement-breakpoint
CREATE TYPE "public"."announcement_target" AS ENUM('all', 'shops', 'customers');
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" "announcement_category" NOT NULL,
	"target" "announcement_target" DEFAULT 'all' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
-- ร้านโปรดของลูกค้า — เดิมปุ่มหัวใจในหน้าร้านเปลี่ยนแค่ state ในหน้าเว็บ รีโหลดแล้วหาย
CREATE TABLE IF NOT EXISTS "favorite_shops" (
	"user_id" uuid NOT NULL,
	"shop_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "favorite_shops_user_id_shop_id_pk" PRIMARY KEY("user_id","shop_id")
);
--> statement-breakpoint
ALTER TABLE "favorite_shops" ADD CONSTRAINT "favorite_shops_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "favorite_shops" ADD CONSTRAINT "favorite_shops_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
