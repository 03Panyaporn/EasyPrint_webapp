"use client";

import { CheckCircle2, X } from "lucide-react";

interface ApproveModalProps {
  shopName: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ApproveModal({ shopName, onConfirm, onClose }: ApproveModalProps) {
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
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 size={44} className="text-green-500" />
        </div>

        {/* Text */}
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          อนุมัติร้านค้าสำเร็จ!
        </h2>
        <p className="text-sm text-gray-500 mb-1">
          ร้าน &ldquo;<span className="font-semibold text-gray-700">{shopName}</span>&rdquo;
        </p>
        <p className="text-sm text-gray-500 mb-6">
          จะได้รับการแจ้งเตือนอนุมัติทางอีเมลโดยอัตโนมัติ
        </p>

        {/* Buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 transition-colors shadow-sm shadow-green-200"
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  );
}
