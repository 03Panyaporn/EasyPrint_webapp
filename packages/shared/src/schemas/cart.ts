import { z } from "zod";

// สคีมานี้ใช้ทั้งฝั่ง apps/web (ตอน validate ฟอร์มเพิ่มลงตะกร้า) และ apps/api (ตอน validate ก่อนบันทึก DB)

// ขอบเขตกว้าง/สูงของงานแบบ "ตามพื้นที่" — กันตัวเลขติดลบ/ใหญ่เกินจริง (1 ซม. - 10 เมตร)
const areaDimensionSchema = z.number().positive().max(1000, "ขนาดต้องไม่เกิน 1000 ซม. (10 เมตร)");

// ค่าที่ลูกค้าเลือก/กรอกของ 1 ตัวเลือกบริการ (service option) — ตรวจสอบคู่กับ type จริงของ optionId ฝั่ง route
// (ไม่ทำใน schema เพราะต้อง query DB ว่า option นี้เป็น type อะไร คล้ายรูปแบบเดิมที่ cross-check priceOptionId/areaColor ฝั่ง route)
//   dropdown/radio → valueId บังคับมีค่า (เลือกได้ 1 ค่า)
//   checkbox       → valueId มีค่า = ติ๊กเลือก, ไม่ส่ง entry นี้มาเลย = ไม่ติ๊ก (ไม่บังคับ)
//   number/text    → textValue บังคับมีค่า (number ก็ส่งเป็น string ตัวเลข), ไม่มีผลต่อราคา
export const cartOptionSelectionSchema = z.object({
  optionId: z.string().uuid(),
  valueId: z.string().uuid().optional(),
  textValue: z.string().trim().max(500).optional(),
});
export type CartOptionSelectionInput = z.infer<typeof cartOptionSelectionSchema>;

// ⚠️ ไม่มี field pageCount ในสคีมานี้เลยโดยตั้งใจ — จำนวนหน้า (pricingModel = per_page) server นับเองจากไฟล์จริงเสมอ ไม่รับค่าจาก client
const cartItemBaseSchema = z.object({
  mainServiceId: z.string().uuid(),
  colorTierId: z.string().uuid().optional(), // ระดับสีที่เลือก — ไม่ส่ง/undefined = ใช้ราคาขาวดำ (basePrice) หรือบริการนี้ไม่มีตัวเลือกสี
  widthCm: areaDimensionSchema.optional(), // ใช้เมื่อ pricingModel ของบริการ = "per_sqm" เท่านั้น
  heightCm: areaDimensionSchema.optional(),
  optionSelections: z.array(cartOptionSelectionSchema).default([]),
  addOnIds: z.array(z.string().uuid()).default([]),
  quantity: z.number().int().positive().max(1000, "จำนวนต้องไม่เกิน 1000"),
  fileUrl: z.string().min(1, "กรุณาอัปโหลดไฟล์งานพิมพ์").optional(),
  note: z.string().trim().max(500).optional(),
});

export const addCartItemSchema = cartItemBaseSchema;
export const updateCartItemSchema = cartItemBaseSchema;

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

export const setCartDeliveryOptionSchema = z.object({
  deliveryOptionId: z.string().uuid().nullable(),
});
export type SetCartDeliveryOptionInput = z.infer<typeof setCartDeliveryOptionSchema>;

// ข้อมูลที่ลูกค้าส่งมาตอน checkout — ใช้ validate ที่ API ก่อน convert ตะกร้า → Order + OrderItems
export const checkoutSchema = z.object({
  slipUrl: z.string().min(1, "กรุณาแนบหลักฐานการชำระเงิน"), // storage path จาก bucket private "payment-slips"
  deliveryMethod: z.enum(["shop_delivery", "self_pickup"]),
  deliveryAddress: z.string().trim().max(500).optional(), // ต้องมีค่าเมื่อ deliveryMethod = shop_delivery
  note: z.string().trim().max(500).optional(), // โน้ตรวมทั้ง order (ต่างจาก note ของแต่ละ cart item)
}).superRefine((d, ctx) => {
  if (d.deliveryMethod === "shop_delivery" && !d.deliveryAddress) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "กรุณาระบุที่อยู่สำหรับจัดส่ง",
      path: ["deliveryAddress"],
    });
  }
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;
