"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Printer, ShoppingCart, User, Menu, X } from "lucide-react";
import { logout as logoutApi } from "@/lib/api/auth";

// nav กลางที่ยังไม่มีหน้าจริงรองรับ (แชท/ติดต่อเรา) — ใส่ไว้ให้ตรงหน้าตาม็อคอปก่อน ยังไม่ผูก route จริง
const NAV_LINKS: { label: string; href: string; match?: (pathname: string) => boolean }[] = [
  { label: "แชท", href: "#" },
  { label: "ติดต่อเรา", href: "#" },
];

interface CustomerHeaderProps {
  variant: "guest" | "auth";
  cartCount?: number;
  onSignupClick?: () => void;
}

export default function CustomerHeader({ variant, cartCount = 0, onSignupClick }: CustomerHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const homeHref = variant === "auth" ? "/Dashboard" : "/";
  const isHome = pathname === "/" || pathname === "/Dashboard";
  const ordersHref = variant === "auth" ? "/orders" : "/login?redirect=%2Forders";

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
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 px-4 sm:px-6 lg:px-16 py-3.5 flex items-center justify-between gap-4 shadow-xs">
        {/* Logo */}
        <Link href={homeHref} className="flex items-center gap-2 group shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition">
            <Printer className="w-5 h-5" />
          </div>
          <span className="text-xl sm:text-2xl tracking-tight font-black text-orange-500 hidden xs:inline">
            EASY<span className="text-orange-500">PRINT</span>
          </span>
        </Link>

        {/* Center Nav (Desktop) */}
        <nav className="hidden lg:flex items-center gap-7 flex-1 justify-center">
          <Link
            href={homeHref}
            className={`font-bold pb-0.5 text-sm xl:text-base transition ${
              isHome ? "text-orange-500 border-b-2 border-orange-500" : "text-gray-700 hover:text-orange-500"
            }`}
          >
            หน้าหลัก
          </Link>
          <Link
            href={ordersHref}
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
        <div className="hidden sm:flex items-center gap-3 shrink-0">
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

          {variant === "auth" ? (
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen((v) => !v)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-50 text-orange-500 hover:bg-orange-100 transition"
                title="บัญชีของฉัน"
              >
                <User className="w-5 h-5" />
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
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-50 text-orange-500 hover:bg-orange-100 transition"
                title="เข้าสู่ระบบ"
              >
                <User className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="text-orange-500 font-semibold hover:text-orange-600 text-sm md:text-base px-2 py-1 transition"
              >
                เข้าสู่ระบบ
              </Link>
              {onSignupClick ? (
                <button
                  onClick={onSignupClick}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-full px-6 py-2 text-sm md:text-base shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
                >
                  สมัครสมาชิก
                </button>
              ) : (
                <Link
                  href="/register"
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-full px-6 py-2 text-sm md:text-base shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
                >
                  สมัครสมาชิก
                </Link>
              )}
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="lg:hidden flex items-center gap-1.5">
          <Link
            href="/cart"
            className="relative flex items-center justify-center w-9 h-9 rounded-full bg-orange-50 text-orange-500"
          >
            <ShoppingCart className="w-4.5 h-4.5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">
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

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-3 sticky top-[61px] z-40 shadow-lg">
          <Link href={homeHref} onClick={() => setMobileMenuOpen(false)} className="block font-bold text-orange-500 py-1 border-b border-slate-100">
            หน้าหลัก
          </Link>
          <Link href={ordersHref} onClick={() => setMobileMenuOpen(false)} className="block font-semibold text-slate-700 hover:text-orange-500">
            ติดตามคำสั่งซื้อ
          </Link>
          {NAV_LINKS.map((l) => (
            <Link key={l.label} href={l.href} onClick={() => setMobileMenuOpen(false)} className="block font-semibold text-slate-700 hover:text-orange-500">
              {l.label}
            </Link>
          ))}
          {variant === "auth" ? (
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
          ) : (
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
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignupClick?.();
                }}
                className="w-full text-center bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold py-2.5 rounded-xl shadow-xs transition"
              >
                สมัครสมาชิก
              </Link>
            </div>
          )}
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
