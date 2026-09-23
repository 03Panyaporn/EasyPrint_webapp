import { db } from "../db";
import { notifications, users, shops } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { DEFAULT_NOTIFICATION_SETTINGS, notificationSettingKeyForType, type NotificationSettings } from "@easyprint/shared";

export async function createNotification(params: {
  userId: string;
  typeId: number;
  title: string;
  message: string;
  category: "general" | "chat";
  link?: string;
}) {
  try {
    // ดึงข้อมูลผู้ใช้เพื่อตรวจสอบว่าเป็นร้านค้าหรือไม่
    const [user] = await db.select().from(users).where(eq(users.id, params.userId));
    
    if (user && user.role === "shop_owner") {
      const [shop] = await db.select().from(shops).where(eq(shops.ownerId, user.id));
      
      if (shop && shop.notificationSettings) {
        // ใช้ mapping กลางจาก @easyprint/shared ชุดเดียวกับหน้าตั้งค่าและ toast listener ฝั่งเว็บ
        // key = null (เช่น typeId 6 บัญชีถูกระงับ/ปฏิเสธ, setup reminders, รหัสผ่าน) = ปิดไม่ได้ ส่งเสมอ
        const settings = { ...DEFAULT_NOTIFICATION_SETTINGS, ...(shop.notificationSettings as Partial<NotificationSettings>) };
        const key = notificationSettingKeyForType(params.typeId);
        if (key && settings[key] === false) return null;
      }
    }

    const [notification] = await db
      .insert(notifications)
      .values({
        userId: params.userId,
        typeId: params.typeId,
        title: params.title,
        message: params.message,
        category: params.category,
        link: params.link,
      })
      .returning();
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}
