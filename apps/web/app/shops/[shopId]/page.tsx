"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Printer,
  MapPin,
  Clock,
  Phone,
  Mail,
  ExternalLink,
  ShoppingCart,
  User,
  ArrowRight,
  Star,
  Share2,
  Search,
  LogOut,
} from "lucide-react";
import { getShop, type PublicShopDetail } from "@/lib/api/shops";
import { getMainServices } from "@/lib/api/services";
import { getShopCart } from "@/lib/api/cart";
import { getMe, logout, type PublicUser } from "@/lib/api/auth";
import { isShopOpenNow, formatTodayHours } from "@/lib/shopHours";
import { ApiError } from "@/lib/api/client";
import type { MainService } from "@/components/shop/services/types";

const PRICING_MODEL_SUFFIX: Record<MainService["pricingModel"], string> = {
  per_page: "/หน้า",
  per_piece: "/ชิ้น",
  per_sqm: "/ตร.ม.",
  fixed: "",
};

function getPriceLabel(service: MainService) {
  return `เริ่มต้น ฿${service.basePrice.toLocaleString()}${PRICING_MODEL_SUFFIX[service.pricingModel]}`;
}

// หมวดหมู่บริการคงที่ 6 หมวด (ตามภาพต้นแบบ) — ไม่มีระบบหมวดหมู่จริงในฐานข้อมูล
// จึงเช็คว่าร้านนี้มีบริการจริง (mainServices) ที่เข้าข่ายหมวดไหนบ้าง แล้วโชว์เฉพาะหมวดที่ร้านมีขายจริงเท่านั้น
type CategoryIllustrationType = "document" | "vinyl" | "poster" | "sticker" | "card" | "standee";

const FIXED_CATEGORIES: { label: string; type: CategoryIllustrationType; test: (text: string) => boolean }[] = [
  { label: "งานเอกสาร", type: "document", test: (t) => t.includes("เอกสาร") || t.includes("ปริ้น") || t.includes("print") },
  { label: "ป้ายไวนิล", type: "vinyl", test: (t) => t.includes("ไวนิล") || t.includes("แบนเนอร์") || t.includes("banner") },
  { label: "โปสเตอร์", type: "poster", test: (t) => t.includes("โปสเตอร์") || t.includes("poster") },
  { label: "สติ๊กเกอร์", type: "sticker", test: (t) => t.includes("สติ๊กเกอร์") || t.includes("sticker") || t.includes("ฉลาก") },
  { label: "นามบัตร", type: "card", test: (t) => t.includes("นามบัตร") },
  {
    label: "Roll-Up / X-Stand",
    type: "standee",
    test: (t) => t.includes("roll up") || t.includes("roll-up") || t.includes("x-stand") || t.includes("ขาตั้ง"),
  },
];

// ไอคอนภาพจริง (วางไว้ที่ public/icons/categories) — มีให้เฉพาะบางหมวด ที่เหลือยัง fallback เป็น SVG จำลองที่วาดเอง
// ภาพพวกนี้มีพื้นหลังสีพีชในตัวอยู่แล้ว จึงโชว์เต็มกรอบโดยไม่ต้องครอบด้วย wrapper สีพีชซ้ำ
const CATEGORY_IMAGE: Partial<Record<CategoryIllustrationType, string>> = {
  document: "/icons/categories/document.png",
  vinyl: "/icons/categories/vinyl.png",
};

const ICON_SHADOW = { filter: "drop-shadow(0 3px 4px rgba(15,23,42,0.18))" } as const;
const ICON_SVG_CLASS = "w-9 h-9 sm:w-10 sm:h-10";

function CategoryIllustration({ type, gradId }: { type: CategoryIllustrationType; gradId: string }) {
  switch (type) {
    case "card":
      return (
        <svg viewBox="0 0 64 64" className={ICON_SVG_CLASS} style={ICON_SHADOW}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#1e293b" />
              <stop offset="1" stopColor="#334155" />
            </linearGradient>
          </defs>
          <g transform="rotate(-4 32 32)">
            <rect x="12" y="24" width="36" height="22" rx="3" fill="#e2e8f0" />
            <rect x="16" y="16" width="40" height="24" rx="3" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
            <rect x="16" y="16" width="40" height="7" rx="3" fill={`url(#${gradId})`} />
            <rect x="20" y="29" width="20" height="2.5" rx="1.2" fill="#f97316" />
            <rect x="20" y="34" width="14" height="2" rx="1" fill="#cbd5e1" />
          </g>
        </svg>
      );
    case "vinyl":
      return (
        <svg viewBox="0 0 64 64" className={ICON_SVG_CLASS} style={ICON_SHADOW}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#fb923c" />
              <stop offset="1" stopColor="#ea580c" />
            </linearGradient>
          </defs>
          <g transform="rotate(-10 32 32)">
            <rect x="24" y="10" width="16" height="44" rx="8" fill={`url(#${gradId})`} />
            <ellipse cx="32" cy="10" rx="8" ry="4" fill="#1e293b" />
            <ellipse cx="32" cy="54" rx="8" ry="4" fill="#1e293b" />
            <ellipse cx="32" cy="10" rx="5" ry="2.4" fill="#475569" />
            <rect x="27" y="18" width="3" height="28" rx="1.5" fill="#fed7aa" opacity="0.6" />
          </g>
        </svg>
      );
    case "poster":
      return (
        <svg viewBox="0 0 64 64" className={ICON_SVG_CLASS} style={ICON_SHADOW}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#38bdf8" />
              <stop offset="1" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
          <g transform="rotate(4 32 32)">
            <rect x="10" y="8" width="44" height="48" rx="3" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
            <rect x="15" y="13" width="34" height="30" fill={`url(#${gradId})`} />
            <path d="M15 38 L26 26 L33 33 L40 22 L49 33 V43 H15 Z" fill="#0369a1" opacity="0.7" />
            <circle cx="42" cy="19" r="4" fill="#fde68a" />
            <rect x="15" y="47" width="34" height="2.5" rx="1.2" fill="#cbd5e1" />
            <rect x="15" y="52" width="22" height="2.5" rx="1.2" fill="#e2e8f0" />
          </g>
        </svg>
      );
    case "sticker":
      return (
        <svg viewBox="0 0 64 64" className={ICON_SVG_CLASS} style={ICON_SHADOW}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fb923c" />
              <stop offset="1" stopColor="#f97316" />
            </linearGradient>
          </defs>
          <path d="M6 50c4-2 8-2 12 0" stroke="#f97316" strokeWidth="2" fill="none" strokeDasharray="2 3" />
          <g transform="rotate(-8 32 32)">
            <path d="M14 14h28l8 8v28a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V16a2 2 0 0 1 2-2z" fill={`url(#${gradId})`} />
            <path d="M42 14v8h8" fill="#fdba74" />
            <circle cx="24" cy="30" r="3" fill="#fff7ed" opacity="0.85" />
            <circle cx="32" cy="40" r="2" fill="#fff7ed" opacity="0.7" />
          </g>
        </svg>
      );
    case "standee":
      return (
        <svg viewBox="0 0 64 64" className={ICON_SVG_CLASS} style={ICON_SHADOW}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fb923c" />
              <stop offset="1" stopColor="#ea580c" />
            </linearGradient>
          </defs>
          <path d="M18 56 L46 56 L38 44 L26 44 Z" fill="#334155" />
          <rect x="30" y="44" width="4" height="12" fill="#1e293b" />
          <rect x="22" y="6" width="20" height="38" rx="2" fill={`url(#${gradId})`} />
          <circle cx="32" cy="16" r="4" fill="#fff7ed" opacity="0.8" />
          <rect x="27" y="24" width="10" height="2" rx="1" fill="#fed7aa" />
          <rect x="27" y="29" width="10" height="2" rx="1" fill="#fed7aa" />
        </svg>
      );
    case "document":
    default:
      return (
        <svg viewBox="0 0 64 64" className={ICON_SVG_CLASS} style={ICON_SHADOW}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#f1f5f9" />
            </linearGradient>
          </defs>
          <g transform="rotate(-6 32 32)">
            <path d="M16 8h22l10 10v38a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z" fill={`url(#${gradId})`} stroke="#e2e8f0" strokeWidth="1" />
            <path d="M38 8v10h10" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
            <rect x="20" y="28" width="20" height="3" rx="1.5" fill="#F97316" />
            <rect x="20" y="35" width="20" height="3" rx="1.5" fill="#cbd5e1" />
            <rect x="20" y="42" width="14" height="3" rx="1.5" fill="#cbd5e1" />
          </g>
        </svg>
      );
  }
}

// TODO(mock-data): ค่าคะแนนรีวิวนี้เป็นค่าตัวอย่างสำหรับดูดีไซน์เท่านั้น — ระบบยังไม่มีตารางเก็บรีวิว/คะแนนจริง
// ห้ามปล่อยขึ้น production ก่อนต่อกับข้อมูลรีวิวจริง (ดู flag "reviews-hidden-until-real-data" ในบทสนทนา)
const MOCK_SHOP_RATING = { average: 4.8, count: 125 };

export default function ShopDetailPage({ params }: { params: { shopId: string } }) {
  const router = useRouter();
  const [shop, setShop] = useState<PublicShopDetail | null>(null);
  const [mainServices, setMainServices] = useState<MainService[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

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
    getMe()
      .then(({ user }) => setCurrentUser(user))
      .catch(() => setCurrentUser(null)); // ยังไม่ login ก็แค่โชว์ไอคอนโปรไฟล์เฉยๆ ไม่ต้องแจ้ง error
  }, [params.shopId]);

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    try {
      await logout();
    } catch {
      // ออกจากระบบไม่สำเร็จก็ยังพาไปหน้า login ตามปกติ ฝั่ง server จะเช็ค session ซ้ำเองอยู่แล้ว
    }
    router.push("/login");
    router.refresh();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMobileSearchOpen(false);
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const activeServices = mainServices.filter((s) => s.isActive);
  const searchTerm = searchQuery.trim().toLowerCase();
  const filteredServices = searchTerm
    ? activeServices.filter(
        (s) => s.name.toLowerCase().includes(searchTerm) || (s.description ?? "").toLowerCase().includes(searchTerm)
      )
    : activeServices;
  const openNow = shop ? isShopOpenNow(shop.openingHours) : false;
  const matchedCategories = FIXED_CATEGORIES.filter((cat) =>
    activeServices.some((s) => cat.test(`${s.name} ${s.description ?? ""}`.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-500 to-orange-600 sticky top-0 z-40 px-4 sm:px-6 lg:px-16 py-3 flex items-center gap-3 shadow-[0_4px_16px_-4px_rgba(244,106,47,0.4)]">
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-9 h-9 rounded-full bg-white text-orange-500 flex items-center justify-center shadow-md group-hover:scale-105 transition">
            <Printer className="w-4 h-4" />
          </div>
          <span className="text-lg sm:text-xl tracking-tight font-black text-white hidden sm:inline">
            EASY<span className="text-white/90">PRINT</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 ml-auto shrink-0">
          {/* กรอบค้นหา — ติดกับตะกร้า (จอ sm ขึ้นไป) */}
          <form onSubmit={handleSearchSubmit} className="hidden sm:block relative w-56 lg:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาบริการ เช่น นามบัตร, โปสเตอร์, ไวนิล..."
              className="w-full pl-4 pr-11 py-2 rounded-full text-sm text-slate-700 placeholder:text-slate-400 shadow-inner focus:outline-none focus:ring-2 focus:ring-white/60"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center hover:bg-orange-100 transition"
              aria-label="ค้นหา"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          <button
            type="button"
            onClick={() => setMobileSearchOpen((v) => !v)}
            className="sm:hidden flex items-center justify-center w-10 h-10 rounded-full bg-white/15 text-white hover:bg-white/25 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label="ค้นหา"
          >
            <Search className="w-5 h-5" />
          </button>

          <Link href="/cart" className="relative flex items-center justify-center w-10 h-10 text-white hover:text-white/80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-full" title="ตะกร้า">
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                {cartCount}
              </span>
            )}
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileMenuOpen((v) => !v)}
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              {currentUser ? (
                <span className="w-9 h-9 rounded-full bg-white text-orange-600 flex items-center justify-center text-sm font-black shrink-0">
                  {currentUser.firstname.charAt(0).toUpperCase()}
                </span>
              ) : (
                <span className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </span>
              )}
            </button>

            {profileMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl ring-1 ring-slate-900/5 shadow-[0_8px_30px_-8px_rgba(15,23,42,0.25)] py-1.5 z-50 overflow-hidden">
                  <Link
                    href="/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    โปรไฟล์
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    ออกจากระบบ
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {mobileSearchOpen && (
        <div className="sm:hidden bg-orange-50 px-4 py-2.5 border-b border-orange-100">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาบริการ เช่น นามบัตร, โปสเตอร์, ไวนิล..."
              autoFocus
              className="w-full pl-4 pr-11 py-2 rounded-full text-sm bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center"
              aria-label="ค้นหา"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <ShopDetailSkeleton />
      ) : loadError || !shop ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-4">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-400 flex items-center justify-center">
            <Printer className="w-6 h-6" />
          </div>
          <p className="text-sm text-red-500 font-semibold">{loadError || "ไม่พบร้านค้านี้"}</p>
          <Link href="/" className="text-orange-500 text-sm font-bold hover:underline">
            กลับหน้าแรก
          </Link>
        </div>
      ) : (
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-9">
          {/* ── Shop hero card ── */}
          <section className="relative rounded-3xl bg-white p-4 sm:p-6 ring-1 ring-slate-900/5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-8px_rgba(15,23,42,0.12)]">
            {/* badge เปิด/ปิด — ล็อกไว้มุมขวาบนของกรอบการ์ด */}
            <span
              className={`absolute top-4 right-4 sm:top-5 sm:right-6 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                openNow ? "bg-emerald-500 text-white shadow-[0_4px_10px_-2px_rgba(16,185,129,0.5)]" : "bg-slate-400 text-white shadow-xs"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {openNow ? "เปิดทำการ" : "ปิดทำการ"}
            </span>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl shrink-0 overflow-hidden relative ring-1 ring-slate-900/5 shadow-[0_8px_20px_-6px_rgba(15,23,42,0.25)] bg-slate-200">
                {shop.shopPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shop.shopPhotoUrl} alt={shop.name} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                    <Printer className="w-9 h-9 text-slate-400/70" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-2 pr-16 sm:pr-24">
                <h1 className="text-xl sm:text-2xl font-black text-slate-800 truncate">{shop.name}</h1>

                {/* ที่อยู่ + เวลาเปิด-ปิด อยู่ใต้กัน */}
                <div className="space-y-1 text-sm text-slate-500">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                    <span className="truncate">{shop.address ?? "-"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-orange-500 shrink-0" />
                    <span>{formatTodayHours(shop.openingHours)}</span>
                  </div>
                </div>

                {/* MOCK: ยังไม่มีระบบรีวิวจริง ใส่ไว้ดูดีไซน์ก่อนเท่านั้น — ดู MOCK_SHOP_RATING ด้านบนไฟล์ */}
                <div className="flex items-center gap-1.5 pt-1">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i <= Math.round(MOCK_SHOP_RATING.average) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-slate-700">{MOCK_SHOP_RATING.average.toFixed(1)}</span>
                  <span className="text-xs text-slate-400">({MOCK_SHOP_RATING.count} รีวิว)</span>
                </div>
              </div>
            </div>
          </section>

          {/* ── หมวดหมู่บริการ (หมวดคงที่ 6 หมวด — โชว์เฉพาะหมวดที่ร้านนี้มีบริการจริงขายอยู่) — แสดงเฉยๆ ไม่ใช่ลิงก์ ── */}
          {matchedCategories.length > 0 && (
            <section>
              <h2 className="text-base font-bold text-slate-800 mb-3">หมวดหมู่บริการ</h2>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                {matchedCategories.map((cat, idx) => {
                  const imageSrc = CATEGORY_IMAGE[cat.type];
                  return (
                    <div key={cat.label} className="flex-1 basis-[100px] flex flex-col items-center gap-2 text-center">
                      {imageSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageSrc}
                          alt={cat.label}
                          className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl object-cover shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_-8px_rgba(15,23,42,0.15)]"
                        />
                      ) : (
                        <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl bg-gradient-to-b from-orange-100 to-orange-100/60 ring-1 ring-orange-200/60 flex items-center justify-center">
                          <CategoryIllustration type={cat.type} gradId={`cat-grad-${idx}`} />
                        </div>
                      )}
                      <span className="text-[11px] font-bold text-slate-700 leading-tight line-clamp-2">{cat.label}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── แบนเนอร์โปรโมท (ข้อความทั่วไป ไม่มีระบบโปรโมชั่น/ราคาจริงรองรับ) ── */}
          <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-8 sm:px-10 sm:py-10 text-white">
            <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-orange-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-14 -left-10 w-56 h-56 rounded-full bg-[#8FD2D5]/20 blur-3xl pointer-events-none" />
            <div className="relative max-w-md space-y-3">
              <h2 className="text-xl sm:text-2xl font-black leading-snug">งานพิมพ์คุณภาพ คมชัด สีสวย ทนทาน</h2>
              <p className="text-sm text-white/70">เลือกบริการที่ต้องการแล้วสั่งพิมพ์ได้ทันที ราคาคำนวณให้อัตโนมัติตามที่ร้านตั้งไว้</p>
              <a
                href="#services"
                className="inline-flex items-center gap-1.5 mt-1 px-5 py-2.5 text-sm font-bold text-orange-600 bg-white hover:bg-orange-50 rounded-full transition"
              >
                ดูบริการทั้งหมด
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </section>

          {/* ── บริการทั้งหมด ── */}
          <section id="services" className="scroll-mt-20">
            <h2 className="text-lg font-bold text-slate-800 mb-3.5">บริการทั้งหมด</h2>

            {activeServices.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border-2 border-dashed border-slate-200 text-slate-400">
                <Printer className="w-9 h-9 mx-auto mb-2.5 text-slate-300" />
                <p className="text-sm">ร้านนี้ยังไม่มีบริการเปิดให้สั่งพิมพ์</p>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border-2 border-dashed border-slate-200 text-slate-400">
                <Search className="w-9 h-9 mx-auto mb-2.5 text-slate-300" />
                <p className="text-sm">ไม่พบบริการที่ตรงกับ &quot;{searchQuery.trim()}&quot;</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
                {filteredServices.map((service) => {
                  const priceLabel = getPriceLabel(service);

                  return (
                    <Link
                      key={service.id}
                      href={`/shops/${params.shopId}/order/${service.id}`}
                      className="group relative bg-white rounded-2xl ring-1 ring-slate-900/5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_-8px_rgba(15,23,42,0.15)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_36px_-12px_rgba(244,106,47,0.35)] hover:-translate-y-1 hover:ring-orange-200 transition-all duration-300 p-3 flex flex-col"
                    >
                      <div className="aspect-[4/3] w-full bg-slate-100 rounded-xl shrink-0 overflow-hidden relative">
                        {service.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={service.imageUrl}
                            alt={service.name}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Printer className="w-8 h-8 text-slate-300" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between pt-2.5">
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm truncate group-hover:text-orange-600 transition">{service.name}</h3>
                          {service.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{service.description}</p>}
                        </div>
                        <div className="flex items-center justify-between mt-2 gap-1.5">
                          <span className="text-sm font-black text-orange-600 truncate">{priceLabel}</span>
                          <span className="shrink-0 px-3 py-1.5 text-xs font-bold text-white bg-orange-500 group-hover:bg-orange-600 rounded-full shadow-xs transition">
                            สั่งพิมพ์
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── ติดต่อและที่ตั้งร้าน ── */}
          {(shop.phone || shop.address || shop.socialMedia || shop.googleMapLink) && (
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-3.5">ติดต่อและที่ตั้งร้าน</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {shop.phone && (
                  <div className="bg-white rounded-2xl ring-1 ring-slate-900/5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_-8px_rgba(15,23,42,0.15)] p-4 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/30">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-500 font-semibold">เบอร์โทรศัพท์</p>
                      <a href={`tel:${shop.phone}`} className="text-sm font-bold text-slate-800 hover:text-orange-600 truncate block">
                        {shop.phone}
                      </a>
                    </div>
                  </div>
                )}
                {shop.socialMedia && (
                  <div className="bg-white rounded-2xl ring-1 ring-slate-900/5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_-8px_rgba(15,23,42,0.15)] p-4 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/30">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-500 font-semibold">ช่องทางโซเชียล</p>
                      {shop.socialMedia.startsWith("http") ? (
                        <a
                          href={shop.socialMedia}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-slate-800 hover:text-orange-600 truncate block"
                        >
                          {shop.socialMedia}
                        </a>
                      ) : (
                        <p className="text-sm font-bold text-slate-800 truncate">{shop.socialMedia}</p>
                      )}
                    </div>
                  </div>
                )}
                <div className="bg-white rounded-2xl ring-1 ring-slate-900/5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_-8px_rgba(15,23,42,0.15)] p-4 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/30">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-slate-500 font-semibold">ที่ตั้งร้าน</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{shop.address ?? "-"}</p>
                  </div>
                  {shop.googleMapLink && (
                    <a
                      href={shop.googleMapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition"
                      title="เปิดใน Google Maps"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {shop.address && (
                <div className="mt-3.5 rounded-3xl overflow-hidden ring-1 ring-slate-900/5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_-8px_rgba(15,23,42,0.15)] h-64 sm:h-72">
                  <iframe
                    title="แผนที่ร้าน"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(`${shop.name} ${shop.address}`)}&output=embed`}
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}
            </section>
          )}
        </main>
      )}

      {/* Footer */}
      <footer className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 text-white mt-4 py-10 sm:py-12 px-6 sm:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white text-orange-600 flex items-center justify-center font-bold">
                <Printer className="w-4 h-4" />
              </div>
              <span className="text-xl font-black tracking-tight">EASYPRINT</span>
            </div>
            <p className="text-sm text-white/90 leading-relaxed max-w-md">
              ประสบการณ์ใหม่สำหรับการสั่งพิมพ์งานออนไลน์ เพื่อความสะดวกสบาย พร้อมการแจ้งเตือน
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="tel:020000000"
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"
                title="โทรศัพท์"
              >
                <Phone className="w-4 h-4" />
              </a>
              <a
                href="mailto:contact@easyprint.com"
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"
                title="อีเมล"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black tracking-wider uppercase text-white/70">PLATFORM</h4>
            <ul className="space-y-2 text-sm text-white/90">
              <li>
                <a href="/" className="hover:underline">
                  ราคาร้านต่างๆ
                </a>
              </li>
              <li>
                <a href="/status" className="hover:underline">
                  ติดตามสถานะ
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
                  การช่วยเหลือ
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black tracking-wider uppercase text-white/70">COMPANY</h4>
            <ul className="space-y-2 text-sm text-white/90">
              <li>
                <a href="#" className="hover:underline">
                  Our Vision
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
                  Terms of Use
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto border-t border-white/20 mt-8 pt-6 text-center text-xs text-white/70">
          © {new Date().getFullYear()} EasyPrint. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function ShopDetailSkeleton() {
  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-8 animate-pulse">
      <div className="rounded-3xl border border-slate-100 bg-white p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl shrink-0 bg-slate-200" />
          <div className="flex-1 space-y-3 pt-1">
            <div className="h-6 w-40 bg-slate-200 rounded-full" />
            <div className="h-4 w-56 bg-slate-100 rounded-full" />
            <div className="h-4 w-32 bg-slate-100 rounded-full" />
          </div>
        </div>
      </div>
      <div className="space-y-3.5">
        <div className="h-5 w-32 bg-slate-200 rounded-full" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-3 flex flex-col gap-2.5">
              <div className="aspect-[4/3] w-full rounded-xl bg-slate-200" />
              <div className="h-4 w-3/4 bg-slate-200 rounded-full" />
              <div className="h-3 w-1/2 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
      <p className="sr-only">กำลังโหลดข้อมูลร้านค้า...</p>
    </main>
  );
}
