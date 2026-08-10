"use client";

import { useState } from "react";
import { XCircle, X } from "lucide-react";

interface RejectModalProps {
  shopName: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

export default function RejectModal({ shopName, onConfirm, onClose }: RejectModalProps) {
  const [reason, setReason] = useState("");
  const canSubmit = reason.trim().length >= 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center text-center">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <XCircle size={44} className="text-red-500" />
        </div>

        {/* Text */}
        <h2 className="text-xl font-bold text-gray-900 mb-1">ไม่อนุมัติร้านค้า</h2>
        <p className="text-sm text-gray-500 mb-4">
          ร้าน &ldquo;<span className="font-semibold text-gray-700">{shopName}</span>&rdquo;
          จะถูกปฏิเสธการสมัคร
        </p>

        {/* Reason textarea */}
        <div className="w-full mb-5 text-left">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-gray-700">
              เหตุผล <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] text-gray-400">
              {reason.trim().length}/5 ตัวอักษรขึ้นไป
            </span>
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="ระบุเหตุผลที่ไม่อนุมัติ เช่น เอกสารไม่ครบ, ข้อมูลไม่ถูกต้อง..."
            rows={3}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 transition-colors placeholder:text-gray-400"
          />
          {reason.length > 0 && !canSubmit && (
            <p className="text-[11px] text-red-500 mt-1 font-semibold">
              กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษร
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            disabled={!canSubmit}
            onClick={() => {
              if (canSubmit) {
                onConfirm(reason);
                onClose();
              }
            }}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-colors shadow-sm ${
              canSubmit
                ? "bg-red-500 hover:bg-red-600 shadow-red-200"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  );
}
