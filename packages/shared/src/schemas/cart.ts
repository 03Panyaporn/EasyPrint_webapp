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

// POST /shops/:shopId/cart/checkout — deliveryAddress บังคับกรอกเฉพาะตอนตะกร้ามี deliveryOption เลือกไว้แล้วเท่านั้น
// (เช็คฝั่ง route เพราะ schema เองไม่รู้สถานะตะกร้า) ไม่รับ deliveryMethod จาก client เลย — ยึดตาม cart.deliveryOptionId เท่านั้นกัน tampering
export const checkoutCartSchema = z.object({
  slipUrl: z.string().min(1, "กรุณาแนบสลิปการโอนเงิน"), // storage path จาก bucket private "payment-slips"
  deliveryAddress: z.string().trim().min(1).optional(),
});
export type CheckoutCartInput = z.infer<typeof checkoutCartSchema>;
