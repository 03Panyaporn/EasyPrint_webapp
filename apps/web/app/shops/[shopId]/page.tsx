"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  MapPin,
  Clock,
  Star,
  ShoppingCart,
  Loader2,
  AlertTriangle,
  FileText,
  Package,
  Ruler,
  Tag,
} from "lucide-react";
import { getShop, type PublicShopDetail } from "@/lib/api/shops";
import { isShopOpenNow, formatTodayHours } from "@/lib/shopHours";
import { getMainServices } from "@/lib/api/services";
import { getShopCart } from "@/lib/api/cart";
import { ApiError } from "@/lib/api/client";
import type { MainService } from "@/components/shop/services/types";

const PRICING_MODEL_SUFFIX: Record<MainService["pricingModel"], string> = {
  per_page: "/หน้า",
  per_piece: "/ชิ้น",
  per_sqm: "/ตร.ม.",
  fixed: "",
};

// ไอคอนวิธีคิดราคา — ชุดเดียวกับที่ฝั่งร้านค้าใช้ใน MainServicesTable.tsx ให้ลูกค้าคุ้นตากับที่ร้านเห็น
const PRICING_MODEL_ICON: Record<MainService["pricingModel"], typeof FileText> = {
  per_page: FileText,
  per_piece: Package,
  per_sqm: Ruler,
  fixed: Tag,
};

function getPriceLabel(service: MainService) {
  return `เริ่มต้น ฿${service.basePrice.toLocaleString()}${PRICING_MODEL_SUFFIX[service.pricingModel]}`;
}

export default function ShopDetailPage({ params }: { params: { shopId: string } }) {
  const [shop, setShop] = useState<PublicShopDetail | null>(null);
  const [mainServices, setMainServices] = useState<MainService[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [cartCount, setCartCount] = useState(0);

  const refreshCartBadge = () => {
    getShopCart(params.shopId)
      .then((res) => setCartCount(res.cart?.items.length ?? 0))
      .catch(() => setCartCount(0)); // 401 ตอนยังไม่ login ก็แค่โชว์ตะกร้าว่าง ไม่ต้องแจ้ง error
  };

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    Promise.all([getShop(params.shopId), getMainServices(params.shopId)])
      .then(([shopRes, servicesRes]) => {
        setShop(shopRes.shop);
        setMainServices(servicesRes.services);
      })
      .catch((err) => {
        setLoadError(err instanceof ApiError && err.status === 404 ? "ไม่พบร้านค้านี้" : "โหลดข้อมูลร้านค้าไม่สำเร็จ");
      })
      .finally(() => setLoading(false));
    refreshCartBadge();
  }, [params.shopId]);

  const activeServices = mainServices.filter((s) => s.isActive);
  // ร้านปิดอยู่ตอนนี้ (นอกเวลาทำการ) — ลูกค้ายังเข้ามาดูรายการบริการ/ราคาได้ตามปกติ แค่กดสั่งพิมพ์ไม่ได้
  const shopClosed = shop ? !isShopOpenNow(shop.openingHours) : false;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 px-4 sm:px-6 lg:px-16 py-3.5 flex items-center justify-between shadow-xs">
        <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-orange-500 transition">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold text-sm">กลับหน้าแรก</span>
        </Link>
        <Link
          href="/cart"
          className="relative flex items-center justify-center w-10 h-10 rounded-full bg-orange-50 text-orange-500 hover:bg-orange-100 transition"
          title="ตะกร้า"
        >
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Link>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
          <Loader2 size={24} className="animate-spin" />
          <p className="text-sm">กำลังโหลดข้อมูลร้านค้า...</p>
        </div>
      ) : loadError || !shop ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-2 text-center px-4">
          <p className="text-sm text-red-500 font-semibold">{loadError || "ไม่พบร้านค้านี้"}</p>
          <Link href="/" className="text-orange-500 text-sm font-bold hover:underline">
            กลับหน้าแรก
          </Link>
        </div>
      ) : (
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Shop header card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-orange-200 p-4 sm:p-6 flex gap-4 sm:gap-6">
            <div className="w-20 h-20 sm:w-28 sm:h-28 bg-slate-200 rounded-2xl shrink-0 overflow-hidden relative">
              {shop.shopPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shop.shopPhotoUrl} alt={shop.name} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                  <Printer className="w-8 h-8 text-slate-400/70" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-orange-500 truncate">{shop.name}</h1>
                <span
                  className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
                    shopClosed ? "bg-slate-400 text-white" : "bg-emerald-500 text-white"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {shopClosed ? "ปิดทำการ" : "เปิดทำการ"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, idx) => (
                  <Star key={idx} className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-200 fill-slate-200" />
                ))}
                <span className="text-[11px] sm:text-xs text-slate-400">(ยังไม่มีรีวิว)</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                <span className="truncate">{shop.address ?? "-"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Clock className="w-4 h-4 text-orange-500 shrink-0" />
                <span className="truncate">{formatTodayHours(shop.openingHours)}</span>
              </div>
              {(shop.serviceTypes ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(shop.serviceTypes ?? []).map((t) => (
                    <span key={t} className="text-[11px] font-semibold bg-[#96f2eb]/50 text-slate-700 px-2.5 py-0.5 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {shopClosed && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600">
              <AlertTriangle size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm">
                ร้านนี้ปิดทำการอยู่ขณะนี้ — ดูรายการบริการและราคาได้ตามปกติ แต่ยังสั่งพิมพ์ไม่ได้จนกว่าร้านจะเปิด
              </p>
            </div>
          )}

          {/* Main services */}
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-3">บริการของร้าน</h2>
            {activeServices.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border-2 border-dashed border-slate-200 text-slate-400 text-sm">
                ร้านนี้ยังไม่มีบริการเปิดให้สั่งพิมพ์
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {activeServices.map((service) => {
                  const priceLabel = getPriceLabel(service);
                  const PricingIcon = PRICING_MODEL_ICON[service.pricingModel];

                  return (
                    <div
                      key={service.id}
                      className="group bg-white rounded-2xl border border-slate-100 hover:border-orange-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col"
                    >
                      <div className="relative w-full h-32 sm:h-36 bg-slate-100 overflow-hidden">
                        {service.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={service.imageUrl}
                            alt={service.name}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
                            <PricingIcon className="w-10 h-10 text-orange-300" strokeWidth={1.5} />
                          </div>
                        )}
                        {service.estimatedTime && (
                          <span className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-slate-600 shadow-xs">
                            <Clock className="w-2.5 h-2.5" />
                            {service.estimatedTime}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between p-3.5 sm:p-4 gap-2.5">
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm truncate">{service.name}</h3>
                          {service.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{service.description}</p>}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-black text-orange-600 truncate">{priceLabel}</span>
                          {shopClosed ? (
                            <span
                              title="ร้านปิดทำการอยู่ขณะนี้"
                              className="px-3.5 py-1.5 text-xs font-bold text-slate-400 bg-slate-100 rounded-full cursor-not-allowed shrink-0"
                            >
                              ร้านปิดอยู่
                            </span>
                          ) : (
                            <Link
                              href={`/shops/${params.shopId}/order/${service.id}`}
                              className="px-3.5 py-1.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-full shadow-xs transition shrink-0"
                            >
                              สั่งพิมพ์
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}
