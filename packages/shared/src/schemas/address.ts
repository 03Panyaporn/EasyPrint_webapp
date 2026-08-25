import { z } from "zod";

// POST /addresses และ PUT /addresses/:id — จำกัดเฉพาะฟิลด์ที่ลูกค้าแก้ไขได้เอง
// ห้ามมี userId/id ปนมาด้วยเด็ดขาด กันลูกค้าสวมสิทธิ์โอนที่อยู่ไปเป็นของ user คนอื่น (mass assignment)
export const addressInputSchema = z.object({
  receiverName: z.string().trim().min(1, "กรุณากรอกชื่อผู้รับ").max(200),
  phone: z.string().trim().min(1, "กรุณากรอกเบอร์โทรศัพท์").max(20),
  address: z.string().trim().min(1, "กรุณากรอกที่อยู่").max(500),
  subdistrict: z.string().trim().min(1, "กรุณากรอกตำบล/แขวง").max(100),
  district: z.string().trim().min(1, "กรุณากรอกอำเภอ/เขต").max(100),
  province: z.string().trim().min(1, "กรุณากรอกจังหวัด").max(100),
  postalCode: z.string().trim().min(1, "กรุณากรอกรหัสไปรษณีย์").max(10),
  label: z.string().trim().min(1).max(50).optional(),
  isDefault: z.boolean().optional(),
});
export type AddressInput = z.infer<typeof addressInputSchema>;

// PUT ยอมให้ส่งมาเฉพาะบางฟิลด์ได้ (partial update) แต่ยังคงห้าม userId/id เหมือนเดิม
export const addressUpdateSchema = addressInputSchema.partial();
export type AddressUpdateInput = z.infer<typeof addressUpdateSchema>;
