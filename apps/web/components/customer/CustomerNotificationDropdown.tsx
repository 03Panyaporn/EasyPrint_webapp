"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/api/notifications";
import { NOTIFICATION_TYPES, type NotificationItem } from "@/components/shop/ShopNotificationDropdown";

// แก้ BUG-12-01 (QA Phase 12): bell icon + dropdown แจ้งเตือนฝั่งลูกค้า — คู่ขนานของ ShopNotificationDropdown
// ใช้ backend endpoint เดียวกันทุกจุด (GET/PUT /notifications*) เพราะ endpoint เหล่านี้ scope ด้วย userId ของ JWT
// อยู่แล้ว ไม่ผูกกับ role เฉพาะฝั่งใดฝั่งหนึ่ง — ใช้ NOTIFICATION_TYPES/NotificationItem ร่วมกับฝั่งร้านค้าเพื่อไม่ให้โค้ด
// icon-mapping ซ้ำซ้อนกัน 2 ที่ (เป็น type ของการแจ้งเตือนระดับระบบ ไม่ใช่เฉพาะร้านค้า)
export default function CustomerNotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const data = await getNotifications();
        if (data && data.notifications) {
          setNotifications(data.notifications as NotificationItem[]);
        }
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    }
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const markAsReadAndNavigate = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await markNotificationAsRead(notif.id);
        setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)));
      } catch (e) {
        console.error(e);
      }
    }
    if (notif.link) {
      setIsOpen(false);
      router.push(notif.link);
    }
  };

  const removeNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-200 ${
          isOpen ? "bg-orange-500 text-white shadow-md shadow-orange-200" : "bg-orange-50 text-orange-500 hover:bg-orange-100"
        }`}
        aria-label="การแจ้งเตือน"
      >
        <Bell size={18} className={isOpen ? "fill-white/20" : ""} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[10px] font-bold bg-red-500 text-white rounded-full leading-none select-none shadow-sm ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-screen max-w-[340px] sm:max-w-[400px] bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200 origin-top-right">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">การแจ้งเตือน</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
              >
                <Check size={14} />
                อ่านทั้งหมด
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
            {notifications.length > 0 ? (
              <div className="flex flex-col divide-y divide-gray-50">
                {notifications.map((notif) => {
                  const typeData = NOTIFICATION_TYPES[notif.typeId as keyof typeof NOTIFICATION_TYPES];
                  const Icon = typeData?.icon ?? Bell;
                  const iconColor = typeData?.color ?? "text-slate-500";
                  const iconBg = typeData?.bg ?? "bg-slate-100";

                  return (
                    <div
                      key={notif.id}
                      onClick={() => markAsReadAndNavigate(notif)}
                      className={`relative group flex gap-3.5 p-4 hover:bg-slate-50 transition-colors cursor-pointer ${!notif.isRead ? "bg-orange-50/30" : ""}`}
                    >
                      {!notif.isRead && (
                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-orange-500" />
                      )}
                      <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>
                        <Icon size={18} className={iconColor} />
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <p className="text-sm font-semibold text-slate-800 leading-snug">{notif.title}</p>
                        <p className={`text-xs mt-0.5 line-clamp-2 ${notif.isRead ? "text-slate-500" : "text-slate-600 font-medium"}`}>
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                          {new Date(notif.createdAt).toLocaleString("th-TH", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <button
                        onClick={(e) => removeNotification(notif.id, e)}
                        className="absolute right-4 top-4 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        title="ลบการแจ้งเตือน"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                  <Bell size={24} className="text-slate-300" />
                </div>
                <h4 className="text-slate-600 font-bold mb-1">ไม่มีการแจ้งเตือนใหม่</h4>
                <p className="text-sm text-slate-400">คุณจะได้รับการแจ้งเตือนเมื่อร้านอัปเดตสถานะออเดอร์ หรือแอดมินตอบกลับที่นี่</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
