export interface AddOnPriceBinding {
  addOnId: string;
  extraPrice: number;
}

// วิธีคิดราคาพื้นฐาน — ดู comment เต็มที่ apps/api/drizzle/schema.ts pricingModelEnum
export type PricingModel = "per_page" | "per_piece" | "per_sqm" | "fixed";

export type ServiceOptionType = "dropdown" | "radio" | "checkbox" | "number" | "text";

export type AllowedFileType = "pdf" | "jpg" | "png" | "ai" | "psd";

// หมวดราคาของ Option — 1 หมวดมีได้แค่ 1 Option ต่อบริการ (ยกเว้น "other") — 'color' ไม่อยู่ใน enum นี้โดยเจตนา สีอยู่ที่ ColorTier เท่านั้น
export type OptionPriceCategory = "paper" | "printing_side" | "size" | "other";

// ขอบเขตการคูณราคาเพิ่ม — ใช้ทั้งกับ ServiceOptionValue.priceScope และ AddOnService.scope
export type PriceScope = "per_item" | "per_page" | "per_piece" | "per_sqm";

export type PageCountingMode = "by_file_page" | "by_sheet";

// price_scope ที่อนุญาตให้ใช้ได้ ตาม pricingModel ของบริการ (สเปก §4.3)
export const ALLOWED_PRICE_SCOPES_BY_PRICING_MODEL: Record<PricingModel, PriceScope[]> = {
  per_page: ["per_page", "per_item"],
  per_piece: ["per_piece", "per_item"],
  per_sqm: ["per_sqm", "per_item"],
  fixed: ["per_item"],
};

export interface ServiceOptionValue {
  id?: string; // ไม่มีตอนกำลังกรอกในฟอร์ม แต่มีเสมอตอนดึงจาก backend จริง — ลูกค้าใช้ id นี้ตอนเพิ่มลงตะกร้า
  name: string;
  extraPrice: number; // ห้ามติดลบ
  priceScope: PriceScope;
}

export interface ServiceOption {
  id?: string;
  name: string;
  type: ServiceOptionType;
  priceCategory: OptionPriceCategory;
  // ใช้กับ type = dropdown/radio/checkbox เท่านั้น — number/text ต้องเป็น array ว่าง (ลูกค้ากรอกเอง ไม่มีราคาเพิ่ม)
  values: ServiceOptionValue[];
}

// ระดับราคาตามสี — เป็นส่วนหนึ่งของ Base Pricing ไม่ใช่ Option "ขาวดำ" ไม่มีแถวของตัวเอง เพราะใช้ basePrice ของบริการตรงๆ
export interface ColorTier {
  id?: string;
  label: string;
  pricePerUnit: number;
}

// ราคาต่อหน่วยแบบขั้นบันไดตามจำนวน ใช้กับ pricingModel = per_piece เท่านั้น
export interface QuantityTier {
  id?: string;
  minQty: number;
  maxQty?: number | null; // null/undefined = ไม่จำกัด
  unitPrice: number;
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
  colorTiers: ColorTier[];
  quantityTiers: QuantityTier[]; // ใช้เมื่อ pricingModel = per_piece เท่านั้น
  pageCountingMode: PageCountingMode; // ใช้เมื่อ pricingModel = per_page เท่านั้น
  minArea?: number; // ใช้เมื่อ pricingModel = per_sqm เท่านั้น
  areaRoundingIncrement: number; // ใช้เมื่อ pricingModel = per_sqm เท่านั้น
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
  scope: PriceScope; // ขอบเขตการคิดราคาเพิ่ม — ใช้แสดง label ในหน้าสั่งพิมพ์
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
