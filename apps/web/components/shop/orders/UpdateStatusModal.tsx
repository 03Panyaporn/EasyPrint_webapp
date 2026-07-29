"use client";

import { X, ShieldCheck, Wrench, Truck, PartyPopper, Store, Check, FileText } from "lucide-react";
import { Order, OrderStatus } from "./types";
import { progressSteps, statusConfig } from "./statusConfig";
import FileThumbnail from "./FileThumbnail";

interface UpdateStatusModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onAdvance: (order: Order, nextStatus: OrderStatus) => void;
  onRejectPayment: (order: Order) => void;
  onCancelOrder: (order: Order) => void;
  onPreviewFile: (order: Order, kind: "file" | "slip") => void;
}

interface Variant {
  infoText: string;
  icon: React.ElementType;
  nextStatus: OrderStatus;
  showStepper: boolean;
}

// ลูกค้าที่เลือก "มารับเองที่ร้าน" จะไม่มีสถานะ "กำลังจัดส่ง" — ข้ามตรงไปเสร็จสิ้นเมื่อลูกค้ามารับ
function getProgressSteps(order: Order): OrderStatus[] {
  if (order.delivery.method === "self_pickup") {
    return progressSteps.filter((s) => s !== "shipping");
  }
  return progressSteps;
}

function getVariant(order: Order): Variant | null {
  const isPickup = order.delivery.method === "self_pickup";

  switch (order.status) {
    case "pending_review":
      return {
        infoText: "ตรวจสอบรายการสั่งซื้อและหลักฐานการชำระเงินแล้ว",
        icon: ShieldCheck,
        nextStatus: "accepted",
        showStepper: false,
      };
    case "accepted":
      return {
        infoText: "เริ่มดำเนินการผลิตงานให้ลูกค้า",
        icon: Wrench,
        nextStatus: "in_progress",
        showStepper: true,
      };
    case "in_progress":
      if (isPickup) {
        return {
          infoText: "เตรียมสินค้าให้พร้อม แจ้งลูกค้ามารับที่ร้านได้เลย",
          icon: Store,
          nextStatus: "completed",
          showStepper: true,
        };
      }
      return {
        infoText: "เริ่มจัดเตรียมการจัดส่งให้ลูกค้า",
        icon: Truck,
        nextStatus: "shipping",
        showStepper: true,
      };
    case "shipping":
      return {
        infoText: "จัดส่งสินค้าให้ลูกค้ารับเรียบร้อยแล้ว",
        icon: PartyPopper,
        nextStatus: "completed",
        showStepper: true,
      };
    default:
      return null;
  }
}

export default function UpdateStatusModal({
  order,
  isOpen,
  onClose,
  onAdvance,
  onRejectPayment,
  onCancelOrder,
  onPreviewFile,
}: UpdateStatusModalProps) {
  if (!isOpen || !order) return null;

  const variant = getVariant(order);
  if (!variant) return null;

  const Icon = variant.icon;
  const targetMeta = statusConfig[variant.nextStatus];
  const canRejectPayment = order.status === "pending_review";

  const steps = getProgressSteps(order);
  const currentIndex = steps.indexOf(order.status);
  const targetIndex = steps.indexOf(variant.nextStatus);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">อัปเดตสถานะ</h2>
            <p className="text-xs text-gray-400 mt-0.5">ออเดอร์ {order.code}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-5">
          สถานะปัจจุบัน:{" "}
          <span className="font-semibold text-gray-800">
            {statusConfig[order.status].label}
          </span>
        </p>

        {/* Stepper */}
        {variant.showStepper && (
          <div className="flex items-center mb-6">
            {steps.map((step, idx) => {
              const stepMeta = statusConfig[step];
              const isPast = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              const isTarget = idx === targetIndex;
              const isReached = isPast || isCurrent; // ถึงสถานะนี้แล้วหรือเสร็จแล้ว — ให้มีสี

              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    {/* กล่องขนาดคงที่ครอบวงกลมทุกขั้น กันเงา/วงแหวนของขั้นปัจจุบันล้นไปทับข้อความด้านล่าง โดยไม่กระทบความสูงรวมของขั้นอื่น */}
                    <div className="w-10 h-10 flex items-center justify-center shrink-0">
                      <div
                        className={
                          isCurrent
                            ? "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all bg-orange-500 text-white shadow-lg shadow-orange-300 ring-4 ring-orange-100 scale-110"
                            : isPast
                            ? "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all bg-orange-200 text-orange-600"
                            : isTarget
                            ? "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all bg-white text-orange-600 border-2 border-orange-500"
                            : "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all bg-gray-100 text-gray-400"
                        }
                      >
                        {isCurrent ? <Check size={13} /> : isPast ? <Check size={13} /> : idx + 1}
                      </div>
                    </div>
                    {/* บรรทัดกำกับความสูงคงที่ทุกสถานะ กันไม่ให้ขั้นที่มีคำอธิบายเพิ่ม (ปัจจุบัน)/(ถัดไป) ถูกจัดกึ่งกลางแล้วดูยกสูงกว่าขั้นอื่น */}
                    <span
                      className={`text-[10px] text-center leading-tight max-w-[52px] ${
                        isReached ? "font-semibold text-gray-800" : "text-gray-400"
                      }`}
                    >
                      <span className="block h-[26px]">{stepMeta.label}</span>
                      <span className="block h-[13px] text-[9px] font-normal text-gray-400">
                        {isCurrent ? "(ปัจจุบัน)" : isTarget && !isReached ? "(ถัดไป)" : " "}
                      </span>
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-1 ${
                        idx < currentIndex ? "bg-gray-300" : "bg-gray-100"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Payment slip preview — เฉพาะตอนรอตรวจสอบ ให้เห็นสลิปจริงก่อนกดรับงาน */}
        {canRejectPayment && (
          <div className="rounded-xl border border-gray-100 p-3.5 mb-5">
            <p className="text-xs text-gray-400 mb-2.5">หลักฐานการชำระเงินจากลูกค้า</p>
            <div className="flex items-center gap-4">
              <FileThumbnail
                order={order}
                kind="slip"
                size="lg"
                onClick={() => onPreviewFile(order, "slip")}
              />
              <div className="min-w-0">
                <p className="text-xs text-gray-400">ยอดที่ต้องชำระ</p>
                <p className="text-xl font-bold text-gray-800">
                  {order.price.toLocaleString()} บาท
                </p>
                <p className="text-xs text-gray-400 mt-2">อัปโหลดเมื่อ {order.createdAtLabel}</p>
              </div>
            </div>
          </div>
        )}

        {/* Info box — ข้อความเฉพาะสำหรับรอตรวจสอบ ส่วนสถานะอื่นใช้กล่องแจ้งเตือนกลางแบบเดียวกันหมด */}
        {order.status === "pending_review" ? (
          <div
            className={`flex items-center gap-3 rounded-xl border p-3.5 mb-6 ${targetMeta.badgeBg} ${targetMeta.badgeBorder}`}
          >
            <Icon size={20} className={`shrink-0 ${targetMeta.badgeText}`} />
            <p className={`text-sm font-medium ${targetMeta.badgeText}`}>{variant.infoText}</p>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 mb-6">
            <FileText size={18} className="shrink-0 text-slate-400" />
            <p className="text-xs font-medium text-slate-600 leading-relaxed">
              เมื่อคุณกดอัปเดตสถานะ ระบบจะบันทึกข้อมูลและส่งการแจ้งเตือนความคืบหน้าให้ลูกค้าทั่วไป
              ทราบทันที
            </p>
          </div>
        )}

        {/* Actions: ซ้ายยกเลิกงาน/ปฏิเสธการชำระเงิน, ขวาคือสถานะถัดไป */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => (canRejectPayment ? onRejectPayment(order) : onCancelOrder(order))}
            className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
          >
            {canRejectPayment ? "ปฏิเสธการชำระเงิน" : "ยกเลิกงาน"}
          </button>
          <button
            onClick={() => onAdvance(order, variant.nextStatus)}
            className="flex-1 py-3 rounded-2xl text-white font-semibold text-sm shadow-[0_10px_24px_-6px_rgba(249,115,22,0.45),0_4px_10px_-4px_rgba(249,115,22,0.3)] bg-orange-500 hover:brightness-95 transition-all"
          >
            {targetMeta.label}
          </button>
        </div>

        {/* Footnote */}
        {canRejectPayment && (
          <p className="text-[11px] text-gray-400 mt-4 text-center">
            ปุ่ม &quot;ปฏิเสธการชำระเงิน&quot; จะแสดงเฉพาะเมื่อสถานะเป็น &quot;รอตรวจสอบ&quot; เท่านั้น
          </p>
        )}
      </div>
    </div>
  );
}
