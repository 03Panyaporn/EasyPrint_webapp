import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, shops, orders, carts, addresses, passwordResetTokens, contactAdminMessages } from "../../drizzle/schema";

// กติกาการลบบัญชีผู้ใช้ — ใช้ร่วมกันทั้ง DELETE /auth/me (ผู้ใช้ลบบัญชีตัวเอง) และ DELETE /admin/customers/:id (แอดมินลบให้)
// แยกออกมาไว้ที่เดียวกันลอจิก 2 จุดเพี้ยนกัน — แต่ละ route แปลงสาเหตุเป็นข้อความที่เหมาะกับผู้ใช้ของตัวเองเอง
export type AccountDeletionBlocker = "owns_shop" | "has_orders";

// shops.owner_id / orders.customer_id ตั้งใจไม่มี ON DELETE CASCADE (กันร้านค้า/ประวัติการขายหายไปเงียบๆ ตอนลบบัญชี —
// ดูคอมเมนต์เดียวกันใน services.ts เรื่องลบบริการที่มี cart ผูกอยู่) เลยต้องเช็คก่อนลบเสมอ ไม่งั้น Postgres จะ throw
// foreign_key_violation (23503) ดิบๆ ที่ catch ไม่ทัน กลายเป็น raw 500 (ยืนยันบั๊กจริงจาก QA Phase 08 — BUG-08-01
// พบว่ากระทบทั้งเจ้าของร้านที่มีร้านผูกอยู่ และลูกค้าทั่วไปที่เคยสั่งซื้อแล้วอย่างน้อย 1 ครั้ง — คือเกือบทุกบัญชีที่ใช้งานจริง)
// reviews.customer_id ก็ไม่มี CASCADE แต่รีวิวได้เฉพาะออเดอร์ที่ completed เท่านั้น เลยถูกกันด้วยเงื่อนไข has_orders อยู่แล้ว
// คืนสาเหตุที่ลบไม่ได้ หรือ null ถ้าลบได้
export async function getAccountDeletionBlocker(user: {
  id: string;
  role: (typeof users.$inferSelect)["role"];
}): Promise<AccountDeletionBlocker | null> {
  if (user.role === "shop_owner") {
    const [ownedShop] = await db.select({ id: shops.id }).from(shops).where(eq(shops.ownerId, user.id)).limit(1);
    if (ownedShop) return "owns_shop";
  }
  const [existingOrder] = await db.select({ id: orders.id }).from(orders).where(eq(orders.customerId, user.id)).limit(1);
  if (existingOrder) return "has_orders";
  return null;
}

// ล้างข้อมูลที่ไม่ใช่ประวัติสำคัญทางธุรกิจ (ตะกร้าที่ยังไม่ checkout / token รีเซ็ตรหัสผ่านเก่า) ก่อนลบผู้ใช้เสมอ —
// ทั้งคู่ไม่มี CASCADE เช่นกัน (carts.customer_id, password_reset_tokens.user_id) แต่ไม่ใช่ข้อมูลที่ต้องเก็บรักษาแบบ order/shop
// จึงลบทิ้งตรงนี้ได้เลยแทนที่จะ block การลบบัญชีเหมือน 2 เคสด้านบน (cart_items/addons/option_selections มี CASCADE ผูกกับ cart อยู่แล้ว)
// addresses.user_id / contact_admin_messages.user_id ก็ไม่มี CASCADE — เดิมไม่ได้ล้าง ทำให้ลูกค้าที่มีที่อยู่บันทึกไว้
// หรือเคยติดต่อแอดมินลบบัญชีไม่ได้ (FK violation → 500) ที่อยู่ลบได้เลย (ออเดอร์เก็บที่อยู่เป็น snapshot ใน orders.delivery_address แล้ว)
// ส่วนข้อความถึงแอดมินเก็บไว้เป็นประวัติแต่ตัดการผูกกับบัญชีออก (user_id เป็น nullable อยู่แล้ว)
// notifications / favorite_shops มี CASCADE อยู่แล้ว ลบตามให้เอง
// ทำทั้งหมดใน transaction เดียว — ถ้าขั้นไหนพัง ข้อมูลที่ลบไปก่อนหน้า (เช่น ตะกร้า) ต้องไม่หายไปด้วย
// ⚠️ ต้องเรียก getAccountDeletionBlocker() ก่อนเสมอ — ฟังก์ชันนี้ไม่เช็คซ้ำ
export async function deleteUserAccount(userId: string) {
  await db.transaction(async (tx) => {
    await tx.delete(carts).where(eq(carts.customerId, userId));
    await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
    await tx.delete(addresses).where(eq(addresses.userId, userId));
    await tx.update(contactAdminMessages).set({ userId: null }).where(eq(contactAdminMessages.userId, userId));

    await tx.delete(users).where(eq(users.id, userId));
  });
}
