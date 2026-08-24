// GET /admin/storage/overview, GET /admin/storage/files — หน้าแอดมิน "จัดการไฟล์และพื้นที่จัดเก็บ" (apps/web/app/(admin)/admin/storage/page.tsx)
// ไม่มี Zod schema ฝั่ง request เพราะทุก endpoint เป็น GET (ไม่มี body) หรือ DELETE ที่รับแค่ path param — มีแค่ type ของ response

export type StorageStatus = "normal" | "warning" | "danger";

export interface AdminStorageShopSummary {
  shopId: string;
  shopName: string;
  usedMb: number;
  quotaMb: number;
  fileCount: number;
  percent: number; // 0-100+ (เกิน 100 ได้ถ้าใช้เกินโควต้าจริง)
  status: StorageStatus;
}

export interface AdminStorageOverviewResponse {
  summary: {
    totalUsedMb: number;
    totalQuotaMb: number;
    totalFileCount: number;
    shopsNearLimitCount: number; // percent > 65 (รวม warning + danger)
    totalShopsCount: number;
  };
  shops: AdminStorageShopSummary[];
}

// path = storage path ใน bucket "order-files" (ชื่อไฟล์ UUID สุ่ม) — ใช้เป็น identifier เดียวตอนสั่งลบไฟล์
export interface AdminStorageFile {
  path: string;
  fileName: string | null;
  sizeMb: number;
  shopId: string;
  shopName: string;
  uploadedBy: string;
  createdAt: string;
  source: "cart" | "order"; // cart = ยังอยู่ในตะกร้า ยังไม่ checkout, order = อยู่ในออเดอร์จริงแล้ว
  orderCode: string | null; // มีค่าเฉพาะ source: "order"
}

export interface AdminStorageFilesResponse {
  files: AdminStorageFile[];
}
