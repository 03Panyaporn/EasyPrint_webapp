"use client";

import { useState } from "react";
import { Activity, ClipboardList, History, LogIn } from "lucide-react";
import AuditLogTab from "@/components/admin/logs/AuditLogTab";
import LoginHistoryTab from "@/components/admin/logs/LoginHistoryTab";
import SystemHealthTab from "@/components/admin/logs/SystemHealthTab";

type Tab = "audit" | "logins" | "health";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "audit", label: "ประวัติการทำรายการ (Audit Log)", icon: ClipboardList },
  { key: "logins", label: "ประวัติการเข้าสู่ระบบ", icon: LogIn },
  { key: "health", label: "สถานะระบบ", icon: Activity },
];

export default function AdminLogsPage() {
  const [tab, setTab] = useState<Tab>("audit");

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
          <History size={21} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-800 md:text-2xl">ประวัติและสถานะระบบ</h1>
          <p className="mt-0.5 text-xs text-slate-400 md:text-sm">
            ตรวจสอบย้อนหลังว่าแอดมินทำรายการอะไร ใครเข้าสู่ระบบเมื่อไหร่ และสถานะการทำงานของระบบ
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-1 flex flex-wrap gap-1 shadow-sm" role="tablist">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${tab === key ? "bg-orange-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}
          >
            <Icon size={14} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {tab === "audit" && <AuditLogTab />}
      {tab === "logins" && <LoginHistoryTab />}
      {tab === "health" && <SystemHealthTab />}
    </div>
  );
}
