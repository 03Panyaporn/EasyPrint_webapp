import {
  Clock,
  UserCheck,
  UserCog,
  Truck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { OrderStatus } from "./types";

interface StatusMeta {
  label: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  /** พื้นหลังทึบสีเดียวกับสถานะนี้ ใช้กับปุ่ม action หลักและวงกลม step ที่เป็นเป้าหมาย */
  solidBg: string;
  solidShadow: string;
  /** ขอบเข้มของสถานะนี้ ใช้เน้นวงกลม step ที่กำลังจะเปลี่ยนไป (ให้ดูเป็นสามมิติ) */
  targetBorder: string;
}

export const statusConfig: Record<OrderStatus, StatusMeta> = {
  pending_review: {
    label: "รอตรวจสอบ",
    icon: Clock,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
    badgeBg: "bg-orange-50",
    badgeText: "text-orange-600",
    badgeBorder: "border-orange-100",
    solidBg: "bg-orange-500",
    solidShadow: "shadow-orange-200",
    targetBorder: "border-orange-400",
  },
  accepted: {
    label: "รับงานแล้ว",
    icon: UserCheck,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-500",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-600",
    badgeBorder: "border-purple-100",
    solidBg: "bg-purple-600",
    solidShadow: "shadow-purple-200",
    targetBorder: "border-purple-400",
  },
  in_progress: {
    label: "กำลังดำเนินการ",
    icon: UserCog,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-700",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    badgeBorder: "border-blue-200",
    solidBg: "bg-blue-700",
    solidShadow: "shadow-blue-200",
    targetBorder: "border-blue-400",
  },
  shipping: {
    label: "กำลังจัดส่ง",
    icon: Truck,
    iconBg: "bg-cyan-50",
    iconColor: "text-cyan-600",
    badgeBg: "bg-cyan-50",
    badgeText: "text-cyan-700",
    badgeBorder: "border-cyan-100",
    solidBg: "bg-cyan-600",
    solidShadow: "shadow-cyan-200",
    targetBorder: "border-cyan-400",
  },
  completed: {
    label: "เสร็จสิ้น",
    icon: CheckCircle2,
    iconBg: "bg-green-50",
    iconColor: "text-green-500",
    badgeBg: "bg-green-50",
    badgeText: "text-green-600",
    badgeBorder: "border-green-100",
    solidBg: "bg-green-600",
    solidShadow: "shadow-green-200",
    targetBorder: "border-green-400",
  },
  cancelled: {
    label: "ยกเลิก",
    icon: XCircle,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    badgeBg: "bg-red-50",
    badgeText: "text-red-600",
    badgeBorder: "border-red-100",
    solidBg: "bg-red-600",
    solidShadow: "shadow-red-200",
    targetBorder: "border-red-400",
  },
};

export const statusOrder: OrderStatus[] = [
  "pending_review",
  "accepted",
  "in_progress",
  "shipping",
  "completed",
  "cancelled",
];

export const progressSteps: OrderStatus[] = [
  "pending_review",
  "accepted",
  "in_progress",
  "shipping",
  "completed",
];

export const cancelReasonLabels: Record<string, string> = {
  customer_request: "ลูกค้าขอยกเลิก",
  invalid_payment_slip: "หลักฐานการชำระเงินไม่ถูกต้อง/ไม่ชัดเจน",
  amount_mismatch: "ยอดโอนไม่ตรงกับยอดสั่งซื้อ",
  no_transfer_found: "ไม่พบรายการโอนเงินจริง",
  invalid_file: "ไฟล์งานไม่ถูกต้อง/เสียหาย",
  shop_unavailable: "ร้านไม่สามารถให้บริการได้ตามคำขอ",
  other: "อื่นๆ",
};

export const cancelReasonOptions: { value: string; label: string }[] = [
  { value: "customer_request", label: cancelReasonLabels.customer_request },
  { value: "invalid_file", label: cancelReasonLabels.invalid_file },
  { value: "shop_unavailable", label: cancelReasonLabels.shop_unavailable },
  { value: "other", label: cancelReasonLabels.other },
];

export const rejectPaymentReasonOptions: { value: string; label: string }[] = [
  { value: "invalid_payment_slip", label: cancelReasonLabels.invalid_payment_slip },
  { value: "amount_mismatch", label: cancelReasonLabels.amount_mismatch },
  { value: "no_transfer_found", label: cancelReasonLabels.no_transfer_found },
  { value: "other", label: cancelReasonLabels.other },
];
