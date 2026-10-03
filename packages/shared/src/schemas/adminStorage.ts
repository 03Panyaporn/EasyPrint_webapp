// GET /admin/storage/overview, GET /admin/storage/files — หน้าแอดมิน "จัดการไฟล์และพื้นที่จัดเก็บ" (apps/web/app/(admin)/admin/storage/page.tsx)
// ไม่มี Zod schema ฝั่ง request เพราะทุก endpoint เป็น GET (ไม่มี body) หรือ DELETE ที่รับแค่ path param — มีแค่ type ของ response

// normal ≤65% | warning >65–85% | danger >85–<100% | full =100% | over >100%
// เดิมมีแค่ 3 ค่าและเช็คแค่ "> 85" ไม่มีเพดานบน ร้านที่ใช้เกินโควต้า (เช่น 401%) เลยตกเป็น danger = "ใกล้เต็มมาก" ผิดความหมาย
export type StorageStatus = "normal" | "warning" | "danger" | "full" | "over";

export const STORAGE_WARNING_PERCENT = 65;
export const STORAGE_DANGER_PERCENT = 85;

// ตัดสินสถานะจาก % จริง (ห้ามส่งค่าที่ปัดเศษแล้ว — 99.6% ต้องยังเป็น danger ไม่ใช่ full)
// ใช้ที่เดียวทั้ง api (/admin/storage/overview) และ web กัน threshold แยกกันเขียนจนสี/ป้ายขัดกัน
export function getStorageStatus(percent: number): StorageStatus {
  if (percent > 100) return "over";
  if (percent === 100) return "full";
  if (percent > STORAGE_DANGER_PERCENT) return "danger";
  if (percent > STORAGE_WARNING_PERCENT) return "warning";
  return "normal";
}

// แปลง % เป็นข้อความทศนิยม 1 ตำแหน่งแบบปัดปกติ (ตัด ".0" ทิ้ง: 400.51 → "400.5", 401 → "401") แต่ห้ามปัดข้ามเส้น 100%
// ต่ำกว่า 100 ไม่เกิน "99.9" (99.96 ไม่ขึ้น "100" คู่กับป้าย "ใกล้เต็มมาก"), เกิน 100 ไม่ต่ำกว่า "100.1" (100.02 ไม่ขึ้น "100" คู่กับ "เกินโควต้า")
export function formatStoragePercent(percent: number): string {
  const rounded = Math.round(percent * 10) / 10;
  const clamped = percent < 100 ? Math.min(rounded, 99.9) : percent > 100 ? Math.max(rounded, 100.1) : 100;
  return clamped.toFixed(1).replace(/\.0$/, "");
}

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
    shopsNearLimitCount: number; // status warning + danger (>65% แต่ยังไม่ถึง 100%)
    shopsOverQuotaCount: number; // status full + over (≥100%)
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
  // cart = ยังอยู่ในตะกร้า ยังไม่ checkout, order = อยู่ในออเดอร์จริงแล้ว, chat = ไฟล์แนบในแชทของออเดอร์
  // (เพิ่ม "chat" แก้ QA Phase 15 — BUG-15-02 — เดิมไฟล์แนบแชทไม่ถูกนับรวมในแดชบอร์ดนี้เลย ทั้งที่กินพื้นที่ storage จริง)
  source: "cart" | "order" | "chat";
  orderCode: string | null; // มีค่าเฉพาะ source: "order" หรือ "chat" (เชื่อมกับออเดอร์ที่มีข้อความนี้)
}

export interface AdminStorageFilesResponse {
  files: AdminStorageFile[];
}
