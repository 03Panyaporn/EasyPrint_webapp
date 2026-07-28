"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Printer,
  MapPin,
  Clock,
  ChevronDown,
  Phone,
  Mail,
  SlidersHorizontal,
  Menu,
  X,
  RotateCcw,
  User,
  Store,
} from "lucide-react";
import { getShops, type PublicShopListItem } from "@/lib/api/shops";
import { isShopOpenNow, formatTodayHours } from "@/lib/shopHours";

export default function LandingPage() {
  const [shops, setShops] = useState<PublicShopListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDelivery, setSelectedDelivery] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<string>("all");
  const [selectedHours, setSelectedHours] = useState<string>("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);
  const [registerModalOpen, setRegisterModalOpen] = useState<boolean>(false);

  useEffect(() => {
    getShops()
      .then((res) => setShops(res.shops))
      .catch(() => setShops([]))
      .finally(() => setLoading(false));
  }, []);

  // รายการ "ประเภทงาน" ในตัวกรอง มาจากบริการจริงที่ร้านที่อนุมัติแล้วให้บริการเท่านั้น
  const allServiceTypes = [...new Set(shops.flatMap((shop) => shop.serviceTypes ?? []))];

  // Dynamic filtering logic
  const filteredShops = shops.filter((shop) => {
    // Delivery method filter
    if (selectedDelivery !== "all" && !(shop.deliveryMethods ?? []).includes(selectedDelivery)) {
      return false;
    }
    // Service filter
    if (selectedService !== "all" && !(shop.serviceTypes ?? []).includes(selectedService)) {
      return false;
    }
    // Hours filter
    const openNow = isShopOpenNow(shop.openingHours);
    if (selectedHours === "open" && !openNow) {
      return false;
    }
    if (selectedHours === "close" && openNow) {
      return false;
    }
    return true;
  });

  const activeFilterCount =
    (selectedDelivery !== "all" ? 1 : 0) +
    (selectedService !== "all" ? 1 : 0) +
    (selectedHours !== "all" ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedDelivery("all");
    setSelectedService("all");
    setSelectedHours("all");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navbar Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 px-4 sm:px-6 lg:px-16 py-3.5 flex items-center justify-between shadow-xs">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition">
            <Printer className="w-5 h-5" />
          </div>
          <span className="text-xl sm:text-2xl  tracking-tight font-black text-lg text-orange-500">
            EASY<span className="text-orange-500">PRINT</span>
          </span>
        </Link>

        {/* Center Nav (Desktop) */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className="text-orange-500 font-bold border-b-2 border-orange-500 pb-0.5 text-base transition"
          >
            หน้าหลัก
          </Link>
        </nav>

        {/* Auth Buttons (Desktop) */}
        <div className="hidden sm:flex items-center gap-4">
          <Link
            href="/login"
            className="text-orange-500 font-semibold hover:text-orange-600 text-sm md:text-base px-2 py-1 transition"
          >
            เข้าสู่ระบบ
          </Link>
          <button
            onClick={() => setRegisterModalOpen(true)}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-full px-6 py-2 text-sm md:text-base shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            สมัครสมาชิก
          </button>
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="sm:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-700 hover:text-orange-500 hover:bg-orange-50 transition focus:outline-none"
            aria-label="Toggle Mobile Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-3 sticky top-[61px] z-40 shadow-lg animate-in slide-in-from-top-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-orange-500 font-bold text-base py-1 border-b border-slate-100"
          >
            หน้าหลัก
          </Link>
          <div className="flex flex-col gap-2 pt-1">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center text-orange-500 font-semibold py-2.5 rounded-xl border border-orange-200 bg-orange-50/50 transition"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold py-2.5 rounded-xl shadow-xs transition"
            >
              สมัครสมาชิก
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#4bc5e0] via-[#5cc3d4] to-[#ef7d3b] pt-12 sm:pt-14 pb-16 sm:pb-20 px-4 sm:px-6 text-center shadow-inner">
        {/* Background Overlay Art */}
        <div className="absolute inset-0 bg-black/5 pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-wide drop-shadow-md">
            ร้านถ่ายเอกสารออนไลน์
          </h1>

          {/* Subtitle Glass Pill */}
          <div className="inline-block bg-white/85 backdrop-blur-md px-4 sm:px-6 py-2 sm:py-2.5 rounded-full border border-white/40 shadow-lg">
            <p className="text-slate-700 font-bold text-xs sm:text-base md:text-lg">
              ใช้ง่ายแค่{" "}
              <span className="text-orange-600 font-extrabold">เลือกร้านที่คุณต้องการ</span>{" "}
              อัปโหลดไฟล์
            </p>
          </div>
        </div>
      </section>

      {/* Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Filter Section */}
        <div className="space-y-3">
          {/* Section Header with Mobile Filter Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
              <SlidersHorizontal className="w-4 h-4 text-orange-500" />
              <span>ตัวกรองร้านค้า</span>
            </div>

            {/* Mobile Filter Toggle Button */}
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
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${mobileFilterOpen ? "rotate-180" : ""
                  }`}
              />
            </button>
          </div>

          {/* Mobile Quick Tap Chips (Horizontal Scroll on Mobile) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:hidden scrollbar-none text-xs font-semibold">
            <button
              onClick={() => setSelectedDelivery("all")}
              className={`px-3.5 py-1.5 rounded-full shrink-0 transition ${selectedDelivery === "all"
                ? "bg-orange-500 text-white shadow-xs font-bold"
                : "bg-slate-200/70 text-slate-700 hover:bg-slate-300"
                }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() =>
                setSelectedDelivery(selectedDelivery === "รับที่หน้าร้าน" ? "all" : "รับที่หน้าร้าน")
              }
              className={`px-3.5 py-1.5 rounded-full shrink-0 transition ${selectedDelivery === "รับที่หน้าร้าน"
                ? "bg-teal-500 text-white shadow-xs font-bold"
                : "bg-[#96f2eb]/60 text-slate-800 hover:bg-[#82e5dd]"
                }`}
            >
              รับเอง
            </button>
            <button
              onClick={() =>
                setSelectedDelivery(selectedDelivery === "จัดส่งโดยร้าน" ? "all" : "จัดส่งโดยร้าน")
              }
              className={`px-3.5 py-1.5 rounded-full shrink-0 transition ${selectedDelivery === "จัดส่งโดยร้าน"
                ? "bg-teal-500 text-white shadow-xs font-bold"
                : "bg-[#96f2eb]/60 text-slate-800 hover:bg-[#82e5dd]"
                }`}
            >
              ร้านจัดส่งให้
            </button>
            <button
              onClick={() =>
                setSelectedHours(selectedHours === "open" ? "all" : "open")
              }
              className={`px-3.5 py-1.5 rounded-full shrink-0 transition ${selectedHours === "open"
                ? "bg-emerald-500 text-white shadow-xs font-bold"
                : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                }`}
            >
              เปิดทำการตอนนี้
            </button>
          </div>

          {/* Filter Dropdowns Box */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 bg-white p-4 rounded-2xl shadow-xs border border-slate-100 transition-all ${mobileFilterOpen ? "block" : "hidden sm:grid"
              }`}
          >
            {/* Filter 1: การจัดส่ง*/}
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

            {/* Filter 2: ประเภทงาน */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">ประเภทงาน</label>
              <div className="relative">
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full bg-[#96f2eb]/60 text-slate-800 font-bold text-sm rounded-full px-4 py-2.5 appearance-none hover:bg-[#82e5dd] transition focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer pr-10"
                >
                  <option value="all">ทั้งหมด</option>
                  {allServiceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-600 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Filter 3: เวลาทำการ */}
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

            {/* Reset Filters Option on Mobile */}
            {activeFilterCount > 0 && (
              <div className="sm:hidden pt-2 border-t border-slate-100 flex justify-end">
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
        ) : filteredShops.length === 0 ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center border-2 border-dashed border-slate-200 space-y-3">
            <p className="text-slate-500 font-semibold text-xs sm:text-base">
              {shops.length === 0
                ? "ยังไม่มีร้านค้าที่เปิดให้บริการในขณะนี้"
                : "ไม่พบร้านค้าที่ตรงตามเงื่อนไขที่เลือก"}
            </p>
            {shops.length > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-orange-500 font-bold text-xs sm:text-sm underline hover:text-orange-600"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-6">
            {filteredShops.map((shop) => {
              const openNow = isShopOpenNow(shop.openingHours);
              return (
                <div
                  key={shop.id}
                  className="group border-2 border-orange-300 hover:border-orange-400 rounded-2xl sm:rounded-3xl p-3 sm:p-5 bg-white shadow-xs hover:shadow-md transition-all flex flex-row gap-3 sm:gap-5 relative overflow-hidden"
                >
                  {/* Shop Image Box (Compact Square on Mobile & Desktop) */}
                  <div className="w-24 sm:w-36 h-24 sm:h-36 bg-slate-200 rounded-xl sm:rounded-2xl shrink-0 flex items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition">
                    {shop.shopPhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={shop.shopPhotoUrl}
                        alt={shop.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                        <Printer className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400/70" />
                      </div>
                    )}
                  </div>

                  {/* Shop Details Right Side */}
                  <div className="flex-1 flex flex-col justify-between space-y-1 sm:space-y-2 overflow-hidden">
                    <div className="flex items-start justify-between gap-1.5">
                      <h3 className="text-base sm:text-2xl font-black text-orange-500 group-hover:text-orange-600 transition truncate">
                        {shop.name}
                      </h3>
                      <span
                        className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-3 sm:py-1 rounded-full flex items-center gap-1 shrink-0 ${openNow
                          ? "bg-emerald-500 text-white shadow-xs"
                          : "bg-slate-400 text-white"
                          }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        {openNow ? "เปิดทำการ" : "ปิดทำการ"}
                      </span>
                    </div>

                    {/* Service Badge */}
                    <div>
                      <span className="inline-block bg-[#96f2eb]/70 text-slate-700 text-[10px] sm:text-xs font-bold px-2.5 py-0.5 sm:px-3.5 sm:py-1 rounded-full truncate max-w-full">
                        {(shop.serviceTypes ?? []).join(", ") || "-"}
                      </span>
                    </div>

                    {/* Location & Operating Hours */}
                    <div className="space-y-0.5 sm:space-y-1 text-[11px] sm:text-sm text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 shrink-0" />
                        <span className="truncate">{shop.address ?? "-"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 shrink-0" />
                        <span className="truncate">{formatTodayHours(shop.openingHours)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
            {/* Social / Contact Icons */}
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

          {/* Platform Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black tracking-wider uppercase text-white/70">
              PLATFORM
            </h4>
            <ul className="space-y-2 text-sm text-white/90">
              <li>
                <a href="#" className="hover:underline">
                  ราคาร้านต่างๆ
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
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

          {/* Company Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black tracking-wider uppercase text-white/70">
              COMPANY
            </h4>
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

      {/* ─── Register Select Modal ─── */}
      {registerModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setRegisterModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-7 sm:p-9 space-y-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setRegisterModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title */}
            <div className="text-center space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-orange-500  ">
                สมัครสมาชิก
              </h2>
              <p className="text-slate-500 text-sm">คุณต้องการสมัครในฐานะอะไร?</p>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* ลูกค้า */}
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
                <span className="flex items-center gap-1 text-teal-600 font-bold text-x">
                  เลือก
                </span>
              </Link>

              {/* ร้านค้า */}
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
                <span className="flex items-center gap-1 text-orange-500 font-bold text-x">
                  เลือก
                </span>
              </Link>
            </div>

            <p className="text-center text-xs text-slate-400">
              มีบัญชีอยู่แล้ว?{" "}
              <Link href="/login" className="text-orange-500 font-bold hover:underline">
                เข้าสู่ระบบ
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
