import { z } from "zod";

// ── ประกาศจากระบบ (แอดมิน → ผู้ใช้) ──
// บันทึกลงตาราง announcements (ดูย้อนหลังในหน้าแดชบอร์ดแอดมิน) + ส่งเป็นแจ้งเตือนในแอป typeId 5 ถึงผู้ใช้กลุ่มเป้าหมาย
// category ใช้แยกสี/ป้ายในหน้าแดชบอร์ดเท่านั้น, target = กลุ่มผู้รับ (ไม่รวมแอดมินเสมอ)
export const announcementCategorySchema = z.enum(["update", "feature", "security"]);
export type AnnouncementCategory = z.infer<typeof announcementCategorySchema>;

export const announcementTargetSchema = z.enum(["all", "shops", "customers"]);
export type AnnouncementTarget = z.infer<typeof announcementTargetSchema>;

// POST /admin/announcements
export const createAnnouncementSchema = z.object({
  category: announcementCategorySchema,
  target: announcementTargetSchema.default("all"),
  title: z.string().trim().min(1, "กรุณากรอกหัวข้อประกาศ").max(120),
  message: z.string().trim().min(1, "กรุณากรอกรายละเอียดประกาศ").max(1000),
});
export type CreateAnnouncementInput = z.input<typeof createAnnouncementSchema>;

export interface AnnouncementItem {
  id: string;
  category: AnnouncementCategory;
  target: AnnouncementTarget;
  title: string;
  message: string;
  recipientCount: number; // จำนวนผู้ใช้ที่ได้รับแจ้งเตือนจริงตอนส่ง
  createdAt: string; // ISO
}

export interface AnnouncementListResponse {
  announcements: AnnouncementItem[];
}
