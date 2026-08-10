ALTER TABLE "order_items" ADD COLUMN "color_tier_label_snapshot" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "color_tier_price_snapshot" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "width_cm_snapshot" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "height_cm_snapshot" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "note_snapshot" text;
