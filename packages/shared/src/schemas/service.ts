import { z } from "zod";

// สคีมานี้ใช้ทั้งฝั่ง apps/web (ตอน validate ฟอร์มหน้า /shop/services) และ apps/api (ตอน validate ก่อนบันทึก DB)
// แก้ที่นี่ที่เดียว ทั้งสองฝั่งจะตรวจสอบข้อมูลตรงกันเสมอ

export const paperSizeSchema = z.enum(["A4", "A3", "A5", "กำหนดเอง"]);
export const colorSchema = z.enum(["ขาวดำ", "สี"]);
export const serviceUnitSchema = z.enum(["แผ่น", "เล่ม", "ชิ้น", "หน้า", "งาน"]);
export const estimatedTimeSchema = z.enum([
  "2 นาที",
  "5 นาที",
  "10 นาที",
  "15 นาที",
  "30 นาที",
  "1 ชั่วโมง",
  "2 ชั่วโมง",
  "1 วัน",
]);

export const addOnBindingSchema = z.object({
  addOnId: z.string().uuid(),
  extraPrice: z.number().nonnegative(),
});

function requiresCustomPaperSize(d: { paperSizes: string[]; customPaperSize?: string }) {
  return !d.paperSizes.includes("กำหนดเอง") || !!d.customPaperSize?.trim();
}

const mainServiceBaseSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อบริการ").max(100),
  description: z.string().trim().max(500).optional(),
  paperSizes: z.array(paperSizeSchema).min(1, "กรุณาเลือกขนาดกระดาษอย่างน้อย 1 รายการ"),
  customPaperSize: z.string().trim().max(50).optional(),
  colors: z.array(colorSchema).min(1, "กรุณาเลือกรูปแบบสีอย่างน้อย 1 รายการ"),
  price: z.number().nonnegative(),
  unit: serviceUnitSchema,
  estimatedTime: estimatedTimeSchema.optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  addOns: z.array(addOnBindingSchema).default([]),
});

export const createMainServiceSchema = mainServiceBaseSchema.refine(requiresCustomPaperSize, {
  message: "กรุณากรอกขนาดกระดาษแบบกำหนดเอง",
  path: ["customPaperSize"],
});

export const updateMainServiceSchema = mainServiceBaseSchema.partial().refine(
  (d) => d.paperSizes === undefined || requiresCustomPaperSize({ paperSizes: d.paperSizes, customPaperSize: d.customPaperSize }),
  { message: "กรุณากรอกขนาดกระดาษแบบกำหนดเอง", path: ["customPaperSize"] }
);

export type CreateMainServiceInput = z.infer<typeof createMainServiceSchema>;
export type UpdateMainServiceInput = z.infer<typeof updateMainServiceSchema>;

const addOnServiceBaseSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อบริการ").max(100),
  description: z.string().trim().max(500).optional(),
  price: z.number().nonnegative(),
  unit: serviceUnitSchema,
  estimatedTime: estimatedTimeSchema.optional(),
  isActive: z.boolean().default(true),
});

export const createAddOnServiceSchema = addOnServiceBaseSchema;
export const updateAddOnServiceSchema = addOnServiceBaseSchema.partial();

export type CreateAddOnServiceInput = z.infer<typeof createAddOnServiceSchema>;
export type UpdateAddOnServiceInput = z.infer<typeof updateAddOnServiceSchema>;

const deliveryOptionBaseSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อประเภทการจัดส่ง").max(100),
  description: z.string().trim().max(500).optional(),
  logoUrl: z.string().url().optional(),
  baseFee: z.number().nonnegative(),
  // null = ลบเงื่อนไขส่งฟรีออกอย่างชัดเจน (ต่างจาก undefined ที่แปลว่า "ไม่ได้ส่งค่านี้มา ไม่ต้องแก้")
  freeShippingThreshold: z.number().positive().nullable().optional(),
  isActive: z.boolean().default(true),
});

export const createDeliveryOptionSchema = deliveryOptionBaseSchema;
export const updateDeliveryOptionSchema = deliveryOptionBaseSchema.partial();

export type CreateDeliveryOptionInput = z.infer<typeof createDeliveryOptionSchema>;
export type UpdateDeliveryOptionInput = z.infer<typeof updateDeliveryOptionSchema>;
