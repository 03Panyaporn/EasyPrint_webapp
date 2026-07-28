import { Elysia } from "elysia";
import { uploadFile, type UploadType } from "../storage";

// ⚠️ endpoint นี้เปิดสาธารณะ (ไม่เช็ค JWT) เพราะต้องใช้ตอนสมัครร้านค้า ก่อนมีบัญชี/login
// กันการใช้งานผิดวัตถุประสงค์ด้วยการจำกัดชนิดไฟล์ + ขนาดไฟล์ที่ apps/api/src/storage.ts เท่านั้น
// (ไม่มี rate limit — ยอมรับความเสี่ยงนี้ไว้ก่อนสำหรับ scope โปรเจกต์นี้)
export const uploadsRoutes = new Elysia().post("/uploads", async ({ body, set }) => {
  const { file, type } = body as { file?: unknown; type?: unknown };

  if (!(file instanceof File)) {
    set.status = 400;
    return { error: "ไม่พบไฟล์ที่อัปโหลด" };
  }
  const validTypes: UploadType[] = ["shop-photo", "id-card", "service-image", "delivery-logo"];
  if (!validTypes.includes(type as UploadType)) {
    set.status = 400;
    return { error: `type ต้องเป็นหนึ่งใน ${validTypes.join(", ")}` };
  }

  try {
    return await uploadFile(type as UploadType, file);
  } catch (err) {
    set.status = 400;
    return { error: err instanceof Error ? err.message : "อัปโหลดไฟล์ไม่สำเร็จ" };
  }
});
