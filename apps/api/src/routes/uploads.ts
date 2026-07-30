import { Elysia } from "elysia";
import { uploadFile, type UploadType } from "../storage";
import { verifyAuthToken, AUTH_COOKIE_NAME } from "../auth/jwt";

// ⚠️ endpoint นี้เปิดสาธารณะโดยดีฟอลต์ (ไม่เช็ค JWT) เพราะต้องใช้ตอนสมัครร้านค้า ก่อนมีบัญชี/login
// กันการใช้งานผิดวัตถุประสงค์ด้วยการจำกัดชนิดไฟล์ + ขนาดไฟล์ที่ apps/api/src/storage.ts เท่านั้น
// (ไม่มี rate limit — ยอมรับความเสี่ยงนี้ไว้ก่อนสำหรับ scope โปรเจกต์นี้)
// ยกเว้น "order-file" (ไฟล์งานพิมพ์แนบตะกร้า/ออเดอร์) ที่บังคับ login เป็น customer เพราะรับไฟล์ใหญ่ถึง 20MB
// และมีแค่ลูกค้าที่ login เท่านั้นที่ต้องใช้อยู่แล้ว ไม่จำเป็นต้องเปิดสาธารณะเหมือน type อื่น
export const uploadsRoutes = new Elysia().post("/uploads", async ({ body, cookie, set }) => {
  const { file, type } = body as { file?: unknown; type?: unknown };

  if (!(file instanceof File)) {
    set.status = 400;
    return { error: "ไม่พบไฟล์ที่อัปโหลด" };
  }
  const validTypes: UploadType[] = ["shop-photo", "id-card", "service-image", "delivery-logo", "payment-slip", "order-file"];
  if (!validTypes.includes(type as UploadType)) {
    set.status = 400;
    return { error: `type ต้องเป็นหนึ่งใน ${validTypes.join(", ")}` };
  }

  if (type === "order-file" || type === "payment-slip") {
    const token = cookie[AUTH_COOKIE_NAME]?.value as string | undefined;
    const payload = token ? verifyAuthToken(token) : null;
    if (!payload || payload.role !== "customer") {
      set.status = 401;
      return { error: "ต้องเข้าสู่ระบบเป็นลูกค้าก่อนอัปโหลดสลิปหรือไฟล์งานพิมพ์" };
    }
  }

  try {
    return await uploadFile(type as UploadType, file);
  } catch (err) {
    set.status = 400;
    return { error: err instanceof Error ? err.message : "อัปโหลดไฟล์ไม่สำเร็จ" };
  }
});
