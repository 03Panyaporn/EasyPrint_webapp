export interface AddOnPriceBinding {
  addOnId: string;
  extraPrice: number;
}

export interface MainService {
  id: string;
  name: string;
  description?: string;
  paperSizes: string[]; // e.g., ["A4"], ["A4", "A3"], etc.
  customPaperSize?: string;
  colors: string[]; // e.g., ["ขาวดำ"], ["สี"], ["ขาวดำ", "สี"]
  price: number;
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
