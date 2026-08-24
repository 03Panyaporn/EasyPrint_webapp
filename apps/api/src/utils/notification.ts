import { db } from "../db";
import { notifications, users, shops } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

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
        const settings: any = shop.notificationSettings;
        const typeId = params.typeId;

        // เช็คการตั้งค่าตาม Type ID
        // 1 = คำสั่งซื้อใหม่
        if (typeId === 1 && settings.newOrder === false) return null;
        
        // 2 = อัปเดตสถานะ, 5 = ลูกค้ายกเลิกออเดอร์
        if ((typeId === 2 || typeId === 5) && settings.orderUpdate === false) return null;
        
        // 3 = ข้อความแชทใหม่
        if (typeId === 3 && settings.chatAndRequests === false) return null;
        
        // 7 = เตือนก่อนปิดร้านและออเดอร์ค้าง
        if (typeId === 7 && settings.closingWarning === false) return null;
        
        // 13 = สิ้นสุดพักร้อน, 14 = ร้านเปิดอัตโนมัติ, 15 = ร้านปิดอัตโนมัติ
        if ((typeId === 13 || typeId === 14 || typeId === 15) && settings.autoShopStatus === false) return null;
        
        // 4 = ประกาศแอดมิน, 6 = บัญชีถูกระงับ/เตือน
        if ((typeId === 4 || typeId === 6) && settings.adminUpdates === false) return null;

        // หมายเหตุ: Type 8, 9, 11, 12 (Setup Reminders) และ Type 10 (Password) 
        // จะไม่ถูก block (ถือเป็น System Critical / Setup)
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
