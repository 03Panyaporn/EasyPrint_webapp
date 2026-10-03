import type { LoginFailureReason } from "@easyprint/shared";
import { db } from "../db";
import { loginHistory } from "../../drizzle/schema";

// บันทึกการเข้าสู่ระบบทุกครั้ง (ทุก role ทั้งสำเร็จ/ล้มเหลว) ให้แอดมินดูย้อนหลังที่หน้า /admin/logs
// best-effort: เรียกแบบไม่ await ได้ — บันทึกไม่สำเร็จต้องไม่ทำให้ login ของผู้ใช้ล้มตาม
export async function recordLogin(input: {
  email: string;
  userId: string | null;
  role: "customer" | "shop_owner" | "admin" | null;
  success: boolean;
  failureReason: LoginFailureReason | null;
  ipAddress: string | null;
  userAgent: string | null;
}) {
  try {
    await db.insert(loginHistory).values(input);
  } catch (err) {
    console.error(`บันทึกประวัติการเข้าสู่ระบบของ ${input.email} ไม่สำเร็จ:`, err);
  }
}
