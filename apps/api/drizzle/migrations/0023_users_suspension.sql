-- แอดมินระงับ/เปิดใช้งานบัญชีลูกค้า (หน้า /admin/users) — เพิ่มคอลัมน์ nullable เท่านั้น ไม่กระทบข้อมูลเดิม (บัญชีเดิมทั้งหมด = ใช้งานปกติ)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspended_at" timestamp;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspended_reason" text;
