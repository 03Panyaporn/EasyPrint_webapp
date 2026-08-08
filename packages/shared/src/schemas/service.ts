import { z } from "zod";

// สคีมานี้ใช้ทั้งฝั่ง apps/web (ตอน validate ฟอร์มหน้า /shop/services) และ apps/api (ตอน validate ก่อนบันทึก DB)
// แก้ที่นี่ที่เดียว ทั้งสองฝั่งจะตรวจสอบข้อมูลตรงกันเสมอ

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

// วิธีคิดราคาพื้นฐาน — ดู comment เต็มที่ apps/api/drizzle/schema.ts pricingModelEnum
export const pricingModelSchema = z.enum(["per_page", "per_piece", "per_sqm", "fixed"]);

export const allowedFileTypeSchema = z.enum(["pdf", "jpg", "png", "ai", "psd"]);

// ตัวเลือกบริการ (service option) ที่ร้านค้าสร้างเองได้ไม่จำกัด เช่น "ประเภทกระดาษ", "สี", "วัสดุ"
export const serviceOptionTypeSchema = z.enum(["dropdown", "radio", "checkbox", "number", "text"]);

// หมวดราคาของ Option — 1 หมวดมีได้แค่ 1 Option ต่อบริการ (ยกเว้น "other") กันสร้าง Option ซ้ำซ้อนกันโดยไม่ตั้งใจ (สเปก §4.4)
// 'color' ไม่อยู่ใน enum นี้โดยเจตนา — ห้ามสร้าง Option เกี่ยวกับสีเด็ดขาด สีอยู่ที่ colorTiers ของบริการเพียงจุดเดียว (ดู colorTierSchema)
export const optionPriceCategorySchema = z.enum(["paper", "printing_side", "size", "other"]);

// ขอบเขตการคูณราคาเพิ่ม — ใช้ทั้งกับ OptionValue.priceScope และ AddOnService.scope
export const priceScopeSchema = z.enum(["per_item", "per_page", "per_piece", "per_sqm"]);

// วิธีนับหน้าเมื่อ pricingModel = per_page: by_file_page = นับหน้าไฟล์ตรงๆ, by_sheet = ปัดขึ้นครึ่งหนึ่ง (พิมพ์สองหน้า)
export const pageCountingModeSchema = z.enum(["by_file_page", "by_sheet"]);

// price_scope ที่อนุญาตให้ OptionValue ใช้ได้ ตาม pricingModel ของบริการ (สเปก §4.3) — ต้องตรงกับ apps/api/src/pricing/engine.ts
export const ALLOWED_PRICE_SCOPES_BY_PRICING_MODEL: Record<z.infer<typeof pricingModelSchema>, z.infer<typeof priceScopeSchema>[]> = {
  per_page: ["per_page", "per_item"],
  per_piece: ["per_piece", "per_item"],
  per_sqm: ["per_sqm", "per_item"],
  fixed: ["per_item"],
};

// ค่าที่ลูกค้าเลือกได้ของตัวเลือกแบบ dropdown/radio/checkbox — number/text ไม่มี values (ลูกค้ากรอกเองอิสระ ไม่มีราคาเพิ่ม)
export const serviceOptionValueSchema = z.object({
  id: z.string().uuid().optional(), // ไม่มีตอนกำลังกรอกในฟอร์ม แต่มีเสมอตอนดึงจาก backend จริง
  name: z.string().trim().min(1, "กรุณากรอกชื่อค่าตัวเลือก").max(100),
  extraPrice: z.number().nonnegative("ราคาเพิ่มต้องเป็น 0 บาทขึ้นไป ไม่ติดลบ"),
  priceScope: priceScopeSchema.default("per_item"),
});
export type ServiceOptionValueInput = z.infer<typeof serviceOptionValueSchema>;

// ระดับราคาตามสีของบริการ — เป็นส่วนหนึ่งของ Base Pricing ไม่ใช่ Option (ดู optionPriceCategorySchema ด้านบน)
// pricePerUnit เป็นราคาต่อหน่วยแบบเบ็ดเสร็จ ไม่บวกกับ basePrice — "ขาวดำ" ไม่มีแถวของตัวเอง เพราะใช้ basePrice ของบริการตรงๆ
export const colorTierSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(1, "กรุณากรอกชื่อระดับสี").max(100),
  pricePerUnit: z.number().nonnegative("ราคาต้องเป็น 0 บาทขึ้นไป ไม่ติดลบ"),
});
export type ColorTierInput = z.infer<typeof colorTierSchema>;

// ราคาต่อหน่วยแบบขั้นบันไดตามจำนวน ใช้กับ pricingModel = per_piece เท่านั้น — ช่วงห้ามทับกัน (ตรวจใน superRefine ด้านล่าง)
export const quantityTierSchema = z.object({
  id: z.string().uuid().optional(),
  minQty: z.number().int().positive("จำนวนขั้นต่ำต้องเป็นจำนวนเต็มบวก"),
  maxQty: z.number().int().positive().nullable().optional(), // null/undefined = ไม่จำกัด
  unitPrice: z.number().positive("ราคาต้องมากกว่า 0 บาท"), // ขั้นบันไดราคาต้องมีราคาจริง ต่างจาก OptionValue/ColorTier ที่ 0 ได้ (เช่น ราคาพื้นฐานฟรี)
});
export type QuantityTierInput = z.infer<typeof quantityTierSchema>;

function hasDuplicateNames(items: { name: string }[]) {
  const seen = new Set<string>();
  for (const i of items) {
    const key = i.name.trim().toLowerCase();
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

export const serviceOptionSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1, "กรุณากรอกชื่อตัวเลือก").max(100),
    type: serviceOptionTypeSchema,
    // หมวดราคา ใช้กันสร้าง Option ซ้ำซ้อนกันในหมวดเดียวกัน (ดู refineNoDuplicatePriceCategory ด้านล่าง) — default "other" ไม่ถูกจำกัด
    priceCategory: optionPriceCategorySchema.default("other"),
    // ใช้กับ type = dropdown/radio/checkbox เท่านั้น — number/text ต้องเป็น array ว่าง
    values: z.array(serviceOptionValueSchema).default([]),
  })
  .superRefine((d, ctx) => {
    // checkbox = toggle เดียว (เช่น "พิมพ์ 2 หน้า +10 บาท") จึงบังคับมีค่าเดียวพอดี — เก็บได้ 1 แถวต่อ 1 ตัวเลือกในตะกร้า (ไม่รองรับ multi-select)
    if (d.type === "checkbox") {
      if (d.values.length !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `ตัวเลือกแบบ checkbox "${d.name || "-"}" ต้องมีค่าเดียวพอดี (ราคาเพิ่มตอนติ๊กเลือก)`,
          path: ["values"],
        });
      }
      return;
    }
    const needsValues = d.type === "dropdown" || d.type === "radio";
    if (needsValues) {
      if (d.values.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `ตัวเลือก "${d.name || "-"}" ต้องมีค่าให้เลือกอย่างน้อย 1 รายการ`,
          path: ["values"],
        });
      } else if (hasDuplicateNames(d.values)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `ตัวเลือก "${d.name || "-"}" มีชื่อค่าซ้ำกัน กรุณาตรวจสอบ`,
          path: ["values"],
        });
      }
    } else if (d.values.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `ตัวเลือกแบบ "${d.type}" ไม่ต้องมีรายการค่า (ลูกค้ากรอกเองอิสระ)`,
        path: ["values"],
      });
    }
  });
export type ServiceOptionInput = z.infer<typeof serviceOptionSchema>;

const mainServiceObjectSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อบริการ").max(100),
  description: z.string().trim().max(500).optional(),
  pricingModel: pricingModelSchema.default("fixed"),
  basePrice: z.number().nonnegative("ราคาต้องเป็น 0 บาทขึ้นไป ไม่ติดลบ"),
  requiresFileUpload: z.boolean().default(true),
  allowedFileTypes: z.array(allowedFileTypeSchema).default(["pdf", "jpg", "png"]),
  options: z.array(serviceOptionSchema).default([]),
  colorTiers: z.array(colorTierSchema).default([]),
  quantityTiers: z.array(quantityTierSchema).default([]), // ใช้เมื่อ pricingModel = per_piece เท่านั้น
  pageCountingMode: pageCountingModeSchema.default("by_file_page"), // ใช้เมื่อ pricingModel = per_page เท่านั้น
  minArea: z.number().positive("พื้นที่ขั้นต่ำต้องมากกว่า 0").optional(), // ใช้เมื่อ pricingModel = per_sqm เท่านั้น
  areaRoundingIncrement: z.number().positive("หน่วยปัดขึ้นต้องมากกว่า 0").default(0.1), // ใช้เมื่อ pricingModel = per_sqm เท่านั้น
  unit: serviceUnitSchema,
  estimatedTime: estimatedTimeSchema.optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  addOns: z.array(addOnBindingSchema).default([]),
});

function refineNoDuplicateOptionNames(d: { options?: ServiceOptionInput[] }, ctx: z.RefinementCtx) {
  if (d.options && hasDuplicateNames(d.options)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "มีชื่อตัวเลือกซ้ำกันในบริการนี้ กรุณาตรวจสอบ",
      path: ["options"],
    });
  }
}

// สเปก §4.4: 1 price_category (ยกเว้น "other") มีได้แค่ 1 Option ต่อบริการ — กันสร้าง Option ที่ทำหน้าที่ซ้ำกัน (มิเรอร์ DB unique index)
function refineNoDuplicatePriceCategory(d: { options?: ServiceOptionInput[] }, ctx: z.RefinementCtx) {
  if (!d.options) return;
  const seen = new Set<string>();
  for (const opt of d.options) {
    if (opt.priceCategory === "other") continue;
    if (seen.has(opt.priceCategory)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `มีตัวเลือกมากกว่า 1 รายการที่ใช้หมวดราคาเดียวกัน — กรุณาเพิ่มเป็นค่าใหม่ใต้ตัวเลือกเดิมแทนการสร้างตัวเลือกใหม่`,
        path: ["options"],
      });
      return;
    }
    seen.add(opt.priceCategory);
  }
}

// สเปก §4.3: price_scope ของ OptionValue ต้องอยู่ใน allow-list ตาม pricingModel ของบริการนี้
function refinePriceScopeAllowList(
  d: { pricingModel?: z.infer<typeof pricingModelSchema>; options?: ServiceOptionInput[] },
  ctx: z.RefinementCtx
) {
  if (!d.pricingModel || !d.options) return;
  const allowed = ALLOWED_PRICE_SCOPES_BY_PRICING_MODEL[d.pricingModel];
  d.options.forEach((opt, optIdx) => {
    opt.values.forEach((val, valIdx) => {
      if (!allowed.includes(val.priceScope)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `ขอบเขตราคา "${val.priceScope}" ใช้กับบริการแบบ "${d.pricingModel}" ไม่ได้ (ใช้ได้แค่ ${allowed.join(", ")})`,
          path: ["options", optIdx, "values", valIdx, "priceScope"],
        });
      }
    });
  });
}

// QuantityTier ranges ห้ามทับกันภายในบริการเดียวกัน (เฉพาะ pricingModel = per_piece)
function refineQuantityTierOverlap(
  d: { pricingModel?: z.infer<typeof pricingModelSchema>; quantityTiers?: QuantityTierInput[] },
  ctx: z.RefinementCtx
) {
  if (d.pricingModel !== "per_piece" || !d.quantityTiers || d.quantityTiers.length < 2) return;
  const sorted = [...d.quantityTiers].sort((a, b) => a.minQty - b.minQty);
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    if (prev.maxQty == null || cur.minQty <= prev.maxQty) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ช่วงจำนวนของราคาขั้นบันได (Quantity Tier) ห้ามทับซ้อนกัน กรุณาตรวจสอบ",
        path: ["quantityTiers"],
      });
      return;
    }
  }
}

function refineMainService(
  d: {
    options?: ServiceOptionInput[];
    quantityTiers?: QuantityTierInput[];
    pricingModel?: z.infer<typeof pricingModelSchema>;
  },
  ctx: z.RefinementCtx
) {
  refineNoDuplicateOptionNames(d, ctx);
  refineNoDuplicatePriceCategory(d, ctx);
  refinePriceScopeAllowList(d, ctx);
  refineQuantityTierOverlap(d, ctx);
}

export const createMainServiceSchema = mainServiceObjectSchema.superRefine(refineMainService);
export const updateMainServiceSchema = mainServiceObjectSchema.partial().superRefine(refineMainService);

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
