"use client";

import { useState } from "react";
import { Clock, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, MessageSquare, User, Calendar } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  date: string;
  status: "pending" | "in_progress" | "resolved";
  message: string;
  adminReply?: string;
  replyDate?: string;
}

// Mock Data
const MOCK_TICKETS: Ticket[] = [
  {
    id: "TK-20240810-01",
    subject: "สอบถามบริการเข้าเล่มเอกสาร",
    date: "10 ส.ค. 2024, 14:30",
    status: "resolved",
    message: "อยากทราบว่าทางระบบมีแผนจะเพิ่มบริการเข้าเล่มแบบกระดูกงูในเร็วๆ นี้ไหมครับ ลูกค้าถามหาเยอะมาก",
    adminReply: "สวัสดีครับ ทางเรากำลังเตรียมอัปเดตระบบให้รองรับการเข้าเล่มแบบกระดูกงูในเดือนหน้านี้ครับ รอดติดตามประกาศในระบบได้เลยครับ",
    replyDate: "11 ส.ค. 2024, 09:15"
  },
  {
    id: "TK-20240812-05",
    subject: "แจ้งปัญหาการใช้งาน - อัปโหลดไฟล์ไม่ได้",
    date: "12 ส.ค. 2024, 10:20",
    status: "in_progress",
    message: "ลูกค้าแจ้งว่าอัปโหลดไฟล์ PDF ขนาด 15MB ไม่ได้ ระบบขึ้นว่าเกินกำหนด ทั้งที่ตั้งค่าไว้ 20MB ครับ ช่วยตรวจสอบให้หน่อยครับ"
  },
  {
    id: "TK-20240813-02",
    subject: "ขอเปลี่ยนแปลงข้อมูลร้านค้า",
    date: "13 ส.ค. 2024, 08:00",
    status: "pending",
    message: "ต้องการแก้ไขเลขประจำตัวผู้เสียภาษีของร้านค้า ต้องส่งเอกสารอะไรเพิ่มเติมให้ทางแอดมินบ้างครับ"
  }
];

const StatusBadge = ({ status }: { status: Ticket["status"] }) => {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
          <Clock className="w-3.5 h-3.5" /> รอดำเนินการ
        </span>
      );
    case "in_progress":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600">
          <AlertCircle className="w-3.5 h-3.5" /> กำลังตรวจสอบ
        </span>
      );
    case "resolved":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
          <CheckCircle2 className="w-3.5 h-3.5" /> เสร็จสิ้น
        </span>
      );
  }
};

export default function ContactAdminHistory() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="w-full space-y-4">
      {MOCK_TICKETS.map((ticket) => (
        <div key={ticket.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-slate-300">
          <div 
            className="p-4 md:p-5 flex items-center justify-between cursor-pointer select-none"
            onClick={() => toggleExpand(ticket.id)}
          >
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-1.5">
                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md inline-block w-fit">
                  {ticket.id}
                </span>
                <StatusBadge status={ticket.status} />
              </div>
              <h3 className="text-base font-semibold text-slate-800 truncate">{ticket.subject}</h3>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {ticket.date}
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
              {ticket.adminReply && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-slate-800">แอดมิน EasyPrint</p>
                      <span className="text-xs text-slate-400">{ticket.replyDate}</span>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl rounded-tl-none border border-blue-100 text-sm text-slate-700 shadow-sm whitespace-pre-wrap">
                      {ticket.adminReply}
                    </div>
                  </div>
                </div>
              )}
              
              {!ticket.adminReply && (
                <div className="flex items-center justify-center py-4 text-sm text-slate-400 gap-2 border-t border-slate-200/60 mt-4 pt-6">
                  <Clock className="w-4 h-4" />
                  แอดมินกำลังตรวจสอบและจะตอบกลับในเร็วๆ นี้
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      
      <div className="text-center py-6">
        <p className="text-xs text-slate-400">แสดงรายการคำร้องย้อนหลัง 30 วัน</p>
      </div>
    </div>
  );
}
