"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Store, XCircle, MessageCircle, CheckCheck, Loader2 } from "lucide-react";
import type { AdminNotificationItem, AdminNotificationType } from "@easyprint/shared";
import { getAdminNotifications, markAdminNotificationRead, markAllAdminNotificationsRead } from "@/lib/api/notifications";
import { ApiError } from "@/lib/api/client";

const NOTIF_META: Record<AdminNotificationType, { icon: typeof Store; iconBg: string; iconColor: string; label: string }> = {
  shop_registered: { icon: Store, iconBg: "bg-emerald-50 border border-emerald-200/80", iconColor: "text-emerald-600", label: "ร้านค้าใหม่" },
  order_cancelled: { icon: XCircle, iconBg: "bg-red-50 border border-red-200/80", iconColor: "text-red-600", label: "ออเดอร์ยกเลิก" },
  contact_admin_message: { icon: MessageCircle, iconBg: "bg-blue-50 border border-blue-200/80", iconColor: "text-blue-600", label: "ข้อความ" },
};

function formatThaiDateTime(iso: string): string {
  return new Date(iso).toLocaleString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | AdminNotificationType>("all");

  const load = useCallback(() => {
    setLoading(true);
    getAdminNotifications()
      .then((res) => setNotifications(res.notifications))
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "โหลดการแจ้งเตือนไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filtered = notifications.filter((n) => activeTab === "all" || n.type === activeTab);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    markAllAdminNotificationsRead().catch((err) => console.error("มาร์คอ่านทั้งหมดไม่สำเร็จ:", err));
  };

  const handleClick = (n: AdminNotificationItem) => {
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    if (!n.isRead) markAdminNotificationRead(n.id).catch((err) => console.error("มาร์คอ่านไม่สำเร็จ:", err));
    if (n.link) router.push(n.link);
  };

  return (
    <div className="space-y-3 pb-2 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-2 bg-white/60 p-3 rounded-2xl border border-gray-100/80 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0">
            <Bell size={17} />
          </div>
          <div>
            <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">การแจ้งเตือน</h1>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              {unreadCount > 0 ? `${unreadCount} รายการยังไม่ได้อ่าน` : "อ่านครบทุกรายการแล้ว"}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors"
          >
            <CheckCheck size={14} />
            อ่านทั้งหมด
          </button>
        )}
      </div>

      <div className="inline-flex items-center p-0.5 bg-gray-100/80 rounded-xl gap-0.5">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === "all" ? "bg-white text-orange-600 shadow-sm" : "text-gray-600 hover:bg-white/60"}`}
        >
          ทั้งหมด
        </button>
        {(Object.keys(NOTIF_META) as AdminNotificationType[]).map((type) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === type ? "bg-white text-orange-600 shadow-sm" : "text-gray-600 hover:bg-white/60"}`}
          >
            {NOTIF_META[type].label}
          </button>
        ))}
      </div>

      {loadError && (
        <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-600 font-semibold">{loadError}</div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <Loader2 size={24} className="animate-spin" />
          <p className="text-sm">กำลังโหลด...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 shadow-2xs text-center text-sm text-gray-400">
          ไม่มีการแจ้งเตือนในหมวดนี้
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-2xs divide-y divide-gray-50 overflow-hidden">
          {filtered.map((n) => {
            const meta = NOTIF_META[n.type];
            const Icon = meta.icon;
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50/70 transition-colors ${!n.isRead ? "bg-orange-50/30" : ""}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.iconBg} ${meta.iconColor}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`text-sm ${!n.isRead ? "font-extrabold text-gray-900" : "font-bold text-gray-700"}`}>{n.title}</h4>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                  <p className="text-[11px] text-gray-400 font-semibold mt-1.5">{formatThaiDateTime(n.createdAt)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
