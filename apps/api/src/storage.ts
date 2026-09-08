import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ย้ายจาก Supabase Storage มา Cloudflare R2 (S3-compatible API) — เหตุผล: R2 ไม่คิดเงิน egress เลย
// (Supabase/S3 ปกติคิดเงินตอนโหลดไฟล์ออก ยิ่งมีคนเปิดดูออเดอร์/แชทบ่อยยิ่งเสียเงิน) และ free tier ให้ 10GB ฟรีตลอด
// ไม่มีวันหมดอายุ (ต่างจาก AWS S3 free tier ที่จำกัดแค่ 12 เดือน)
if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
  throw new Error(
    "R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY ไม่ถูกตั้งค่า — เช็คไฟล์ .env (ก็อปจาก .env.example)"
  );
}
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
// URL สาธารณะสำหรับ bucket ที่เปิด public access (custom domain หรือ *.r2.dev subdomain ที่ตั้งค่าไว้ใน Cloudflare
// dashboard ต่อ bucket) — จำเป็นเฉพาะ bucket ที่ public:true ด้านล่าง (shop-photos) เท่านั้น
const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL;

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// wrapper รูปทรงเหมือน supabase-js storage client เดิม (from(bucket).upload/getPublicUrl/createSignedUrl/remove/download)
// เพื่อให้ 8 ไฟล์ที่เรียกใช้อยู่เดิม (routes/*.ts) แก้แค่เปลี่ยนชื่อ import จาก supabaseAdmin.storage เป็น objectStorage
// ไม่ต้องแก้ logic การเรียกใช้เลย — ยกเว้น listBucketFiles() ด้านล่างที่ต้องเขียนใหม่แยกเพราะ S3 ไม่มี offset-based
// pagination แบบที่ Supabase API มี (ใช้ ContinuationToken แทน)
function bucketRef(bucket: string) {
  return {
    async upload(path: string, body: ArrayBuffer, opts: { contentType: string }) {
      try {
        await s3.send(
          new PutObjectCommand({ Bucket: bucket, Key: path, Body: new Uint8Array(body), ContentType: opts.contentType })
        );
        return { error: null };
      } catch (err) {
        return { error: err as Error };
      }
    },
    getPublicUrl(path: string) {
      if (!R2_PUBLIC_BASE_URL) {
        throw new Error(`R2_PUBLIC_BASE_URL ไม่ถูกตั้งค่า — จำเป็นสำหรับ bucket สาธารณะ "${bucket}"`);
      }
      return { data: { publicUrl: `${R2_PUBLIC_BASE_URL}/${path}` } };
    },
    async createSignedUrl(path: string, expiresInSeconds: number) {
      try {
        const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: path }), {
          expiresIn: expiresInSeconds,
        });
        return { data: { signedUrl: url }, error: null };
      } catch (err) {
        return { data: null, error: err as Error };
      }
    },
    async remove(paths: string[]) {
      try {
        await s3.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: paths.map((Key) => ({ Key })) } }));
        return { error: null };
      } catch (err) {
        return { error: err as Error };
      }
    },
    async download(path: string) {
      try {
        const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: path }));
        const bytes = await res.Body!.transformToByteArray();
        // ต้อง cast เพราะ TS ตีความ Uint8Array<ArrayBufferLike> ที่มาจาก transformToByteArray() ว่าอาจเป็น
        // SharedArrayBuffer ซึ่งไม่ตรงกับ BlobPart แบบเป๊ะๆ (runtime ใช้ได้ปกติ ปัญหาแค่ระดับ type)
        return { data: new Blob([bytes as BlobPart]), error: null };
      } catch (err) {
        return { data: null, error: err as Error };
      }
    },
    async createBucket() {
      try {
        await s3.send(new CreateBucketCommand({ Bucket: bucket }));
        return { error: null };
      } catch (err) {
        return { error: err as Error };
      }
    },
  };
}

export const objectStorage = { from: bucketRef };

const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"];
const PRINT_FILE_MIME = [...IMAGE_MIME, "application/pdf"];

// shop-photos = public bucket (ลูกค้าต้องเห็นรูปหน้าร้านได้) — id-cards/payment-slips = private (ข้อมูลละเอียดอ่อน ห้ามเปิดสาธารณะ)
// รูปบริการหลัก/โลโก้ตัวเลือกจัดส่ง ก็เป็นรูปสาธารณะเหมือนกัน (ลูกค้าต้องเห็นได้) เลยใช้ bucket "shop-photos" ร่วมกัน ไม่ต้องสร้าง bucket ใหม่
// payment-slip = สลิปโอนเงิน เป็นเอกสารการเงิน ต้อง private เหมือน id-card แล้วออก signed URL ให้เจ้าของร้านดูตอนตรวจสอบเท่านั้น
// order-files = private bucket เก็บไฟล์งานพิมพ์ในตะกร้า/ออเดอร์ของลูกค้า — ห้ามเปิดสาธารณะ
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
    // ยืนยันบั๊กเล็กน้อยจากการตรวจสอบระหว่าง QA Phase 15: ข้อความ error เดิมเช็คแค่ type === "order-file" ถึงจะบอกว่ารองรับ PDF
    // ทั้งที่ "contact-admin-attachment" ก็ใช้ PRINT_FILE_MIME เดียวกัน (รองรับ PDF จริง) แต่ข้อความ error กลับบอกว่ารองรับแค่รูปภาพ
    // เช็คจาก allowedMime ของ config ตรงๆ แทนการเจาะจงชื่อ type จะได้ไม่พลาดถ้ามี type ใหม่ที่ใช้ PRINT_FILE_MIME เพิ่มในอนาคต
    throw new Error(
      (config.allowedMime as readonly string[]).includes("application/pdf")
        ? "รองรับเฉพาะไฟล์ JPG, PNG, WEBP หรือ PDF เท่านั้น"
        : "รองรับเฉพาะไฟล์รูปภาพ JPG, PNG หรือ WEBP เท่านั้น"
    );
  }
  if (file.size > config.maxSize) {
    throw new Error(`ไฟล์ต้องมีขนาดไม่เกิน ${Math.round(config.maxSize / (1024 * 1024))}MB`);
  }
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await objectStorage.from(config.bucket).upload(path, await file.arrayBuffer(), { contentType: file.type });

  if (error) throw new Error(error.message);

  // bucket private (id-card) ไม่มี public URL ตรงๆ — เก็บแค่ path ไว้ก่อน รอ endpoint สร้าง signed URL ให้แอดมินดูตอนอนุมัติร้านค้า
  if (config.public) {
    const { data } = objectStorage.from(config.bucket).getPublicUrl(path);
    return { path, url: data.publicUrl };
  }
  return { path, url: null };
}

// list ไฟล์ทั้งหมดใน bucket พร้อมขนาดไฟล์ — ใช้ตอนหน้าแอดมิน "จัดการพื้นที่จัดเก็บ" คำนวณพื้นที่ใช้งานจริง
// เหตุผลที่ต้องมาดึงจาก Storage API ตรงๆ (ไม่ใช่จาก DB): ไฟล์ใน bucket "order-files" ตั้งชื่อเป็น UUID สุ่มล้วน ไม่มีโฟลเดอร์แยกตามร้าน
// และ DB (cart_items/order_items) ก็ไม่ได้เก็บขนาดไฟล์ไว้เลย ต้องมาขอจาก Storage แล้ว join กับ DB เอาเองที่ apps/api/src/routes/adminStorage.ts
// (เขียนตรงกับ S3 client ไม่ผ่าน bucketRef ด้านบน เพราะ S3/R2 list API ใช้ ContinuationToken ไม่ใช่ offset แบบ Supabase เดิม)
export async function listBucketFiles(bucket: string): Promise<Map<string, number>> {
  const sizeByPath = new Map<string, number>();
  let continuationToken: string | undefined;

  do {
    const res = await s3.send(
      new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1000, ContinuationToken: continuationToken })
    );
    for (const obj of res.Contents ?? []) {
      if (obj.Key) sizeByPath.set(obj.Key, obj.Size ?? 0);
    }
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken);

  return sizeByPath;
}
