import { z } from "zod";

// สคีมานี้ใช้ทั้งฝั่ง apps/web (ตอน validate ฟอร์ม) และ apps/api (ตอน validate ก่อนบันทึก DB)

export const rejectShopSchema = z.object({
  reason: z.string().min(1, "กรุณาระบุเหตุผลที่ไม่อนุมัติ"),
});

export type RejectShopInput = z.infer<typeof rejectShopSchema>;

// PATCH /admin/shops/:id — แอดมินแก้ข้อมูลร้านค้าแทนเจ้าของร้าน (เช่น พิมพ์ผิดตอนสมัคร ติดต่อร้านไม่ได้)
// ตั้งใจให้เป็น field ชุดจำกัดกว่าที่ร้านแก้เอง (updateShopProfileSchema) — เผื่อไว้ตามหน้า UI ที่ใช้จริงตอนนี้ (admin/manage)
export const adminUpdateShopSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อร้านค้า").max(100).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email("อีเมลไม่ถูกต้อง").or(z.literal("")).optional(),
  address: z.string().trim().max(500).optional(),
  serviceTypes: z.array(z.string()).optional(),
});
export type AdminUpdateShopInput = z.infer<typeof adminUpdateShopSchema>;

// GET /admin/dashboard — สรุปภาพรวมหน้าหลักแอดมิน
// change = null หมายถึงไม่มีวิธีคำนวณที่แม่นยำ (เช่น approvalStatus เปลี่ยนได้ ไม่มี audit log ย้อนหลัง) ไม่ใช่แค่ "ไม่มีข้อมูลเทียบ"
export interface AdminDashboardPendingShop {
  id: string;
  name: string;
  ownerEmail: string | null;
  createdAt: string;
  hasIdCard: boolean;
}

export interface AdminDashboardResponse {
  shops: {
    total: number;
    totalChange: number | null;
    approved: number;
    pending: number;
  };
  users: {
    total: number;
    totalChange: number | null;
  };
  pendingShops: AdminDashboardPendingShop[];
}
