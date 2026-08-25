"use client";

import { useState } from "react";
import { History, PhoneCall, MessageSquare } from "lucide-react";
import CustomerContactAdminForm from "./CustomerContactAdminForm";
import CustomerContactAdminHistory from "./CustomerContactAdminHistory";
import CustomerContactAdminGuidelines from "./CustomerContactAdminGuidelines";

type TabType = "contact" | "history";

export default function CustomerContactAdminContainer() {
  const [activeTab, setActiveTab] = useState<TabType>("contact");

  return (
    <main className="flex-1 bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between gap-2.5 relative overflow-hidden bg-white/40 p-5 rounded-2xl border border-white/50 min-h-[120px]">
          <div className="relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-200">
                <PhoneCall size={20} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                ติดต่อแอดมิน
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-2 ml-[50px]">
              แจ้งปัญหา สอบถาม หรือตรวจสอบสถานะคำร้องของคุณ
            </p>
          </div>

          {/* Support Agent Illustration */}
          <div className="absolute inset-y-0 right-0 md:right-4 pointer-events-none py-2 md:py-1">
            <img src="/support-agent.png" alt="" className="h-full w-auto object-contain object-right opacity-90" />
          </div>

          {/* Background blob */}
          <div className="absolute right-0 top-0 w-64 h-64 bg-orange-50 rounded-full blur-3xl opacity-60 -z-10 translate-x-1/3 -translate-y-1/4"></div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setActiveTab("contact")}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "contact"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-gray-300"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              ติดต่อแอดมิน
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "history"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-gray-300"
              }`}
            >
              <History className="w-4 h-4" />
              ตรวจสอบคำร้อง
            </button>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 bg-slate-50/50 min-h-[500px]">
            {activeTab === "contact" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <CustomerContactAdminForm />
                </div>
                <div className="lg:col-span-1">
                  <CustomerContactAdminGuidelines />
                </div>
              </div>
            )}
            {activeTab === "history" && <CustomerContactAdminHistory />}
          </div>
        </div>
      </div>
    </main>
  );
}
