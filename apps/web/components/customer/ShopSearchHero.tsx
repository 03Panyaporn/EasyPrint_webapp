"use client";

import type { CSSProperties } from "react";
import { Search, LayoutGrid } from "lucide-react";

// Soft dot grid decoration background
const DOT_GRID_STYLE: CSSProperties = {
  backgroundImage: "radial-gradient(circle, rgba(234,88,12,0.25) 1.5px, transparent 1.5px)",
  backgroundSize: "12px 12px",
};

// Cute puffy 3D cloud SVG component
function PuffyCloud({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 55" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M 20 42 C 10 42 4 32 12 24 C 10 14 24 6 36 12 C 44 4 60 4 68 12 C 80 8 90 18 86 28 C 94 34 88 44 78 42 Z"
        fill="white"
        fillOpacity="0.95"
        className="drop-shadow-sm"
      />
    </svg>
  );
}

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
    <section className="relative overflow-hidden bg-gradient-to-b from-[#fff6ef] via-[#fde9d7] to-[#fbdcb8] pt-2.5 sm:pt-4 pb-4 sm:pb-6 px-4 sm:px-6">
      {/* Keyframe animations for multiple floating clouds */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes ep-cloud-1 { 0%,100% { transform: translateY(0px) translateX(0px); } 50% { transform: translateY(-6px) translateX(8px); } }
          @keyframes ep-cloud-2 { 0%,100% { transform: translateY(0px) translateX(0px); } 50% { transform: translateY(-9px) translateX(-6px); } }
          @keyframes ep-cloud-3 { 0%,100% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-5px) scale(1.06); } }
          @keyframes ep-cloud-4 { 0%,100% { transform: translateY(0px) translateX(0px); } 50% { transform: translateY(-8px) translateX(10px); } }
          .ep-cloud-1 { animation: ep-cloud-1 6s ease-in-out infinite; }
          .ep-cloud-2 { animation: ep-cloud-2 7.5s ease-in-out infinite; }
          .ep-cloud-3 { animation: ep-cloud-3 5.5s ease-in-out infinite; }
          .ep-cloud-4 { animation: ep-cloud-4 8s ease-in-out infinite; }
        `,
      }} />

      {/* Background Soft Blobs */}
      <div className="absolute -top-16 -left-16 w-52 h-52 rounded-full bg-orange-200/40 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-16 w-60 h-60 rounded-full bg-amber-200/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-3 left-8 w-20 h-14 rounded-xl pointer-events-none hidden lg:block opacity-30" style={DOT_GRID_STYLE} />

      <div className="relative z-10 max-w-6xl mx-auto space-y-3 sm:space-y-4">
        {/* ── Integrated Top Pill Search Bar (Compact Height) ── */}
        <div className="w-full max-w-xl mx-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-full border border-orange-100/80 shadow-xs hover:shadow-sm p-1 flex items-center gap-2 pl-3.5 pr-1 focus-within:ring-2 focus-within:ring-orange-400 transition-all duration-200">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => onSearchTextChange(e.target.value)}
              placeholder="ค้นหาร้านพิมพ์ หรือบริการที่ต้องการ..."
              className="flex-1 text-xs sm:text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none bg-transparent font-medium"
            />
            <button
              type="button"
              onClick={onViewAllClick}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold rounded-full px-4 py-1.5 text-xs transition-all shadow-xs shadow-orange-500/20 active:scale-95 shrink-0"
            >
              ค้นหา
            </button>
          </div>
        </div>

        {/* ── Main Hero Content & 3D Print Shop Graphic (Compact Sizing) ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-5 items-center">
          {/* Left Column: Text & CTA Buttons */}
          <div className="md:col-span-7 flex flex-col items-start text-left space-y-2.5 sm:space-y-3">
            <div className="inline-flex items-center bg-white/90 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-orange-200/80 shadow-2xs">
              <span className="text-orange-600 font-extrabold text-[9px] sm:text-[10px] tracking-wider">
                EASYPRINT MARKETPLACE
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 w-full">
              <div className="flex-1">
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  หาร้านพิมพ์ที่ใช่
                  <br />
                  <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                    สำหรับงานของคุณ
                  </span>
                </h1>

                <p className="text-slate-600 font-medium text-[10px] sm:text-xs leading-relaxed max-w-md mt-1">
                  เปรียบเทียบร้าน บริการ ราคา และรีวิว เลือกสั่งพิมพ์ได้ง่ายในที่เดียว
                </p>
              </div>

              {/* 3D Print Shop Graphic on Mobile with Floating Clouds */}
              <div className="md:hidden shrink-0 w-24 sm:w-32 relative">
                {/* Floating Clouds (Mobile) */}
                <div className="absolute -top-2.5 -left-2.5 w-8 h-auto pointer-events-none ep-cloud-1 z-20">
                  <PuffyCloud className="w-full h-auto text-white drop-shadow-xs" />
                </div>
                <div className="absolute -top-3 right-0 w-9 h-auto pointer-events-none ep-cloud-2 z-20">
                  <PuffyCloud className="w-full h-auto text-white drop-shadow-xs" />
                </div>
                <div className="absolute top-5 -right-2.5 w-7 h-auto pointer-events-none ep-cloud-3 z-20">
                  <PuffyCloud className="w-full h-auto text-white/90 drop-shadow-2xs" />
                </div>

                <img
                  src="/print_shop_3d_transparent.png"
                  alt="EasyPrint 3D Print Shop Storefront"
                  className="w-full h-auto object-contain drop-shadow-sm transform hover:scale-105 transition duration-300 relative z-10"
                />
              </div>
            </div>

            {/* Dual Pill CTA Buttons (Compact Sizing) */}
            <div className="flex items-center justify-start gap-2 pt-1 w-full">
              <button
                type="button"
                onClick={onViewAllClick}
                className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold rounded-full px-3.5 sm:px-5 py-2 text-xs shadow-xs shadow-orange-500/20 hover:shadow-sm transition-all transform hover:-translate-y-0.5 active:scale-95 flex-1 sm:flex-none"
              >
                <Search className="w-3.5 h-3.5" />
                <span>ค้นหาร้านพิมพ์</span>
              </button>

              <button
                type="button"
                onClick={onViewAllClick}
                className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-800 font-extrabold rounded-full px-3.5 sm:px-5 py-2 text-xs shadow-2xs border border-slate-200/80 hover:border-orange-200 transition-all transform hover:-translate-y-0.5 active:scale-95 flex-1 sm:flex-none"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-orange-500" />
                <span>ดูบริการทั้งหมด</span>
              </button>
            </div>
          </div>

          {/* Desktop 3D Print Shop Graphic (Compact Scaled Image) */}
          <div className="hidden md:flex md:col-span-5 justify-center items-center relative">
            <div className="absolute w-44 h-44 lg:w-52 lg:h-52 rounded-full bg-white/30 blur-2xl pointer-events-none" />

            {/* Floating Clouds (Desktop - Hugging the shop building closely) */}
            <div className="absolute -top-2 left-8 lg:left-12 w-10 lg:w-13 h-auto pointer-events-none ep-cloud-1 z-20">
              <PuffyCloud className="w-full h-auto text-white drop-shadow-xs" />
            </div>
            <div className="absolute -top-3 right-6 lg:right-10 w-11 lg:w-15 h-auto pointer-events-none ep-cloud-2 z-20">
              <PuffyCloud className="w-full h-auto text-white drop-shadow-xs" />
            </div>
            <div className="absolute top-6 left-4 lg:left-8 w-8 lg:w-11 h-auto pointer-events-none ep-cloud-3 z-20">
              <PuffyCloud className="w-full h-auto text-white/90 drop-shadow-2xs" />
            </div>
            <div className="absolute top-8 right-4 lg:right-8 w-9 lg:w-12 h-auto pointer-events-none ep-cloud-4 z-20">
              <PuffyCloud className="w-full h-auto text-white/95 drop-shadow-2xs" />
            </div>

            <img
              src="/print_shop_3d_transparent.png"
              alt="EasyPrint 3D Print Shop Storefront"
              className="relative z-10 w-44 lg:w-56 h-auto object-contain drop-shadow-md hover:scale-105 transition duration-300"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
