import { z } from "zod";

// สคีมานี้ใช้ทั้งฝั่ง apps/web (ตอน validate ฟอร์ม) และ apps/api (ตอน validate ก่อนบันทึก DB)
// แก้ที่นี่ที่เดียว ทั้งสองฝั่งจะตรวจสอบข้อมูลตรงกันเสมอ

export const registerSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
  firstname: z.string().min(1, "กรุณากรอกชื่อ"),
  lastname: z.string().min(1, "กรุณากรอกนามสกุล"),
  phone: z.string().min(9, "เบอร์โทรศัพท์ไม่ถูกต้อง").max(10, "เบอร์โทรศัพท์ไม่ถูกต้อง"),
  address: z.string().max(500).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
  rememberMe: z.boolean().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "ไม่พบ token"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ตรงกับตัวเลือก "ประเภทร้านค้า" ใน apps/web/app/(auth)/register/shop-register/page.tsx — แก้ที่นี่ที่เดียว หน้าเว็บ import ไปใช้
export const shopTypeSchema = z.enum([
  "ร้านถ่ายเอกสารทั่วไป",
  "ร้านพรินต์สี / กราฟิก",
  "ร้านเข้าเล่ม / ทำสปิไรล์",
  "ร้านปริ้นต์ขนาดใหญ่ (A0/A1)",
  "ร้านสติ๊กเกอร์ / ป้าย",
  "ร้านครบวงจร",
]);
export const SHOP_TYPES = shopTypeSchema.options;

const phoneSchema = z.string().min(9, "เบอร์โทรศัพท์ไม่ถูกต้อง").max(10, "เบอร์โทรศัพท์ไม่ถูกต้อง");

export const registerShopSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
  firstname: z.string().min(1, "กรุณากรอกชื่อเจ้าของร้าน"),
  lastname: z.string().min(1, "กรุณากรอกนามสกุลเจ้าของร้าน"),
  shopName: z.string().min(1, "กรุณากรอกชื่อร้านค้า").max(100),
  phone: phoneSchema,
  shopType: shopTypeSchema,
  houseNo: z.string().min(1, "กรุณากรอกบ้านเลขที่"),
  village: z.string().optional(),
  street: z.string().optional(),
  subdistrict: z.string().min(1, "กรุณากรอกตำบล/แขวง"),
  district: z.string().min(1, "กรุณากรอกอำเภอ/เขต"),
  province: z.string().min(1, "กรุณาเลือกจังหวัด"),
  postcode: z.string().regex(/^\d{5}$/, "รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก"),
  googleMapLink: z.string().url("ลิงก์ไม่ถูกต้อง"),
  // อัปโหลดผ่าน POST /uploads ก่อนแล้วค่อยส่งผลลัพธ์มาที่นี่
  // shopPhotoUrl = public URL จาก bucket "shop-photos" (Supabase คืน URL เต็มให้)
  // idCardUrl = storage path จาก bucket "id-cards" (bucket private ไม่มี public URL ตรงๆ ไม่ใช่ URL จริง แค่ path)
  idCardUrl: z.string().min(1, "กรุณาอัปโหลดรูปบัตรประชาชน"),
  shopPhotoUrl: z.string().url("กรุณาอัปโหลดรูปภาพร้านค้า"),
  socialMedia: z.string().min(1, "กรุณากรอกช่องทาง Social Media"),
  openingHours: z.any().optional(),
});

export type RegisterShopInput = z.infer<typeof registerShopSchema>;
