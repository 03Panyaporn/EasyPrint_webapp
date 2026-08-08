"use client";

import { useState } from "react";
import Link from "next/link";
import { Printer, MapPin, Clock, Star, Heart } from "lucide-react";
import type { PublicShopListItem } from "@/lib/api/shops";
import { isShopOpenNow, formatTodayHours } from "@/lib/shopHours";

interface ShopCardProps {
  shop: PublicShopListItem;
}

// การ์ดร้านค้า — ใช้ร่วมกันทั้งหน้าแรก (guest) และ Dashboard (login แล้ว) ให้หน้าตาตรงกันทั้งสองที่
export default function ShopCard({ shop }: ShopCardProps) {
  const openNow = isShopOpenNow(shop.openingHours);
  // ยังไม่มีระบบรีวิว/ถูกใจจริงในระบบหลังบ้าน — ปุ่มถูกใจเป็นแค่ UI toggle ในเครื่อง ไม่ได้บันทึกจริง ไม่โชว์ตัวเลขรีวิว/คะแนนปลอมเพราะจะทำให้ลูกค้าเข้าใจผิด
  const [liked, setLiked] = useState(false);

  return (
    <div className="group border-2 border-orange-200 hover:border-orange-400 rounded-2xl sm:rounded-3xl p-3 sm:p-4 bg-white shadow-xs hover:shadow-md transition-all relative overflow-hidden">
      {/* Shop Image */}
      <div className="relative w-full h-32 sm:h-40 bg-slate-200 rounded-xl sm:rounded-2xl overflow-hidden mb-3">
        {shop.shopPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shop.shopPhotoUrl} alt={shop.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition duration-300" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
            <Printer className="w-10 h-10 text-slate-400/70" />
          </div>
        )}

        {/* Open/closed badge */}
        <span
          className={`absolute top-2 left-2 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs ${
            openNow ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          {openNow ? "เปิดทำการ" : "ปิดทำการ"}
        </span>

        {/* Favorite toggle — local UI only, ไม่ persist */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setLiked((v) => !v);
          }}
          title="ถูกใจร้านนี้"
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-xs transition"
        >
          <Heart className={`w-4 h-4 transition ${liked ? "fill-red-500 text-red-500" : "text-slate-400"}`} />
        </button>
      </div>

      {/* Shop Details */}
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-1.5">
          <h3 className="text-base sm:text-lg font-black text-orange-500 group-hover:text-orange-600 transition truncate">{shop.name}</h3>
        </div>

        {/* ยังไม่มีระบบรีวิวจริง — โชว์ดาวเปล่าพร้อมข้อความบอกตรงๆ กันลูกค้าเข้าใจผิดว่ามีคนรีวิวแล้ว */}
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, idx) => (
            <Star key={idx} className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-200 fill-slate-200" />
          ))}
          <span className="text-[11px] sm:text-xs text-slate-400">(ยังไม่มีรีวิว)</span>
        </div>

        {(shop.serviceTypes ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(shop.serviceTypes ?? []).slice(0, 3).map((t) => (
              <span key={t} className="text-[10px] sm:text-[11px] font-semibold bg-[#96f2eb]/50 text-slate-700 px-2 py-0.5 rounded-full truncate max-w-[9rem]">
                {t}
              </span>
            ))}
            {(shop.serviceTypes ?? []).length > 3 && (
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 px-1 py-0.5">
                +{(shop.serviceTypes ?? []).length - 3}
              </span>
            )}
          </div>
        )}

        <div className="space-y-0.5 text-[11px] sm:text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-500 shrink-0" />
            <span className="truncate">{shop.address ?? "-"}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-500 shrink-0" />
            <span className="truncate">{formatTodayHours(shop.openingHours)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Link
            href={`/shops/${shop.id}`}
            className="flex-1 text-center px-3 py-2 text-xs sm:text-sm font-bold text-orange-600 border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50 rounded-full transition"
          >
            ดูร้าน
          </Link>
          <Link
            href={`/shops/${shop.id}`}
            className="flex-1 text-center px-3 py-2 text-xs sm:text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-full shadow-xs transition"
          >
            เลือกบริการ
          </Link>
        </div>
      </div>
    </div>
  );
}
