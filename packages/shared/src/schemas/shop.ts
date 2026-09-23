import { z } from "zod";

// ตัด "-" กับช่องว่างออกก่อนเช็คความยาว
const phoneSchema = z
  .string()
  .transform((val) => val.replace(/[\s-]/g, ""))
  .pipe(z.string().min(9, "เบอร์โทรศัพท์ไม่ถูกต้อง").max(10, "เบอร์โทรศัพท์ไม่ถูกต้อง"));

// ค่าเริ่มต้นของการตั้งค่าแจ้งเตือนร้าน = เปิดทุกหมวด — ตรงกับพฤติกรรมจริงของ backend ที่ส่งทุกอย่างเมื่อร้านยังไม่เคยตั้งค่า
// (shops.notification_settings = null) ใช้ค่าชุดนี้ที่เดียวทั้ง backend (utils/notification.ts), หน้าตั้งค่า และ toast listener
// เดิมหน้าเว็บตั้ง default เป็น false เกือบทั้งหมด ทำให้สวิตช์แสดงว่า "ปิด" ทั้งที่จริงได้รับอยู่ และพอกดบันทึกครั้งแรกก็ปิดจริงไปเงียบๆ
export const DEFAULT_NOTIFICATION_SETTINGS = {
  newOrder: true,
  orderUpdate: true,
  chatAndRequests: true,
  closingWarning: true,
  autoShopStatus: true,
  adminUpdates: true,
} as const;

// Schema สำหรับ notification settings
export const notificationSettingsSchema = z.object({
  newOrder: z.boolean().default(DEFAULT_NOTIFICATION_SETTINGS.newOrder),
  orderUpdate: z.boolean().default(DEFAULT_NOTIFICATION_SETTINGS.orderUpdate),
  chatAndRequests: z.boolean().default(DEFAULT_NOTIFICATION_SETTINGS.chatAndRequests),
  closingWarning: z.boolean().default(DEFAULT_NOTIFICATION_SETTINGS.closingWarning),
  autoShopStatus: z.boolean().default(DEFAULT_NOTIFICATION_SETTINGS.autoShopStatus),
  adminUpdates: z.boolean().default(DEFAULT_NOTIFICATION_SETTINGS.adminUpdates),
});

export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;

// notification typeId → สวิตช์ในหน้าตั้งค่าที่ควบคุมมัน (null = แจ้งเตือนสำคัญ ปิดไม่ได้ ส่ง/แสดงเสมอ)
// 1 ออเดอร์ใหม่ | 2 ลูกค้ายกเลิกออเดอร์ | 3 แชท | 4 แอดมินอนุมัติ/ตอบคำร้อง | 5 ประกาศจากแอดมิน
// 6 บัญชีถูกระงับ/ปฏิเสธ/เตือน (ปิดไม่ได้ — ร้านต้องรู้เสมอ) | 7 เตือนก่อนปิดร้าน
// 13 สิ้นสุดปิดชั่วคราว | 14 ร้านเปิดอัตโนมัติ | 15 ร้านปิดอัตโนมัติ | อื่นๆ (8-12 setup reminder, 10 รหัสผ่าน) ปิดไม่ได้
export function notificationSettingKeyForType(typeId: number): keyof NotificationSettings | null {
  switch (typeId) {
    case 1:
      return "newOrder";
    case 2:
      return "orderUpdate";
    case 3:
      return "chatAndRequests";
    case 4:
    case 5:
      return "adminUpdates";
    case 7:
      return "closingWarning";
    case 13:
    case 14:
    case 15:
      return "autoShopStatus";
    default:
      return null;
  }
}

export const updateShopProfileSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อร้านค้า").max(100),
  description: z.string().max(500).optional().or(z.literal("")).nullable(),
  phone: z.union([phoneSchema, z.literal(""), z.null()]).optional(),
  email: z.string().email("อีเมลไม่ถูกต้อง").optional().or(z.literal("")).nullable(),
  facebook: z.string().optional().or(z.literal("")).nullable(),
  lineId: z.string().optional().or(z.literal("")).nullable(),
  socialMedia: z.string().max(300).optional().or(z.literal("")).nullable(), // ช่องทางโซเชียลอื่นๆ ที่กรอกตอนสมัคร — เดิมแก้ภายหลังไม่ได้
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
  notificationSettings: notificationSettingsSchema.optional().nullable(),
});

export type UpdateShopProfileInput = z.infer<typeof updateShopProfileSchema>;

// PATCH /shops/me/delivery-enabled — สวิตช์เปิด/ปิดระบบจัดส่งทั้งร้าน (shops.delivery_enabled)
export const updateShopDeliveryEnabledSchema = z.object({
  deliveryEnabled: z.boolean(),
});

export type UpdateShopDeliveryEnabledInput = z.infer<typeof updateShopDeliveryEnabledSchema>;
