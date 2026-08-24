import { z } from "zod";

// ตัด "-" กับช่องว่างออกก่อนเช็คความยาว
const phoneSchema = z
  .string()
  .transform((val) => val.replace(/[\s-]/g, ""))
  .pipe(z.string().min(9, "เบอร์โทรศัพท์ไม่ถูกต้อง").max(10, "เบอร์โทรศัพท์ไม่ถูกต้อง"));

export const updateShopProfileSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อร้านค้า").max(100),
  description: z.string().max(500).optional().or(z.literal("")).nullable(),
  phone: z.union([phoneSchema, z.literal(""), z.null()]).optional(),
  email: z.string().email("อีเมลไม่ถูกต้อง").optional().or(z.literal("")).nullable(),
  facebook: z.string().optional().or(z.literal("")).nullable(),
  lineId: z.string().optional().or(z.literal("")).nullable(),
  shopPhotoUrl: z.string().url("ลิงก์รูปภาพไม่ถูกต้อง").optional().or(z.literal("")).nullable(),
  
  // Address section
  address: z.string().optional().or(z.literal("")).nullable(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  googleMapLink: z.string().optional().or(z.literal("")).nullable(),
  
  // Opening hours
  openingHours: z.any().optional(),
  
  // Temporary closing
  tempCloseStart: z.string().optional().or(z.literal("")).nullable(),
  tempCloseEnd: z.string().optional().or(z.literal("")).nullable(),
  tempCloseReason: z.string().optional().or(z.literal("")).nullable(),
  
  // Payment Settings
  bankAccountName: z.string().optional().or(z.literal("")).nullable(),
  bankName: z.string().optional().or(z.literal("")).nullable(),
  bankAccountNumber: z.string().optional().or(z.literal("")).nullable(),
  promptpayNumber: z.string().optional().or(z.literal("")).nullable(),
  promptpayQrUrl: z.string().url("ลิงก์ QR Code ไม่ถูกต้อง").optional().or(z.literal("")).nullable(),
  
  // Notification Settings
  notificationSettings: z.any().optional(),
});

export type UpdateShopProfileInput = z.infer<typeof updateShopProfileSchema>;
