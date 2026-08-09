"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Printer,
  MapPin,
  Loader2,
  AlertTriangle,
  Clock,
  Star,
  Phone,
  Share2,
  Tag,
  Mail,
  Heart,
  MoreHorizontal,
} from "lucide-react";
import { getShop, type PublicShopDetail } from "@/lib/api/shops";
import { isShopOpenNow, formatTodayHours } from "@/lib/shopHours";
import { getMainServices } from "@/lib/api/services";
import { getShopCart } from "@/lib/api/cart";
import { getMe } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import type { MainService } from "@/components/shop/services/types";
import { SERVICE_CATEGORIES } from "@/components/customer/ServiceCategoryGrid";
import ShopDetailHeader from "@/components/customer/ShopDetailHeader";

const PRICING_MODEL_SUFFIX: Record<MainService["pricingModel"], string> = {
  per_page: "/หน้า",
  per_piece: "/ชิ้น",
  per_sqm: "/ตร.ม.",
  fixed: "",
};

function getPriceValue(service: MainService) {
  return `฿${service.basePrice.toLocaleString()}${PRICING_MODEL_SUFFIX[service.pricingModel]}`;
}

// จับคู่ serviceTypes ของร้าน (string ดิบจาก backend) กับหมวดหมู่ที่มีไอคอนกำหนดไว้แล้วในระบบ
// ตัวที่จับคู่ไม่ได้ (ร้านตั้งชื่อเองแบบอิสระ) ยัง fallback เป็น Tag icon ธรรมดา ไม่ตกหล่น
function resolveCategoryIcon(serviceType: string) {
  return SERVICE_CATEGORIES.find((c) => c.value === serviceType)?.icon ?? Tag;
}

// หัวข้อ section แบบเดียวกันทั้งหน้า — แถบส้มเล็กๆ ข้างหัวข้อ เป็นจังหวะซ้ำที่ผูกทุก section เข้าด้วยกัน
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 mb-2">
      <span className="w-1 h-5 sm:h-6 rounded-full bg-orange-500 shrink-0" />
      <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">{children}</h2>
    </div>
  );
}

const MOCK_REVIEWS: {
  id: number;
  name: string;
  avatar: string;
  rating: number;
  text: string;
  likes: number;
  time: string;
}[] = [];

export default function ShopDetailPage({ params }: { params: { shopId: string } }) {
  const router = useRouter();
  const [shop, setShop] = useState<PublicShopDetail | null>(null);
  const [mainServices, setMainServices] = useState<MainService[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [activeReviewFilter, setActiveReviewFilter] = useState("ทั้งหมด");
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const categoryTrackRef = useRef<HTMLDivElement>(null);
  const [categoryScrollMeta, setCategoryScrollMeta] = useState({ thumbPct: 100, leftPct: 0, scrollable: false });

  // อัปเดตแถบบอกตำแหน่งเลื่อนของแถวประเภทงาน — เรียกทั้งตอน scroll และตอนรายการเปลี่ยน (ร้านมีของหลายแบบจนล้นจอมือถือ)
  const updateCategoryScrollMeta = () => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const { scrollWidth, clientWidth, scrollLeft } = el;
    const scrollable = scrollWidth > clientWidth + 4;
    const thumbPct = scrollable ? Math.max((clientWidth / scrollWidth) * 100, 15) : 100;
    const maxScroll = scrollWidth - clientWidth;
    const leftPct = scrollable && maxScroll > 0 ? (scrollLeft / maxScroll) * (100 - thumbPct) : 0;
    setCategoryScrollMeta({ thumbPct, leftPct, scrollable });
  };

  // ลากที่ตัวแถบบอกตำแหน่งเลื่อนโดยตรงก็เลื่อนแถวประเภทงานได้ ไม่ต้องลากที่ไอคอนเท่านั้น
  const seekCategoryScrollFromClientX = (clientX: number) => {
    const track = categoryTrackRef.current;
    const row = categoryScrollRef.current;
    if (!track || !row) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    row.scrollLeft = ratio * (row.scrollWidth - row.clientWidth);
  };

  const handleCategoryTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // บาง edge case (เช่น pointer id ที่เบราว์เซอร์ไม่ถือว่า active) capture ไม่ได้ ก็ไม่เป็นไร ยังลากต่อ (onPointerMove) ได้อยู่แค่ไม่ล็อกเป้าหมายเวลาลากออกนอกแถบ
    }
    seekCategoryScrollFromClientX(e.clientX);
  };

  const handleCategoryTrackPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pressure === 0) return; // ลากอยู่เท่านั้นถึงจะขยับ (ไม่ใช่แค่เมาส์ hover ผ่าน)
    seekCategoryScrollFromClientX(e.clientX);
  };

  const toggleFavorite = () => {
    const nextState = !isFavorite;
    setIsFavorite(nextState);
    if (nextState) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const refreshCartBadge = () => {
    getShopCart(params.shopId)
      .then((res) => setCartCount(res.cart?.items.length ?? 0))
      .catch(() => setCartCount(0)); // 401 ตอนยังไม่ login ก็แค่โชว์ตะกร้าว่าง ไม่ต้องแจ้ง error
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");

    // หน้ารายละเอียดร้านค้าดูได้เฉพาะลูกค้าที่ login แล้วเท่านั้น — เช็ค session ก่อนถึงจะโหลดข้อมูลร้าน
    // ยังไม่ login ก็เด้งไป login พร้อม redirect กลับมาหน้าร้านเดิมหลัง login สำเร็จ (แพทเทิร์นเดียวกับ CustomerHeader)
    getMe()
      .then(() => {
        if (cancelled) return;
        return Promise.all([getShop(params.shopId), getMainServices(params.shopId)]).then(([shopRes, servicesRes]) => {
          if (cancelled) return;
          setShop(shopRes.shop);
          setMainServices(servicesRes.services);
        });
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace(`/login?redirect=${encodeURIComponent(`/shops/${params.shopId}`)}`);
          return;
        }
        setLoadError(err instanceof ApiError && err.status === 404 ? "ไม่พบร้านค้านี้" : "โหลดข้อมูลร้านค้าไม่สำเร็จ");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    refreshCartBadge();
    return () => {
      cancelled = true;
    };
  }, [params.shopId, router]);

  const activeServices = mainServices.filter((s) => s.isActive);
  const openNow = shop ? isShopOpenNow(shop.openingHours) : false;
  // ร้านปิดอยู่ตอนนี้ (นอกเวลาทำการ) — ลูกค้ายังเข้ามาดูรายการบริการ/ราคาได้ตามปกติ แค่กดสั่งพิมพ์ไม่ได้
  const shopClosed = shop ? !openNow : false;
  const todayHours = shop ? formatTodayHours(shop.openingHours) : "";
  const categories = shop?.serviceTypes ?? [];

  useEffect(() => {
    updateCategoryScrollMeta();
    window.addEventListener("resize", updateCategoryScrollMeta);
    return () => window.removeEventListener("resize", updateCategoryScrollMeta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.length]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* หน้านี้เข้าได้เฉพาะคนที่ login แล้ว (เช็คใน useEffect ด้านบน) ใช้ header แยกเฉพาะหน้านี้ */}
      <ShopDetailHeader
        cartCount={cartCount}
        openNow={openNow}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
      />

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
        <>
          {/* ── Shop profile hero — เต็มความกว้างจอ ไม่เว้นขอบข้าง ─── */}
          <section className="relative overflow-hidden bg-[#fdf5ee] border-b border-orange-100">
            {/* Blob decorations — 3D sphere style ใช้สี brand ส้ม/แอมเบอร์ */}
            {/* ก้อนใหญ่ซ้ายล่าง */}
            <div
              className="absolute -bottom-16 -left-16 w-52 h-52 sm:w-72 sm:h-72 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle at 32% 28%, #fed7aa 0%, #fb923c 45%, #c2410c 100%)",
                opacity: 0.28,
                boxShadow: "12px -12px 40px rgba(194,65,12,0.30), inset -8px 8px 20px rgba(0,0,0,0.15)",
              }}
            />
            {/* ก้อนกลางซ้ายล่าง เล็กกว่า */}
            <div
              className="absolute bottom-4 left-24 sm:left-40 w-20 h-20 sm:w-28 sm:h-28 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle at 30% 28%, #fff7ed 0%, #fdba74 40%, #ea580c 100%)",
                opacity: 0.35,
                boxShadow: "6px -6px 20px rgba(234,88,12,0.25), inset -4px 4px 10px rgba(0,0,0,0.12)",
              }}
            />
            {/* ก้อนใหญ่ขวาบน */}
            <div
              className="absolute -top-20 -right-16 w-60 h-60 sm:w-80 sm:h-80 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle at 32% 28%, #fef9c3 0%, #fbbf24 45%, #b45309 100%)",
                opacity: 0.28,
                boxShadow: "10px 14px 36px rgba(180,83,9,0.25), inset -8px 8px 20px rgba(0,0,0,0.12)",
              }}
            />
            {/* ก้อนเล็กขวาล่าง */}
            <div
              className="absolute bottom-0 right-24 sm:right-48 w-16 h-16 sm:w-24 sm:h-24 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle at 30% 28%, #fff7ed 0%, #fed7aa 40%, #f97316 100%)",
                opacity: 0.38,
                boxShadow: "4px -4px 14px rgba(249,115,22,0.22), inset -3px 3px 8px rgba(0,0,0,0.10)",
              }}
            />
            <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
              {/* สถานะเปิด/ปิด + ปุ่มรายการโปรด — จอ PC เหมือนเดิม (ลอยมุมขวาบนของการ์ดโปรไฟล์) / มือถือใช้ที่ breadcrumbs แทน (ดูใน ShopDetailHeader) เลยซ่อนอันนี้บนมือถือ */}
              <div className="hidden sm:flex sm:absolute sm:top-6 sm:right-6 justify-end items-center gap-2 z-10">
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold px-3.5 py-1.5 rounded-full ${
                    openNow
                      ? "bg-gradient-to-b from-emerald-400 to-emerald-500 text-white ring-1 ring-emerald-600/30"
                      : "bg-gradient-to-b from-slate-400 to-slate-500 text-white ring-1 ring-slate-600/30"
                  }`}
                  style={{
                    boxShadow: openNow
                      ? "0 2px 8px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 2px rgba(0, 0, 0, 0.1)"
                      : "0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 2px rgba(0, 0, 0, 0.1)"
                  }}
                >
                  {openNow ? (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                  ) : (
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white/60 shadow-inner"></span>
                  )}
                  <span className="tracking-wide">{openNow ? "เปิดทำการ" : "ปิดทำการ"}</span>
                </span>

                <button
                  onClick={toggleFavorite}
                  className={`w-8 h-8 sm:w-9 sm:h-9 backdrop-blur-sm rounded-full flex items-center justify-center transition-all active:scale-95 ring-1 ring-black/5 shrink-0 ${
                    isFavorite
                      ? "bg-white text-rose-500 shadow-md shadow-rose-200/50"
                      : "bg-white/90 text-slate-400 hover:text-rose-500 hover:bg-white shadow-sm"
                  }`}
                  title={isFavorite ? "เลิกบันทึกร้านโปรด" : "บันทึกร้านโปรด"}
                >
                  <Heart className={`w-4 h-4 sm:w-[18px] sm:h-[18px] transition-all duration-300 ${isFavorite ? "fill-rose-500 scale-110" : ""}`} />
                </button>
              </div>

              <div className="flex items-center gap-4 sm:gap-6">
                <div className="relative w-20 h-20 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shrink-0 shadow-lg ring-1 ring-black/5">
                  {shop.shopPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={shop.shopPhotoUrl}
                      alt={shop.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                      <Printer className="w-8 h-8 text-slate-400/70" />
                    </div>
                  )}
                </div>

                <div className="relative flex-1 min-w-0 space-y-1.5 sm:space-y-2">
                  <h1 className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight truncate sm:pr-0">
                    {shop.name}
                  </h1>

                  <a
                    href={shop.googleMapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address || shop.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 font-medium hover:text-orange-600 transition-colors group cursor-pointer w-fit"
                  >
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="truncate group-hover:underline">{shop.address ?? "-"}</span>
                  </a>
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 font-medium">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 shrink-0" />
                    <span className="truncate">{todayHours}</span>
                  </div>

                  {/* อัปเดตตามภาพ (Mock Data) — กดแล้วเลื่อนไปที่ส่วนคะแนนและรีวิวด้านล่าง */}
                  <a
                    href="#reviews"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className="flex items-center gap-1.5 pt-0.5 w-fit cursor-pointer rounded-md hover:opacity-80 active:scale-95 transition outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
                  >
                    <div className="flex items-center">
                      {[...Array(5)].map((_, idx) => (
                        <Star key={idx} className="w-3.5 h-3.5 text-slate-200 fill-slate-200" />
                      ))}
                      <span className="font-black text-slate-800 ml-1.5">0.0</span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium border-l border-slate-200 pl-2 hover:text-orange-600 hover:underline transition-colors">
                      (0 รีวิว)
                    </span>
                  </a>
                </div>
              </div>
            </div>

            {/* ── ประเภทงานที่รับ — กรอบ card สีขาว rounded อยู่ในการ์ดโปรไฟล์ ── */}
            {categories.length > 0 && (
              <div className="relative mt-5 sm:mt-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
                <div
                  className="backdrop-blur-md rounded-2xl border border-white/40 py-4 sm:py-5 w-fit max-w-full mx-auto"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%)",
                    boxShadow: [
                      /* outer drop */ "0 4px 16px rgba(0,0,0,0.07)",
                      /* close shadow */ "0 1px 4px rgba(0,0,0,0.05)",
                      /* top-left inner highlight */ "inset 0 1px 0 rgba(255,255,255,0.65)",
                      /* left edge highlight */ "inset 1px 0 0 rgba(255,255,255,0.30)",
                      /* bottom-right inner shadow */ "inset 0 -1px 0 rgba(0,0,0,0.06)",
                      /* right edge shadow */ "inset -1px 0 0 rgba(0,0,0,0.04)",
                    ].join(", "),
                  }}
                >
                  {/* มือถือ: กรอบทั้งกรอบ (รวม padding) เป็นพื้นที่เลื่อนได้เลย ลากตรงไหนในกรอบก็เลื่อน ไม่ต้องลากตรงไอคอนเท่านั้น / sm ขึ้นไป: พับบรรทัดกึ่งกลางตามปกติ มีที่ว่างพอ */}
                  <div
                    ref={categoryScrollRef}
                    onScroll={updateCategoryScrollMeta}
                    className="flex gap-6 overflow-x-auto no-scrollbar snap-x snap-proximity px-6 sm:px-12 sm:flex-wrap sm:justify-center sm:gap-12 sm:overflow-visible"
                  >
                    {categories.map((type) => {
                      const Icon = resolveCategoryIcon(type);
                      return (
                        <div
                          key={type}
                          className="snap-start shrink-0 w-[74px] sm:w-auto flex flex-col items-center gap-1.5 text-center py-1 sm:py-0"
                        >
                          <Icon
                            className="w-5 h-5 sm:w-5 sm:h-5 text-slate-500"
                            strokeWidth={1.5}
                            style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.10))" }}
                          />
                          <span className="text-[10px] sm:text-[10px] font-medium text-slate-500 leading-snug line-clamp-2">{type}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* แถบบอกตำแหน่งเลื่อน — ลากที่แถบนี้โดยตรงก็เลื่อนแถวได้เหมือนกัน โชว์เฉพาะมือถือและเฉพาะตอนเนื้อหาล้นจอ (เลื่อนได้จริง) */}
                  {categoryScrollMeta.scrollable && (
                    <div className="sm:hidden mt-3 px-5">
                      <div
                        ref={categoryTrackRef}
                        onPointerDown={handleCategoryTrackPointerDown}
                        onPointerMove={handleCategoryTrackPointerMove}
                        className="relative h-1 rounded-full bg-black/10 overflow-hidden cursor-pointer touch-none"
                      >
                        <div
                          className="h-full rounded-full bg-slate-400 pointer-events-none"
                          style={{ width: `${categoryScrollMeta.thumbPct}%`, marginLeft: `${categoryScrollMeta.leftPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          <main className="bg-slate-50/80 pb-14">

            {shopClosed && (
              <div className="max-w-6xl mx-auto mt-6 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800">
                  <AlertTriangle size={18} className="text-amber-500 shrink-0" />
                  <p className="text-xs sm:text-sm font-medium">
                    ร้านนี้ปิดทำการอยู่ขณะนี้ — ดูรายการบริการและราคาได้ตามปกติ แต่ยังสั่งพิมพ์ไม่ได้จนกว่าร้านจะเปิด
                  </p>
                </div>
              </div>
            )}

            {/* ── Services ───────────────────────────────────────────── */}
            <section className="max-w-6xl mx-auto pt-10 sm:pt-14 px-4 sm:px-6 lg:px-8">
              <SectionHeading>บริการของร้าน</SectionHeading>
              {activeServices.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border-2 border-dashed border-slate-200 text-slate-400 text-sm">
                  ร้านนี้ยังไม่มีบริการเปิดให้สั่งพิมพ์
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {activeServices.map((service) => {
                    const priceValue = getPriceValue(service);

                    return (
                      <div
                        key={service.id}
                        className="group bg-white rounded-2xl border border-slate-100 shadow-md shadow-slate-200/60 hover:shadow-xl hover:shadow-orange-100/60 hover:border-orange-200 hover:-translate-y-1 transition-all duration-500 overflow-hidden flex flex-col"
                      >
                        <div className="relative aspect-square bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
                          {service.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={service.imageUrl}
                              alt={service.name}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700 ease-out"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Printer className="w-6 h-6 text-slate-300" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col p-2.5 sm:p-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug tracking-tight line-clamp-1">{service.name}</h3>
                            {service.description && (
                              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed line-clamp-2">{service.description}</p>
                            )}
                          </div>

                          <div className="flex items-end justify-between gap-1.5 mt-2.5 pt-2.5 border-t border-slate-100">
                            <div className="min-w-0">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">เริ่มต้น</p>
                              <p className="text-sm font-black text-orange-600 tracking-tight leading-none mt-1 truncate">{priceValue}</p>
                            </div>
                            {shopClosed ? (
                              <span
                                title="ร้านปิดทำการอยู่ขณะนี้"
                                className="shrink-0 px-2.5 py-1.5 text-[10px] font-bold text-slate-400 bg-slate-100 rounded-full cursor-not-allowed"
                              >
                                ปิดอยู่
                              </span>
                            ) : (
                              <Link
                                href={`/shops/${params.shopId}/order/${service.id}`}
                                className="shrink-0 px-2.5 py-1.5 text-[10px] sm:text-[11px] font-bold text-white bg-orange-500 rounded-full shadow-sm shadow-orange-500/30 hover:bg-orange-600 hover:shadow-md hover:shadow-orange-500/40 active:scale-90 transition-all duration-200"
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
            </section>

            {/* ── Ratings & Reviews ───────────────────────────────────────────── */}
            <section id="reviews" className="max-w-6xl mx-auto mt-10 sm:mt-14 pb-4 px-4 sm:px-6 lg:px-8 scroll-mt-24">
              <div className="mb-6">
                <SectionHeading>คะแนนและรีวิว</SectionHeading>
              </div>

              {/* Overall Rating Box */}
              <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 items-center justify-center sm:justify-start bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-md shadow-slate-200/60 mb-6">
                <div className="flex flex-col items-center justify-center text-center sm:border-r border-slate-100 sm:pr-8">
                  <div className="text-4xl sm:text-5xl font-black text-slate-900 mb-1.5 tracking-tighter">0.0</div>
                  <div className="flex items-center gap-1 mb-1.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-200 fill-slate-200" />
                    ))}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-500 font-medium">(0 รีวิว)</div>
                </div>
                
                <div className="flex flex-col gap-1.5 sm:gap-2 w-full max-w-[220px] sm:max-w-[240px]">
                  {[
                    { star: 5, pct: 0 },
                    { star: 4, pct: 0 },
                    { star: 3, pct: 0 },
                    { star: 2, pct: 0 },
                    { star: 1, pct: 0 },
                  ].map(row => (
                    <div key={row.star} className="flex items-center gap-3">
                      <span className="w-3 text-sm font-bold text-slate-600 text-right">{row.star}</span>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${row.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filter Chips */}
              <div className="flex overflow-x-auto gap-2 sm:gap-2.5 pb-4 mb-2 no-scrollbar">
                {['ทั้งหมด', '5', '4', '3', '2', '1'].map((f, i) => (
                  <button 
                    key={i}
                    onClick={() => setActiveReviewFilter(f)}
                    className={`flex items-center gap-1 sm:gap-1.5 px-3 py-1 sm:py-1.5 rounded-full border-[1.5px] text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all ${
                      activeReviewFilter === f 
                        ? 'bg-orange-500 border-orange-500 text-white shadow-sm shadow-orange-500/30' 
                        : 'bg-white border-orange-200 text-orange-500 hover:bg-orange-50'
                    }`}
                  >
                    <Star className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${activeReviewFilter === f ? 'fill-white text-white' : 'fill-orange-500 text-orange-500'}`} />
                    {f}
                  </button>
                ))}
              </div>

              {/* Review List */}
              <div className="space-y-4">
                {MOCK_REVIEWS.filter(r => activeReviewFilter === 'ทั้งหมด' || r.rating.toString() === activeReviewFilter).length > 0 ? (
                  MOCK_REVIEWS.filter(r => activeReviewFilter === 'ทั้งหมด' || r.rating.toString() === activeReviewFilter).map(review => (
                    <div key={review.id} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2.5">
                      {/* User Info & Date */}
                      <div className="flex items-center gap-3">
                        <img src={review.avatar} alt={review.name} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover bg-slate-100 border border-slate-200" />
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm leading-tight">{review.name}</span>
                          <span className="text-xs text-slate-400 mt-0.5">{review.time}</span>
                        </div>
                      </div>
                      
                      {/* Star Rating */}
                      <div className="flex items-center gap-1 mt-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${i < review.rating ? 'fill-orange-400 text-orange-400' : 'fill-slate-100 text-slate-100'}`} />
                        ))}
                      </div>
                      
                      {/* Review Text */}
                      <p className="text-slate-600 leading-relaxed text-sm sm:text-base mt-1">
                        {review.text}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-400 font-medium">
                    ยังไม่มีรีวิวสำหรับคะแนนนี้
                  </div>
                )}
              </div>
            </section>


          </main>

          {/* ── Footer ─────────────────────────────────────────────── */}
          <footer className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 text-white py-6 sm:py-8 px-6 sm:px-12 lg:px-20">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Brand Info */}
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white text-orange-600 flex items-center justify-center font-bold">
                    <Printer className="w-4 h-4" />
                  </div>
                  <span className="text-xl font-black tracking-tight">EASYPRINT</span>
                </div>
                <p className="text-sm text-white/90 leading-relaxed max-w-md">
                  ประสบการณ์ใหม่สำหรับการสั่งพิมพ์งานออนไลน์ เพื่อความสะดวกสบาย พร้อมการแจ้งเตือน
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <a
                    href="tel:020000000"
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"
                    title="โทรศัพท์"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="mailto:contact@easyprint.com"
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"
                    title="อีเมล"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-[11px] font-black tracking-wider uppercase text-white/70">PLATFORM</h4>
                <ul className="space-y-1.5 text-sm text-white/90">
                  <li><a href="#" className="hover:underline">ราคาร้านต่างๆ</a></li>
                  <li><a href="#" className="hover:underline">ติดตามสถานะ</a></li>
                  <li><a href="#" className="hover:underline">การช่วยเหลือ</a></li>
                </ul>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-[11px] font-black tracking-wider uppercase text-white/70">COMPANY</h4>
                <ul className="space-y-1.5 text-sm text-white/90">
                  <li><a href="#" className="hover:underline">Our Vision</a></li>
                  <li><a href="#" className="hover:underline">Privacy Policy</a></li>
                  <li><a href="#" className="hover:underline">Terms of Use</a></li>
                </ul>
              </div>
            </div>

            <div className="max-w-6xl mx-auto border-t border-white/20 mt-6 pt-5 text-center text-xs text-white/70">
              © {new Date().getFullYear()} EasyPrint. All rights reserved.
            </div>
          </footer>
        </>
      )}

      {/* Toast Notification */}
      <div
        className={`fixed bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white/95 backdrop-blur-md text-slate-800 px-5 py-3 rounded-full shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 transition-all duration-500 ease-out ${
          showToast ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
          <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
        </div>
        <span className="text-sm font-bold tracking-tight pr-2">บันทึกร้านโปรดเรียบร้อย</span>
      </div>
    </div>
  );
}
