-- อีเมลผู้ใช้ไม่สนตัวพิมพ์เล็ก/ใหญ่ — แปลงอีเมลเดิมเป็นตัวพิมพ์เล็ก แล้วกันซ้ำด้วย unique index บน lower(email)
-- ⚠️ ก่อนรัน ให้เช็คว่าไม่มีบัญชีที่อีเมลต่างกันแค่ตัวพิมพ์ (ถ้ามี migration นี้จะ fail ทั้งก้อนโดยไม่เปลี่ยนข้อมูล):
--   SELECT lower(email), count(*) FROM users GROUP BY lower(email) HAVING count(*) > 1;
UPDATE "users" SET "email" = lower(trim("email")) WHERE "email" <> lower(trim("email"));
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_lower_unique" ON "users" USING btree (lower("email"));
