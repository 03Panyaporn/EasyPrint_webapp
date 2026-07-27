"use client";

import { useEffect } from "react";
import { Bell, X, CheckCircle2, XCircle } from "lucide-react";

export type ToastType = "approve" | "reject";

interface NotificationToastProps {
  type: ToastType;
  shopName: string;
  onClose: () => void;
  /** Auto-dismiss after ms (default: 4000) */
  duration?: number;
}

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

  const isApprove = type === "approve";

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex items-start gap-3 px-4 py-4 rounded-2xl shadow-2xl border max-w-xs w-full
        ${isApprove
          ? "bg-white border-green-200"
          : "bg-white border-red-200"
        }
        animate-in slide-in-from-right-4 fade-in duration-300`}
    >
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          isApprove ? "bg-green-100" : "bg-red-100"
        }`}
      >
        {isApprove ? (
          <CheckCircle2 size={22} className="text-green-500" />
        ) : (
          <XCircle size={22} className="text-red-500" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm font-bold text-gray-900">
          {isApprove ? "อนุมัติร้านค้าแล้ว" : "ไม่อนุมัติร้านค้า"}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          ร้าน &ldquo;{shopName}&rdquo; {isApprove ? "ได้รับการอนุมัติแล้ว" : "ถูกปฏิเสธการสมัคร"}
        </p>
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
          className={`h-full ${isApprove ? "bg-green-400" : "bg-red-400"}`}
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
