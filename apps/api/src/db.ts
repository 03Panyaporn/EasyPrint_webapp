import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../drizzle/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL ไม่ถูกตั้งค่า — เช็คไฟล์ .env (ก็อปจาก .env.example)");
}

// prepare: false — จำเป็นเมื่อต่อผ่าน Supabase connection pooler โหมด "transaction" (พอร์ต 6543/PgBouncer)
// เพราะ PgBouncer โหมดนี้สลับ physical connection ให้แต่ละ transaction ได้ตลอดเวลา ถ้าเปิด prepared statements
// (ค่า default ของ postgres.js) การ query แบบ prepared statement ข้าม logical connection อาจไปชนกับ
// transaction อื่นที่กำลังเปิดอยู่บน physical connection เดียวกัน ทำให้เกิด silent rollback/ข้อมูลเพี้ยนแบบสุ่ม
// (พบจาก QA Phase 17 — E17-01: checkout สำเร็จ (200, ได้ order.id/code) แต่ query หา order ไม่เจอในภายหลัง
// และ cart ไม่ถูกเคลียร์ — สอดคล้องกับปัญหานี้ที่ Supabase docs เตือนไว้โดยตรงสำหรับ postgres.js + pooler)
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
