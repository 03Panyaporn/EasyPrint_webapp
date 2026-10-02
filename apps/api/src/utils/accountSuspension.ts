import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../../drizzle/schema";
import { getSystemSettings } from "../systemSettings";

// แอดมินระงับบัญชีลูกค้าได้จากหน้า /admin/users (PATCH /admin/customers/:id/suspend) — ไฟล์นี้รวมสิ่งที่ใช้บังคับการระงับ
// ทั้งตอน login (auth/routes.ts) และ hook กลางที่บล็อกทุก API (index.ts) ไว้ที่เดียว

// frontend เช็ค code นี้ได้ถ้าต้องการแยกกรณีบัญชีถูกระงับออกจาก 403 ทั่วไป
export const ACCOUNT_SUSPENDED_CODE = "ACCOUNT_SUSPENDED";

export async function isCustomerSuspended(userId: string): Promise<boolean> {
  const [row] = await db.select({ suspendedAt: users.suspendedAt }).from(users).where(eq(users.id, userId));
  return !!row?.suspendedAt;
}

// ข้อความแจ้งผู้ใช้ที่ถูกระงับ — แนบช่องทางติดต่อแอดมินจาก system_settings ถ้าตั้งไว้ (ลูกค้าที่ถูกระงับ login เข้าหน้า contact-admin ไม่ได้)
export async function getSuspendedAccountMessage(): Promise<string> {
  const settings = await getSystemSettings();
  const contacts = [
    settings.contactEmail ? `อีเมล ${settings.contactEmail}` : null,
    settings.contactPhone ? `โทร ${settings.contactPhone}` : null,
  ].filter(Boolean);
  return `บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ${contacts.length ? ` (${contacts.join(" / ")})` : ""}`;
}
