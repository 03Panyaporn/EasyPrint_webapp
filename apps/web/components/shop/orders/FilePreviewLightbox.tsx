"use client";

import { X } from "lucide-react";
import { Order } from "./types";
import { renderFileMock } from "./FilePreviewContent";

interface FilePreviewLightboxProps {
  order: Order | null;
  kind: "file" | "slip" | null;
  onClose: () => void;
  onConfirmPayment?: (order: Order) => void;
  onRejectPayment?: (order: Order) => void;
}

export default function FilePreviewLightbox({
  order,
  kind,
  onClose,
  onConfirmPayment,
  onRejectPayment,
}: FilePreviewLightboxProps) {
  if (!order || !kind) return null;

  const file = kind === "slip" ? order.paymentSlip : order.file;
  const showPaymentActions =
    kind === "slip" && order.status === "pending_review" && onConfirmPayment && onRejectPayment;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-white rounded-3xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_48px_-12px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.8)] w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {kind === "slip" ? "สลิปโอนเงิน" : "ไฟล์งาน"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">รหัสออเดอร์ {order.code}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-5">
          จากลูกค้า: <span className="font-semibold text-gray-800">{order.customerName}</span>
        </p>

        {/* Preview panel */}
        <div className="rounded-xl border border-gray-100 p-3.5 mb-5 flex flex-col items-center">
          <div className="rounded-2xl overflow-hidden shadow-lg mb-2.5">
            {renderFileMock(order, kind)}
          </div>
          <p className="text-sm font-medium text-gray-800 text-center">{file.name}</p>
        </div>

        {showPaymentActions && (
          <>
            <button
              onClick={() => onConfirmPayment(order)}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm shadow-md shadow-orange-200 bg-orange-500 hover:brightness-95 transition-all mb-3"
            >
              ยืนยันการชำระเงิน
            </button>
            <button
              onClick={() => onRejectPayment(order)}
              className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
            >
              ปฏิเสธการชำระเงิน
            </button>
          </>
        )}
      </div>
    </div>
  );
}
