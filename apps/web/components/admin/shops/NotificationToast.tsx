"use client";

import { useEffect } from "react";
import { X, CheckCircle2, XCircle, CirclePause, Trash2, Pencil } from "lucide-react";

// ครอบคลุมทุก action ที่ใช้ toast นี้จริงในหน้า admin/manage และ admin/shops
// (เดิมมีแค่ approve/reject — ทั้งผมและเพื่อนร่วมทีมต่างเจอบั๊กเดียวกันว่า admin/manage เรียก type "delete"/"edit"/"suspend" อยู่แล้วโดยไม่มี case รองรับ แก้พร้อมกันคนละรอบ ใช้เวอร์ชันนี้เพราะครอบคลุมกว่า (มี "reinstate" เพิ่มด้วย))
export type ToastType = "approve" | "reject" | "suspend" | "reinstate" | "delete" | "edit";

interface NotificationToastProps {
  type: ToastType;
  shopName: string;
  onClose: () => void;
  /** Auto-dismiss after ms (default: 4000) */
  duration?: number;
}

const TOAST_CONFIG: Record<
  ToastType,
  { title: string; describe: (shopName: string) => string; tone: "green" | "red" | "slate" }
> = {
  approve: { title: "อนุมัติร้านค้าแล้ว", describe: (n) => `ร้าน "${n}" ได้รับการอนุมัติแล้ว`, tone: "green" },
  reject: { title: "ไม่อนุมัติร้านค้า", describe: (n) => `ร้าน "${n}" ถูกปฏิเสธการสมัคร`, tone: "red" },
  suspend: { title: "ระงับการใช้งานร้านค้าแล้ว", describe: (n) => `ร้าน "${n}" ถูกระงับการใช้งาน`, tone: "red" },
  reinstate: { title: "คืนสถานะร้านค้าแล้ว", describe: (n) => `ร้าน "${n}" กลับมาเปิดใช้งานได้อีกครั้ง`, tone: "green" },
  delete: { title: "ลบร้านค้าแล้ว", describe: (n) => `ร้าน "${n}" ถูกลบออกจากระบบ`, tone: "red" },
  edit: { title: "บันทึกข้อมูลร้านค้าแล้ว", describe: (n) => `แก้ไขข้อมูลร้าน "${n}" เรียบร้อยแล้ว`, tone: "slate" },
};

const TONE_CLASS = {
  green: { border: "border-green-200", iconBg: "bg-green-100", icon: "text-green-500", bar: "bg-green-400" },
  red: { border: "border-red-200", iconBg: "bg-red-100", icon: "text-red-500", bar: "bg-red-400" },
  slate: { border: "border-slate-200", iconBg: "bg-slate-100", icon: "text-slate-500", bar: "bg-slate-400" },
} as const;

const TOAST_ICON: Record<ToastType, typeof CheckCircle2> = {
  approve: CheckCircle2,
  reject: XCircle,
  suspend: CirclePause,
  reinstate: CheckCircle2,
  delete: Trash2,
  edit: Pencil,
};

export default function NotificationToast({
  type,
  shopName,
  onClose,
  duration = 4000,
}: NotificationToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const { title, describe, tone } = TOAST_CONFIG[type];
  const toneClass = TONE_CLASS[tone];
  const Icon = TOAST_ICON[type];

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex items-start gap-3 px-4 py-4 rounded-2xl shadow-2xl border max-w-xs w-full bg-white ${toneClass.border}
        animate-in slide-in-from-right-4 fade-in duration-300`}
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${toneClass.iconBg}`}>
        <Icon size={22} className={toneClass.icon} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{describe(shopName)}</p>
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        className="flex items-center justify-center w-6 h-6 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
      >
        <X size={14} />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl overflow-hidden">
        <div
          className={`h-full ${toneClass.bar}`}
          style={{ animation: `shrink ${duration}ms linear forwards` }}
        />
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
