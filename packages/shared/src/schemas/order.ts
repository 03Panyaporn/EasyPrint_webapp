import { z } from "zod";

// สคีมานี้ใช้ทั้งฝั่ง apps/web (ตอน validate ฟอร์ม) และ apps/api (ตอน validate ก่อนบันทึก DB)
// แก้ที่นี่ที่เดียว ทั้งสองฝั่งจะตรวจสอบข้อมูลตรงกันเสมอ

export const printServiceTypeSchema = z.enum([
  "photocopy", // ถ่ายเอกสาร
  "color_print", // พิมพ์สี
  "poster", // โปสเตอร์
]);

export const createOrderSchema = z.object({
  shopId: z.string().uuid(),
  serviceType: printServiceTypeSchema,
  pages: z.number().int().positive(),
  copies: z.number().int().positive().default(1),
  colorMode: z.enum(["bw", "color"]).default("bw"),
  paperSize: z.enum(["A4", "A3", "letter"]).default("A4"),
  binding: z.boolean().default(false),
  lamination: z.boolean().default(false),
  fileUrl: z.string().url(),
  note: z.string().max(500).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const orderStatusSchema = z.enum([
  "pending_payment", // รอตรวจสอบการชำระเงิน
  "in_progress", // กำลังดำเนินการ
  "completed", // เสร็จสิ้น
  "cancelled", // ยกเลิก
]);

export type OrderStatus = z.infer<typeof orderStatusSchema>;
