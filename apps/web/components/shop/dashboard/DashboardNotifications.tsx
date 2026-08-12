"use client";

import Link from "next/link";
import { ChevronRight, Lock, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

export default function DashboardNotifications() {
  const notifications = [
    {
      id: 1,
      title: "มีคำสั่งซื้อใหม่ #OR680S013",
      desc: "ลูกค้า ปอเปต ใจดีสั่ง ถ่ายเอกสาร A4 ขาวดำ 30 หน้า",
      time: "10:45",
      type: "lock",
      color: "text-rose-500",
      bg: "bg-rose-100",
      icon: Lock,
    },
    {
      id: 2,
      title: "ลูกค้าโอนเงินแล้ว #OR680S011",
      desc: "จำนวน 120 บาท ธนาคารกสิกรไทย",
      time: "09:45",
      type: "user",
      color: "text-blue-500",
      bg: "bg-blue-100",
      icon: CheckCircle2, // close enough
    },
    {
      id: 3,
      title: "งานเสร็จแล้ว #OR680S007",
      desc: "งานพิมพ์สี A4 10 หน้า พร้อมรับงานแล้ว",
      time: "09:20",
      type: "check",
      color: "text-emerald-500",
      bg: "bg-emerald-100",
      icon: CheckCircle2,
    },
    {
      id: 4,
      title: "ใกล้ถึงเวลารับงาน #OR680S005",
      desc: "ลูกค้าแจ้งรับงานแล้ว ภายใน 30 นาที",
      time: "08:50",
      type: "clock",
      color: "text-purple-500",
      bg: "bg-purple-100",
      icon: Clock,
    },
    {
      id: 5,
      title: "ไฟล์งานไม่สมบูรณ์ #OR680S004",
      desc: "กรุณาตรวจสอบไฟล์อัพโหลดของลูกค้า",
      time: "08:30",
      type: "alert",
      color: "text-orange-500",
      bg: "bg-orange-100",
      icon: AlertTriangle,
    },
  ];

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
      </div>
    </div>
  );
}
