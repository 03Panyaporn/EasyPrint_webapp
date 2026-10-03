import { z } from "zod";

// ── หน้าแอดมิน "ประวัติและสถานะระบบ" (/admin/logs) ──
// Audit Log = ประวัติการทำรายการของแอดมิน, Login History = ประวัติการเข้าสู่ระบบทุก role, System Health = สถานะ API/DB/Storage

// action key → ป้ายภาษาไทย ใช้ทั้ง api (ตอนบันทึก, ดู apps/api/src/utils/auditLog.ts) และ web (ตอนแสดงผล/ตัวกรอง)
export const AUDIT_ACTIONS = {
  "shop.update": "แก้ไขข้อมูลร้านค้า",
  "shop.delete": "ลบร้านค้า",
  "shop.approve": "อนุมัติร้านค้า",
  "shop.reject": "ไม่อนุมัติร้านค้า",
  "shop.suspend": "ระงับร้านค้า",
  "customer.suspend": "ระงับบัญชีลูกค้า",
  "customer.reinstate": "เปิดใช้งานบัญชีลูกค้า",
  "customer.delete": "ลบบัญชีลูกค้า",
  "announcement.create": "ส่งประกาศจากระบบ",
  "settings.update": "แก้ไขการตั้งค่าระบบ",
  "file.delete": "ลบไฟล์",
  "shop_files.delete": "ลบไฟล์ทั้งหมดของร้าน",
  "review.delete": "ลบรีวิว",
  "contact_message.reply": "ตอบกลับข้อความติดต่อ",
  "contact_message.delete": "ลบข้อความติดต่อ",
} as const;
export type AuditAction = keyof typeof AUDIT_ACTIONS;
const auditActionKeys = Object.keys(AUDIT_ACTIONS) as [AuditAction, ...AuditAction[]];

// GET /admin/audit-logs
export const adminAuditLogQuerySchema = z.object({
  q: z.string().trim().max(100, "คำค้นหายาวเกินไป").optional(), // อีเมลแอดมิน หรือ id ของข้อมูลที่ถูกแก้
  action: z.enum(auditActionKeys).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type AdminAuditLogQuery = z.infer<typeof adminAuditLogQuerySchema>;

export interface AdminAuditLogItem {
  id: string;
  actorId: string | null;
  actorEmail: string;
  actorName: string | null; // null เมื่อบัญชีแอดมินถูกลบไปแล้ว
  action: string; // AuditAction ปกติ — เป็น string เผื่อแถวเก่าที่ action ถูกเลิกใช้ไปแล้ว
  targetType: string | null;
  targetId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AdminAuditLogListResponse {
  logs: AdminAuditLogItem[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

// GET /admin/login-history
export const loginFailureReasonSchema = z.enum(["invalid_credentials", "suspended"]);
export type LoginFailureReason = z.infer<typeof loginFailureReasonSchema>;

export const adminLoginHistoryQuerySchema = z.object({
  q: z.string().trim().max(100, "คำค้นหายาวเกินไป").optional(), // อีเมล หรือ IP
  status: z.enum(["all", "success", "failed"]).default("all"),
  role: z.enum(["all", "customer", "shop_owner", "admin"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type AdminLoginHistoryQuery = z.infer<typeof adminLoginHistoryQuerySchema>;

export interface AdminLoginHistoryItem {
  id: string;
  userId: string | null; // null = อีเมลที่กรอกไม่มีในระบบ (หรือบัญชีถูกลบไปแล้ว)
  email: string;
  role: "customer" | "shop_owner" | "admin" | null;
  success: boolean;
  failureReason: LoginFailureReason | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AdminLoginHistoryListResponse {
  logins: AdminLoginHistoryItem[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  // สรุป 24 ชั่วโมงล่าสุด (ไม่ขึ้นกับตัวกรอง) ใช้แสดงการ์ดด้านบนของแท็บ
  last24h: { success: number; failed: number };
}

// GET /admin/system-health
export interface SystemHealthCheck {
  ok: boolean;
  latencyMs: number | null;
  error: string | null;
}

export interface SystemHealthResponse {
  health: {
    status: "ok" | "degraded"; // degraded = มีอย่างน้อย 1 บริการที่เช็คไม่ผ่าน
    checkedAt: string;
    api: { uptimeSeconds: number; environment: string; runtime: string; memoryMb: number };
    database: SystemHealthCheck;
    storage: SystemHealthCheck;
    email: { configured: boolean }; // มี RESEND_API_KEY หรือไม่ (ไม่ยิงส่งอีเมลจริงเพื่อเช็ค)
  };
}
