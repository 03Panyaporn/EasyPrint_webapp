"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, ChevronDown, Menu, LogOut, Settings, User } from "lucide-react";

interface AdminTopbarProps {
  onMobileMenuOpen: () => void;
  notificationCount?: number;
}

export default function AdminTopbar({ onMobileMenuOpen, notificationCount = 3 }: AdminTopbarProps) {
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

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-1.5">
        {/* Notification Bell */}
        <button
          id="admin-topbar-notifications"
          className="relative flex items-center justify-center w-9 h-9 rounded-xl text-gray-500 hover:text-orange-500 hover:bg-orange-50 transition-colors"
          aria-label="การแจ้งเตือน"
        >
          <Bell size={20} />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-red-500 text-white rounded-full leading-none select-none">
              {notificationCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            id="admin-topbar-profile"
            onClick={() => setProfileOpen((p) => !p)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
            aria-haspopup="true"
            aria-expanded={profileOpen}
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm shrink-0">
              <User size={14} className="text-white" />
            </div>
            <div className="hidden sm:flex flex-col items-start min-w-0">
              <span className="text-sm font-semibold text-gray-800 leading-tight max-w-[110px] truncate">
                Admin
              </span>
              <span className="text-[11px] text-orange-500 font-medium leading-tight">
                ผู้ดูแลระบบ
              </span>
            </div>
            <ChevronDown
              size={14}
              className={`text-gray-400 shrink-0 hidden sm:block transition-transform duration-200 ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown */}
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50">
              <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
                <p className="text-sm font-semibold text-gray-800">Admin</p>
                <p className="text-xs text-gray-500 mt-0.5">admin@easyprint.app</p>
              </div>

              <button
                onClick={() => setProfileOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
              >
                <Settings size={15} className="text-gray-400" />
                ตั้งค่าบัญชี
              </button>

              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  onClick={() => setProfileOpen(false)}
                >
                  <LogOut size={15} />
                  ออกจากระบบ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
