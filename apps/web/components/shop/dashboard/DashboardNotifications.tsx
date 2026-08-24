"use client";

import Link from "next/link";
import { ChevronRight, Lock, CheckCircle2, Clock, AlertTriangle, BellOff, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { getNotifications } from "@/lib/api/notifications";

export default function DashboardNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getNotifications();
        const mapped = res.notifications.map((n) => {
          let Icon = Info;
          let bg = "bg-blue-100";
          let color = "text-blue-500";
          
          if (n.category === "order" || n.title.includes("ออเดอร์")) {
             Icon = Clock;
             bg = "bg-orange-100";
             color = "text-orange-500";
          } else if (n.category === "payment" || n.title.includes("เงิน")) {
             Icon = CheckCircle2;
             bg = "bg-emerald-100";
             color = "text-emerald-500";
          } else if (n.category === "system" || n.title.includes("ระบบ") || n.category === "alert") {
             Icon = AlertTriangle;
             bg = "bg-red-100";
             color = "text-red-500";
          }

          return {
            id: n.id,
            title: n.title,
            desc: n.message,
            time: new Date(n.createdAt).toLocaleString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            icon: Icon,
            bg,
            color
          };
        });
        setNotifications(mapped.slice(0, 5)); // Show latest 5
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

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

      <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <BellOff size={32} className="mb-2 opacity-30" />
            <span className="text-sm font-medium">ยังไม่มีการแจ้งเตือนใหม่</span>
          </div>
        ) : (
          <div className="flex flex-col relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-100 before:to-transparent">
            {notifications.map((notif, idx) => {
              const Icon = notif.icon;
              return (
                <div key={notif.id} className="relative flex items-start gap-4 mb-5 group">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${notif.bg} ring-4 ring-white`}>
                    <Icon size={18} className={notif.color} />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-orange-600 transition-colors">
                        {notif.title}
                      </h4>
                      <span className="text-[11px] font-semibold text-slate-400 shrink-0 mt-0.5">{notif.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {notif.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
