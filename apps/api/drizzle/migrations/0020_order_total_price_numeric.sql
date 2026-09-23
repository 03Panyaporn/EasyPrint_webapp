-- orders.total_price: integer → numeric(10,2) — เดิม checkout บันทึก Math.round(total) ทำให้ยอดที่มีเศษสตางค์
-- (เช่น ราคาตามพื้นที่ per_sqm หรือราคา ฿0.50/หน้า) ถูกปัดเป็นบาทเต็ม ไม่ตรงกับยอดที่ลูกค้าโอนจริง
ALTER TABLE "orders" ALTER COLUMN "total_price" SET DATA TYPE numeric(10, 2) USING "total_price"::numeric(10, 2);
--> statement-breakpoint
-- คำนวณยอดของออเดอร์ Schema v2 ใหม่จาก subtotal + ค่าจัดส่งที่ snapshot ไว้ (ค่าที่ไม่ถูกปัด)
-- ออเดอร์เก่าแบบ v1 (subtotal เป็น null) คงค่าเดิมไว้
UPDATE "orders"
SET "total_price" = "subtotal" + "shipping_fee_snapshot"
WHERE "subtotal" IS NOT NULL AND "shipping_fee_snapshot" IS NOT NULL;
