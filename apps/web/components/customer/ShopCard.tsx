"use client";

import { useState } from "react";
import Link from "next/link";
import { Printer, MapPin, Clock, Star, Heart } from "lucide-react";
import type { PublicShopListItem } from "@/lib/api/shops";
import { isShopOpenNow, formatTodayHours, isShopTempClosed } from "@/lib/shopHours";

interface ShopCardProps {
  shop: PublicShopListItem;
}

// การ์ดร้านค้า — ใช้ร่วมกันทั้งหน้าแรก (guest) และ Dashboard (login แล้ว) ปรับสเกลขนาดบน mobile ให้กระทัดรัด
export default function ShopCard({ shop }: ShopCardProps) {
  const openNow = !isShopTempClosed(shop.tempCloseStart, shop.tempCloseEnd) && isShopOpenNow(shop.openingHours);
  // ยังไม่มีระบบรีวิว/ถูกใจจริงในระบบหลังบ้าน — ปุ่มถูกใจเป็นแค่ UI toggle ในเครื่อง
  const [liked, setLiked] = useState(false);

  return (
    <div className="group border border-orange-200/80 hover:border-orange-400 rounded-xl sm:rounded-2xl p-2 sm:p-3.5 bg-white shadow-2xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
      <div>
        {/* Shop Image */}
        <div className="relative w-full h-24 xs:h-28 sm:h-36 lg:h-36 bg-slate-200 rounded-lg sm:rounded-xl overflow-hidden mb-2 sm:mb-2.5">
          {shop.shopPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shop.shopPhotoUrl} alt={shop.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition duration-300" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
              <Printer className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400/70" />
            </div>
          )}

          {/* Open/closed badge */}
          <span
            className={`absolute top-1.5 left-1.5 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full flex items-center gap-1 shadow-xs ${
              openNow ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            {openNow ? "เปิดทำการ" : "ปิดทำการ"}
          </span>

          {/* Favorite toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setLiked((v) => !v);
            }}
            title="ถูกใจร้านนี้"
            className="absolute top-1.5 right-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-xs transition"
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition ${liked ? "fill-red-500 text-red-500" : "text-slate-400"}`} />
          </button>
        </div>

        {/* Shop Details */}
        <div className="space-y-1 sm:space-y-1.5">
          <div className="flex items-start justify-between gap-1">
            <h3 className="text-xs sm:text-base font-black text-orange-500 group-hover:text-orange-600 transition truncate">{shop.name}</h3>
          </div>

          {/* รีวิวดาว */}
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, idx) => (
              <Star key={idx} className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-slate-200 fill-slate-200" />
            ))}
            <span className="text-[9px] sm:text-xs text-slate-400">(ยังไม่มีรีวิว)</span>
          </div>

          {(shop.serviceTypes ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(shop.serviceTypes ?? []).slice(0, 2).map((t) => (
                <span key={t} className="text-[9px] sm:text-[11px] font-semibold bg-[#96f2eb]/50 text-slate-700 px-1.5 py-0.5 rounded-full truncate max-w-[7rem] sm:max-w-[9rem]">
                  {t}
                </span>
              ))}
              {(shop.serviceTypes ?? []).length > 2 && (
                <span className="text-[9px] sm:text-[11px] font-semibold text-slate-400 px-1 py-0.5">
                  +{(shop.serviceTypes ?? []).length - 2}
                </span>
              )}
            </div>
          )}

          <div className="space-y-0.5 text-[10px] sm:text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
              <span className="truncate">{shop.address ?? "-"}</span>
            </div>
            <div className="flex items-center gap-1 truncate">
              <Clock className="w-3 h-3 text-orange-500 shrink-0" />
              <span className="truncate">{formatTodayHours(shop.openingHours)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-2 mt-1 sm:mt-2">
        <Link
          href={`/shops/${shop.id}`}
          className="w-full block text-center px-3 py-1.5 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-extrabold text-white bg-orange-500 hover:bg-orange-600 rounded-full shadow-xs transition active:scale-95"
        >
          เลือกบริการ
        </Link>
      </div>
    </div>
  );
}
