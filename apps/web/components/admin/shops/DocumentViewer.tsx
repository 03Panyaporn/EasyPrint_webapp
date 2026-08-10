"use client";

import { X, FileText, ImageIcon, Eye, Download } from "lucide-react";
import type { MockDocument, MockShop } from "@/lib/mock/adminShops";

interface DocumentViewerProps {
  shop: MockShop;
  onClose: () => void;
}

export default function DocumentViewer({ shop, onClose }: DocumentViewerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              ตรวจสอบเอกสาร — {shop.name}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              เอกสารทั้งหมด {shop.documents.length} ไฟล์
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Document list */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-2">
          {shop.documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400 text-center gap-2">
              <FileText size={32} className="text-gray-300" />
              <p className="text-sm font-semibold text-gray-500">ยังไม่มีเอกสารแนบ</p>
              <p className="text-xs text-gray-400">ร้านค้านี้ยังไม่ได้อัปโหลดเอกสารประกอบการลงทะเบียน</p>
            </div>
          ) : (
            shop.documents.map((doc) => (
              <DocRow key={doc.id} doc={doc} />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

function DocRow({ doc }: { doc: MockDocument }) {
  const isPdf = doc.type === "pdf";
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors group">
      {/* File icon */}
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          isPdf
            ? "bg-red-100 text-red-500"
            : "bg-blue-100 text-blue-500"
        }`}
      >
        {isPdf ? <FileText size={20} /> : <ImageIcon size={20} />}
      </div>

      {/* Name + size */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
        <p className="text-xs text-gray-500">{doc.size}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => window.open(doc.url, "_blank", "noopener,noreferrer")}
          className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
          title="ดูตัวอย่าง"
        >
          <Eye size={14} />
        </button>
        <a
          href={doc.url}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
          title="ดาวน์โหลด"
        >
          <Download size={14} />
        </a>
      </div>
    </div>
  );
}
