DO $$ BEGIN
 CREATE TYPE "public"."shop_approval_status" AS ENUM('pending', 'approved', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "category" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "google_map_link" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "id_card_url" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "shop_photo_url" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "approval_status" "shop_approval_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
-- users.firstname/lastname/phone/address ถูกเพิ่มไปแล้วบน Supabase จริงโดยตรง (ทีม auth push เองแยกจาก migration history นี้)
-- ใส่ IF NOT EXISTS กันพังตอนรันซ้ำ แทนที่จะลบ statement ทิ้งไปเลย เพื่อให้ประวัติ migration ยังสมบูรณ์ถ้าต้องตั้ง DB ใหม่ตั้งแต่ต้น
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "firstname" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastname" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "address" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
