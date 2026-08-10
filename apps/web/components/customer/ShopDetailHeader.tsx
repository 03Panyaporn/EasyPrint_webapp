"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, User, Menu, X, ChevronRight, Home, Package, MessageCircle, Phone, LogOut, Heart } from "lucide-react";
import { logout as logoutApi } from "@/lib/api/auth";

// nav กลางที่ยังไม่มีหน้าจริงรองรับ (แชท/ติดต่อเรา) — ใส่ไว้ให้ตรงหน้าตาม็อคอปก่อน ยังไม่ผูก route จริง
const NAV_LINKS: { label: string; href: string }[] = [
  { label: "แชท", href: "#" },
  { label: "ติดต่อเรา", href: "#" },
];

interface ShopDetailHeaderProps {
  cartCount?: number;
  openNow?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

// Header เฉพาะหน้ารายละเอียดร้านค้า (/shops/[shopId]) — แยกจาก CustomerHeader ที่ใช้ในหน้าอื่นๆ
// ของเว็บ เพื่อไม่ให้การปรับดีไซน์ตรงนี้กระทบหน้าอื่น เข้าหน้านี้ได้เฉพาะลูกค้าที่ login แล้วเท่านั้น
// จึงมีแค่โหมด auth (ไม่มี guest state)
export default function ShopDetailHeader({ cartCount = 0, openNow = false, isFavorite = false, onToggleFavorite }: ShopDetailHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      // เข้าสู่ระบบใหม่ได้เสมออยู่แล้ว ไม่ critical ถ้า logout endpoint พลาด
    }
    setLogoutConfirmOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <div className="sticky top-0 z-50">
        <header className="bg-white/95 backdrop-blur-md px-4 sm:pl-4 sm:pr-6 lg:pl-6 lg:pr-16 py-3.5 flex items-center gap-4 shadow-xs">
          {/* Logo — ยึดซ้ายสุดเสมอ ไม่ถูกดันด้วย nav กลาง */}
          <Link href="/Dashboard" className="flex items-center shrink-0 sm:ml-[25px]">
            <span className="text-lg sm:text-xl lg:text-2xl tracking-tight font-bold text-orange-500 whitespace-nowrap">
              EASYPRINT
            </span>
          </Link>

          {/* Center Nav (Desktop) */}
          <nav className="hidden lg:flex items-center gap-7 flex-1 justify-center">
            <Link
              href="/Dashboard"
              className="font-bold pb-0.5 text-sm xl:text-base text-gray-700 hover:text-orange-500 transition"
            >
              หน้าหลัก
            </Link>
            <Link
              href="/orders"
              className={`font-bold pb-0.5 text-sm xl:text-base transition ${
                pathname.startsWith("/orders") ? "text-orange-500 border-b-2 border-orange-500" : "text-gray-700 hover:text-orange-500"
              }`}
            >
              ติดตามคำสั่งซื้อ
            </Link>
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="font-bold pb-0.5 text-sm xl:text-base text-gray-700 hover:text-orange-500 transition"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right side (Desktop) */}
          <div className="hidden sm:flex items-center gap-4 shrink-0 ml-auto lg:ml-0">
            <Link
              href="/cart"
              className="relative flex items-center justify-center w-10 h-10 text-orange-500 hover:text-orange-600 hover:-translate-y-0.5 transition"
              title="ตะกร้า"
            >
              <ShoppingCart className="w-6 h-6 drop-shadow-[0_3px_4px_rgba(249,115,22,0.4)]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-extrabold inline-flex items-center justify-center shrink-0 aspect-square leading-none pointer-events-none shadow-sm shadow-orange-500/40">
                  {cartCount}
                </span>
              )}
            </Link>

            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen((v) => !v)}
                className="flex items-center justify-center w-10 h-10 text-orange-500 hover:text-orange-600 hover:-translate-y-0.5 transition"
                title="บัญชีของฉัน"
              >
                <User className="w-6 h-6 drop-shadow-[0_3px_4px_rgba(249,115,22,0.4)]" />
              </button>
              {profileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50">
                    <Link
                      href="/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition"
                    >
                      โปรไฟล์ของฉัน
                    </Link>
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        setLogoutConfirmOpen(true);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition"
                    >
                      ออกจากระบบ
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden flex items-center gap-1.5 ml-auto">
            <Link
              href="/cart"
              className="relative flex items-center justify-center w-9 h-9 text-orange-500"
            >
              <ShoppingCart className="w-5 h-5 drop-shadow-[0_2px_3px_rgba(249,115,22,0.4)]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-extrabold inline-flex items-center justify-center shrink-0 aspect-square leading-none pointer-events-none shadow-sm shadow-orange-500/40">
                  {cartCount}
                </span>
              )}
            </Link>

            <div className="relative">
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="p-2 rounded-xl text-slate-700 hover:text-orange-500 hover:bg-orange-50 transition focus:outline-none"
                aria-label="Toggle Mobile Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* เมนูมือถือแบบ dropdown card ลอย (ไอคอน+ข้อความ, hover ไฮไลต์, เส้นคั่นก่อนออกจากระบบ) ตามภาพตัวอย่าง แทนแถบเต็มความกว้างแบบเดิม */}
              {mobileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMobileMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                    <Link
                      href="/Dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-orange-600 transition"
                    >
                      <Home className="w-[18px] h-[18px] text-slate-400" />
                      หน้าหลัก
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-orange-600 transition"
                    >
                      <Package className="w-[18px] h-[18px] text-slate-400" />
                      ติดตามคำสั่งซื้อ
                    </Link>
                    <Link
                      href="#"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-orange-600 transition"
                    >
                      <MessageCircle className="w-[18px] h-[18px] text-slate-400" />
                      แชท
                    </Link>
                    <Link
                      href="#"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-orange-600 transition"
                    >
                      <Phone className="w-[18px] h-[18px] text-slate-400" />
                      ติดต่อเรา
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-orange-600 transition"
                    >
                      <User className="w-[18px] h-[18px] text-slate-400" />
                      โปรไฟล์ของฉัน
                    </Link>

                    <div className="my-1.5 border-t border-slate-100" />

                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setLogoutConfirmOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition"
                    >
                      <LogOut className="w-[18px] h-[18px]" />
                      ออกจากระบบ
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
      </div>

      {/* แถบสีส้มใต้ header ทำหน้าที่เป็นทั้งเส้นขั้นและที่ใส่ Breadcrumbs ในตัว ไม่ sticky ตาม (เลื่อนไปกับเนื้อหาปกติ) */}
      <nav aria-label="breadcrumb" className="bg-orange-400 px-4 sm:px-6 lg:px-16 py-1.5">
        <div className="flex items-center justify-between gap-3">
          <ol className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white/70 min-w-0 sm:-ml-[10px]">
            <li className="shrink-0">
              <Link href="/Dashboard" className="hover:text-white transition">
                หน้าหลัก
              </Link>
            </li>
            <li aria-hidden className="shrink-0">
              <ChevronRight className="w-3 h-3 text-white/50" />
            </li>
            <li aria-current="page" className="text-white font-semibold truncate">
              รายละเอียดร้านค้า
            </li>
          </ol>

          {/* สถานะเปิด/ปิด + ปุ่มรายการโปรด — เฉพาะมือถือเท่านั้น (จอ PC ใช้ตำแหน่งเดิมในการ์ดโปรไฟล์ ดูใน page.tsx) */}
          <div className="flex sm:hidden items-center gap-2 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm ${
                openNow
                  ? "bg-gradient-to-b from-emerald-400 to-emerald-500 text-white ring-1 ring-emerald-600/30"
                  : "bg-white/85 text-slate-500 ring-1 ring-black/5"
              }`}
            >
              {openNow ? (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                </span>
              ) : (
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-slate-400" />
              )}
              <span className="tracking-wide whitespace-nowrap">{openNow ? "เปิดทำการ" : "ปิดทำการ"}</span>
            </span>

            <button
              onClick={onToggleFavorite}
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all active:scale-95 shrink-0 ${
                isFavorite
                  ? "bg-white text-rose-500 shadow-sm"
                  : "bg-white/25 text-white hover:bg-white/40"
              }`}
              title={isFavorite ? "เลิกบันทึกร้านโปรด" : "บันทึกร้านโปรด"}
            >
              <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-300 ${isFavorite ? "fill-rose-500 scale-110" : ""}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* Logout confirm modal */}
      {logoutConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setLogoutConfirmOpen(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-800">ยืนยันการออกจากระบบ</h2>
            <p className="text-slate-500 mt-2">คุณต้องการออกจากระบบใช่หรือไม่?</p>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setLogoutConfirmOpen(false)} className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-100">
                ยกเลิก
              </button>
              <button onClick={handleLogout} className="px-4 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600">
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
