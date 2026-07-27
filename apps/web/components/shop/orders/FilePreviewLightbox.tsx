"use client";

import { X } from "lucide-react";
import { Order } from "./types";
import { renderFileMock } from "./FilePreviewContent";

interface FilePreviewLightboxProps {
  order: Order | null;
  kind: "file" | "slip" | null;
  onClose: () => void;
}

export default function FilePreviewLightbox({ order, kind, onClose }: FilePreviewLightboxProps) {
  if (!order || !kind) return null;

  const file = kind === "slip" ? order.paymentSlip : order.file;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative flex flex-col items-center gap-4 max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors z-10"
        >
          <X size={18} />
        </button>

        <div className="rounded-2xl overflow-hidden shadow-2xl max-h-[75vh] overflow-y-auto">
          {renderFileMock(order, kind)}
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-white">{file.name}</p>
          <p className="text-xs text-white/70">{file.sizeLabel}</p>
        </div>
      </div>
    </div>
  );
}
