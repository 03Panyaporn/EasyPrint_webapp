"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  Menu,
  Minus,
  Plus,
  Printer,
  Maximize2,
  Minimize2,
  FileText,
  ChevronDown,
  Check,
} from "lucide-react";
import { Order } from "./types";
import DocumentPageContent from "./DocumentPageContent";
import { buildMockPdfBlob, downloadBlob } from "./pdfMock";

interface PdfViewerLightboxProps {
  order: Order | null;
  onClose: () => void;
}

export default function PdfViewerLightbox({ order, onClose }: PdfViewerLightboxProps) {
  const pageCount = order
    ? Math.min(12, Math.max(3, Math.round(order.totalPages / 8)))
    : 0;
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  if (!order) return null;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {
        showToast("เบราว์เซอร์ไม่อนุญาตโหมดเต็มจอ");
      });
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=680,height=880");
    if (!printWindow) {
      showToast("เบราว์เซอร์บล็อกหน้าต่างพิมพ์");
      return;
    }
    printWindow.document.write(`
      <html>
        <head><title>${order.file.name}</title></head>
        <body style="margin:0;padding:32px;font-family:sans-serif;display:flex;justify-content:center;background:#f3f4f6;">
          <div style="width:100%;max-width:560px;background:#fff;padding:32px;box-shadow:0 1px 4px rgba(0,0,0,0.1);">
            <div style="height:14px;width:66%;background:#1f2937;border-radius:9999px;margin-bottom:8px;"></div>
            <div style="height:10px;width:50%;background:#d1d5db;border-radius:9999px;margin-bottom:24px;"></div>
            <p style="color:#6b7280;font-size:13px;">ไฟล์งาน: ${order.file.name} (${order.file.sizeLabel})</p>
            <p style="color:#6b7280;font-size:13px;">ออเดอร์: ${order.code} — ${order.customerName}</p>
            <p style="color:#9ca3af;font-size:12px;margin-top:24px;">ตัวอย่างเอกสารจำลองสำหรับพิมพ์ (mock preview)</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleDownload = () => {
    const blob = buildMockPdfBlob(`EasyPrint mock file - order ${order.code}`);
    downloadBlob(blob, order.file.name.endsWith(".pdf") ? order.file.name : `${order.file.name}.pdf`);
    showToast("ดาวน์โหลดไฟล์แล้ว");
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
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 text-gray-200 text-xs shrink-0">
          <button
            onClick={() => setShowSidebar((s) => !s)}
            className={`p-1.5 rounded transition-colors ${
              showSidebar ? "bg-white/10" : "hover:bg-white/10"
            }`}
            title={showSidebar ? "ซ่อนหน้าตัวอย่าง" : "แสดงหน้าตัวอย่าง"}
          >
            <Menu size={15} />
          </button>

          <div className="flex items-center gap-1 px-2 py-1 rounded cursor-default">
            <span>
              {currentPage} / {pageCount}
            </span>
            <ChevronDown size={12} className="text-gray-400" />
          </div>

          <div className="w-px h-4 bg-white/15" />

          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 25))}
              className="p-1.5 rounded hover:bg-white/10 transition-colors"
            >
              <Minus size={14} />
            </button>
            <span className="w-11 text-center">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(200, z + 25))}
              className="p-1.5 rounded hover:bg-white/10 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="flex-1" />

          <button
            onClick={handlePrint}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            title="พิมพ์"
          >
            <Printer size={15} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            title={isFullscreen ? "ออกจากเต็มจอ" : "ดูเต็มจอ"}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Thumbnails sidebar */}
          {showSidebar && (
            <div className="w-24 bg-gray-900 overflow-y-auto py-4 flex flex-col items-center gap-3 shrink-0">
              {Array.from({ length: pageCount }).map((_, i) => {
                const page = i + 1;
                const active = page === currentPage;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className="flex flex-col items-center gap-1 shrink-0"
                  >
                    <div
                      className={`w-14 h-[72px] bg-white rounded-sm overflow-hidden ring-2 transition-all ${
                        active ? "ring-blue-500" : "ring-transparent hover:ring-white/30"
                      }`}
                    >
                      <DocumentPageContent compact />
                    </div>
                    <span className={`text-[10px] ${active ? "text-blue-400" : "text-gray-500"}`}>
                      {page}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Main page area */}
          <div className="flex-1 bg-gray-100 overflow-y-auto p-6 flex justify-center">
            <div
              className="bg-white shadow-md border border-gray-200 shrink-0 h-fit"
              style={{ width: `${(560 * zoom) / 100}px`, aspectRatio: "3 / 4" }}
            >
              <DocumentPageContent />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
              <FileText size={15} className="text-red-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">{order.file.name}</p>
              <p className="text-[11px] text-gray-400">{order.file.sizeLabel}</p>
            </div>
          </div>
          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-md shadow-orange-200 transition-colors shrink-0"
          >
            ดาวน์โหลด
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-xs rounded-xl shadow-xl">
            <Check size={14} className="text-emerald-400" />
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
