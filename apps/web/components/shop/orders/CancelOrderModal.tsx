"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { CancelModalMode, Order } from "./types";
import { cancelReasonOptions, rejectPaymentReasonOptions } from "./statusConfig";

interface CancelOrderModalProps {
  order: Order | null;
  mode: CancelModalMode;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (order: Order, reason: string, note: string) => void;
}

const NOTE_MAX_LENGTH = 200;

export default function CancelOrderModal({
  order,
  mode,
  isOpen,
  onClose,
  onConfirm,
}: CancelOrderModalProps) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setNote("");
    }
  }, [isOpen, order?.id, mode]);

  if (!isOpen || !order) return null;

  const isReject = mode === "reject_payment";
  const reasonOptions = isReject ? rejectPaymentReasonOptions : cancelReasonOptions;
  const title = isReject ? `ปฏิเสธการชำระเงิน ${order.code}` : `ยกเลิกงาน ${order.code}`;
  const warningText = isReject
    ? "การปฏิเสธการชำระเงินจะแจ้งเตือนให้ลูกค้าอัปโหลดหลักฐานใหม่ กรุณาระบุเหตุผลให้ชัดเจน"
    : "การยกเลิกงานจะไม่สามารถกู้คืนได้ กรุณาแจ้งลูกค้าให้ทราบ";
  const confirmLabel = isReject ? "ยืนยันการปฏิเสธ" : "ยืนยันการยกเลิก";
  const reasonLabel = isReject ? "เหตุผลการปฏิเสธ *" : "เหตุผลการยกเลิกงาน *";

  const handleConfirm = () => {
    if (!reason) return;
    onConfirm(order, reason, note);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-4">ออเดอร์อ้างอิง {order.ref}</p>

        {/* Warning box */}
        <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-3.5 mb-5">
          <AlertTriangle size={18} className="shrink-0 text-red-500 mt-0.5" />
          <p className="text-sm text-red-700 font-medium">{warningText}</p>
        </div>

        {/* Reason select */}
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{reasonLabel}</label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-red-400 text-gray-700"
        >
          <option value="">เลือกเหตุผล</option>
          {reasonOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Note textarea */}
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          รายละเอียดเพิ่มเติม (ไม่บังคับ)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX_LENGTH))}
          rows={3}
          placeholder="เช่น งานพิมพ์มีปัญหา, ลูกค้าแจ้งยกเลิก ฯลฯ"
          className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-red-400 text-gray-700"
        />
        <p className="text-[11px] text-gray-400 text-right mt-1 mb-5">
          {note.length}/{NOTE_MAX_LENGTH}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-md shadow-red-200 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
