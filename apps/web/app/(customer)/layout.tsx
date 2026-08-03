"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Printer,
  Phone,
  Mail,
  Menu,
  X,
  ShoppingCart,
  User,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLogoutOpen, setLogoutOpen] = useState(false);
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 px-4 sm:px-6 lg:px-16 py-3.5 flex items-center justify-between shadow-xs">
        {/* Logo */}
        <Link href="/Dashboard" className="flex items-center gap-2 group">
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
            href="/Dashboard"
            className={`font-bold pb-0.5 text-base transition ${pathname === "/Dashboard"
              ? "text-orange-500 border-b-2 border-orange-500"
              : "text-gray-700 hover:text-orange-500"
              }`}
          >
            หน้าหลัก
          </Link>
          <Link
            href="/orders"
            className={`font-bold pb-0.5 text-base transition ${pathname.startsWith("/orders")
              ? "text-orange-500 border-b-2 border-orange-500"
              : "text-gray-700 hover:text-orange-500"
              }`}
          >
            ติดตามสถานะ
          </Link>
          <Link
            href="/message"
            className={`font-bold pb-0.5 text-base transition ${pathname.startsWith("/message")
              ? "text-orange-500 border-b-2 border-orange-500"
              : "text-gray-700 hover:text-orange-500"
              }`}
          >
            แชท
          </Link>
          <Link
            href="/messageadmin"
            className={`font-bold pb-0.5 text-base transition ${pathname.startsWith("/messageadmin")
              ? "text-orange-500 border-b-2 border-orange-500"
              : "text-gray-700 hover:text-orange-500"
              }`}
          >
            ติดต่อแอดมิน
          </Link>
        </nav>

        {/* Auth Buttons (Desktop) */}
        <div className="hidden sm:flex items-center gap-4">
          <Link
            href="/cart"
            className="text-orange-500 font-semibold hover:text-orange-600 text-sm md:text-base px-2 py-1 transition"
          >
            <ShoppingCart className="w-5 h-5" />
          </Link>
          <Link
            href="/profile"
            className="text-orange-500 font-semibold hover:text-orange-600 text-sm md:text-base px-2 py-1 transition"
          >
            <User className="w-5 h-5" />
          </Link>
          <button
            onClick={() => setLogoutOpen(true)}
            className="bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 transition"
          >
            ออกจากระบบ
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
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-b border-slate-200 shadow-lg">
          <div className="px-6 py-4 space-y-3">

            <Link
              href="/Dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-semibold text-orange-500"
            >
              หน้าหลัก
            </Link>

            <Link
              href="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-semibold text-slate-700 hover:text-orange-500"
            >
              ติดตามสถานะ
            </Link>

            <Link
              href="/message"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-semibold text-slate-700 hover:text-orange-500"
            >
              แชท
            </Link>

            <Link
              href="/messageadmin"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-semibold text-slate-700 hover:text-orange-500"
            >
              ติดต่อแอดมิน
            </Link>

            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-semibold text-slate-700 hover:text-orange-500"
            >
              โปรไฟล์
            </Link>

            <button
              onClick={() => setLogoutOpen(true)}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-full px-6 py-2 text-sm md:text-base shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      )}
      {children}
      {isLogoutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setLogoutOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-slate-800">
              ยืนยันการออกจากระบบ
            </h2>

            <p className="text-slate-500 mt-2">
              คุณต้องการออกจากระบบใช่หรือไม่?
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setLogoutOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-100"
              >
                ยกเลิก
              </button>

              <button
                onClick={() => {
                  setLogoutOpen(false);

                  localStorage.removeItem("token");
                  sessionStorage.clear();

                  router.push("/");
                }}
                className="px-4 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}
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
                <a href="/Dashboard" className="hover:underline">
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
    </div>
  );
}
