export interface AddOnPriceBinding {
  addOnId: string;
  extraPrice: number;
}

// วิธีคิดราคาพื้นฐาน — ดู comment เต็มที่ apps/api/drizzle/schema.ts pricingModelEnum
export type PricingModel = "per_page" | "per_piece" | "per_sqm" | "fixed";

export type ServiceOptionType = "dropdown" | "radio" | "checkbox" | "number" | "text";

export type AllowedFileType = "pdf" | "jpg" | "png" | "ai" | "psd";

export interface ServiceOptionValue {
  id?: string; // ไม่มีตอนกำลังกรอกในฟอร์ม แต่มีเสมอตอนดึงจาก backend จริง — ลูกค้าใช้ id นี้ตอนเพิ่มลงตะกร้า
  name: string;
  extraPrice: number; // ห้ามติดลบ
}

export interface ServiceOption {
  id?: string;
  name: string;
  type: ServiceOptionType;
  // ใช้กับ type = dropdown/radio/checkbox เท่านั้น — number/text ต้องเป็น array ว่าง (ลูกค้ากรอกเอง ไม่มีราคาเพิ่ม)
  values: ServiceOptionValue[];
}

export interface MainService {
  id: string;
  name: string;
  description?: string;
  pricingModel: PricingModel;
  basePrice: number;
  requiresFileUpload: boolean;
  allowedFileTypes: AllowedFileType[];
  options: ServiceOption[];
  unit: string; // e.g., "แผ่น", "เล่ม", "ชิ้น", "หน้า", "งาน"
  estimatedTime?: string; // e.g., "5 นาที", "30 นาที"
  availableAddOns: AddOnPriceBinding[];
  imageUrl?: string;
  isActive: boolean;
}

export interface AddOnService {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit: string; // e.g., "เล่ม", "แผ่น", "ชิ้น"
  estimatedTime?: string; // e.g., "10 นาที"
  imageUrl?: string;
  isActive: boolean;
}

export interface DeliveryOption {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  isActive: boolean;
  baseFee: number;
  freeShippingThreshold?: number; // e.g., 500 = ฟรีเมื่อสั่งครบ 500 บาท
}

export type ServiceTypeTab = "main" | "addon" | "delivery";
