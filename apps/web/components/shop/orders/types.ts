export type OrderStatus =
  | "pending_review" // รอตรวจสอบ
  | "accepted" // รับงานแล้ว
  | "in_progress" // กำลังดำเนินการ
  | "shipping" // กำลังจัดส่ง
  | "completed" // เสร็จสิ้น
  | "cancelled"; // ยกเลิก

export type CancelReason =
  | "customer_request" // ลูกค้าขอยกเลิก
  | "invalid_payment_slip" // หลักฐานการชำระเงินไม่ถูกต้อง/ไม่ชัดเจน
  | "amount_mismatch" // ยอดโอนไม่ตรงกับยอดสั่งซื้อ
  | "no_transfer_found" // ไม่พบรายการโอนเงินจริง
  | "invalid_file" // ไฟล์งานไม่ถูกต้อง/เสียหาย
  | "shop_unavailable" // ร้านไม่สามารถให้บริการได้ตามคำขอ
  | "other"; // อื่นๆ

export type CancelModalMode = "cancel" | "reject_payment";

export interface OrderFileAttachment {
  name: string;
  sizeLabel: string; // e.g. "2.4 MB"
  type: "pdf" | "image";
}

export type DeliveryMethod = "shop_delivery" | "self_pickup";

export interface OrderDelivery {
  method: DeliveryMethod;
  address?: string; // แสดงเมื่อ method = shop_delivery
}

export interface OrderItemSnapshot {
  id: string;
  serviceName: string;
  pricingType: string;
  baseRate: number;
  colorTierLabel: string | null;
  colorTierPrice: number | null;
  quantity: number;
  pageCount: number | null;
  widthCm: number | null;
  heightCm: number | null;
  optionsSnapshot: Array<{
    optionName: string;
    valueName?: string | null;
    textValue?: string | null;
    extraPrice: number;
    priceScope: string;
  }>;
  addOnsSnapshot: Array<{
    name: string;
    extraPrice: number;
    scope: string;
  }>;
  itemSubtotal: number;
  fileUrl: string | null;
  note: string | null;
}

export interface Order {
  id: string;
  code: string; // เลขแสดงในตาราง เช่น #0005
  ref: string; // รหัสอ้างอิงเต็ม เช่น ORD-20260516-B0F2
  customerName: string;
  customerPhone: string;
  category: string; // ประเภทงาน เช่น "ถ่ายเอกสารขาว-ดำ"
  paperSize: string; // เช่น "A4", "A3"
  copies: number; // จำนวนชุด
  totalPages: number; // จำนวนหน้ารวม
  addOns: string[]; // บริการเพิ่มเติม เช่น ["เข้าเล่ม", "เคลือบ"]
  file: OrderFileAttachment;
  paymentSlip: OrderFileAttachment;
  delivery: OrderDelivery;
  subtotal?: number | null;
  shippingFee?: number | null;
  price: number;
  items?: OrderItemSnapshot[];
  rawFileUrl?: string | null;
  rawSlipUrl?: string | null;
  status: OrderStatus;
  createdAtLabel: string; // เช่น "16 พ.ค. 10:30"
  note?: string; // หมายเหตุจากลูกค้าตอนสั่งซื้อ
  cancelReason?: CancelReason;
  cancelNote?: string;
}

