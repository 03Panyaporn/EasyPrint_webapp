import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL หรือ SUPABASE_SERVICE_ROLE_KEY ไม่ถูกตั้งค่า — เช็คไฟล์ .env");
}

// ใช้ service role key เพราะ endpoint อัปโหลดรันฝั่ง server เท่านั้น ห้ามส่งคีย์นี้ไปฝั่ง client เด็ดขาด
export const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// shop-photos = public bucket (ลูกค้าต้องเห็นรูปหน้าร้านได้) — id-cards/payment-slips = private (ข้อมูลละเอียดอ่อน ห้ามเปิดสาธารณะ)
// รูปบริการหลัก/โลโก้ตัวเลือกจัดส่ง ก็เป็นรูปสาธารณะเหมือนกัน (ลูกค้าต้องเห็นได้) เลยใช้ bucket "shop-photos" ร่วมกัน ไม่ต้องสร้าง bucket ใหม่บน Supabase
// payment-slip = สลิปโอนเงิน เป็นเอกสารการเงิน ต้อง private เหมือน id-card แล้วออก signed URL ให้เจ้าของร้านดูตอนตรวจสอบเท่านั้น
export const UPLOAD_BUCKETS = {
  "shop-photo": { bucket: "shop-photos", public: true },
  "id-card": { bucket: "id-cards", public: false },
  "service-image": { bucket: "shop-photos", public: true },
  "delivery-logo": { bucket: "shop-photos", public: true },
  "payment-slip": { bucket: "payment-slips", public: false },
} as const;
export type UploadType = keyof typeof UPLOAD_BUCKETS;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

export async function uploadFile(type: UploadType, file: File) {
  if (!ALLOWED_MIME.includes(file.type)) {
    throw new Error("รองรับเฉพาะไฟล์รูปภาพ JPG, PNG หรือ WEBP เท่านั้น");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("ไฟล์ต้องมีขนาดไม่เกิน 5MB");
  }

  const config = UPLOAD_BUCKETS[type];
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
