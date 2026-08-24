import { db } from "./db";
import { adminNotifications } from "../drizzle/schema";
import type { AdminNotificationType } from "@easyprint/shared";

// insert แถวแจ้งเตือนแอดมิน — best-effort เสมอ (เรียกจาก route อื่นที่ทำงานหลักสำเร็จไปแล้ว เช่น สมัครร้าน/ยกเลิกออเดอร์)
// error ตรงนี้ไม่ควรทำให้ request หลักที่เรียกมา fail ไปด้วย จึงให้ผู้เรียก .catch() เองแทนที่จะ throw ทะลุออกไป
export async function createAdminNotification(params: {
  type: AdminNotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  await db.insert(adminNotifications).values({
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link,
  });
}
