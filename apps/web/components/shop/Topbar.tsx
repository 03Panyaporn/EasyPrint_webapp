"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  LogOut,
  Settings,
  Store,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
interface TopbarProps {
  onMobileMenuOpen: () => void;
}

export default function Topbar({ onMobileMenuOpen }: TopbarProps) {
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
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
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      router.replace("/");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-100 shadow-sm flex items-center gap-3 px-4">
      {/* Mobile menu button */}
      <button
        onClick={onMobileMenuOpen}
        className="flex lg:hidden items-center justify-center w-9 h-9 rounded-xl text-gray-500 hover:text-orange-500 hover:bg-orange-50 transition-colors shrink-0"
        aria-label="เปิดเมนู"
      >
        <Menu size={20} />
      </button>

      {/* Search bar */}
      <div className="flex-1 max-w-sm relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="search"
          id="topbar-search"
          placeholder="ค้นหาคำสั่งซื้อ, ชื่อลูกค้า..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl
            placeholder-gray-400 text-gray-700
            focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-400
            transition-all duration-150"
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-1.5">
        {/* Notification */}
        <button
          id="topbar-notifications"
          className="relative flex items-center justify-center w-9 h-9 rounded-xl text-gray-500 hover:text-orange-500 hover:bg-orange-50 transition-colors"
          aria-label="การแจ้งเตือน"
        >
          <Bell size={20} />
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-red-500 text-white rounded-full leading-none select-none">
            3
          </span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            id="topbar-profile"
            onClick={() => setProfileOpen((p) => !p)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
            aria-haspopup="true"
            aria-expanded={profileOpen}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm shrink-0">
              <Store size={14} className="text-white" />
            </div>
            <div className="hidden sm:flex flex-col items-start min-w-0">
              <span className="text-sm font-semibold text-gray-800 leading-tight max-w-[110px] truncate">
                ร้าน EasyPrint
              </span>
              <span className="text-[11px] text-orange-500 font-medium leading-tight">
                เจ้าของร้าน
              </span>
            </div>
            <ChevronDown
              size={14}
              className={`text-gray-400 shrink-0 hidden sm:block transition-transform duration-200 ${profileOpen ? "rotate-180" : ""
                }`}
            />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50">
              {/* Header */}
              <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
                <p className="text-sm font-semibold text-gray-800">ร้าน EasyPrint</p>
                <p className="text-xs text-gray-500 mt-0.5">easyprint@shop.com</p>
              </div>

              <Link
                href="/shop/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
              >
                <User size={15} className="text-gray-400" />
                โปรไฟล์ร้านค้า
              </Link>

              <Link
                href="/shop/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
              >
                <Settings size={15} className="text-gray-400" />
                ตั้งค่า
              </Link>

              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  onClick={() => {
                    setProfileOpen(false);
                    setLogoutOpen(true);
                  }}
                >
                  <LogOut size={15} />
                  ออกจากระบบ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {logoutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setLogoutOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-[360px] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <LogOut className="w-8 h-8 text-red-500" />
              </div>

              <h2 className="text-xl font-bold text-gray-800">
                ออกจากระบบ
              </h2>

              <p className="text-sm text-gray-500 mt-2">
                คุณต้องการออกจากระบบใช่หรือไม่?
              </p>

              <div className="flex gap-3 w-full mt-6">
                <button
                  onClick={() => setLogoutOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-100 transition"
                >
                  ยกเลิก
                </button>

                <button
                  onClick={async () => {
                    setLogoutOpen(false);

                    // เรียก API Logout ตรงนี้
                    // await authClient.signOut();
                    // หรือ await fetch("/api/auth/logout",{method:"POST"});

                    window.location.href = "/login";
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition"
                >
                  ออกจากระบบ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
