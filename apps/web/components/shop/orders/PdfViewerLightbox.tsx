"use client";

import { useEffect, useRef, useState } from "react";
import { X, Maximize2, Minimize2, FileText, Download, ExternalLink } from "lucide-react";
import { Order } from "./types";

interface PdfViewerLightboxProps {
  order: Order | null;
  onClose: () => void;
}

export default function PdfViewerLightbox({ order, onClose }: PdfViewerLightboxProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  if (!order) return null;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div
        ref={containerRef}
        className="relative w-full max-w-5xl h-[88vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
          <h2 className="text-sm font-bold text-gray-800 truncate">
            ดูไฟล์งาน <span className="font-normal text-gray-400">({order.file.name})</span>
          </h2>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              title={isFullscreen ? "ออกจากเต็มจอ" : "ดูเต็มจอ"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body — ใช้ตัวแสดง PDF ในตัวของเบราว์เซอร์ แสดงไฟล์งานจริงที่ลูกค้าอัปโหลด (ไม่ใช่ mock) */}
        <div className="flex-1 min-h-0 bg-gray-100">
          {order.rawFileUrl ? (
            <iframe
              src={order.rawFileUrl}
              title={order.file.name}
              className="w-full h-full border-0"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-gray-400">
              <FileText size={32} />
              <p className="text-sm">ไม่พบไฟล์งาน หรือลิงก์หมดอายุแล้ว</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
              <FileText size={15} className="text-red-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">{order.file.name}</p>
            </div>
          </div>
          {order.rawFileUrl && (
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={order.rawFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-semibold transition-colors"
              >
                <ExternalLink size={14} />
                เปิดแท็บใหม่
              </a>
              <a
                href={order.rawFileUrl}
                download={order.file.name}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-md shadow-orange-200 transition-colors"
              >
                <Download size={14} />
                ดาวน์โหลด
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
