"use client";

import { useEffect, useState } from "react";
import { X, Check, CheckCircle2 } from "lucide-react";
import { Order } from "./types";
import { MOCK_WIDTH, renderFileMock } from "./FilePreviewContent";
import { statusConfig } from "./statusConfig";

const SLIP_THUMB_PX = 96;

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
  const [slipExpanded, setSlipExpanded] = useState(true);

  // เปิดสลิปใหม่ทุกครั้งให้เริ่มที่สถานะซูมขยายเสมอ ไม่ค้างสถานะย่อจากออเดอร์ก่อนหน้า
  useEffect(() => {
    if (order && kind === "slip") setSlipExpanded(true);
  }, [order?.id, kind]);

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
            <div className="flex items-start gap-4 mb-5">
              <button
                type="button"
                onClick={() => setSlipExpanded((v) => !v)}
                className="shrink-0 flex flex-col items-center gap-1.5 group"
              >
                <div
                  className="overflow-hidden rounded-xl ring-1 ring-gray-100 group-hover:ring-orange-300 transition-all"
                  style={
                    slipExpanded
                      ? undefined
                      : { width: SLIP_THUMB_PX, height: SLIP_THUMB_PX }
                  }
                >
                  <div
                    style={
                      slipExpanded
                        ? undefined
                        : {
                            width: MOCK_WIDTH,
                            transform: `scale(${SLIP_THUMB_PX / MOCK_WIDTH})`,
                            transformOrigin: "top left",
                          }
                    }
                  >
                    {renderFileMock(order, "slip")}
                  </div>
                </div>
                <span className="text-[10px] text-orange-500 font-medium">
                  {slipExpanded ? "ย่อรูป" : "แตะเพื่อดูขยาย"}
                </span>
              </button>

              <div className="min-w-0 pt-0.5">
                <p className="text-xs text-gray-400">ลูกค้า</p>
                <p className="text-sm font-semibold text-gray-800 mb-2.5">{order.customerName}</p>
                <p className="text-xs text-gray-400">ยอดที่ต้องชำระ</p>
                <p className="text-xl font-bold text-gray-800">
                  ฿{order.price.toLocaleString()}.00
                </p>
              </div>
            </div>

            {/* แถบยืนยันยอด — โทนสีส้มตามสถานะรอตรวจสอบ */}
            <div className="flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50 px-3.5 py-2.5 mb-4">
              <CheckCircle2 size={16} className="text-orange-600 shrink-0" />
              <p className="text-xs font-semibold text-orange-700">
                ยอดเงินในสลิปตรงกับออเดอร์
              </p>
            </div>

            {/* รายละเอียดสลิป */}
            <div className="space-y-2.5 text-sm mb-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">ยอดในสลิป</span>
                <span className="font-semibold text-gray-800">
                  ฿{order.price.toLocaleString()}.00
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">วันเวลาโอน</span>
                <span className="text-gray-700">{order.createdAtLabel} น.</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">ธนาคารต้นทาง</span>
                <span className="text-gray-700">ธนาคารตัวอย่าง</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">เลขที่อ้างอิง</span>
                <span className="text-gray-700 truncate max-w-[160px]" title={order.ref}>
                  {order.ref}
                </span>
              </div>
            </div>

            {/* ปฏิเสธ / อนุมัติ */}
            <div className="flex items-center gap-3">
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
