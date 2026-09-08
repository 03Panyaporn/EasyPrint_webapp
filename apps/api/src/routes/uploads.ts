import { Elysia } from "elysia";
import { uploadFile, type UploadType } from "../storage";
import { verifyAuthToken, AUTH_COOKIE_NAME } from "../auth/jwt";
import { requireAdmin } from "./admin";

// ⚠️ endpoint นี้เปิดสาธารณะโดยดีฟอลต์ (ไม่เช็ค JWT) เพราะต้องใช้ตอนสมัครร้านค้า ก่อนมีบัญชี/login
// กันการใช้งานผิดวัตถุประสงค์ด้วยการจำกัดชนิดไฟล์ + ขนาดไฟล์ที่ apps/api/src/storage.ts เท่านั้น
// (ไม่มี rate limit — ยอมรับความเสี่ยงนี้ไว้ก่อนสำหรับ scope โปรเจกต์นี้)
// ยกเว้น "order-file" (ไฟล์งานพิมพ์แนบตะกร้า/ออเดอร์ + ไฟล์แนบในแชทของออเดอร์), "payment-slip" (สลิปโอนเงินตอน checkout)
// และ "contact-admin-attachment" (ไฟล์แนบในคำร้อง contact-admin) — ทั้งสามชนิดนี้บังคับ login ตาม role ที่เกี่ยวข้องเท่านั้น
// "payment-slip" บังคับ login เป็น customer เท่านั้น (ผูกกับตัวตนลูกค้าที่ checkout โดยตรง)
// "order-file" อนุญาตทั้ง customer และ shop_owner เพราะใช้ร่วมกันทั้งตอนสั่งซื้อ (ลูกค้าเท่านั้น) และตอนแนบไฟล์ในแชทออเดอร์ (ทั้งสองฝั่งคุยกันได้)
// "contact-admin-attachment" อนุญาต shop_owner (ตอนส่งคำร้อง) และ admin (ตอนตอบกลับ)
export const uploadsRoutes = new Elysia().post("/uploads", async ({ body, cookie, set }) => {
  // ยืนยันบั๊กจริงจาก QA Phase 15 (ST15-03, เดิม SEC9-05c): ยิง POST /uploads แบบ body ว่างเปล่า (ไม่ส่ง multipart มาเลย)
  // ทำให้ body เป็น null/undefined แล้ว destructure ตรงๆ ด้านล่าง throw TypeError ดิบๆ กลายเป็น raw 500 แทน 400 ที่ควรจะเป็น
  if (typeof body !== "object" || body === null) {
    set.status = 400;
    return { error: "ไม่พบไฟล์ที่อัปโหลด" };
  }
  const { file, type } = body as { file?: unknown; type?: unknown };

  if (!(file instanceof File)) {
    set.status = 400;
    return { error: "ไม่พบไฟล์ที่อัปโหลด" };
  }
  const validTypes: UploadType[] = [
    "shop-photo",
    "id-card",
    "service-image",
    "delivery-logo",
    "order-file",
    "payment-slip",
    "contact-admin-attachment",
    "system-logo",
  ];
  if (!validTypes.includes(type as UploadType)) {
    set.status = 400;
    return { error: `type ต้องเป็นหนึ่งใน ${validTypes.join(", ")}` };
  }

  if (type === "payment-slip") {
    const token = cookie[AUTH_COOKIE_NAME]?.value as string | undefined;
    const payload = token ? verifyAuthToken(token) : null;
    if (!payload || payload.role !== "customer") {
      set.status = 401;
      return { error: "ต้องเข้าสู่ระบบเป็นลูกค้าก่อนอัปโหลดสลิปการโอนเงิน" };
    }
  }

  if (type === "order-file") {
    const token = cookie[AUTH_COOKIE_NAME]?.value as string | undefined;
    const payload = token ? verifyAuthToken(token) : null;
    if (!payload || (payload.role !== "customer" && payload.role !== "shop_owner")) {
      set.status = 401;
      return { error: "ต้องเข้าสู่ระบบก่อนอัปโหลดไฟล์งานพิมพ์" };
    }
  }

  if (type === "contact-admin-attachment") {
    const token = cookie[AUTH_COOKIE_NAME]?.value as string | undefined;
    const payload = token ? verifyAuthToken(token) : null;
    if (!payload || (payload.role !== "shop_owner" && payload.role !== "customer" && payload.role !== "admin")) {
      set.status = 401;
      return { error: "ต้องเข้าสู่ระบบก่อนอัปโหลดไฟล์แนบคำร้อง" };
    }
  }

  // system-logo (โลโก้ระบบในหน้า /admin/settings) ต้องเป็นแอดมินเท่านั้นถึงจะอัปโหลดได้ ต่างจาก type สาธารณะอื่นๆ
  if (type === "system-logo") {
    const authError = await requireAdmin(cookie, set);
    if (authError) return authError;
  }

  try {
    return await uploadFile(type as UploadType, file);
  } catch (err) {
    set.status = 400;
    return { error: err instanceof Error ? err.message : "อัปโหลดไฟล์ไม่สำเร็จ" };
  }
});
