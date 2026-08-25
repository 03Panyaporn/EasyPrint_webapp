"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Printer,
  ShoppingCart,
  User,
  Menu,
  X,
  PackageSearch,
  KeyRound,
  LogOut,
  ChevronRight,
  Home,
  MessageCircle,
  Phone,
  PhoneCall,
} from "lucide-react";
import { getMe, logout as logoutApi, type PublicUser } from "@/lib/api/auth";

// nav กลางที่ยังไม่มีหน้าจริงรองรับ (แชท) — ใส่ไว้ให้ตรงหน้าตาม็อคอปก่อน ยังไม่ผูก route จริง
const NAV_LINKS: { label: string; href: string; match?: (pathname: string) => boolean }[] = [
  { label: "แชท", href: "/chat" },
  { label: "ติดต่อแอดมิน", href: "/contact-admin", match: (p) => p.startsWith("/contact-admin") },
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
  const [user, setUser] = useState<PublicUser | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);

  const homeHref = variant === "auth" ? "/Dashboard" : "/";
  const isHome = pathname === "/" || pathname === "/Dashboard";
  const ordersHref = variant === "auth" ? "/orders" : "/login?redirect=%2Forders";

  // Fetch logged in user session data
  useEffect(() => {
    if (variant === "auth") {
      getMe()
        .then((res) => setUser(res.user))
        .catch(() => setUser(null));
    }
  }, [variant]);

  // Outside click listener for profile dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const displayName = user
    ? `${user.firstname} ${user.lastname}`
    : "พัณณาภรณ์ พรสา";
  const displayEmail = user ? user.email : "panyaporn@example.com";
  const avatarInitial = user?.firstname?.[0]
    ? user.firstname[0].toUpperCase()
    : user?.email?.[0]
      ? user.email[0].toUpperCase()
      : "พ";

  return (
    <>
      {/* 3-Column Grid for exact mathematical centering of Center Navigation Links (Col 2) */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 px-4 sm:px-6 lg:px-16 py-3.5 grid grid-cols-2 lg:grid-cols-3 items-center justify-between gap-4 shadow-xs">
        {/* Logo (Col 1 - Aligned Left) */}
        <div className="flex items-center justify-start">
          <Link href={homeHref} className="flex items-center gap-2 group shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition">
              <Printer className="w-5 h-5" />
            </div>
            <span className="text-xl sm:text-2xl tracking-tight font-black text-orange-500 hidden xs:inline">
              EASY<span className="text-orange-500">PRINT</span>
            </span>
          </Link>
        </div>

        {/* Center Nav (Col 2 - 100% Perfectly Centered on Desktop) */}
        <nav className="hidden lg:flex items-center justify-center gap-7 w-full mx-auto">
          <Link
            href={homeHref}
            className={`font-bold pb-0.5 text-sm xl:text-base transition ${isHome ? "text-orange-500 border-b-2 border-orange-500" : "text-gray-700 hover:text-orange-500"
              }`}
          >
            หน้าหลัก
          </Link>
          <Link
            href={ordersHref}
            className={`font-bold pb-0.5 text-sm xl:text-base transition ${pathname.startsWith("/orders") ? "text-orange-500 border-b-2 border-orange-500" : "text-gray-700 hover:text-orange-500"
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

        {/* Right side (Col 3 & Mobile Toggle - Aligned Right) */}
        <div className="flex items-center justify-end gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-3">
            {/* Cart Icon — Show ONLY when logged in (auth mode) */}
            {variant === "auth" && (
              <Link
                href="/cart"
                className="relative flex items-center justify-center w-10 h-10 rounded-full bg-orange-50 text-orange-500 hover:bg-orange-100 transition active:scale-95"
                title="ตะกร้า"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-extrabold inline-flex items-center justify-center shrink-0 aspect-square leading-none pointer-events-none">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {variant === "auth" ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileMenuOpen((v) => !v)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${profileMenuOpen
                    ? "bg-orange-500 text-white shadow-md shadow-orange-200 scale-105"
                    : "bg-orange-50 text-orange-500 hover:bg-orange-100 active:scale-95"
                    }`}
                  title="บัญชีของฉัน"
                >
                  <User className="w-5 h-5" />
                </button>

                {/* Account Dropdown UI */}
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2.5 w-64 sm:w-72 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-100 p-3 z-50 origin-top-right transition-all duration-200 animate-in fade-in zoom-in-95">
                    {/* User Profile Header Banner (Dynamic) */}
                    <div className="p-3 bg-gradient-to-r from-orange-50/80 to-amber-50/80 rounded-2xl border border-orange-100/60 flex items-center gap-3 mb-2">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white font-black text-base flex items-center justify-center shadow-md shadow-orange-200 shrink-0">
                        {avatarInitial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black text-slate-900 truncate">{displayName}</h4>
                          <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-orange-500 text-white rounded-full shrink-0">
                            สมาชิก
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate font-medium mt-0.5">
                          {displayEmail}
                        </p>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="space-y-0.5 py-1">
                      <Link
                        href="/profile"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center group-hover:scale-110 transition">
                            <User size={15} />
                          </div>
                          <span>โปรไฟล์ของฉัน</span>
                        </div>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition" />
                      </Link>

                      <Link
                        href="/orders"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
                            <PackageSearch size={15} />
                          </div>
                          <span>ประวัติการสั่งซื้อ</span>
                        </div>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition" />
                      </Link>

                      <Link
                        href="/change-password"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
                            <KeyRound size={15} />
                          </div>
                          <span>เปลี่ยนรหัสผ่าน</span>
                        </div>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition" />
                      </Link>

                      <Link
                        href="/contact-admin"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center group-hover:scale-110 transition">
                            <PhoneCall size={15} />
                          </div>
                          <span>ติดต่อแอดมิน</span>
                        </div>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition" />
                      </Link>
                    </div>

                    {/* Divider & Logout Button */}
                    <div className="pt-1 mt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          setLogoutConfirmOpen(true);
                        }}
                        className="w-full px-3 py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-500 font-extrabold text-xs flex items-center justify-between transition-all duration-150 active:scale-98 group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl bg-white text-red-500 flex items-center justify-center shadow-2xs group-hover:scale-110 transition">
                            <LogOut size={15} />
                          </div>
                          <span>ออกจากระบบ</span>
                        </div>
                        <ChevronRight size={14} className="text-red-300 group-hover:translate-x-0.5 transition" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Guest View: Clean Login link and Signup button only */
              <div className="flex items-center gap-2.5 sm:gap-3">
                <Link
                  href="/login"
                  className="text-orange-500 font-extrabold hover:text-orange-600 text-sm md:text-base px-2.5 py-1.5 transition"
                >
                  เข้าสู่ระบบ
                </Link>
                {onSignupClick ? (
                  <button
                    onClick={onSignupClick}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold rounded-full px-5 sm:px-6 py-2 text-sm md:text-base shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5 active:scale-95"
                  >
                    สมัครสมาชิก
                  </button>
                ) : (
                  <Link
                    href="/register"
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold rounded-full px-5 sm:px-6 py-2 text-sm md:text-base shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5 active:scale-95"
                  >
                    สมัครสมาชิก
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden flex items-center gap-1.5">
            {/* Cart Icon — Show ONLY when logged in (auth mode) */}
            {variant === "auth" && (
              <Link
                href="/cart"
                className="relative flex items-center justify-center w-9 h-9 rounded-full bg-orange-50 text-orange-500"
              >
                <ShoppingCart className="w-4.5 h-4.5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-extrabold inline-flex items-center justify-center shrink-0 aspect-square leading-none pointer-events-none">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="p-2 rounded-xl text-slate-700 hover:text-orange-500 hover:bg-orange-50 transition focus:outline-none"
              aria-label="Toggle Mobile Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Floating Corner Popup Overlay (Matches user screenshot 100%) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs flex justify-end items-start p-3 sm:p-4 animate-in fade-in duration-200">
          {/* Overlay Backdrop click listener */}
          <div className="absolute inset-0" onClick={() => setMobileMenuOpen(false)} />

          {/* Popup Card (Positioned Top Right Corner) */}
          <div className="relative z-10 w-full max-w-[320px] bg-white rounded-3xl shadow-2xl border border-slate-100 p-3.5 space-y-3 animate-in zoom-in-95 slide-in-from-top-4 duration-200">
            {/* Close Button X (Positioned top right without creating empty top row) */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-2.5 right-2.5 z-20 w-7 h-7 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>

            {variant === "auth" ? (
              <div className="space-y-2.5">
                {/* User Profile Card Header in Light Cream Background */}
                <div className="p-3 pr-8 bg-gradient-to-r from-orange-50/90 to-amber-50/70 rounded-2xl border border-orange-100/80 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-black text-sm flex items-center justify-center shadow-md shadow-orange-200 shrink-0">
                    {avatarInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">{displayName}</h4>
                    <p className="text-[11px] text-slate-500 truncate font-medium mt-0.5">{displayEmail}</p>
                  </div>
                </div>

                {/* Navigation List Items */}
                <div className="space-y-0.5 pt-1">
                  <Link
                    href={homeHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-800 hover:bg-orange-50 hover:text-orange-500 transition"
                  >
                    <Home className="w-5 h-5 text-orange-500 shrink-0" />
                    <span>หน้าหลัก</span>
                  </Link>

                  <Link
                    href={ordersHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-800 hover:bg-orange-50 hover:text-orange-500 transition"
                  >
                    <PackageSearch className="w-5 h-5 text-orange-500 shrink-0" />
                    <span>ติดตามคำสั่งซื้อ</span>
                  </Link>

                  <Link
                    href="/chat"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-800 hover:bg-orange-50 hover:text-orange-500 transition"
                  >
                    <MessageCircle className="w-5 h-5 text-orange-500 shrink-0" />
                    <span>แชท</span>
                  </Link>

                  <Link
                    href="/contact-admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-800 hover:bg-orange-50 hover:text-orange-500 transition"
                  >
                    <PhoneCall className="w-5 h-5 text-orange-500 shrink-0" />
                    <span>ติดต่อแอดมิน</span>
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-800 hover:bg-orange-50 hover:text-orange-500 transition"
                  >
                    <User className="w-5 h-5 text-orange-500 shrink-0" />
                    <span>โปรไฟล์ของฉัน</span>
                  </Link>
                </div>

                {/* Divider & Logout Button */}
                <div className="border-t border-slate-100 pt-2 mt-1">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setLogoutConfirmOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-extrabold text-red-500 hover:bg-red-50 transition"
                  >
                    <LogOut className="w-5 h-5 text-red-500 shrink-0" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Guest Mobile Popup View */
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <Link
                    href={homeHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-800 hover:bg-orange-50 hover:text-orange-500 transition"
                  >
                    <Home className="w-5 h-5 text-orange-500 shrink-0" />
                    <span>หน้าหลัก</span>
                  </Link>

                  <Link
                    href={ordersHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-800 hover:bg-orange-50 hover:text-orange-500 transition"
                  >
                    <PackageSearch className="w-5 h-5 text-orange-500 shrink-0" />
                    <span>ติดตามคำสั่งซื้อ</span>
                  </Link>

                  <Link
                    href="/chat"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-800 hover:bg-orange-50 hover:text-orange-500 transition"
                  >
                    <MessageCircle className="w-5 h-5 text-orange-500 shrink-0" />
                    <span>แชท</span>
                  </Link>

                  <Link
                    href="/contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-800 hover:bg-orange-50 hover:text-orange-500 transition"
                  >
                    <Phone className="w-5 h-5 text-orange-500 shrink-0" />
                    <span>ติดต่อเรา</span>
                  </Link>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center text-orange-500 font-extrabold py-2.5 rounded-xl border border-orange-200 bg-orange-50/50 hover:bg-orange-100/50 transition"
                  >
                    เข้าสู่ระบบ
                  </Link>
                  {onSignupClick ? (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onSignupClick();
                      }}
                      className="w-full text-center bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold py-2.5 rounded-xl shadow-md transition active:scale-95"
                    >
                      สมัครสมาชิก
                    </button>
                  ) : (
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-center bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold py-2.5 rounded-xl shadow-md transition active:scale-95"
                    >
                      สมัครสมาชิก
                    </Link>
                  )}
                </div>
              </div>
            )}
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
              <button onClick={() => setLogoutConfirmOpen(false)} className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 font-bold text-slate-700">
                ยกเลิก
              </button>
              <button onClick={handleLogout} className="px-4 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 font-bold">
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
