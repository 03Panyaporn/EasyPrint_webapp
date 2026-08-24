import { db } from "./db";
import { systemSettings } from "../drizzle/schema";

// system_settings มีแถวเดียวเสมอ (singleton) — ถ้ายังไม่มีแถวเลย (เช่น deploy ครั้งแรก) สร้าง default ให้อัตโนมัติตอนอ่านครั้งแรก
// เรียกใช้จุดนี้ที่เดียวทุกที่ที่ต้องอ่าน/อ้างอิงค่า settings (เช่น minPasswordLength ตอน validate รหัสผ่าน) กันแยกกันเขียน query ซ้ำหลายที่
export async function getSystemSettings() {
  const [existing] = await db.select().from(systemSettings).limit(1);
  if (existing) return existing;

  const [created] = await db.insert(systemSettings).values({}).returning();
  return created;
}
