DO $$ BEGIN
 CREATE TYPE "public"."cancel_reason" AS ENUM('customer_request', 'invalid_payment_slip', 'amount_mismatch', 'no_transfer_found', 'invalid_file', 'shop_unavailable', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."delivery_method" AS ENUM('shop_delivery', 'self_pickup');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "order_status" ADD VALUE 'pending_review';--> statement-breakpoint
ALTER TYPE "order_status" ADD VALUE 'accepted';--> statement-breakpoint
ALTER TYPE "order_status" ADD VALUE 'shipping';--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending_review';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "ref" text NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "selected_add_ons" text[];--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_method" "delivery_method" DEFAULT 'self_pickup' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_address" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "slip_url" text NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "slip_uploaded_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cancel_reason" "cancel_reason";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cancel_note" text;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_ref_unique" UNIQUE("ref");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_shop_id_code_unique" UNIQUE("shop_id","code");