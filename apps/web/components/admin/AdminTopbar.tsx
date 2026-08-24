"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  Menu,
  LogOut,
  Settings,
  User,
  Store,
  XCircle,
  MessageCircle,
  CheckCircle2,
  CheckCheck,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { AdminNotificationItem, AdminNotificationType } from "@easyprint/shared";
import { getAdminNotifications, markAdminNotificationRead, markAllAdminNotificationsRead } from "@/lib/api/notifications";

interface AdminTopbarProps {
  onMobileMenuOpen: () => void;
  notificationCount?: number;
}

const NOTIF_META: Record<AdminNotificationType, { icon: typeof Store; iconBg: string; iconColor: string; label: string }> = {
  shop_registered: { icon: Store, iconBg: "bg-emerald-50 border border-emerald-200/80", iconColor: "text-emerald-600", label: "ร้านค้าใหม่" },
  order_cancelled: { icon: XCircle, iconBg: "bg-red-50 border border-red-200/80", iconColor: "text-red-600", label: "ออเดอร์ยกเลิก" },
  contact_admin_message: { icon: MessageCircle, iconBg: "bg-blue-50 border border-blue-200/80", iconColor: "text-blue-600", label: "ข้อความ" },
};

// เวลาสัมพัทธ์แบบไทยง่ายๆ ("5 นาทีที่แล้ว") — ใช้แสดงในรายการแจ้งเตือนเท่านั้น ไม่ต้อง precise
function formatTimeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "เมื่อสักครู่";
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hours / 24);
  return `${days} วันที่แล้ว`;
}

const NOTIF_POLL_INTERVAL_MS = 30000;

export default function AdminTopbar({ onMobileMenuOpen }: AdminTopbarProps) {
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | AdminNotificationType>("all");

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const loadNotifications = useCallback(() => {
    getAdminNotifications()
      .then((res) => setNotifications(res.notifications))
      .catch((err) => console.error("โหลดการแจ้งเตือนไม่สำเร็จ:", err));
  }, []);

  // โหลดครั้งแรก + poll ทุก 30 วิ (ไม่มี WebSocket ในระบบนี้ — polling เพียงพอสำหรับความถี่การแจ้งเตือนที่มี)
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, NOTIF_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadNotifications]);

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

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    markAllAdminNotificationsRead().catch((err) => console.error("มาร์คอ่านทั้งหมดไม่สำเร็จ:", err));
  };

  const handleNotificationClick = (notif: AdminNotificationItem) => {
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)));
    if (!notif.isRead) {
      markAdminNotificationRead(notif.id).catch((err) => console.error("มาร์คอ่านไม่สำเร็จ:", err));
    }
    setNotifOpen(false);
    if (notif.link) router.push(notif.link);
  };

  const filteredNotifications = notifications.filter((n) => activeTab === "all" || n.type === activeTab);

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
        {/* Notification Bell Popup Trigger */}
        <div className="relative" ref={notifRef}>
          <button
            id="admin-topbar-notifications-btn"
            onClick={() => setNotifOpen((v) => !v)}
            className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 ease-out active:scale-90 ${
              notifOpen
                ? "bg-orange-100 text-orange-600 scale-105 shadow-2xs"
                : "text-gray-500 hover:text-orange-500 hover:bg-orange-50 hover:scale-105"
            }`}
            aria-label="การแจ้งเตือน"
          >
            <Bell
              size={20}
              className={`transition-transform duration-300 ${
                notifOpen ? "rotate-12 scale-110" : "group-hover:rotate-6"
              }`}
            />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-red-500 text-[10px] font-extrabold text-white leading-none shadow-xs">
                  {unreadCount}
                </span>
              </span>
            )}
          </button>

          {/* Notifications Popup Dropdown Card with Spring Entrance & Exit */}
          <div
            className={`absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100/90 overflow-hidden z-50 origin-top-right transition-all duration-300 ease-out ${
              notifOpen
                ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
            }`}
          >
            {/* Header */}
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-orange-400 animate-bounce duration-1000" />
                <h3 className="font-bold text-sm">การแจ้งเตือน</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold bg-orange-500 text-white rounded-full shadow-2xs animate-pulse">
                    {unreadCount} ใหม่
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 transition-all duration-150 hover:scale-105 active:scale-95"
                >
                  <CheckCheck size={13} />
                  <span>อ่านทั้งหมด</span>
                </button>
              )}
            </div>

            {/* Tabs Filter */}
            <div className="flex items-center border-b border-gray-100 bg-gray-50/80 p-1.5 text-xs font-semibold">
              <button
                onClick={() => setActiveTab("all")}
                className={`flex-1 py-1.5 rounded-lg transition-all duration-200 text-center ${
                  activeTab === "all"
                    ? "bg-white text-orange-600 shadow-2xs font-extrabold scale-[1.02]"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-100/60"
                }`}
              >
                ทั้งหมด ({notifications.length})
              </button>
              {(Object.keys(NOTIF_META) as AdminNotificationType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveTab(type)}
                  className={`flex-1 py-1.5 rounded-lg transition-all duration-200 text-center ${
                    activeTab === type
                      ? "bg-white text-orange-600 shadow-2xs font-extrabold scale-[1.02]"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-100/60"
                  }`}
                >
                  {NOTIF_META[type].label}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="max-h-[340px] overflow-y-auto divide-y divide-gray-100/80">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-400" />
                  <p className="text-xs font-bold text-gray-700">ไม่มีการแจ้งเตือนในหมวดนี้</p>
                  <p className="text-[11px] text-gray-400">ระบบทำงานเป็นปกติทุกส่วน</p>
                </div>
              ) : (
                filteredNotifications.map((n) => {
                  const meta = NOTIF_META[n.type];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`group w-full p-3.5 text-left transition-all duration-200 ease-out flex items-start gap-3 hover:bg-orange-50/70 hover:translate-x-1 ${
                        !n.isRead ? "bg-orange-50/30" : "bg-white"
                      }`}
                    >
                      {/* Icon Badge with micro hover bounce */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-200 group-hover:scale-110 ${meta.iconBg} ${meta.iconColor}`}
                      >
                        <Icon size={18} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className={`text-xs truncate transition-colors duration-150 group-hover:text-orange-600 ${!n.isRead ? "font-extrabold text-gray-900" : "font-bold text-gray-700"}`}>
                            {n.title}
                          </h4>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 animate-ping" />
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed font-medium">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-gray-400 font-semibold mt-1">
                          {formatTimeAgo(n.createdAt)}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Popup Footer Links */}
            <div className="p-2.5 bg-gray-50/90 border-t border-gray-100 flex items-center justify-between text-xs">
              <Link
                href="/admin/shops"
                onClick={() => setNotifOpen(false)}
                className="text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1 transition-transform duration-150 hover:translate-x-0.5"
              >
                <ShieldCheck size={13} />
                <span>ดูหน้าตรวจสอบร้านค้า</span>
              </Link>
              <Link
                href="/admin/notifications"
                onClick={() => setNotifOpen(false)}
                className="text-[11px] font-bold text-gray-600 hover:text-gray-900 hover:underline flex items-center gap-1 transition-transform duration-150 hover:translate-x-0.5"
              >
                <Bell size={13} />
                <span>ดูการแจ้งเตือนทั้งหมด</span>
              </Link>
            </div>
          </div>
        </div>

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

      {/* Logout Confirmation Modal */}
      {logoutOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <LogOut size={32} className="text-red-500" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">ออกจากระบบ</h3>
            <p className="text-gray-600 text-center mb-6">
              คุณต้องการออกจากระบบใช่หรือไม่?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setLogoutOpen(false)}
                className="flex-1 py-3 px-4 bg-gray-50 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  setLogoutOpen(false);
                  handleLogout();
                }}
                className="flex-1 py-3 px-4 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors shadow-md"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
