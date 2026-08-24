"use client";

import { useEffect, useState } from "react";
import { Clock, CheckCircle2, ChevronDown, ChevronUp, MessageSquare, User, Calendar, Loader2 } from "lucide-react";
import { getMyShopProfile } from "@/lib/api/shops";
import { getShopContactAdminMessages } from "@/lib/api/contactAdmin";
import type { ContactAdminMessageItem, ContactAdminStatus } from "@easyprint/shared";
import { ApiError } from "@/lib/api/client";

function formatThaiDateTime(iso: string): string {
  return new Date(iso).toLocaleString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const StatusBadge = ({ status }: { status: ContactAdminStatus }) => {
  if (status === "resolved") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
        <CheckCircle2 className="w-3.5 h-3.5" /> ตอบกลับแล้ว
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
      <Clock className="w-3.5 h-3.5" /> รอดำเนินการ
    </span>
  );
};

export default function ContactAdminHistory() {
  const [messages, setMessages] = useState<ContactAdminMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    getMyShopProfile()
      .then(({ shop }) => getShopContactAdminMessages(shop.id))
      .then((res) => setMessages(res.messages))
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "โหลดประวัติคำร้องไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (loadError) {
    return <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl p-4 text-sm">{loadError}</div>;
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-300" />
        <p className="text-sm">ยังไม่มีคำร้องที่เคยส่งไป</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {messages.map((ticket) => (
        <div key={ticket.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-slate-300">
          <div
            className="p-4 md:p-5 flex items-center justify-between cursor-pointer select-none"
            onClick={() => toggleExpand(ticket.id)}
          >
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-1.5">
                <StatusBadge status={ticket.status} />
              </div>
              <h3 className="text-base font-semibold text-slate-800 truncate">{ticket.subject}</h3>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatThaiDateTime(ticket.createdAt)}
                </div>
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 text-slate-400">
              {expandedId === ticket.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>

          {/* Expanded Content */}
          {expandedId === ticket.id && (
            <div className="border-t border-slate-100 bg-slate-50 p-4 md:p-6 space-y-6">
              {/* User Message */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800 mb-1">คุณ (ร้านค้า)</p>
                  <div className="bg-white p-4 rounded-xl rounded-tl-none border border-slate-200 text-sm text-slate-600 shadow-sm whitespace-pre-wrap">
                    {ticket.message}
                  </div>
                </div>
              </div>

              {/* Admin Reply */}
              {ticket.adminReply ? (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800 mb-1">แอดมิน EasyPrint</p>
                    <div className="bg-blue-50 p-4 rounded-xl rounded-tl-none border border-blue-100 text-sm text-slate-700 shadow-sm whitespace-pre-wrap">
                      {ticket.adminReply}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-4 text-sm text-slate-400 gap-2 border-t border-slate-200/60 mt-4 pt-6">
                  <Clock className="w-4 h-4" />
                  แอดมินกำลังตรวจสอบและจะตอบกลับในเร็วๆ นี้
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
