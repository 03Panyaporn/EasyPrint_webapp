import { z } from "zod";

// สคีมานี้ใช้ทั้งฝั่ง apps/web (ตอน validate ฟอร์ม) และ apps/api (ตอน validate ก่อนบันทึก DB)

export const rejectShopSchema = z.object({
  reason: z.string().min(1, "กรุณาระบุเหตุผลที่ไม่อนุมัติ"),
});

export type RejectShopInput = z.infer<typeof rejectShopSchema>;

// PATCH /admin/shops/:id/suspend — ระงับร้านที่เคย approved แล้ว (ต่างจาก reject ที่ใช้กับร้านสมัครใหม่ที่ยังไม่เคยอนุมัติ)
// body shape เหมือน rejectShopSchema เป๊ะ แต่แยก schema/ข้อความ error เพื่อให้สื่อความหมายถูกจุดตอนเรียกใช้
export const suspendShopSchema = z.object({
  reason: z.string().min(1, "กรุณาระบุเหตุผลในการระงับการใช้งาน"),
});

export type SuspendShopInput = z.infer<typeof suspendShopSchema>;

// PATCH /admin/shops/:id — แอดมินแก้ข้อมูลร้านค้าแทนเจ้าของร้าน (เช่น พิมพ์ผิดตอนสมัคร ติดต่อร้านไม่ได้)
// ตั้งใจให้เป็น field ชุดจำกัดกว่าที่ร้านแก้เอง (updateShopProfileSchema) — เผื่อไว้ตามหน้า UI ที่ใช้จริงตอนนี้ (admin/manage)
export const adminUpdateShopSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อร้านค้า").max(100).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email("อีเมลไม่ถูกต้อง").or(z.literal("")).optional(),
  address: z.string().trim().max(500).optional(),
  serviceTypes: z.array(z.string()).optional(),
  // โควต้าพื้นที่จัดเก็บเฉพาะร้านนี้ (MB) — ส่ง null เพื่อล้าง override กลับไปใช้ค่า default กลาง (system_settings.defaultShopStorageQuotaMb)
  storageQuotaMb: z.number().int().min(1, "ต้องมากกว่า 0").nullable().optional(),
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

// ── จัดการบัญชีลูกค้า (หน้า /admin/users) — เฉพาะ role "customer" เท่านั้น เจ้าของร้านจัดการผ่านหน้าร้านค้า (/admin/manage) ──
// สถานะคำนวณจาก users.suspended_at (null = active) ไม่มีคอลัมน์ status แยก
export const adminCustomerStatusSchema = z.enum(["active", "suspended"]);
export type AdminCustomerStatus = z.infer<typeof adminCustomerStatusSchema>;

// GET /admin/customers — query string มาเป็น string เสมอ เลยใช้ z.coerce กับตัวเลข
export const adminCustomerListQuerySchema = z.object({
  q: z.string().trim().max(100, "คำค้นหายาวเกินไป").optional(),
  status: z.enum(["all", "active", "suspended"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});
export type AdminCustomerListQuery = z.infer<typeof adminCustomerListQuerySchema>;

// PATCH /admin/customers/:id/suspend
export const suspendCustomerSchema = z.object({
  reason: z.string().trim().min(1, "กรุณาระบุเหตุผลในการระงับการใช้งาน").max(500, "เหตุผลยาวเกินไป (ไม่เกิน 500 ตัวอักษร)"),
});
export type SuspendCustomerInput = z.infer<typeof suspendCustomerSchema>;

export interface AdminCustomerListItem {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  status: AdminCustomerStatus;
  suspendedAt: string | null;
  orderCount: number;
  createdAt: string;
}

export interface AdminCustomerListResponse {
  customers: AdminCustomerListItem[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  // ตัวเลขรวมทั้งระบบ (ไม่ขึ้นกับคำค้นหา/ตัวกรอง) ใช้แสดงการ์ดสถิติด้านบนของหน้า
  stats: { total: number; active: number; suspended: number };
}

export interface AdminCustomerAddress {
  id: string;
  label: string;
  receiverName: string;
  phone: string;
  fullAddress: string;
  isDefault: boolean;
}

export interface AdminCustomerRecentOrder {
  id: string;
  ref: string;
  shopName: string | null;
  status: string; // ค่า order_status เดียวกับ orders.status
  totalPrice: number | null;
  createdAt: string;
}

// สาเหตุที่ลบบัญชีไม่ได้ — has_orders = มีประวัติคำสั่งซื้อผูกอยู่ (ต้องเก็บไว้เป็นประวัติของร้านค้า ใช้การระงับแทน)
export type AdminCustomerDeleteBlocker = "has_orders";

export interface AdminCustomerDetail extends AdminCustomerListItem {
  address: string | null;
  suspendedReason: string | null;
  addresses: AdminCustomerAddress[];
  orderStats: {
    total: number;
    active: number; // ยังไม่ completed/cancelled
    completed: number;
    cancelled: number;
    totalSpent: number; // รวมยอดของออเดอร์ที่ completed แล้วเท่านั้น (บาท)
    lastOrderAt: string | null;
  };
  recentOrders: AdminCustomerRecentOrder[];
  reviewCount: number;
  favoriteShopCount: number;
  canDelete: boolean;
  deleteBlocker: AdminCustomerDeleteBlocker | null;
}

// GET/PATCH /admin/settings — ตั้งค่าระบบฝั่งแอดมิน (system_settings มีแถวเดียวเสมอ)
// key ต้องตรงกับ notificationSettings ที่ apps/web/app/(admin)/admin/settings/page.tsx ใช้แสดงผลเป๊ะ
export const notificationTogglesSchema = z.object({
  newShop: z.boolean(),
  storageWarning90: z.boolean(),
  shopPendingReview: z.boolean(),
  newMessage: z.boolean(),
  storageWarning80: z.boolean(),
  systemError: z.boolean(),
});
export type NotificationToggles = z.infer<typeof notificationTogglesSchema>;

// ทุก field เป็น .optional() เพราะ PATCH รับแค่ field ที่เปลี่ยน ไม่ต้องส่งทั้งก้อนทุกครั้ง (merge ทับของเดิมที่ backend)
export const updateAdminSettingsSchema = z.object({
  systemName: z.string().trim().min(1, "กรุณากรอกชื่อระบบ").max(100).optional(),
  logoUrl: z.string().url("ลิงก์โลโก้ไม่ถูกต้อง").nullable().optional(),
  contactEmail: z.string().trim().email("อีเมลไม่ถูกต้อง").or(z.literal("")).nullable().optional(),
  contactPhone: z.string().trim().max(20).nullable().optional(),
  website: z.string().trim().url("ลิงก์เว็บไซต์ไม่ถูกต้อง").or(z.literal("")).nullable().optional(),
  notificationSettings: notificationTogglesSchema.optional(),
  // บังคับใช้จริงตอนสมัคร/เปลี่ยนรหัสผ่าน (ดู apps/api/src/auth/routes.ts) — field security อื่นด้านล่างเก็บไว้แสดงผลเฉยๆ ยังไม่บังคับใช้จริง
  minPasswordLength: z.number().int().min(6, "อย่างน้อย 6 ตัวอักษร").max(32, "ไม่เกิน 32 ตัวอักษร").optional(),
  requireSpecialChar: z.boolean().optional(),
  enable2fa: z.boolean().optional(),
  autoLogoutMinutes: z.number().int().min(5, "อย่างน้อย 5 นาที").max(240, "ไม่เกิน 240 นาที").optional(),
  defaultShopStorageQuotaMb: z.number().int().min(1, "ต้องมากกว่า 0").optional(),
});
export type UpdateAdminSettingsInput = z.infer<typeof updateAdminSettingsSchema>;

export interface AdminSettingsResponse {
  id: string;
  systemName: string;
  logoUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  notificationSettings: NotificationToggles | null;
  minPasswordLength: number;
  requireSpecialChar: boolean;
  enable2fa: boolean;
  autoLogoutMinutes: number;
  defaultShopStorageQuotaMb: number;
  updatedAt: string;
  createdAt: string;
}
