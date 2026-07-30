ALTER TABLE "carts" DROP CONSTRAINT "carts_customer_id_unique";--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_id_shop_id_unique" UNIQUE("customer_id","shop_id");