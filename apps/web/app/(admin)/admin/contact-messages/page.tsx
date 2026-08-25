"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Loader2, Send, CheckCircle2 } from "lucide-react";
import type { ContactAdminMessageItem } from "@easyprint/shared";
import { getAllContactAdminMessages, replyContactAdminMessage } from "@/lib/api/contactAdmin";
import { ApiError } from "@/lib/api/client";

function formatThaiDateTime(iso: string): string {
  return new Date(iso).toLocaleString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminContactMessagesPage() {
  const [messages, setMessages] = useState<ContactAdminMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    getAllContactAdminMessages()
      .then((res) => setMessages(res.messages))
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "โหลดข้อความไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, []);

  const handleReply = async (id: string) => {
    const reply = (replyDrafts[id] ?? "").trim();
    if (!reply) return;
    setSendingId(id);
    try {
      const { message: updated } = await replyContactAdminMessage(id, { adminReply: reply });
      setMessages((prev) => prev.map((m) => (m.id === id ? updated : m)));
      setReplyDrafts((prev) => ({ ...prev, [id]: "" }));
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : "ตอบกลับไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="space-y-3 pb-2 max-w-3xl mx-auto">
      <div className="flex items-center gap-2.5 bg-white/60 p-3 rounded-2xl border border-gray-100/80 shadow-2xs">
        <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0">
          <MessageCircle size={17} />
        </div>
        <div>
          <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">ข้อความติดต่อแอดมิน</h1>
          <p className="text-[11px] text-gray-500 font-medium mt-0.5">คำร้อง/ข้อความติดต่อแอดมินจากร้านค้าและลูกค้าทั้งหมด</p>
        </div>
      </div>

      {loadError && (
        <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-600 font-semibold">{loadError}</div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <Loader2 size={24} className="animate-spin" />
          <p className="text-sm">กำลังโหลด...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 shadow-2xs text-center text-sm text-gray-400">
          ยังไม่มีข้อความ
        </div>
      ) : (
        <div className="space-y-2.5">
          {messages.map((m) => (
            <div key={m.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                        m.senderType === "customer"
                          ? "bg-blue-50 text-blue-600 border border-blue-200"
                          : "bg-purple-50 text-purple-600 border border-purple-200"
                      }`}
                    >
                      {m.senderType === "customer" ? "ลูกค้า" : "ร้านค้า"}
                    </span>
                    <p className="text-sm font-bold text-gray-900">{m.subject}</p>
                  </div>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                    {(m.senderType === "customer" ? m.customerName : m.shopName) ??
                      (m.senderType === "customer" ? "ลูกค้า" : "ร้านค้า")}{" "}
                    · {formatThaiDateTime(m.createdAt)}
                  </p>
                </div>
                {m.status === "resolved" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-[10px] font-bold shrink-0">
                    <CheckCircle2 size={11} /> ตอบแล้ว
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-[10px] font-bold shrink-0">
                    รอตอบกลับ
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-2 whitespace-pre-wrap">{m.message}</p>

              {m.adminReply ? (
                <div className="mt-3 p-3 bg-orange-50/60 border border-orange-100 rounded-xl">
                  <p className="text-[10px] font-bold text-orange-600 mb-1">คำตอบจากแอดมิน</p>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap">{m.adminReply}</p>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={replyDrafts[m.id] ?? ""}
                    onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [m.id]: e.target.value }))}
                    placeholder="พิมพ์คำตอบ..."
                    className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition"
                  />
                  <button
                    onClick={() => handleReply(m.id)}
                    disabled={sendingId === m.id || !(replyDrafts[m.id] ?? "").trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors disabled:opacity-50 shrink-0"
                  >
                    <Send size={13} />
                    ส่ง
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
