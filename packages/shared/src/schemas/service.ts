import { z } from "zod";

// สคีมานี้ใช้ทั้งฝั่ง apps/web (ตอน validate ฟอร์มหน้า /shop/services) และ apps/api (ตอน validate ก่อนบันทึก DB)
// แก้ที่นี่ที่เดียว ทั้งสองฝั่งจะตรวจสอบข้อมูลตรงกันเสมอ

// ปุ่มลัดที่มีให้เลือกในฟอร์ม — ร้านค้ายังพิมพ์ขนาดเองได้อิสระ (เช่น "B5", "โปสเตอร์ A2") ไม่ได้ผูกกับ enum นี้
export const commonPaperSizes = ["A4", "A3", "A5"] as const;
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

// ราคาแยกตาม "ขนาดกระดาษ x สี" — ร้านค้าเพิ่มได้กี่รายการก็ได้ ขนาดพิมพ์เองได้อิสระ ไม่ผูกกับ preset
export const priceOptionSchema = z.object({
  paperSize: z.string().trim().min(1, "กรุณากรอกขนาด").max(30, "ชื่อขนาดยาวเกินไป"),
  color: colorSchema,
  price: z.number().nonnegative(),
});
export type PriceOptionInput = z.infer<typeof priceOptionSchema>;

// อัตราราคาต่อตารางเมตร แยกตามสี — ใช้ตอน pricingMode = "area" (ลูกค้ากรอกกว้าง/สูงเองตอนสั่งซื้อจริง)
export const areaRateSchema = z.object({
  color: colorSchema,
  ratePerSqm: z.number().nonnegative(),
});
export type AreaRateInput = z.infer<typeof areaRateSchema>;

export const mainServicePricingModeSchema = z.enum(["fixed", "area"]);

function hasDuplicatePriceOptions(options: { paperSize: string; color: string }[]) {
  const seen = new Set<string>();
  for (const o of options) {
    const key = `${o.paperSize.trim().toLowerCase()}|${o.color}`;
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

function hasDuplicateAreaRateColors(rates: { color: string }[]) {
  const seen = new Set<string>();
  for (const r of rates) {
    if (seen.has(r.color)) return true;
    seen.add(r.color);
  }
  return false;
}

const mainServiceBaseSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อบริการ").max(100),
  description: z.string().trim().max(500).optional(),
  pricingMode: mainServicePricingModeSchema.default("fixed"),
  // priceOptions ใช้เมื่อ pricingMode = "fixed", areaRates ใช้เมื่อ pricingMode = "area" — validate คู่กับ pricingMode ด้านล่าง
  priceOptions: z.array(priceOptionSchema).default([]),
  areaRates: z.array(areaRateSchema).default([]),
  unit: serviceUnitSchema,
  estimatedTime: estimatedTimeSchema.optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  addOns: z.array(addOnBindingSchema).default([]),
});

function refinePricingData(
  d: { pricingMode?: "fixed" | "area"; priceOptions?: PriceOptionInput[]; areaRates?: AreaRateInput[] },
  ctx: z.RefinementCtx
) {
  if (d.pricingMode === undefined) return; // update ที่ไม่ได้แตะโหมดราคาเลย ข้ามการเช็คนี้ไป

  if (d.pricingMode === "fixed") {
    if (!d.priceOptions || d.priceOptions.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "กรุณาเพิ่มราคาอย่างน้อย 1 รายการ (ขนาด + สี + ราคา)",
        path: ["priceOptions"],
      });
    } else if (hasDuplicatePriceOptions(d.priceOptions)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "มีขนาด+สีซ้ำกันในรายการราคา กรุณาตรวจสอบ",
        path: ["priceOptions"],
      });
    }
  } else {
    if (!d.areaRates || d.areaRates.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "กรุณาเพิ่มอัตราราคาต่อตารางเมตรอย่างน้อย 1 สี",
        path: ["areaRates"],
      });
    } else if (hasDuplicateAreaRateColors(d.areaRates)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "มีสีซ้ำกันในรายการอัตราราคา กรุณาตรวจสอบ",
        path: ["areaRates"],
      });
    }
  }
}

export const createMainServiceSchema = mainServiceBaseSchema.superRefine(refinePricingData);
export const updateMainServiceSchema = mainServiceBaseSchema.partial().superRefine(refinePricingData);

export type CreateMainServiceInput = z.infer<typeof createMainServiceSchema>;
export type UpdateMainServiceInput = z.infer<typeof updateMainServiceSchema>;

const addOnServiceBaseSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อบริการ").max(100),
  description: z.string().trim().max(500).optional(),
  price: z.number().nonnegative(),
  unit: serviceUnitSchema,
  estimatedTime: estimatedTimeSchema.optional(),
  imageUrl: z.string().url().optional(),
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
