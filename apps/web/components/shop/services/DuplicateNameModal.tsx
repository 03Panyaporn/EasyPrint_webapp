"use client";

import { useState, useEffect, useRef } from "react";
import { X, Copy, Loader2 } from "lucide-react";

interface DuplicateNameModalProps {
  isOpen: boolean;
  originalName: string;
  onConfirm: (newName: string) => Promise<void>;
  onClose: () => void;
}

export default function DuplicateNameModal({
  isOpen,
  originalName,
  onConfirm,
  onClose,
}: DuplicateNameModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(`${originalName} (สำเนา)`);
      setError("");
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [isOpen, originalName]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("กรุณากรอกชื่อบริการ");
      return;
    }
    setLoading(true);
    try {
      await onConfirm(trimmed);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "คัดลอกไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
              <Copy size={18} className="text-orange-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">คัดลอกบริการ</h3>
              <p className="text-xs text-gray-500 mt-0.5">ตั้งชื่อสำหรับบริการที่คัดลอก</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-1">
            <X size={18} />
          </button>
        </div>

        {/* Source service name */}
        <div className="px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500">
          จาก: <span className="font-semibold text-gray-700">{originalName}</span>
        </div>

        {/* Name input */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">ชื่อบริการใหม่</label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleConfirm()}
            className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition ${
              error ? "border-red-400 bg-red-50" : "border-gray-200"
            }`}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <p className="text-xs text-gray-400">
            บริการที่คัดลอกจะมีราคา ตัวเลือก ไฟล์ และบริการเสริมเดียวกัน (ปิดใช้งานไว้ก่อน)
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !name.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-md shadow-orange-200 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                คัดลอก...
              </>
            ) : (
              <>
                <Copy size={15} />
                สร้างสำเนา
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
