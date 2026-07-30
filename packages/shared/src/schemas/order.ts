import { z } from "zod";

// สคีมานี้ใช้ทั้งฝั่ง apps/web (ตอน validate ฟอร์ม) และ apps/api (ตอน validate ก่อนบันทึก DB)
// แก้ที่นี่ที่เดียว ทั้งสองฝั่งจะตรวจสอบข้อมูลตรงกันเสมอ

export const printServiceTypeSchema = z.enum([
  "photocopy", // ถ่ายเอกสาร
  "color_print", // พิมพ์สี
  "poster", // โปสเตอร์
]);

export const deliveryMethodSchema = z.enum([
  "shop_delivery", // ร้านจัดส่งให้
  "self_pickup", // มารับเองที่ร้าน
]);
export type DeliveryMethod = z.infer<typeof deliveryMethodSchema>;

export const createOrderSchema = z
  .object({
    shopId: z.string().uuid(),
    serviceType: printServiceTypeSchema,
    pages: z.number().int().positive(),
    copies: z.number().int().positive().default(1),
    colorMode: z.enum(["bw", "color"]).default("bw"),
    paperSize: z.enum(["A4", "A3", "letter"]).default("A4"),
    binding: z.boolean().default(false),
    lamination: z.boolean().default(false),
    selectedAddOns: z.array(z.string()).default([]),
    fileUrl: z.string().url(),
    slipUrl: z.string().url(), // หลักฐานการชำระเงิน — บังคับแนบมาพร้อมตอนสั่งเสมอ
    deliveryMethod: deliveryMethodSchema.default("self_pickup"),
    deliveryAddress: z.string().min(1).optional(), // บังคับกรอกเมื่อ deliveryMethod = shop_delivery เท่านั้น (เช็คด้วย .refine ด้านล่าง)
    note: z.string().max(500).optional(),
  })
  .refine((data) => data.deliveryMethod !== "shop_delivery" || !!data.deliveryAddress, {
    message: "กรุณากรอกที่อยู่จัดส่ง",
    path: ["deliveryAddress"],
  });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// ต้องตรงกับ OrderStatus ฝั่ง frontend (apps/web/components/shop/orders/types.ts) และ orderStatusEnum ใน apps/api/drizzle/schema.ts เสมอ
export const orderStatusSchema = z.enum([
  "pending_review", // รอตรวจสอบ
  "accepted", // รับงานแล้ว
  "in_progress", // กำลังดำเนินการ
  "shipping", // กำลังจัดส่ง
  "completed", // เสร็จสิ้น
  "cancelled", // ยกเลิก
]);

export type OrderStatus = z.infer<typeof orderStatusSchema>;

// ลำดับ flow ปกติของออเดอร์ — ใช้ตรวจสอบฝั่ง backend ว่าข้ามสถานะที่ไม่ถูกต้องไม่ได้ (ดู apps/api/src/routes/orders.ts)
export const orderStatusFlow: OrderStatus[] = [
  "pending_review",
  "accepted",
  "in_progress",
  "shipping",
  "completed",
];

// ต้องตรงกับ cancelReasonLabels ฝั่ง frontend (apps/web/components/shop/orders/statusConfig.ts) และ cancelReasonEnum ใน schema.ts
export const cancelReasonSchema = z.enum([
  "customer_request", // ลูกค้าขอยกเลิก
  "invalid_payment_slip", // หลักฐานการชำระเงินไม่ถูกต้อง/ไม่ชัดเจน
  "amount_mismatch", // ยอดโอนไม่ตรงกับยอดสั่งซื้อ
  "no_transfer_found", // ไม่พบรายการโอนเงินจริง
  "invalid_file", // ไฟล์งานไม่ถูกต้อง/เสียหาย
  "shop_unavailable", // ร้านไม่สามารถให้บริการได้ตามคำขอ
  "other", // อื่นๆ
]);
export type CancelReason = z.infer<typeof cancelReasonSchema>;

// สำหรับปุ่ม "ปฏิเสธการชำระเงิน" (เฉพาะตอนสถานะ pending_review) — จำกัดเหตุผลไว้เฉพาะกลุ่มที่เกี่ยวกับการชำระเงินเท่านั้น
export const rejectPaymentReasonSchema = z.enum([
  "invalid_payment_slip",
  "amount_mismatch",
  "no_transfer_found",
  "other",
]);

// PATCH /orders/:id/status — ส่งสถานะถัดไปที่ต้องการเปลี่ยน ถ้าเป็น cancelled ต้องแนบเหตุผลด้วยเสมอ
export const updateOrderStatusSchema = z
  .object({
    status: orderStatusSchema,
    cancelReason: cancelReasonSchema.optional(),
    cancelNote: z.string().max(500).optional(),
  })
  .refine((data) => data.status !== "cancelled" || !!data.cancelReason, {
    message: "กรุณาระบุเหตุผลที่ยกเลิก/ปฏิเสธการชำระเงิน",
    path: ["cancelReason"],
  });
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

// GET /shops/:shopId/orders?status=... — filter รายการออเดอร์ตามสถานะ (ไม่ส่ง = เอาทุกสถานะ)
export const orderListQuerySchema = z.object({
  status: orderStatusSchema.optional(),
});
