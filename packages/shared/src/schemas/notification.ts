import { z } from "zod";

export const notificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  typeId: z.number().int().positive(),
  title: z.string().min(1),
  message: z.string().min(1),
  category: z.string(),
  isRead: z.boolean(),
  link: z.string().nullable(),
  createdAt: z.string(),
});

export type Notification = z.infer<typeof notificationSchema>;

export const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  typeId: z.number().int().positive(),
  title: z.string().min(1),
  message: z.string().min(1),
  category: z.string(),
  link: z.string().optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
// สคีมานี้ใช้ทั้งฝั่ง apps/web และ apps/api

// ── Admin notifications (in-app) — มีแค่ 3 event ตอนนี้: ร้านสมัครใหม่, ออเดอร์ถูกยกเลิก/ปฏิเสธชำระเงิน, ข้อความ contact-admin ──
export const adminNotificationTypeSchema = z.enum([
  "shop_registered",
  "order_cancelled",
  "contact_admin_message",
]);
export type AdminNotificationType = z.infer<typeof adminNotificationTypeSchema>;

export interface AdminNotificationItem {
  id: string;
  type: AdminNotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface AdminNotificationListResponse {
  notifications: AdminNotificationItem[];
  unreadCount: number;
}

// ── Contact-admin (ร้านค้าส่งข้อความถึงแอดมิน) ──
export const contactAdminStatusSchema = z.enum(["open", "resolved"]);
export type ContactAdminStatus = z.infer<typeof contactAdminStatusSchema>;

export const createContactAdminMessageSchema = z.object({
  subject: z.string().trim().min(1, "กรุณากรอกหัวข้อ").max(200),
  message: z.string().trim().min(1, "กรุณากรอกรายละเอียด").max(2000),
});
export type CreateContactAdminMessageInput = z.infer<typeof createContactAdminMessageSchema>;

export const replyContactAdminMessageSchema = z.object({
  adminReply: z.string().trim().min(1, "กรุณากรอกคำตอบ").max(2000),
});
export type ReplyContactAdminMessageInput = z.infer<typeof replyContactAdminMessageSchema>;

export interface ContactAdminMessageItem {
  id: string;
  shopId: string;
  shopName?: string;
  subject: string;
  message: string;
  status: ContactAdminStatus;
  adminReply: string | null;
  createdAt: string;
}
