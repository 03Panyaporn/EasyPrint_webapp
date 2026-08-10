"use client";

import type { CSSProperties } from "react";
import { Search, Printer, Upload, FileText, Palette, Send, ChevronLeft } from "lucide-react";

// grid จุดเล็กๆ ตกแต่งพื้นหลัง — ทำด้วย radial-gradient ซ้ำ ไม่ต้องใช้ภาพ
const DOT_GRID_STYLE: CSSProperties = {
  backgroundImage: "radial-gradient(circle, rgba(234,88,12,0.35) 1.5px, transparent 1.5px)",
  backgroundSize: "10px 10px",
};

interface ShopSearchHeroProps {
  searchText: string;
  onSearchTextChange: (v: string) => void;
  onViewAllClick: () => void;
}

export default function ShopSearchHero({
  searchText,
  onSearchTextChange,
  onViewAllClick,
}: ShopSearchHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#fdf2e9] via-[#fce3cc] to-[#f8c89b] pt-6 sm:pt-10 pb-6 sm:pb-8 px-4 sm:px-6">
      {/* keyframes ลอยตัวเบาๆ ให้พื้นหลังดูมีชีวิตชีวาขึ้น — inline ไว้ในคอมโพเนนต์นี้ที่เดียว ไม่ต้องแก้ tailwind.config ส่วนกลาง */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes ep-float-a { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-10px) rotate(3deg); } }
          @keyframes ep-float-b { 0%,100% { transform: translateY(0) rotate(6deg); } 50% { transform: translateY(-14px) rotate(-2deg); } }
          @keyframes ep-float-c { 0%,100% { transform: translateY(0) rotate(-6deg); } 50% { transform: translateY(10px) rotate(-10deg); } }
          @keyframes ep-pulse-soft { 0%,100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.08); } }
          .ep-float-a { animation: ep-float-a 6s ease-in-out infinite; }
          .ep-float-b { animation: ep-float-b 7s ease-in-out infinite; }
          .ep-float-c { animation: ep-float-c 8s ease-in-out infinite; }
          .ep-pulse-soft { animation: ep-pulse-soft 5s ease-in-out infinite; }
        `,
      }} />

      {/* ── ตกแต่งพื้นหลัง (ขยับได้เบาๆ) ── */}
      <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-orange-200/50 blur-2xl pointer-events-none ep-pulse-soft" />
      <div className="absolute top-10 left-[38%] w-16 h-16 rounded-full border-2 border-orange-300/60 pointer-events-none hidden sm:block ep-float-a" />
      <div className="absolute top-6 right-[8%] w-14 h-14 rounded-2xl bg-teal-400/90 shadow-lg flex items-center justify-center rotate-12 pointer-events-none hidden sm:flex ep-float-b">
        <Send className="w-6 h-6 text-white -rotate-12" />
      </div>
      <div className="absolute top-8 right-[22%] w-14 h-10 rounded-lg pointer-events-none hidden lg:block ep-float-a" style={DOT_GRID_STYLE} />
      <div className="absolute bottom-10 right-[16%] w-16 h-12 rounded-lg pointer-events-none hidden lg:block ep-float-c" style={DOT_GRID_STYLE} />
      <button
        type="button"
        onClick={onViewAllClick}
        aria-label="ดูร้านค้าทั้งหมด"
        className="absolute left-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-r-full bg-orange-500 hover:bg-orange-600 shadow-lg flex items-center justify-center transition hidden sm:flex"
      >
        <ChevronLeft className="w-4 h-4 text-white rotate-180" />
      </button>

      <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 lg:gap-8 items-center">
        {/* Left: headline + CTA + search — ลำดับบนมือถือปรับให้ค้นหาขึ้นมาก่อนปุ่ม CTA ผ่าน order-* (desktop คงลำดับเดิม) */}
        <div className="flex flex-col gap-3 sm:gap-4 text-center lg:text-left">
          <div className="order-1 w-fit bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-orange-200 shadow-sm self-center lg:self-start">
            <p className="text-orange-600 font-bold text-[9px] sm:text-[11px] tracking-normal whitespace-nowrap">EASYPRINT MARKETPLACE</p>
          </div>
          <h1 className="order-2 text-xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight">
            หาร้านพิมพ์ที่ใช่
            <br />
            สำหรับงานของคุณ
          </h1>
          <p className="order-3 text-slate-500 font-semibold text-xs sm:text-sm max-w-md mx-auto lg:mx-0">
            เปรียบเทียบร้าน บริการ ราคา และรีวิว เลือกสั่งพิมพ์ได้ง่ายในที่เดียว
          </p>

          {/* Search bar — order-4 บนมือถือ (มาก่อนปุ่ม), order-5 บน desktop (มาหลังปุ่ม เหมือนเดิม) */}
          <div className="order-4 sm:order-5 bg-white rounded-2xl shadow-xl p-1.5 flex flex-col sm:flex-row gap-1.5 max-w-2xl mx-auto lg:mx-0 w-full">
            <input
              type="text"
              value={searchText}
              onChange={(e) => onSearchTextChange(e.target.value)}
              placeholder="ค้นหาชื่อร้าน หรือบริการที่ต้องการ..."
              className="flex-1 px-3.5 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none rounded-xl"
            />
            <button
              onClick={onViewAllClick}
              className="flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl px-4 py-2 text-sm transition shrink-0"
            >
              <Search className="w-4 h-4" />
              ค้นหา
            </button>
          </div>

          <div className="order-5 sm:order-4 flex flex-wrap gap-2.5 justify-center lg:justify-start">
            <button
              onClick={onViewAllClick}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full px-5 py-2 text-xs sm:text-sm shadow-lg shadow-orange-500/20 transition"
            >
              <Search className="w-3.5 h-3.5" />
              ค้นหาร้านพิมพ์
            </button>
            <button
              onClick={onViewAllClick}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-full px-5 py-2 text-xs sm:text-sm shadow-sm border border-slate-100 transition"
            >
              ดูบริการทั้งหมด
            </button>
          </div>
        </div>

        {/* Right: decorative illustration (composed from icons — ไม่มีภาพประกอบจริง) */}
        <div className="hidden lg:flex items-center justify-center relative h-52">
          <div className="absolute w-44 h-44 rounded-full bg-white/40 blur-2xl ep-pulse-soft" />
          <div className="relative w-36 h-36 bg-white rounded-[1.75rem] shadow-2xl flex items-center justify-center rotate-[-4deg] ep-float-a">
            <Printer className="w-16 h-16 text-orange-500" />
          </div>
          <div className="absolute top-2 right-10 w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center ep-float-b">
            <FileText className="w-7 h-7 text-teal-500" />
          </div>
          <div className="absolute bottom-4 left-6 w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center ep-float-c">
            <Palette className="w-7 h-7 text-amber-500" />
          </div>
          <div className="absolute bottom-8 right-4 w-12 h-12 bg-orange-500 rounded-full shadow-xl flex items-center justify-center animate-bounce">
            <Upload className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </section>
  );
}
