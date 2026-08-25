"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, BellOff, Loader2 } from "lucide-react";
import { getNotifications } from "@/lib/api/notifications";
import type { NotificationItem } from "../ShopNotificationDropdown";
import { NOTIFICATION_TYPES } from "../ShopNotificationDropdown";

function formatTimeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

export default function DashboardNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    getNotifications()
      .then((res) => setNotifications((res.notifications as NotificationItem[]).slice(0, 5)))
      .catch((err) => console.error("โหลดการแจ้งเตือนไม่สำเร็จ:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
    // รีเฟรชรายการทันทีเมื่อมีการแจ้งเตือนใหม่เกิดขึ้น (dispatch จากที่อื่นในแอป) ไม่ต้องรอ mount ใหม่
    window.addEventListener("new-notification", loadData);
    return () => window.removeEventListener("new-notification", loadData);
  }, [loadData]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col h-[350px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-800">การแจ้งเตือน</h2>
        <Link
          href="/shop/notifications"
          className="text-xs font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors"
        >
          ดูทั้งหมด <ChevronRight size={14} />
        </Link>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-300">
          <Loader2 size={22} className="animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-300">
          <BellOff size={28} />
          <p className="text-xs text-slate-400">ยังไม่มีการแจ้งเตือน</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
          <div className="flex flex-col relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-100 before:to-transparent">
            {notifications.map((notif) => {
              const typeData = NOTIFICATION_TYPES[notif.typeId as keyof typeof NOTIFICATION_TYPES];
              const Icon = typeData?.icon ?? BellOff;
              return (
                <div key={notif.id} className="relative flex items-start gap-4 mb-5 group">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${typeData?.bg ?? "bg-slate-100"} ring-4 ring-white`}>
                    <Icon size={18} className={typeData?.color ?? "text-slate-500"} />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-orange-600 transition-colors">
                        {notif.title}
                      </h4>
                      <span className="text-[11px] font-semibold text-slate-400 shrink-0 mt-0.5">
                        {formatTimeLabel(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
