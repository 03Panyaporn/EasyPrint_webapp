"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, User, Menu, X, ChevronRight } from "lucide-react";
import { logout as logoutApi } from "@/lib/api/auth";

// nav กลางที่ยังไม่มีหน้าจริงรองรับ (แชท/ติดต่อเรา) — ใส่ไว้ให้ตรงหน้าตาม็อคอปก่อน ยังไม่ผูก route จริง
const NAV_LINKS: { label: string; href: string }[] = [
  { label: "แชท", href: "#" },
  { label: "ติดต่อเรา", href: "#" },
];

interface ShopDetailHeaderProps {
  cartCount?: number;
}

// Header เฉพาะหน้ารายละเอียดร้านค้า (/shops/[shopId]) — แยกจาก CustomerHeader ที่ใช้ในหน้าอื่นๆ
// ของเว็บ เพื่อไม่ให้การปรับดีไซน์ตรงนี้กระทบหน้าอื่น เข้าหน้านี้ได้เฉพาะลูกค้าที่ login แล้วเท่านั้น
// จึงมีแค่โหมด auth (ไม่มี guest state)
export default function ShopDetailHeader({ cartCount = 0 }: ShopDetailHeaderProps) {
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
        <header className="bg-white/95 backdrop-blur-md pl-3 pr-4 sm:pl-4 sm:pr-6 lg:pl-6 lg:pr-16 py-3.5 flex items-center gap-4 shadow-xs">
          {/* Logo — ยึดซ้ายสุดเสมอ ไม่ถูกดันด้วย nav กลาง */}
          <Link href="/Dashboard" className="flex items-center shrink-0 ml-[25px]">
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
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm shadow-orange-500/40">
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
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm shadow-orange-500/40">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="p-2 rounded-xl text-slate-700 hover:text-orange-500 hover:bg-orange-50 transition focus:outline-none"
              aria-label="Toggle Mobile Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>
      </div>

      {/* แถบสีส้มใต้ header ทำหน้าที่เป็นทั้งเส้นขั้นและที่ใส่ Breadcrumbs ในตัว ไม่ sticky ตาม (เลื่อนไปกับเนื้อหาปกติ) */}
      <nav aria-label="breadcrumb" className="bg-orange-400 px-4 sm:px-6 lg:px-16 py-1.5">
        <ol className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white/70 min-w-0 -ml-[10px]">
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
      </nav>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-3 sticky top-[68px] z-40 shadow-lg">
          <Link href="/Dashboard" onClick={() => setMobileMenuOpen(false)} className="block font-bold text-slate-700 hover:text-orange-500 py-1 border-b border-slate-100">
            หน้าหลัก
          </Link>
          <Link href="/orders" onClick={() => setMobileMenuOpen(false)} className="block font-semibold text-slate-700 hover:text-orange-500">
            ติดตามคำสั่งซื้อ
          </Link>
          {NAV_LINKS.map((l) => (
            <Link key={l.label} href={l.href} onClick={() => setMobileMenuOpen(false)} className="block font-semibold text-slate-700 hover:text-orange-500">
              {l.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 pt-1">
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center text-orange-500 font-semibold py-2.5 rounded-xl border border-orange-200 bg-orange-50/50 transition"
            >
              โปรไฟล์ของฉัน
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setLogoutConfirmOpen(true);
              }}
              className="w-full text-center bg-red-50 text-red-500 font-semibold py-2.5 rounded-xl transition"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      )}

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
