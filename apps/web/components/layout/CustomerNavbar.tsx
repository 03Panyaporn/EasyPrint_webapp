"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Printer,
  ShoppingCart,
  User,
  LogOut,
  Settings,
  History,
  MessageSquare,
  HelpCircle,
  Clock,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

interface CustomerNavbarProps {
  cartCount?: number;
  activeMenu?: string;
}

export default function CustomerNavbar({
  cartCount = 3,
  activeMenu,
}: CustomerNavbarProps) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navLinks = [
    { label: "หน้าหลัก", href: "/" },
    { label: "ติดตามสถานะ", href: "/orders" },
    { label: "แชท", href: "/chat" },
    { label: "ติดต่อแอดมิน", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 h-[80px] bg-white border-b border-[#E5E7EB] shadow-xs px-4 sm:px-8 flex items-center justify-between transition-all">
      {/* ── LEFT: Logo ────────────────────────────────── */}
      <Link href="/" className="flex items-center gap-3 group">
        <div className="w-11 h-11 rounded-full bg-[#FF6B35] flex items-center justify-center text-white shadow-md shadow-[#FF6B35]/25 group-hover:scale-105 transition-transform duration-200">
          <Printer className="w-6 h-6 stroke-[2]" />
        </div>
        <span className="text-2xl font-black tracking-tight text-[#FF6B35]">
          EASY<span className="text-[#FF6B35]">PRINT</span>
        </span>
      </Link>

      {/* ── CENTER: Menu (Desktop) ─────────────────────── */}
      <nav className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => {
          const isActive =
            activeMenu === link.label ||
            (link.href === "/" ? pathname === "/" : pathname.startsWith(link.href));
          return (
            <Link
              key={link.label}
              href={link.href}
              className={`relative text-base font-semibold transition-colors duration-150 py-6 ${
                isActive
                  ? "text-[#FF6B35]"
                  : "text-[#FF6B35] hover:text-[#e05825]"
              }`}
            >
              {link.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#FF6B35] rounded-t-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── RIGHT: Cart + Profile + Logout ─────────────── */}
      <div className="hidden sm:flex items-center gap-4">
        {/* Cart Card */}
        <Link
          href="/cart"
          className="relative flex items-center justify-center w-11 h-11 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-[#FF6B35]/30 text-gray-700 hover:text-[#FF6B35] transition-all duration-150"
          aria-label="รถเข็น"
        >
          <ShoppingCart className="w-5 h-5 stroke-[2]" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-[20px] px-1 text-[11px] font-bold bg-[#FF6B35] text-white rounded-full leading-none shadow-xs">
              {cartCount}
            </span>
          )}
        </Link>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((p) => !p)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#F5F6F8] transition-colors"
            aria-haspopup="true"
            aria-expanded={profileOpen}
          >
            <div className="w-10 h-10 rounded-full bg-[#FF6B35]/10 border border-[#FF6B35]/20 flex items-center justify-center text-[#FF6B35] shadow-xs shrink-0">
              <User className="w-5 h-5 stroke-[2]" />
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Profile Dropdown Menu */}
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
                <p className="text-sm font-bold text-gray-800">ลูกค้า EasyPrint</p>
                <p className="text-xs text-gray-400">customer@email.com</p>
              </div>

              <Link
                href="/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-[#FF6B35]/5 hover:text-[#FF6B35] transition-colors"
              >
                <User className="w-4 h-4 stroke-[2] text-gray-400" />
                โปรไฟล์
              </Link>
              <Link
                href="/orders"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-[#FF6B35]/5 hover:text-[#FF6B35] transition-colors"
              >
                <History className="w-4 h-4 stroke-[2] text-gray-400" />
                ประวัติคำสั่งซื้อ
              </Link>
              <Link
                href="/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-[#FF6B35]/5 hover:text-[#FF6B35] transition-colors"
              >
                <Settings className="w-4 h-4 stroke-[2] text-gray-400" />
                ตั้งค่า
              </Link>

              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={() => setProfileOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4 stroke-[2]" />
                  ออกจากระบบ
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          className="h-[48px] px-6 bg-[#FF6B35] hover:bg-[#e05825] active:bg-[#c94917] text-white font-semibold text-sm rounded-full shadow-md shadow-[#FF6B35]/20 hover:shadow-lg transition-all duration-150 flex items-center justify-center shrink-0"
        >
          ออกจากระบบ
        </button>
      </div>

      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileMenuOpen((o) => !o)}
        className="flex md:hidden items-center justify-center w-10 h-10 rounded-xl text-gray-600 hover:bg-[#F5F6F8]"
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[80px] bg-white border-b border-gray-200 shadow-xl p-6 space-y-4 z-50 animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-semibold text-[#FF6B35] hover:text-[#e05825] py-2"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <Link
              href="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-700"
            >
              <ShoppingCart className="w-5 h-5 text-[#FF6B35]" />
              รถเข็น ({cartCount})
            </Link>
            <button className="h-10 px-5 bg-[#FF6B35] text-white text-xs font-bold rounded-full">
              ออกจากระบบ
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
