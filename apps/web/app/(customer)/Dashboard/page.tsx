"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, SlidersHorizontal, RotateCcw } from "lucide-react";
import { getShops, type PublicShopListItem } from "@/lib/api/shops";
import { isShopOpenNow } from "@/lib/shopHours";
import ShopSearchHero from "@/components/customer/ShopSearchHero";
import ServiceCategoryGrid from "@/components/customer/ServiceCategoryGrid";
import ShopCard from "@/components/customer/ShopCard";

export default function DashboardPage() {
  const [shops, setShops] = useState<PublicShopListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedDelivery, setSelectedDelivery] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<string>("all");
  const [selectedHours, setSelectedHours] = useState<string>("all");
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);
  const shopListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getShops()
      .then((res) => setShops(res.shops))
      .catch((err) => {
        console.error(err);
        setLoadError("โหลดข้อมูลร้านค้าไม่สำเร็จ");
      })
      .finally(() => setLoading(false));
  }, []);

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
    <>
      <ShopSearchHero
        searchText={searchText}
        onSearchTextChange={setSearchText}
        onViewAllClick={scrollToShopList}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-3.5 sm:py-5 space-y-3.5 sm:space-y-4.5">
        <ServiceCategoryGrid selected={selectedService} onSelect={setSelectedService} />

        {/* Filter Section - Right-aligned tight pills bar */}
        <div ref={shopListRef} className="scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Left: Title */}
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm shrink-0">
              <SlidersHorizontal className="w-4 h-4 text-orange-500" />
              <span>ร้านพิมพ์ใกล้คุณ</span>
            </div>

            {/* Right: Inline Filter Dropdowns Bar (Right-aligned, tight pill width) */}
            <div
              className={`flex-wrap sm:flex items-center gap-2 sm:justify-end transition-all ${
                mobileFilterOpen ? "flex bg-white p-2.5 rounded-2xl border border-slate-100 shadow-2xs mt-2 sm:mt-0" : "hidden sm:flex"
              }`}
            >
              {/* 1. การจัดส่ง */}
              <div
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-all relative shrink-0 border ${
                  selectedDelivery !== "all"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400 shadow-xs"
                    : "bg-orange-50/80 hover:bg-orange-100/90 text-slate-800 border-orange-200/80 shadow-2xs"
                }`}
              >
                <span className={`font-bold text-[11px] shrink-0 ${selectedDelivery !== "all" ? "text-orange-100" : "text-orange-600"}`}>
                  การจัดส่ง:
                </span>
                <select
                  value={selectedDelivery}
                  onChange={(e) => setSelectedDelivery(e.target.value)}
                  className={`bg-transparent font-extrabold text-xs appearance-none focus:outline-none cursor-pointer pr-3.5 shrink-0 ${
                    selectedDelivery !== "all" ? "text-white" : "text-slate-800"
                  } ${
                    selectedDelivery === "all" ? "w-[54px]" : selectedDelivery === "รับที่หน้าร้าน" ? "w-[52px]" : "w-[84px]"
                  }`}
                >
                  <option value="all" className="text-slate-800">ทั้งหมด</option>
                  <option value="รับที่หน้าร้าน" className="text-slate-800">รับเอง</option>
                  <option value="จัดส่งโดยร้าน" className="text-slate-800">ร้านจัดส่งให้</option>
                </select>
                <ChevronDown className={`w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${selectedDelivery !== "all" ? "text-white" : "text-slate-500"}`} />
              </div>

              {/* 2. ประเภทงาน */}
              <div
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-all relative shrink-0 border ${
                  selectedService !== "all"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400 shadow-xs"
                    : "bg-orange-50/80 hover:bg-orange-100/90 text-slate-800 border-orange-200/80 shadow-2xs"
                }`}
              >
                <span className={`font-bold text-[11px] shrink-0 ${selectedService !== "all" ? "text-orange-100" : "text-orange-600"}`}>
                  ประเภทงาน:
                </span>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className={`bg-transparent font-extrabold text-xs appearance-none focus:outline-none cursor-pointer pr-3.5 shrink-0 ${
                    selectedService !== "all" ? "text-white" : "text-slate-800"
                  } ${
                    selectedService === "all" ? "w-[54px]" : "w-auto max-w-[125px] truncate"
                  }`}
                >
                  <option value="all" className="text-slate-800">ทั้งหมด</option>
                  {[...new Set(shops.flatMap((shop) => shop.serviceTypes ?? []))].map((type) => (
                    <option key={type} value={type} className="text-slate-800">{type}</option>
                  ))}
                </select>
                <ChevronDown className={`w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${selectedService !== "all" ? "text-white" : "text-slate-500"}`} />
              </div>

              {/* 3. เวลาทำการ */}
              <div
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-all relative shrink-0 border ${
                  selectedHours !== "all"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400 shadow-xs"
                    : "bg-orange-50/80 hover:bg-orange-100/90 text-slate-800 border-orange-200/80 shadow-2xs"
                }`}
              >
                <span className={`font-bold text-[11px] shrink-0 ${selectedHours !== "all" ? "text-orange-100" : "text-orange-600"}`}>
                  เวลาทำการ:
                </span>
                <select
                  value={selectedHours}
                  onChange={(e) => setSelectedHours(e.target.value)}
                  className={`bg-transparent font-extrabold text-xs appearance-none focus:outline-none cursor-pointer pr-3.5 shrink-0 ${
                    selectedHours !== "all" ? "text-white" : "text-slate-800"
                  } ${
                    selectedHours === "all" ? "w-[54px]" : selectedHours === "open" ? "w-[96px]" : "w-[92px]"
                  }`}
                >
                  <option value="all" className="text-slate-800">ทั้งหมด</option>
                  <option value="open" className="text-slate-800">เปิดทำการตอนนี้</option>
                  <option value="close" className="text-slate-800">ปิดทำการตอนนี้</option>
                </select>
                <ChevronDown className={`w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${selectedHours !== "all" ? "text-white" : "text-slate-500"}`} />
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] font-extrabold text-orange-500 hover:text-orange-600 flex items-center gap-1 ml-0.5"
                >
                  <RotateCcw className="w-3 h-3" />
                  ล้างตัวกรอง
                </button>
              )}
            </div>

            {/* Mobile Filter Button */}
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="sm:hidden flex items-center justify-between bg-orange-50 text-orange-600 border border-orange-200 font-bold text-xs px-3.5 py-1.5 rounded-full hover:bg-orange-100 transition"
            >
              <span>{mobileFilterOpen ? "ซ่อนตัวกรอง" : "กรองเพิ่มเติม"}</span>
              <div className="flex items-center gap-1.5">
                {activeFilterCount > 0 && (
                  <span className="w-4.5 h-4.5 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${mobileFilterOpen ? "rotate-180" : ""}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Shop Grid */}
        {loading ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center border-2 border-dashed border-slate-200">
            <p className="text-slate-500 font-semibold text-xs sm:text-base">กำลังโหลดร้านค้า...</p>
          </div>
        ) : loadError ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center border-2 border-dashed border-red-200">
            <p className="text-red-500 font-semibold text-xs sm:text-base">{loadError}</p>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-5">
            {sortedShops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
