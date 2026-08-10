"use client";

import { X, Check, CheckCircle2, User } from "lucide-react";
import { Order } from "./types";
import { renderFileMock } from "./FilePreviewContent";
import { statusConfig } from "./statusConfig";

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
  const showConfirmedNotice =
    kind === "slip" && order.status !== "pending_review" && order.status !== "cancelled";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-white rounded-3xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_48px_-12px_rgba(0,0,0,0.35),inset_0_1px_0_0_rgba(255,255,255,0.8)] w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        {showPaymentActions ? (
          <>
            {/* Header: order code + status badge (โทนสีส้ม เฉพาะสถานะรอตรวจสอบ) */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-xs text-gray-400">ออเดอร์</p>
                <p className="text-base font-bold text-gray-800">{order.code}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap ${statusConfig.pending_review.badgeBg} ${statusConfig.pending_review.badgeText} ${statusConfig.pending_review.badgeBorder}`}
                >
                  {statusConfig.pending_review.label}
                </span>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ลูกค้า + สลิป + ยอดที่ต้องชำระ */}
            <div className="flex flex-col gap-6 w-full">
              <div className="shrink-0 flex flex-col items-center self-center">
                <div className="overflow-hidden rounded-xl ring-1 ring-gray-200 shadow-sm">
                  <div>
                    {renderFileMock(order, "slip")}
                  </div>
                </div>
              </div>

              <div className="w-full text-left bg-slate-50 p-4 rounded-2xl">
                <div className="flex-1 min-w-0 flex flex-col">
                  <p className="text-[11px] font-medium text-slate-500 leading-none mb-1">ลูกค้า</p>
                  <p className="text-sm font-bold text-slate-800 mb-2 truncate">{order.customerName}</p>
                  <div className="flex items-end justify-between mt-auto">
                    <p className="text-[11px] font-medium text-slate-500 leading-none">ยอดที่ต้องชำระ</p>
                    <p className="text-[22px] font-bold text-blue-600 leading-none tracking-tight">
                      ฿{order.price.toLocaleString()}.00
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ปฏิเสธ / อนุมัติ */}
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => onRejectPayment(order)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
              >
                <X size={16} />
                ปฏิเสธ
              </button>
              <button
                onClick={() => onConfirmPayment(order)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md shadow-orange-200 bg-orange-500 hover:brightness-95 transition-all"
              >
                <Check size={16} />
                อนุมัติ
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
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

            {showConfirmedNotice && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <p className="text-xs font-semibold text-emerald-700">ยืนยันการชำระเงินแล้ว</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
