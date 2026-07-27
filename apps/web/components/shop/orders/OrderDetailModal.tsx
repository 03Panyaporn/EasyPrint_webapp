"use client";

import { X, MapPin, Store, MessageSquareText } from "lucide-react";
import { Order } from "./types";
import { statusConfig, cancelReasonLabels } from "./statusConfig";
import FileThumbnail from "./FileThumbnail";

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onPreviewFile: (order: Order, kind: "file" | "slip") => void;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <div className="text-sm font-medium text-gray-800">{children}</div>
    </div>
  );
}

export default function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onPreviewFile,
}: OrderDetailModalProps) {
  if (!isOpen || !order) return null;

  const meta = statusConfig[order.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="text-lg font-bold text-gray-800">รายละเอียดออเดอร์ {order.code}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{order.ref}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <span
          className={`inline-block mt-3 mb-5 px-3 py-1 rounded-full text-xs font-semibold border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
        >
          {meta.label}
        </span>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <DetailRow label="ชื่อลูกค้า">{order.customerName}</DetailRow>
          <DetailRow label="วันที่สั่งซื้อ">{order.createdAtLabel}</DetailRow>
          <DetailRow label="ประเภทงาน">{order.category}</DetailRow>
          <DetailRow label="ขนาดกระดาษ">{order.paperSize}</DetailRow>
          <DetailRow label="จำนวนชุด">
            {order.copies} ชุด ({order.totalPages} หน้า)
          </DetailRow>
          <DetailRow label="บริการเพิ่มเติม">
            {order.addOns.length > 0 ? order.addOns.join(", ") : "-"}
          </DetailRow>
        </div>

        {/* Files */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="flex flex-col items-center rounded-xl border border-gray-100 p-3">
            <p className="text-xs text-gray-400 mb-2 self-start">ไฟล์งาน</p>
            <FileThumbnail
              order={order}
              kind="file"
              size="md"
              onClick={() => onPreviewFile(order, "file")}
            />
          </div>

          <div className="flex flex-col items-center rounded-xl border border-gray-100 p-3">
            <p className="text-xs text-gray-400 mb-2 self-start">สลิปโอนเงิน</p>
            <FileThumbnail
              order={order}
              kind="slip"
              size="md"
              onClick={() => onPreviewFile(order, "slip")}
            />
          </div>
        </div>

        {/* Delivery */}
        <div className="rounded-xl border border-gray-100 p-3.5 mb-5">
          <p className="text-xs text-gray-400 mb-1.5">การจัดส่ง</p>
          {order.delivery.method === "self_pickup" ? (
            <p className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
              <Store size={15} className="text-gray-400" />
              มารับเองที่ร้าน
            </p>
          ) : (
            <p className="flex items-start gap-1.5 text-sm font-medium text-gray-800">
              <MapPin size={15} className="text-gray-400 mt-0.5 shrink-0" />
              {order.delivery.address}
            </p>
          )}
        </div>

        {/* Customer note */}
        {order.note && (
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-3.5 mb-5">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 mb-1">
              <MessageSquareText size={13} />
              หมายเหตุจากลูกค้า
            </p>
            <p className="text-sm text-amber-800 leading-relaxed">{order.note}</p>
          </div>
        )}

        {/* Cancel / reject info */}
        {order.status === "cancelled" && order.cancelReason && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-3.5 mb-5">
            <p className="text-xs text-red-500 mb-1">เหตุผลที่ยกเลิก</p>
            <p className="text-sm font-medium text-red-700">
              {cancelReasonLabels[order.cancelReason] ?? order.cancelReason}
            </p>
            {order.cancelNote && (
              <p className="text-xs text-red-500 mt-1.5">{order.cancelNote}</p>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between rounded-xl bg-orange-50 border border-orange-100 p-4 mb-6">
          <span className="text-sm font-medium text-orange-700">ราคารวม</span>
          <span className="text-xl font-bold text-orange-600">
            {order.price.toLocaleString()} บาท
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          ปิด
        </button>
      </div>
    </div>
  );
}
