"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BellOff, Check, Trash2 } from "lucide-react";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/lib/api/notifications";
import { NOTIFICATION_TYPES, type NotificationItem } from "@/components/shop/ShopNotificationDropdown";
import { SkeletonRow } from "@/components/ui/Skeleton";

// หน้า "ดูทั้งหมด" ของการแจ้งเตือนร้าน (ลิงก์จากการ์ดแจ้งเตือนในหน้า dashboard) — เดิมลิงก์นี้ชี้ไปหน้าที่ไม่มีอยู่ (404)
// ใช้ API ชุดเดียวกับ dropdown กระดิ่ง: GET /notifications, PUT /:id/read, PUT /read-all, DELETE /:id

type Tab = "all" | "unread" | "chat" | "general";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "unread", label: "ยังไม่อ่าน" },
  { key: "general", label: "ทั่วไป" },
  { key: "chat", label: "แชท" },
];

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ShopNotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    getNotifications()
      .then((res) => setItems(res.notifications as NotificationItem[]))
      .catch(() => setError("โหลดการแจ้งเตือนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"))
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = items.filter((n) => !n.isRead).length;
  const visible = items.filter((n) =>
    tab === "all" ? true : tab === "unread" ? !n.isRead : n.category === tab
  );

  const openItem = async (n: NotificationItem) => {
    if (!n.isRead) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      markNotificationAsRead(n.id).catch((err) => console.error(err));
    }
    if (n.link) router.push(n.link);
  };

  const markAll = async () => {
    const previous = items;
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
    try {
      await markAllNotificationsAsRead();
    } catch (err) {
      console.error(err);
      setItems(previous);
    }
  };

  const remove = async (id: string) => {
    const previous = items;
    setItems((prev) => prev.filter((x) => x.id !== id));
    try {
      await deleteNotification(id);
    } catch (err) {
      console.error(err);
      setItems(previous);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">การแจ้งเตือน</h1>
          <p className="text-xs text-gray-400 mt-0.5">ยังไม่อ่าน {unreadCount} รายการ</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAll}
            className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-3 py-2 rounded-xl transition-colors"
          >
            <Check size={14} /> อ่านทั้งหมด
          </button>
        )}
      </div>

      <div className="flex bg-slate-100/70 p-1 rounded-xl w-fit max-w-full overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition ${
              tab === t.key ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-50 p-4" aria-live="polite" aria-busy="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : error ? (
          <p className="p-8 text-center text-sm text-red-500">{error}</p>
        ) : visible.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2 text-slate-300">
            <BellOff size={28} />
            <p className="text-xs text-slate-400">ไม่มีการแจ้งเตือน</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {visible.map((n) => {
              const typeData = NOTIFICATION_TYPES[n.typeId as keyof typeof NOTIFICATION_TYPES];
              const Icon = typeData?.icon ?? BellOff;
              return (
                <li key={n.id} className={`flex items-start gap-3 p-4 ${n.isRead ? "" : "bg-orange-50/40"}`}>
                  <button onClick={() => openItem(n)} className="flex flex-1 min-w-0 items-start gap-3 text-left">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${typeData?.bg ?? "bg-slate-100"}`}>
                      <Icon size={18} className={typeData?.color ?? "text-slate-500"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm truncate ${n.isRead ? "text-slate-700" : "font-bold text-slate-900"}`}>{n.title}</p>
                        <span className="text-[11px] text-slate-400 shrink-0">{formatDateTime(n.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  </button>
                  <button
                    onClick={() => remove(n.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg shrink-0"
                    aria-label="ลบการแจ้งเตือน"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
