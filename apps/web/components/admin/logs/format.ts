// ตัวช่วยจัดรูปแบบข้อมูลในหน้าประวัติและสถานะระบบ (/admin/logs)
import { AUDIT_ACTIONS, type AdminLoginHistoryItem, type LoginFailureReason } from "@easyprint/shared";

export function formatThaiDateTime(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function auditActionLabel(action: string) {
  return (AUDIT_ACTIONS as Record<string, string>)[action] ?? action;
}

export const TARGET_TYPE_LABEL: Record<string, string> = {
  shop: "ร้านค้า",
  customer: "บัญชีลูกค้า",
  settings: "การตั้งค่าระบบ",
  announcement: "ประกาศ",
  file: "ไฟล์",
  review: "รีวิว",
  contact_message: "ข้อความติดต่อ",
};

export const ROLE_LABEL: Record<NonNullable<AdminLoginHistoryItem["role"]>, string> = {
  customer: "ลูกค้า",
  shop_owner: "ร้านค้า",
  admin: "แอดมิน",
};

export const FAILURE_REASON_LABEL: Record<LoginFailureReason, string> = {
  invalid_credentials: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  suspended: "บัญชีถูกระงับ",
};

// สรุป user agent เป็น "เบราว์เซอร์ · ระบบปฏิบัติการ" แบบหยาบๆ ให้อ่านง่ายในตาราง (ค่าเต็มดูได้ใน tooltip)
export function describeUserAgent(ua: string | null) {
  if (!ua) return "-";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Safari\//.test(ua)
            ? "Safari"
            : null;
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Android/.test(ua)
      ? "Android"
      : /iPhone|iPad|iOS/.test(ua)
        ? "iOS"
        : /Mac OS X|Macintosh/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : null;
  if (!browser && !os) return ua.length > 40 ? `${ua.slice(0, 40)}…` : ua;
  return [browser, os].filter(Boolean).join(" · ");
}

export function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days} วัน ${hours} ชม.`;
  if (hours > 0) return `${hours} ชม. ${minutes} นาที`;
  return `${minutes} นาที ${seconds % 60} วินาที`;
}
