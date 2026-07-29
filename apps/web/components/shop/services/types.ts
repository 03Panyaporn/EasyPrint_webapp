export interface AddOnPriceBinding {
  addOnId: string;
  extraPrice: number;
}

export interface PriceOption {
  paperSize: string; // เช่น "A4", "A3" หรือขนาดกำหนดเองที่ร้านค้าพิมพ์เอง เช่น "B5"
  color: string; // "ขาวดำ" | "สี"
  price: number;
}

export interface AreaRate {
  color: string; // "ขาวดำ" | "สี"
  ratePerSqm: number; // บาทต่อตารางเมตร — ลูกค้ากรอกกว้าง/สูงเองตอนสั่งซื้อ ราคารวม = กว้าง x สูง x ratePerSqm
}

export type MainServicePricingMode = "fixed" | "area";

export interface MainService {
  id: string;
  name: string;
  description?: string;
  pricingMode: MainServicePricingMode;
  priceOptions: PriceOption[]; // ใช้เมื่อ pricingMode = "fixed" — ราคาแยกตาม ขนาด x สี มีได้หลายรายการ
  areaRates: AreaRate[]; // ใช้เมื่อ pricingMode = "area" — อัตราต่อตร.ม. แยกตามสี
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
