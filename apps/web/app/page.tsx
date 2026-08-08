"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Phone,
  Mail,
  SlidersHorizontal,
  X,
  RotateCcw,
  User,
  Store,
  Printer,
} from "lucide-react";
import { getShops, type PublicShopListItem } from "@/lib/api/shops";
import { isShopOpenNow } from "@/lib/shopHours";
import CustomerHeader from "@/components/customer/CustomerHeader";
import ShopSearchHero from "@/components/customer/ShopSearchHero";
import ServiceCategoryGrid from "@/components/customer/ServiceCategoryGrid";
import ShopCard from "@/components/customer/ShopCard";

export default function LandingPage() {
  const [shops, setShops] = useState<PublicShopListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [selectedDelivery, setSelectedDelivery] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<string>("all");
  const [selectedHours, setSelectedHours] = useState<string>("all");
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);
  const [registerModalOpen, setRegisterModalOpen] = useState<boolean>(false);
  const shopListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getShops()
      .then((res) => setShops(res.shops))
      .catch((err) => {
        console.error("โหลดรายชื่อร้านค้าไม่สำเร็จ:", err);
        setLoadError("โหลดรายชื่อร้านค้าไม่สำเร็จ — เช็คว่า API รันอยู่หรือไม่ (ดู console สำหรับรายละเอียด)");
      })
      .finally(() => setLoading(false));
  }, []);

  // Dynamic filtering logic
  const filteredShops = shops.filter((shop) => {
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      const matchesName = shop.name.toLowerCase().includes(q);
      const matchesService = (shop.serviceTypes ?? []).some((t) => t.toLowerCase().includes(q));
      if (!matchesName && !matchesService) return false;
    }
    if (selectedDelivery !== "all" && !(shop.deliveryMethods ?? []).includes(selectedDelivery)) {
      return false;
    }
    if (selectedService !== "all" && !(shop.serviceTypes ?? []).includes(selectedService)) {
      return false;
    }
    const openNow = isShopOpenNow(shop.openingHours);
    if (selectedHours === "open" && !openNow) {
      return false;
    }
    if (selectedHours === "close" && openNow) {
      return false;
    }
    return true;
  });

  // ร้านที่เปิดอยู่ตอนนี้ขึ้นก่อนเสมอ — ใช้ stable sort กันลำดับเดิม (createdAt desc จาก API) ภายในกลุ่มเปิด/ปิดสลับกันเอง
  const sortedShops = [...filteredShops].sort((a, b) => {
    const aOpen = isShopOpenNow(a.openingHours);
    const bOpen = isShopOpenNow(b.openingHours);
    return aOpen === bOpen ? 0 : aOpen ? -1 : 1;
  });

  const activeFilterCount =
    (selectedDelivery !== "all" ? 1 : 0) +
    (selectedService !== "all" ? 1 : 0) +
    (selectedHours !== "all" ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedDelivery("all");
    setSelectedService("all");
    setSelectedHours("all");
    setSearchText("");
  };

  const scrollToShopList = () => shopListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <CustomerHeader variant="guest" onSignupClick={() => setRegisterModalOpen(true)} />

      <ShopSearchHero
        searchText={searchText}
        onSearchTextChange={setSearchText}
        onViewAllClick={scrollToShopList}
      />

      {/* Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <ServiceCategoryGrid selected={selectedService} onSelect={setSelectedService} />

        {/* Filter Section */}
        <div ref={shopListRef} className="space-y-3 scroll-mt-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
              <SlidersHorizontal className="w-4 h-4 text-orange-500" />
              <span>ร้านพิมพ์ใกล้คุณ</span>
            </div>

            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="sm:hidden flex items-center gap-1.5 bg-orange-50 text-orange-600 border border-orange-200 font-bold text-xs px-3.5 py-1.5 rounded-full hover:bg-orange-100 transition"
            >
              <span>{mobileFilterOpen ? "ซ่อนตัวกรอง" : "กรองเพิ่มเติม"}</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${mobileFilterOpen ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Filter Dropdowns Box */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 bg-white p-4 rounded-2xl shadow-xs border border-slate-100 transition-all ${
              mobileFilterOpen ? "block" : "hidden sm:grid"
            }`}
          >
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">การจัดส่ง</label>
              <div className="relative">
                <select
                  value={selectedDelivery}
                  onChange={(e) => setSelectedDelivery(e.target.value)}
                  className="w-full bg-[#96f2eb]/60 text-slate-800 font-bold text-sm rounded-full px-4 py-2.5 appearance-none hover:bg-[#82e5dd] transition focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer pr-10"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="รับที่หน้าร้าน">รับเอง</option>
                  <option value="จัดส่งโดยร้าน">ร้านจัดส่งให้</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-600 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">ประเภทงาน</label>
              <div className="relative">
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full bg-[#96f2eb]/60 text-slate-800 font-bold text-sm rounded-full px-4 py-2.5 appearance-none hover:bg-[#82e5dd] transition focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer pr-10"
                >
                  <option value="all">ทั้งหมด</option>
                  {[...new Set(shops.flatMap((shop) => shop.serviceTypes ?? []))].map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-600 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">เวลาทำการ</label>
              <div className="relative">
                <select
                  value={selectedHours}
                  onChange={(e) => setSelectedHours(e.target.value)}
                  className="w-full bg-[#96f2eb]/60 text-slate-800 font-bold text-sm rounded-full px-4 py-2.5 appearance-none hover:bg-[#82e5dd] transition focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer pr-10"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="open">เปิดทำการตอนนี้</option>
                  <option value="close">ปิดทำการตอนนี้</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-600 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* ระยะทาง — ยังไม่มีข้อมูลพิกัดร้าน/ลูกค้าจริงในระบบ ใส่ไว้ให้ตรงหน้าตาม็อคอปก่อน ยังไม่กรองจริง */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">ระยะทาง</label>
              <div className="relative">
                <select
                  disabled
                  defaultValue="all"
                  title="ต้องขอสิทธิ์ตำแหน่งลูกค้าก่อนถึงจะกรองได้จริง — ยังไม่เปิดใช้งาน"
                  className="w-full bg-slate-100 text-slate-400 font-bold text-sm rounded-full px-4 py-2.5 appearance-none pr-10 cursor-not-allowed"
                >
                  <option value="all">ทั้งหมด</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="sm:col-span-2 lg:col-span-4 pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={clearAllFilters}
                  className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  ล้างตัวกรองทั้งหมด
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Shop Grid */}
        {loading ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center border-2 border-dashed border-slate-200">
            <p className="text-slate-500 font-semibold text-xs sm:text-base">กำลังโหลดร้านค้า...</p>
          </div>
        ) : loadError ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center border-2 border-dashed border-red-200 space-y-1">
            <p className="text-red-500 font-semibold text-xs sm:text-base">{loadError}</p>
            <p className="text-slate-400 text-[11px] sm:text-xs">
              ถ้าเพิ่งดึงโค้ดมาใหม่ ให้เช็คว่ารัน API (`bun dev:api`) อยู่ และ `.env` ตั้งค่าถูกต้อง
            </p>
          </div>
        ) : sortedShops.length === 0 ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center border-2 border-dashed border-slate-200 space-y-3">
            <p className="text-slate-500 font-semibold text-xs sm:text-base">
              {shops.length === 0 ? "ยังไม่มีร้านค้าที่เปิดให้บริการในขณะนี้" : "ไม่พบร้านค้าที่ตรงตามเงื่อนไขที่เลือก"}
            </p>
            {shops.length > 0 && (
              <button onClick={clearAllFilters} className="text-orange-500 font-bold text-xs sm:text-sm underline hover:text-orange-600">
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {sortedShops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 text-white mt-12 sm:mt-16 py-10 sm:py-12 px-6 sm:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
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
              <li><a href="#" className="hover:underline">ราคาร้านต่างๆ</a></li>
              <li><a href="#" className="hover:underline">ติดตามสถานะ</a></li>
              <li><a href="#" className="hover:underline">การช่วยเหลือ</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black tracking-wider uppercase text-white/70">COMPANY</h4>
            <ul className="space-y-2 text-sm text-white/90">
              <li><a href="#" className="hover:underline">Our Vision</a></li>
              <li><a href="#" className="hover:underline">Privacy Policy</a></li>
              <li><a href="#" className="hover:underline">Terms of Use</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto border-t border-white/20 mt-8 pt-6 text-center text-xs text-white/70">
          © {new Date().getFullYear()} EasyPrint. All rights reserved.
        </div>
      </footer>

      {/* ─── Register Select Modal ─── */}
      {registerModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setRegisterModalOpen(false)}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-7 sm:p-9 space-y-6 relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setRegisterModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-orange-500">สมัครสมาชิก</h2>
              <p className="text-slate-500 text-sm">คุณต้องการสมัครในฐานะอะไร?</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/register"
                className="group border-2 border-slate-200 hover:border-teal-400 rounded-2xl p-5 flex flex-col items-center gap-3 text-center transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-xl bg-teal-100 group-hover:bg-teal-500 flex items-center justify-center transition-all">
                  <User className="w-7 h-7 text-teal-500 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="font-black text-slate-800">ลูกค้า</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">สั่งพิมพ์งานออนไลน์</p>
                </div>
                <span className="flex items-center gap-1 text-teal-600 font-bold text-x">เลือก</span>
              </Link>

              <Link
                href="/register/shop-register"
                className="group border-2 border-slate-200 hover:border-orange-400 rounded-2xl p-5 flex flex-col items-center gap-3 text-center transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-xl bg-orange-100 group-hover:bg-orange-500 flex items-center justify-center transition-all">
                  <Store className="w-7 h-7 text-orange-500 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="font-black text-slate-800">ร้านค้า</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">รับออเดอร์ออนไลน์</p>
                </div>
                <span className="flex items-center gap-1 text-orange-500 font-bold text-x">เลือก</span>
              </Link>
            </div>

            <p className="text-center text-xs text-slate-400">
              มีบัญชีอยู่แล้ว?{" "}
              <Link href="/login" className="text-orange-500 font-bold hover:underline">เข้าสู่ระบบ</Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
