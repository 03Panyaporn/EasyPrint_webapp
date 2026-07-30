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

// ค่าที่ลูกค้าเลือกได้ของตัวเลือกแบบ dropdown/radio/checkbox — number/text ไม่มี values (ลูกค้ากรอกเองอิสระ ไม่มีราคาเพิ่ม)
export const serviceOptionValueSchema = z.object({
  id: z.string().uuid().optional(), // ไม่มีตอนกำลังกรอกในฟอร์ม แต่มีเสมอตอนดึงจาก backend จริง
  name: z.string().trim().min(1, "กรุณากรอกชื่อค่าตัวเลือก").max(100),
  extraPrice: z.number().nonnegative("ราคาเพิ่มต้องเป็น 0 บาทขึ้นไป ไม่ติดลบ"),
});
export type ServiceOptionValueInput = z.infer<typeof serviceOptionValueSchema>;

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

export const createMainServiceSchema = mainServiceObjectSchema.superRefine(refineNoDuplicateOptionNames);
export const updateMainServiceSchema = mainServiceObjectSchema.partial().superRefine(refineNoDuplicateOptionNames);

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
