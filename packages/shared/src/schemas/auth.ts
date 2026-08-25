import { z } from "zod";

// สคีมานี้ใช้ทั้งฝั่ง apps/web (ตอน validate ฟอร์ม) และ apps/api (ตอน validate ก่อนบันทึก DB)
// แก้ที่นี่ที่เดียว ทั้งสองฝั่งจะตรวจสอบข้อมูลตรงกันเสมอ

// ตัด "-" กับช่องว่างออกก่อนเช็คความยาว เพราะฟอร์ม (placeholder "0XX-XXX-XXXX") ยอมให้ผู้ใช้พิมพ์เบอร์แบบมีขีดได้
// ถ้าไม่ตัดก่อน ค่าที่มีขีดจะยาวเกิน 10 ตัวอักษรและไม่ผ่าน validation ทั้งที่เป็นเบอร์ที่ถูกต้อง
export const phoneSchema = z
  .string()
  .transform((val) => val.replace(/[\s-]/g, ""))
  .pipe(z.string().min(9, "เบอร์โทรศัพท์ไม่ถูกต้อง").max(10, "เบอร์โทรศัพท์ไม่ถูกต้อง"));

export const registerSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
  firstname: z.string().min(1, "กรุณากรอกชื่อ"),
  lastname: z.string().min(1, "กรุณากรอกนามสกุล"),
  phone: phoneSchema,
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

// ใช้ตอนผู้ใช้ล็อกอินอยู่แล้วขอเปลี่ยนรหัสผ่านเอง (ต่างจาก reset-password ที่ใช้ token จากอีเมลตอนลืมรหัสผ่าน)
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "กรุณากรอกรหัสผ่านปัจจุบัน"),
  newPassword: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const changeEmailSchema = z.object({
  newEmail: z.string().email("อีเมลไม่ถูกต้อง"),
  currentPassword: z.string().min(1, "กรุณากรอกรหัสผ่านปัจจุบัน"),
});

export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;

export const deleteAccountSchema = z.object({
  currentPassword: z.string().min(1, "กรุณากรอกรหัสผ่านปัจจุบัน"),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

// ใช้ตอนผู้ใช้ (ลูกค้า/ร้านค้า) แก้ไขชื่อ-นามสกุล/เบอร์โทรของตัวเองในหน้าโปรไฟล์ — ไม่รวมอีเมล/รหัสผ่านเพราะมี flow แยก
// ที่ต้องยืนยันด้วยรหัสผ่านปัจจุบันก่อน (ดู changeEmailSchema/changePasswordSchema ด้านบน)
export const updateProfileSchema = z.object({
  firstname: z.string().trim().min(1, "กรุณากรอกชื่อ").max(100),
  lastname: z.string().trim().min(1, "กรุณากรอกนามสกุล").max(100),
  phone: phoneSchema,
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ตรงกับตัวเลือก "บริการของร้าน" ใน apps/web/app/(auth)/register/shop-register/page.tsx — แก้ที่นี่ที่เดียว หน้าเว็บ import ไปใช้
// เลือกได้หลายรายการ (checkbox) แทนที่ dropdown "ประเภทร้านค้า" แบบเดิมที่เลือกได้ทีละ 1
export const shopServiceTypeSchema = z.enum([
  "ถ่ายเอกสาร",
  "ปริ้นเอกสารขาวดำ",
  "ปริ้นเอกสารสี",
  "สแกนเอกสาร",
  "เข้าเล่ม (สันกาว / สันห่วง / สันเกลียว)",
  "เคลือบเอกสาร",
  "ตัดกระดาษ",
  "เจาะรู",
  "เย็บเอกสาร",
  "พิมพ์แบบแปลน",
  "พิมพ์โปสเตอร์",
  "พิมพ์ไวนิล / แบนเนอร์",
  "พิมพ์สติ๊กเกอร์",
  "นามบัตร",
  "ใบปลิว / โบรชัวร์",
  "อื่น ๆ",
]);
export const SHOP_SERVICE_TYPES = shopServiceTypeSchema.options;

// "วิธีรับสินค้า" ตอนสมัครร้าน — เลือกได้หลายรายการเช่นกัน
export const shopDeliveryMethodSchema = z.enum(["รับที่หน้าร้าน", "จัดส่งโดยร้าน"]);
export const SHOP_DELIVERY_METHODS = shopDeliveryMethodSchema.options;

export const registerShopSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
  firstname: z.string().min(1, "กรุณากรอกชื่อเจ้าของร้าน"),
  lastname: z.string().min(1, "กรุณากรอกนามสกุลเจ้าของร้าน"),
  shopName: z.string().min(1, "กรุณากรอกชื่อร้านค้า").max(100),
  phone: phoneSchema,
  serviceTypes: z.array(shopServiceTypeSchema).min(1, "กรุณาเลือกบริการของร้านอย่างน้อย 1 รายการ"),
  deliveryMethods: z.array(shopDeliveryMethodSchema).min(1, "กรุณาเลือกวิธีรับสินค้าอย่างน้อย 1 รายการ"),
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
  socialMedia: z.string().optional(),
  openingHours: z.any().optional(),
});

export type RegisterShopInput = z.infer<typeof registerShopSchema>;
