"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Printer,
  UploadCloud,
  FileText,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minus,
  Plus,
  MapPin,
  Clock,
  Truck,
  Star,
  ArrowLeft,
  ShoppingCart,
  Check,
  ChevronRight,
  Store,
  X,
  ExternalLink,
} from "lucide-react";
import CustomerNavbar from "@/components/layout/CustomerNavbar";

async function parsePdfPageCount(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const text = new TextDecoder("latin1").decode(bytes);

    // 1. Search for /Count inside /Type /Pages
    const countMatches = text.match(/\/Type\s*\/Pages[^]*?\/Count\s+(\d+)/g);
    if (countMatches && countMatches.length > 0) {
      let maxCount = 0;
      for (const m of countMatches) {
        const numMatch = m.match(/\/Count\s+(\d+)/);
        if (numMatch) {
          const count = parseInt(numMatch[1], 10);
          if (count > maxCount) maxCount = count;
        }
      }
      if (maxCount > 0) return maxCount;
    }

    // 2. Secondary search for any /Count X
    const generalCounts = text.match(/\/Count\s+(\d+)/g);
    if (generalCounts && generalCounts.length > 0) {
      let maxCount = 0;
      for (const m of generalCounts) {
        const numMatch = m.match(/\/Count\s+(\d+)/);
        if (numMatch) {
          const count = parseInt(numMatch[1], 10);
          if (count > maxCount) maxCount = count;
        }
      }
      if (maxCount > 0) return maxCount;
    }

    // 3. Fallback search for /Type /Page
    const pageMatches = text.match(/\/Type\s*\/Page(?!\s*s)/g);
    if (pageMatches && pageMatches.length > 0) {
      return pageMatches.length;
    }
  } catch (err) {
    console.error("PDF Parsing error:", err);
  }
  return 1;
}

export default function OrderPrintingServicePage() {
  // ── Form State ──────────────────────────────────────────────────────────
  const [file, setFile] = useState<{
    name: string;
    pages: number;
    size?: string;
    previewUrl?: string;
  } | null>({
    name: "ข้อเสนอโครงการ_EasyPrint.pdf",
    pages: 18,
    size: "3.2 MB",
  });
  const [isParsingPdf, setIsParsingPdf] = useState<boolean>(false);
  const [printType, setPrintType] = useState<"bw" | "color">("color");
  const [paperSize, setPaperSize] = useState<"A3" | "A4" | "A5">("A4");
  const [quantity, setQuantity] = useState<number>(1);
  const [extraServices, setExtraServices] = useState<{
    binding: boolean;
    laminating: boolean;
    stapling: boolean;
    clearCover: boolean;
  }>({
    binding: true, // +30
    laminating: false, // +20
    stapling: false, // +10
    clearCover: true, // +10
  });
  const [note, setNote] = useState<string>("");

  // Preview state
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [addedToCart, setAddedToCart] = useState<boolean>(false);
  const [showReviewsModal, setShowReviewsModal] = useState<boolean>(false);
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Price Calculation ───────────────────────────────────────────────────
  const pageCount = file?.pages || 18;
  const pricePerPage =
    printType === "color"
      ? paperSize === "A3"
        ? 12
        : paperSize === "A4"
        ? 6.67
        : 4
      : paperSize === "A3"
      ? 3
      : paperSize === "A4"
      ? 1.5
      : 1;

  const basePrintCost = Math.round(pageCount * pricePerPage * quantity);

  let extraServiceCost = 0;
  if (extraServices.binding) extraServiceCost += 30 * quantity;
  if (extraServices.laminating) extraServiceCost += 20 * quantity;
  if (extraServices.stapling) extraServiceCost += 10 * quantity;
  if (extraServices.clearCover) extraServiceCost += 10 * quantity;

  const totalPrice = basePrintCost + extraServiceCost;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setIsParsingPdf(true);
      const detectedPages = await parsePdfPageCount(selected);
      const formattedSize =
        selected.size > 1024 * 1024
          ? `${(selected.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(selected.size / 1024)} KB`;
      const objectUrl = URL.createObjectURL(selected);

      setFile({
        name: selected.name,
        pages: detectedPages,
        size: formattedSize,
        previewUrl: objectUrl,
      });
      setCurrentPage(1);
      setIsParsingPdf(false);
    }
  };

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] font-sans flex flex-col pb-28">
      {/* ── 1. Global Navigation Bar ────────────────────────────────────── */}
      <CustomerNavbar cartCount={addedToCart ? 4 : 3} />

      {/* ── 2. Prominent Store Header / Banner Section ──────────────────── */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">
        {/* Large Cover Image Header Banner */}
        <div className="relative rounded-[24px] overflow-hidden shadow-sm py-8 sm:py-10 px-6 sm:px-10 border border-gray-100 min-h-[190px]">
          {/* Shop Cover Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?q=80&w=1600&auto=format&fit=crop')",
            }}
          />
          {/* Subtle Dark Overlay 40% */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />

          {/* Status Badge in Top Right Corner */}
          <span className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-500/90 text-white font-bold rounded-full text-xs sm:text-sm backdrop-blur-sm shadow-md border border-white/20">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            เปิดอยู่
          </span>

          {/* Large Header Content */}
          <div className="relative h-full flex items-center gap-6 sm:gap-8 z-10">
            {/* Circular Shop Logo Container (Larger) */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white text-[#FF6B35] flex flex-col items-center justify-center font-black text-center shadow-xl border-4 border-white/30 shrink-0 p-1.5 leading-none">
              <span className="text-lg sm:text-xl font-black tracking-tight">ABC</span>
              <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold mt-0.5">
                PRINT & COPY
              </span>
            </div>

            {/* Shop Main Details (Larger) */}
            <div className="text-white space-y-2 min-w-0">
              {/* Row 1: Shop Name */}
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-md">
                ABC Print & Copy
              </h1>

              {/* Row 2: Review Button | Location Button */}
              <div className="flex items-center gap-4 text-sm sm:text-base text-white/95 flex-wrap">
                {/* Rating Button */}
                <button
                  type="button"
                  onClick={() => setShowReviewsModal(true)}
                  className="inline-flex items-center gap-1.5 font-semibold hover:text-[#FF6B35] transition-colors group cursor-pointer"
                >
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-white">4.9</span>
                  <span className="text-white/80 group-hover:text-white text-xs sm:text-sm">(325 รีวิว)</span>
                  <ChevronRight className="w-4 h-4 text-white/70 group-hover:text-[#FF6B35] transition-transform group-hover:translate-x-0.5" />
                </button>

                {/* Divider */}
                <span className="text-white/30 font-light">|</span>

                {/* Location Button */}
                <button
                  type="button"
                  onClick={() => setShowLocationModal(true)}
                  className="inline-flex items-center gap-2 font-semibold hover:text-[#FF6B35] transition-colors group cursor-pointer"
                >
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF6B35]" />
                  <span className="text-white group-hover:text-[#FF6B35] text-xs sm:text-sm">ดูที่ตั้งร้าน</span>
                  <ChevronRight className="w-4 h-4 text-white/70 group-hover:text-[#FF6B35] transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── 3. Main Layout Grid (2 Columns) ─────────────────────────────── */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ───────────────────────────────────────────────────────────── */}
          {/* LEFT COLUMN (45% -> lg:col-span-5)                           */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-5 space-y-5">
            {/* Card 1: Upload File Card (Compact) */}
            <div className="bg-white rounded-[16px] shadow-2xs border border-gray-100 p-4 sm:p-4.5 space-y-3">
              <h2 className="text-sm font-bold text-slate-800">
                อัปโหลดไฟล์ PDF
              </h2>

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const droppedFile = e.dataTransfer.files?.[0];
                  if (droppedFile && droppedFile.type === "application/pdf") {
                    handleFileSelect({
                      target: { files: e.dataTransfer.files },
                    } as any);
                  }
                }}
                className="border-2 border-dashed border-[#FF6B35]/40 bg-[#FF6B35]/5 hover:bg-[#FF6B35]/10 hover:border-[#FF6B35] rounded-[14px] p-3.5 sm:p-4 text-center cursor-pointer transition-all duration-200 group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf"
                  className="hidden"
                />
                <div className="w-9 h-9 rounded-full bg-[#FF6B35]/10 group-hover:scale-110 flex items-center justify-center mx-auto mb-1.5 transition-transform">
                  <UploadCloud className="w-5 h-5 text-[#FF6B35] stroke-[2]" />
                </div>
                <p className="text-xs font-bold text-slate-700 mb-0.5">
                  ลากไฟล์ PDF มาวางที่นี่
                </p>
                <p className="text-[11px] text-gray-400 mb-2">หรือ</p>
                <button
                  type="button"
                  className="px-4 py-1.5 bg-white border border-[#FF6B35] text-[#FF6B35] font-bold text-[11px] rounded-full shadow-2xs group-hover:bg-[#FF6B35] group-hover:text-white transition-all"
                >
                  เลือกไฟล์
                </button>
              </div>

              {/* Uploaded File Info Badge */}
              {file && (
                <div className="flex items-center justify-between p-2.5 bg-[#F5F6F8] rounded-[12px] border border-gray-200/80">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-red-100 text-red-500 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 stroke-[2]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-[#FF6B35] font-semibold">
                        {isParsingPdf
                          ? "กำลังคำนวณจำนวนหน้า..."
                          : `คำนวณได้ ${file.pages} หน้า ${file.size ? `(${file.size})` : ""}`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-bold text-gray-500 hover:text-[#FF6B35] underline shrink-0 ml-2"
                  >
                    เปลี่ยนไฟล์
                  </button>
                </div>
              )}

              <p className="text-center text-[10px] text-gray-400">
                รองรับไฟล์ PDF ขนาดไม่เกิน 100MB
              </p>
            </div>

            {/* Card 2: Print Type Card (Compact) */}
            <div className="bg-white rounded-[16px] shadow-2xs border border-gray-100 p-4 sm:p-4.5 space-y-2.5">
              <h2 className="text-sm font-bold text-slate-800">
                ประเภทการพิมพ์
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                {/* ขาวดำ */}
                <button
                  type="button"
                  onClick={() => setPrintType("bw")}
                  className={`flex items-center justify-center gap-2.5 p-2.5 rounded-[12px] border-2 font-bold text-xs transition-all ${
                    printType === "bw"
                      ? "border-[#FF6B35] bg-[#FF6B35]/5 text-[#FF6B35]"
                      : "border-gray-100 bg-white text-slate-600 hover:border-gray-200"
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      printType === "bw"
                        ? "border-[#FF6B35]"
                        : "border-gray-300"
                    }`}
                  >
                    {printType === "bw" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]" />
                    )}
                  </span>
                  <span>ขาวดำ</span>
                </button>

                {/* สี */}
                <button
                  type="button"
                  onClick={() => setPrintType("color")}
                  className={`flex items-center justify-center gap-2.5 p-2.5 rounded-[12px] border-2 font-bold text-xs transition-all ${
                    printType === "color"
                      ? "border-[#FF6B35] bg-[#FF6B35]/5 text-[#FF6B35]"
                      : "border-gray-100 bg-white text-slate-600 hover:border-gray-200"
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                      printType === "color"
                        ? "border-[#FF6B35]"
                        : "border-gray-300"
                    }`}
                  >
                    {printType === "color" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]" />
                    )}
                  </span>
                  <span>สี</span>
                </button>
              </div>
            </div>

            {/* Card 3: Paper Size Card (Compact) */}
            <div className="bg-white rounded-[16px] shadow-2xs border border-gray-100 p-4 sm:p-4.5 space-y-2.5">
              <h2 className="text-sm font-bold text-slate-800">
                ขนาดกระดาษ
              </h2>
              <div className="grid grid-cols-3 gap-2.5">
                {(["A3", "A4", "A5"] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setPaperSize(size)}
                    className={`py-2 rounded-[12px] border-2 font-bold text-xs transition-all ${
                      paperSize === size
                        ? "border-[#FF6B35] bg-white text-[#FF6B35] shadow-2xs"
                        : "border-gray-100 bg-white text-slate-600 hover:border-gray-200"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Card 4: Quantity & Extra Service Card (Compact) */}
            <div className="bg-white rounded-[16px] shadow-2xs border border-gray-100 p-4 sm:p-4.5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                {/* Quantity Stepper */}
                <div className="sm:col-span-5 space-y-1.5">
                  <h2 className="text-sm font-bold text-slate-800">
                    จำนวนชุด
                  </h2>
                  <div className="flex items-center gap-1 bg-[#F5F6F8] p-1 rounded-[12px] border border-gray-200/60">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#FF6B35] disabled:text-gray-300 shadow-2xs hover:bg-gray-50 active:scale-95 transition-all"
                    >
                      <Minus className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                    <span className="flex-1 text-center font-black text-slate-800 text-sm">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#FF6B35] shadow-2xs hover:bg-gray-50 active:scale-95 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>
                </div>

                {/* Extra Service Checkbox Grid (2x2) */}
                <div className="sm:col-span-7 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-800">
                      บริการเสริม
                    </h2>
                    <span className="text-[10px] text-gray-400 font-medium">
                      (เลือกได้หลายรายการ)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {/* 1. เข้าเล่ม */}
                    <label
                      className={`flex flex-col p-2 rounded-lg border-2 cursor-pointer transition-all ${
                        extraServices.binding
                          ? "border-[#FF6B35] bg-[#FF6B35]/5"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={extraServices.binding}
                          onChange={(e) =>
                            setExtraServices((prev) => ({
                              ...prev,
                              binding: e.target.checked,
                            }))
                          }
                          className="w-3.5 h-3.5 accent-[#FF6B35] rounded"
                        />
                        <span className="text-[11px] font-bold text-slate-800">
                          เข้าเล่ม
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 ml-5 mt-0.5">
                        +30 บาท
                      </span>
                    </label>

                    {/* 2. เคลือบ */}
                    <label
                      className={`flex flex-col p-2 rounded-lg border-2 cursor-pointer transition-all ${
                        extraServices.laminating
                          ? "border-[#FF6B35] bg-[#FF6B35]/5"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={extraServices.laminating}
                          onChange={(e) =>
                            setExtraServices((prev) => ({
                              ...prev,
                              laminating: e.target.checked,
                            }))
                          }
                          className="w-3.5 h-3.5 accent-[#FF6B35] rounded"
                        />
                        <span className="text-[11px] font-bold text-slate-800">
                          เคลือบ
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 ml-5 mt-0.5">
                        +20 บาท
                      </span>
                    </label>

                    {/* 3. เย็บแม็กซ์ */}
                    <label
                      className={`flex flex-col p-2 rounded-lg border-2 cursor-pointer transition-all ${
                        extraServices.stapling
                          ? "border-[#FF6B35] bg-[#FF6B35]/5"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={extraServices.stapling}
                          onChange={(e) =>
                            setExtraServices((prev) => ({
                              ...prev,
                              stapling: e.target.checked,
                            }))
                          }
                          className="w-3.5 h-3.5 accent-[#FF6B35] rounded"
                        />
                        <span className="text-[11px] font-bold text-slate-800">
                          เย็บแม็กซ์
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 ml-5 mt-0.5">
                        +10 บาท
                      </span>
                    </label>

                    {/* 4. ปกใส */}
                    <label
                      className={`flex flex-col p-2 rounded-lg border-2 cursor-pointer transition-all ${
                        extraServices.clearCover
                          ? "border-[#FF6B35] bg-[#FF6B35]/5"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={extraServices.clearCover}
                          onChange={(e) =>
                            setExtraServices((prev) => ({
                              ...prev,
                              clearCover: e.target.checked,
                            }))
                          }
                          className="w-3.5 h-3.5 accent-[#FF6B35] rounded"
                        />
                        <span className="text-[11px] font-bold text-slate-800">
                          ปกใส
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 ml-5 mt-0.5">
                        +10 บาท
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 5: Note Card (Compact) */}
            <div className="bg-white rounded-[16px] shadow-2xs border border-gray-100 p-4 sm:p-4.5 space-y-2">
              <h2 className="text-sm font-bold text-slate-800">
                หมายเหตุถึงร้าน <span className="text-gray-400 font-normal text-[11px]">(ถ้ามี)</span>
              </h2>
              <div className="relative">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 200))}
                  maxLength={200}
                  placeholder="เช่น พิมพ์หน้าเดียว, ไม่เข้าเล่ม, ส่งภายในวันพรุ่งนี้ เป็นต้น"
                  rows={2}
                  className="w-full bg-[#F5F6F8] border border-gray-200/80 rounded-[12px] p-2.5 text-xs text-slate-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition-all resize-none"
                />
                <span className="absolute bottom-2 right-3 text-[10px] font-semibold text-gray-400">
                  {note.length}/200
                </span>
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* RIGHT COLUMN (55% -> lg:col-span-7)                          */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-7 space-y-4">
            {/* Card 1: PDF Preview Card (Compact) */}
            <div className="bg-white rounded-[16px] shadow-2xs border border-gray-100 p-4 sm:p-4.5 space-y-2.5">
              <h2 className="text-sm font-bold text-slate-800">
                พรีวิวไฟล์ PDF
              </h2>

              {/* PDF Canvas Container Compact (~320 x 380 px) */}
              <div className="relative bg-[#CBD5E1] rounded-[14px] p-3 flex items-center justify-center min-h-[320px] max-h-[380px] overflow-hidden shadow-inner group">
                {file?.previewUrl ? (
                  /* Real Uploaded PDF Viewer Frame */
                  <div className="w-full max-w-[380px] h-[330px] rounded-[10px] bg-white shadow-xl overflow-hidden relative">
                    <iframe
                      src={`${file.previewUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                      className="w-full h-full border-0"
                      title="Real PDF Preview"
                    />
                  </div>
                ) : (
                  /* Fallback Mock Document Preview */
                  <div
                    className="bg-white shadow-xl rounded-sm p-4 sm:p-6 w-full max-w-[320px] h-[330px] flex flex-col justify-between transition-transform duration-200 select-none overflow-hidden"
                    style={{ transform: `scale(${zoomLevel / 100})` }}
                  >
                    {/* Sample PDF Document Content Header */}
                    <div className="text-center space-y-1 border-b border-gray-200 pb-3">
                      <div className="w-8 h-8 mx-auto rounded-full bg-slate-100 flex items-center justify-center">
                        <Printer className="w-4 h-4 text-slate-600" />
                      </div>
                      <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest truncate max-w-[240px] mx-auto">
                        {file?.name || "ข้อเสนอโครงการมหาวิทยาลัย"}
                      </p>
                      <p className="text-[8px] text-slate-500">
                        คำร้องขอจัดทำเอกสารและสิ่งพิมพ์
                      </p>
                    </div>

                    {/* Sample Document Body Lines */}
                    <div className="space-y-2 my-2 flex-1">
                      <div className="h-1.5 bg-slate-200 rounded-full w-full" />
                      <div className="h-1.5 bg-slate-200 rounded-full w-5/6" />
                      <div className="h-1.5 bg-slate-200 rounded-full w-4/6" />
                      <div className="h-1.5 bg-slate-100 rounded-full w-full mt-3" />
                      <div className="h-1.5 bg-slate-100 rounded-full w-full" />
                      <div className="h-1.5 bg-slate-100 rounded-full w-3/4" />
                    </div>

                    {/* Document Footer */}
                    <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-[8px] text-slate-400 font-medium">
                      <span>EASYPRINT SYSTEM</span>
                      <span>หน้า {currentPage} จาก {pageCount}</span>
                    </div>
                  </div>
                )}

                {/* Bottom Dark Toolbar */}
                <div className="absolute bottom-4 inset-x-6 bg-[#1E293B]/90 backdrop-blur-md text-white rounded-xl py-2 px-4 flex items-center justify-between text-xs font-semibold shadow-lg">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.max(75, z - 10))}
                      className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition"
                      title="ซูมออก"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
                      className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition"
                      title="ซูมเข้า"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Page Indicator */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="text-white/60 hover:text-white disabled:opacity-30"
                    >
                      ‹
                    </button>
                    <span className="font-mono text-white/90">
                      {currentPage} / {pageCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
                      disabled={currentPage >= pageCount}
                      className="text-white/60 hover:text-white disabled:opacity-30"
                    >
                      ›
                    </button>
                  </div>

                  {/* Fullscreen */}
                  <button
                    type="button"
                    onClick={() => setZoomLevel(100)}
                    className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition"
                    title="เต็มหน้าจอ"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Verified file indicator */}
              <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs pt-1">
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>ตรวจสอบไฟล์แล้ว</span>
              </div>
            </div>

            {/* Card 2: Price Summary Card (Directly Below Preview) */}
            <div className="bg-white rounded-[20px] shadow-xs border border-gray-100 p-6 space-y-4">
              <h2 className="text-base font-bold text-slate-800">
                รายละเอียดราคา
              </h2>

              <div className="space-y-2.5 text-sm text-slate-600 font-medium">
                {/* Row 1: Page count */}
                <div className="flex justify-between items-center">
                  <span>จำนวนหน้า</span>
                  <span className="font-bold text-slate-800">{pageCount} หน้า</span>
                </div>

                {/* Row 2: Print cost */}
                <div className="flex justify-between items-center">
                  <span>
                    ค่าพิมพ์ ({printType === "color" ? "สี" : "ขาวดำ"}, {paperSize}, {quantity} ชุด)
                  </span>
                  <span className="font-bold text-slate-800">{basePrintCost} บาท</span>
                </div>

                {/* Row 3: Extra services */}
                <div className="flex justify-between items-center">
                  <span>บริการเสริม</span>
                  <span className="font-bold text-slate-800">{extraServiceCost} บาท</span>
                </div>
              </div>

              {/* Dotted Divider */}
              <div className="border-t-2 border-dashed border-gray-100 pt-3" />

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-slate-800">
                  รวมทั้งหมด
                </span>
                <span className="text-3xl font-black text-[#FF6B35] tracking-tight">
                  {totalPrice} บาท
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── 4. Sticky Bottom Bar ───────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] py-3 px-6 sm:px-12 flex items-center justify-between">
        {/* Left: Total Price */}
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
          <span className="text-xs sm:text-sm font-bold text-slate-600">
            รวมทั้งหมด
          </span>
          <span className="text-2xl sm:text-3xl font-black text-[#FF6B35] tracking-tight">
            {totalPrice} บาท
          </span>
        </div>

        {/* Right: Add to Cart Button */}
        <button
          type="button"
          onClick={handleAddToCart}
          className="h-[56px] px-8 bg-[#FF6B35] hover:bg-[#e05825] active:bg-[#c94917] text-white font-bold text-base sm:text-lg rounded-[14px] shadow-lg shadow-[#FF6B35]/25 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5"
        >
          {addedToCart ? (
            <>
              <Check className="w-6 h-6 stroke-[3]" />
              เพิ่มลงตะกร้าแล้ว!
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5 stroke-[2.5]" />
              เพิ่มลงตะกร้า
            </>
          )}
        </button>
      </div>

      {/* ── 5. Reviews Modal ────────────────────────────────────────────── */}
      {showReviewsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] shadow-2xl max-w-lg w-full p-6 space-y-5 border border-gray-100 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <h3 className="text-lg font-bold text-slate-800">
                  รีวิวจากลูกค้า (325 รีวิว)
                </h3>
              </div>
              <button
                onClick={() => setShowReviewsModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overall Rating Summary */}
            <div className="bg-amber-50/60 rounded-[16px] p-4 flex items-center gap-6 border border-amber-100/80">
              <div className="text-center shrink-0">
                <span className="text-4xl font-black text-slate-800 tracking-tight">4.9</span>
                <div className="flex items-center gap-0.5 justify-center mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-[11px] text-gray-500 font-medium mt-1 block">คะแนนเฉลี่ย</span>
              </div>

              {/* Progress bars */}
              <div className="flex-1 space-y-1.5 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="w-6 text-right font-semibold">5 ★</span>
                  <div className="flex-1 h-2 bg-amber-200/50 rounded-full overflow-hidden">
                    <div className="w-[92%] h-full bg-amber-400 rounded-full" />
                  </div>
                  <span className="w-8 text-right font-medium text-gray-400">92%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 text-right font-semibold">4 ★</span>
                  <div className="flex-1 h-2 bg-amber-200/50 rounded-full overflow-hidden">
                    <div className="w-[6%] h-full bg-amber-400 rounded-full" />
                  </div>
                  <span className="w-8 text-right font-medium text-gray-400">6%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 text-right font-semibold">3 ★</span>
                  <div className="flex-1 h-2 bg-amber-200/50 rounded-full overflow-hidden">
                    <div className="w-[2%] h-full bg-amber-400 rounded-full" />
                  </div>
                  <span className="w-8 text-right font-medium text-gray-400">2%</span>
                </div>
              </div>
            </div>

            {/* Sample Customer Reviews */}
            <div className="space-y-3 divide-y divide-gray-100">
              <div className="pt-3 first:pt-0 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">กิตติพงษ์ ส.</span>
                  <span className="text-gray-400">2 ชั่วโมงที่แล้ว</span>
                </div>
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-gray-600">
                  พิมพ์สีสวยมาก คมชัด ไวมากๆ อัปไฟล์ปุ๊บ 15 นาทีวิ่งไปรับได้เลย สะดวกสุดๆ
                </p>
              </div>

              <div className="pt-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">ณัฐณิชา พ.</span>
                  <span className="text-gray-400">เมื่อวานนี้</span>
                </div>
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-gray-600">
                  เข้าเล่มสันเกลียวสวยงาม เป็นระเบียบมากค่ะ พ่อค้าพูดจาดี อุดหนุนประจำค่ะ
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowReviewsModal(false)}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold text-sm rounded-[12px] transition-colors"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* ── 6. Location Modal ───────────────────────────────────────────── */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] shadow-2xl max-w-md w-full p-6 space-y-5 border border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#FF6B35]" />
                <h3 className="text-lg font-bold text-slate-800">ที่ตั้งร้าน ABC Print & Copy</h3>
              </div>
              <button
                onClick={() => setShowLocationModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Details */}
            <div className="space-y-3 text-sm text-slate-700">
              <div className="bg-slate-50 p-4 rounded-[16px] border border-slate-100 space-y-2">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#FF6B35] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800">ที่อยู่หน้าร้าน:</p>
                    <p className="text-xs text-gray-600 leading-relaxed mt-0.5">
                      99 หมู่ 9 ถนนพะโย-นครสวรรค์ หน้ามหาวิทยาลัยพะเยา ต.แม่กา อ.เมือง จ.พะเยา 56000
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-gray-600 pt-2 border-t border-slate-200/60">
                  <Clock className="w-4 h-4 text-[#FF6B35] shrink-0" />
                  <span>เปิดบริการทุกวัน: 08:00 – 21:00 น.</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <a
                  href="https://maps.google.com/?q=University+of+Phayao"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-[#FF6B35] hover:bg-[#e05825] text-white font-bold text-xs sm:text-sm rounded-[12px] flex items-center justify-center gap-2 shadow-md shadow-[#FF6B35]/20 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  เปิดใน Google Maps
                </a>
                <button
                  onClick={() => setShowLocationModal(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold text-xs sm:text-sm rounded-[12px] transition-colors"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
