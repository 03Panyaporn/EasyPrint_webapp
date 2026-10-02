"use client";

import { useEffect } from "react";
import { X, CheckCircle2, CirclePause, Trash2 } from "lucide-react";

// toast หน้าจัดการบัญชีลูกค้า — หน้าตาเดียวกับ NotificationToast ของหน้าร้านค้า (components/admin/shops)
// แยกไฟล์เพราะข้อความของ toast นั้นผูกกับคำว่า "ร้าน" ไว้ตายตัว
export type CustomerToastType = "suspend" | "reinstate" | "delete";

const TOAST_CONFIG: Record<
  CustomerToastType,
  { title: string; describe: (name: string) => string; tone: "green" | "red"; icon: typeof CheckCircle2 }
> = {
  suspend: { title: "ระงับบัญชีแล้ว", describe: (n) => `บัญชี "${n}" ถูกระงับการใช้งาน`, tone: "red", icon: CirclePause },
  reinstate: { title: "เปิดใช้งานบัญชีแล้ว", describe: (n) => `บัญชี "${n}" กลับมาใช้งานได้ตามปกติ`, tone: "green", icon: CheckCircle2 },
  delete: { title: "ลบบัญชีแล้ว", describe: (n) => `บัญชี "${n}" ถูกลบออกจากระบบ`, tone: "red", icon: Trash2 },
};

const TONE_CLASS = {
  green: { border: "border-green-200", iconBg: "bg-green-100", icon: "text-green-500", bar: "bg-green-400" },
  red: { border: "border-red-200", iconBg: "bg-red-100", icon: "text-red-500", bar: "bg-red-400" },
} as const;

export default function CustomerActionToast({
  type,
  name,
  onClose,
  duration = 4000,
}: {
  type: CustomerToastType;
  name: string;
  onClose: () => void;
  duration?: number;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const { title, describe, tone, icon: Icon } = TOAST_CONFIG[type];
  const toneClass = TONE_CLASS[tone];

  return (
    <div
      role="status"
      className={`fixed bottom-6 right-6 z-[100] flex items-start gap-3 px-4 py-4 rounded-2xl shadow-2xl border max-w-xs w-[calc(100%-3rem)] bg-white ${toneClass.border}
        animate-in slide-in-from-right-4 fade-in duration-300`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${toneClass.iconBg}`}>
        <Icon size={22} className={toneClass.icon} />
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{describe(name)}</p>
      </div>

      <button
        onClick={onClose}
        aria-label="ปิด"
        className="flex items-center justify-center w-6 h-6 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
      >
        <X size={14} />
      </button>

      <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl overflow-hidden">
        <div className={`h-full ${toneClass.bar}`} style={{ animation: `customer-toast-shrink ${duration}ms linear forwards` }} />
      </div>

      <style>{`
        @keyframes customer-toast-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
