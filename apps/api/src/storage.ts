import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL หรือ SUPABASE_SERVICE_ROLE_KEY ไม่ถูกตั้งค่า — เช็คไฟล์ .env");
}

// ใช้ service role key เพราะ endpoint อัปโหลดรันฝั่ง server เท่านั้น ห้ามส่งคีย์นี้ไปฝั่ง client เด็ดขาด
export const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"];
const PRINT_FILE_MIME = [...IMAGE_MIME, "application/pdf"];

// shop-photos = public bucket (ลูกค้าต้องเห็นรูปหน้าร้านได้) — id-cards/payment-slips = private (ข้อมูลละเอียดอ่อน ห้ามเปิดสาธารณะ)
// รูปบริการหลัก/โลโก้ตัวเลือกจัดส่ง ก็เป็นรูปสาธารณะเหมือนกัน (ลูกค้าต้องเห็นได้) เลยใช้ bucket "shop-photos" ร่วมกัน ไม่ต้องสร้าง bucket ใหม่บน Supabase
// payment-slip = สลิปโอนเงิน เป็นเอกสารการเงิน ต้อง private เหมือน id-card แล้วออก signed URL ให้เจ้าของร้านดูตอนตรวจสอบเท่านั้น
// order-files = private bucket ใหม่ (สร้างจริงบน Supabase แล้ว) เก็บไฟล์งานพิมพ์ในตะกร้า/ออเดอร์ของลูกค้า — ห้ามเปิดสาธารณะ
// เพราะอาจมีข้อมูลส่วนตัวในไฟล์ ต้องออก signed URL ให้เฉพาะเจ้าของไฟล์กับร้านที่รับออเดอร์เท่านั้น
export const UPLOAD_BUCKETS = {
  "shop-photo": { bucket: "shop-photos", public: true, allowedMime: IMAGE_MIME, maxSize: 5 * 1024 * 1024 },
  "id-card": { bucket: "id-cards", public: false, allowedMime: IMAGE_MIME, maxSize: 5 * 1024 * 1024 },
  "service-image": { bucket: "shop-photos", public: true, allowedMime: IMAGE_MIME, maxSize: 5 * 1024 * 1024 },
  "delivery-logo": { bucket: "shop-photos", public: true, allowedMime: IMAGE_MIME, maxSize: 5 * 1024 * 1024 },
  "payment-slip": { bucket: "payment-slips", public: false, allowedMime: IMAGE_MIME, maxSize: 5 * 1024 * 1024 },
  "order-file": { bucket: "order-files", public: false, allowedMime: PRINT_FILE_MIME, maxSize: 20 * 1024 * 1024 },
  "contact-admin-attachment": { bucket: "contact-admin-attachments", public: false, allowedMime: PRINT_FILE_MIME, maxSize: 20 * 1024 * 1024 },
  // โลโก้ระบบ (หน้า /admin/settings) — รูปสาธารณะเหมือนกัน ใช้ bucket "shop-photos" ร่วมด้วย ไม่ต้องสร้าง bucket ใหม่
  "system-logo": { bucket: "shop-photos", public: true, allowedMime: IMAGE_MIME, maxSize: 5 * 1024 * 1024 },
} as const;
export type UploadType = keyof typeof UPLOAD_BUCKETS;

export async function uploadFile(type: UploadType, file: File) {
  const config = UPLOAD_BUCKETS[type];

  if (!(config.allowedMime as readonly string[]).includes(file.type)) {
    throw new Error(
      type === "order-file"
        ? "รองรับเฉพาะไฟล์ JPG, PNG, WEBP หรือ PDF เท่านั้น"
        : "รองรับเฉพาะไฟล์รูปภาพ JPG, PNG หรือ WEBP เท่านั้น"
    );
  }
  if (file.size > config.maxSize) {
    throw new Error(`ไฟล์ต้องมีขนาดไม่เกิน ${Math.round(config.maxSize / (1024 * 1024))}MB`);
  }
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(config.bucket)
    .upload(path, await file.arrayBuffer(), { contentType: file.type });

  if (error) throw new Error(error.message);

  // bucket private (id-card) ไม่มี public URL ตรงๆ — เก็บแค่ path ไว้ก่อน รอ endpoint สร้าง signed URL ให้แอดมินดูตอนอนุมัติร้านค้า
  if (config.public) {
    const { data } = supabaseAdmin.storage.from(config.bucket).getPublicUrl(path);
    return { path, url: data.publicUrl };
  }
  return { path, url: null };
}

// list ไฟล์ทั้งหมดใน bucket (แบ่งหน้าอัตโนมัติ) พร้อมขนาดไฟล์ — ใช้ตอนหน้าแอดมิน "จัดการพื้นที่จัดเก็บ" คำนวณพื้นที่ใช้งานจริง
// เหตุผลที่ต้องมาดึงจาก Storage API ตรงๆ (ไม่ใช่จาก DB): ไฟล์ใน bucket "order-files" ตั้งชื่อเป็น UUID สุ่มล้วน ไม่มีโฟลเดอร์แยกตามร้าน
// และ DB (cart_items/order_items) ก็ไม่ได้เก็บขนาดไฟล์ไว้เลย ต้องมาขอจาก Storage แล้ว join กับ DB เอาเองที่ apps/api/src/routes/adminStorage.ts
export async function listBucketFiles(bucket: string): Promise<Map<string, number>> {
  const sizeByPath = new Map<string, number>();
  const limit = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .list("", { limit, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;

    for (const file of data) {
      const size = (file.metadata as { size?: number } | null)?.size ?? 0;
      sizeByPath.set(file.name, size);
    }

    if (data.length < limit) break;
    offset += limit;
  }

  return sizeByPath;
}
