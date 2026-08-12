"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bell,
  FileText,
  XCircle,
  MessageCircle,
  CheckCircle2,
  Megaphone,
  AlertTriangle,
  Clock,
  CreditCard,
  Calendar,
  Key,
  Truck,
  Settings,
  Store,
  Unlock,
  Check,
  X
} from "lucide-react";
import Link from "next/link";

// Notification Data Types
export type NotificationCategory = "all" | "chat" | "general";

export interface NotificationItem {
  id: string;
  typeId: number;
  title: string;
  message: string;
  category: "chat" | "general";
  isRead: boolean;
  createdAt: string;
  link?: string;
}

// 15 Notification Types Definitions
const NOTIFICATION_TYPES = {
  1: { icon: FileText, color: "text-blue-500", bg: "bg-blue-50" }, // ออเดอร์ใหม่
  2: { icon: XCircle, color: "text-red-500", bg: "bg-red-50" }, // ลูกค้ายกเลิกออเดอร์
  3: { icon: MessageCircle, color: "text-green-500", bg: "bg-green-50" }, // แชทลูกค้าทักมา
  4: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" }, // แอดมินอนุมัติเรื่อง
  5: { icon: Megaphone, color: "text-purple-500", bg: "bg-purple-50" }, // นโยบาย/ประกาศใหม่
  6: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" }, // บัญชีถูกระงับ/เตือน
  7: { icon: Clock, color: "text-orange-500", bg: "bg-orange-50" }, // แจ้งเตือนเวลาทำการ (เตือนก่อนปิด)
  8: { icon: CreditCard, color: "text-rose-500", bg: "bg-rose-50" }, // เตือนตั้งค่าการชำระเงิน
  9: { icon: Calendar, color: "text-rose-500", bg: "bg-rose-50" }, // เตือนตั้งค่าเวลาทำการ
  10: { icon: Key, color: "text-slate-500", bg: "bg-slate-100" }, // เปลี่ยนรหัสผ่าน
  11: { icon: Truck, color: "text-rose-500", bg: "bg-rose-50" }, // เตือนตั้งค่าการจัดส่ง
  12: { icon: Settings, color: "text-rose-500", bg: "bg-rose-50" }, // เตือนตั้งค่าบริการ/ราคา
  13: { icon: Store, color: "text-slate-500", bg: "bg-slate-100" }, // ร้านปิดอัตโนมัติ
  14: { icon: Store, color: "text-green-500", bg: "bg-green-50" }, // ร้านเปิดอัตโนมัติ
  15: { icon: Unlock, color: "text-blue-500", bg: "bg-blue-50" }, // พ้นช่วงปิดชั่วคราว
};

// Mock Data
const initialNotifications: NotificationItem[] = [
  { id: "1", typeId: 1, title: "ออเดอร์ใหม่ #EP-0042", message: "คุณได้รับคำสั่งซื้อใหม่จาก คุณสมชาย กรุณาตรวจสอบและรับงาน", category: "general", isRead: false, createdAt: "2 นาทีที่แล้ว" },
  { id: "3", typeId: 3, title: "ข้อความใหม่จากลูกค้า", message: "คุณสมชาย: ผมกดยกเลิกออเดอร์ไปแล้ว รบกวนโอนเงินคืนด้วยครับ", category: "chat", isRead: false, createdAt: "5 นาทีที่แล้ว" },
  { id: "2", typeId: 2, title: "ลูกค้ายกเลิกออเดอร์", message: "คำสั่งซื้อ #EP-0041 ถูกยกเลิกโดยลูกค้า เนื่องจากเปลี่ยนใจ", category: "general", isRead: true, createdAt: "1 ชั่วโมงที่แล้ว" },
  { id: "7", typeId: 7, title: "ใกล้เวลาปิดร้านแล้ว", message: "ร้านของคุณจะปิดอัตโนมัติในอีก 30 นาที แต่ยังมีออเดอร์ค้างอยู่ 2 รายการ", category: "general", isRead: false, createdAt: "2 ชั่วโมงที่แล้ว" },
  { id: "4", typeId: 4, title: "คำร้องขออนุมัติสำเร็จ", message: "แอดมินได้อนุมัติคำขอเปลี่ยนชื่อร้านของคุณเรียบร้อยแล้ว", category: "general", isRead: true, createdAt: "3 ชั่วโมงที่แล้ว" },
  { id: "8", typeId: 8, title: "กรุณาตั้งค่าการชำระเงิน", message: "คุณยังไม่ได้เพิ่มบัญชีธนาคารสำหรับรับเงิน กรุณาตั้งค่าเพื่อเริ่มขาย", category: "general", isRead: false, createdAt: "เมื่อวานนี้" },
  { id: "5", typeId: 5, title: "ประกาศนโยบายใหม่", message: "อัปเดตนโยบายการหักค่าธรรมเนียมแพลตฟอร์ม มีผล 1 กันยายนนี้", category: "general", isRead: true, createdAt: "เมื่อวานนี้" },
  { id: "13", typeId: 13, title: "ร้านถูกปิดอัตโนมัติ", message: "ระบบได้ปิดร้านอัตโนมัติตามเวลาทำการที่คุณตั้งไว้ (18:00 น.)", category: "general", isRead: true, createdAt: "เมื่อวานนี้" },
  { id: "14", typeId: 14, title: "ร้านกลับมาเปิดให้บริการ", message: "ระบบได้เปิดร้านอัตโนมัติตามเวลาทำการที่คุณตั้งไว้ (09:00 น.)", category: "general", isRead: true, createdAt: "2 วันที่แล้ว" },
  { id: "15", typeId: 15, title: "สิ้นสุดช่วงปิดชั่วคราว", message: "ระบบได้เปิดร้านอัตโนมัติ เนื่องจากพ้นช่วงเวลาปิดร้านชั่วคราวที่คุณตั้งไว้", category: "general", isRead: true, createdAt: "2 วันที่แล้ว" },
  { id: "6", typeId: 6, title: "คำเตือนจากระบบ", message: "พบการปฏิเสธงานติดต่อกัน 5 ครั้ง กรุณาตรวจสอบและจัดการออเดอร์", category: "general", isRead: true, createdAt: "3 วันที่แล้ว" },
  { id: "10", typeId: 10, title: "เปลี่ยนรหัสผ่านสำเร็จ", message: "รหัสผ่านบัญชีของคุณถูกเปลี่ยนเมื่อวันที่ 9 ส.ค.", category: "general", isRead: true, createdAt: "3 วันที่แล้ว" },
  { id: "9", typeId: 9, title: "กรุณาตั้งค่าเวลาทำการ", message: "หากไม่ตั้งค่าเวลาทำการ ร้านของคุณจะแสดงสถานะปิดตลอดเวลา", category: "general", isRead: true, createdAt: "4 วันที่แล้ว" },
  { id: "11", typeId: 11, title: "กรุณาตั้งค่าการจัดส่ง", message: "เพิ่มตัวเลือกการจัดส่งเพื่อให้ลูกค้าสามารถสั่งซื้อได้", category: "general", isRead: true, createdAt: "4 วันที่แล้ว" },
  { id: "12", typeId: 12, title: "ตั้งค่าบริการและราคา", message: "คุณต้องเพิ่มรายการบริการและราคาอย่างน้อย 1 รายการเพื่อเริ่มขาย", category: "general", isRead: true, createdAt: "4 วันที่แล้ว" },
];

export default function ShopNotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationCategory>("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === "all") return true;
    return n.category === activeTab;
  });

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const removeNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors duration-200 ${isOpen ? 'bg-orange-50 text-orange-500' : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50'}`}
        aria-label="การแจ้งเตือน"
      >
        <Bell size={20} className={isOpen ? 'fill-orange-500/20' : ''} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[10px] font-bold bg-red-500 text-white rounded-full leading-none select-none shadow-sm ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-screen max-w-[380px] sm:max-w-[420px] bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200 origin-top-right">
          
          {/* Header */}
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">การแจ้งเตือน</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Check size={14} />
                  อ่านทั้งหมด
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100/70 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("all")}
                className={`flex-1 text-sm font-semibold py-1.5 rounded-lg transition-all ${activeTab === "all" ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 text-sm font-semibold py-1.5 rounded-lg transition-all ${activeTab === "chat" ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
              >
                แชท
              </button>
              <button
                onClick={() => setActiveTab("general")}
                className={`flex-1 text-sm font-semibold py-1.5 rounded-lg transition-all ${activeTab === "general" ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
              >
                ทั่วไป
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
            {filteredNotifications.length > 0 ? (
              <div className="flex flex-col divide-y divide-gray-50">
                {filteredNotifications.map((notif) => {
                  const typeData = NOTIFICATION_TYPES[notif.typeId as keyof typeof NOTIFICATION_TYPES];
                  const Icon = typeData.icon;
                  
                  return (
                    <div 
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`relative group flex gap-3.5 p-4 hover:bg-slate-50 transition-colors cursor-pointer ${!notif.isRead ? 'bg-orange-50/30' : ''}`}
                    >
                      {/* Unread Indicator dot */}
                      {!notif.isRead && (
                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-orange-500" />
                      )}

                      {/* Icon */}
                      <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${typeData.bg}`}>
                        <Icon size={18} className={typeData.color} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex justify-between items-start mb-0.5 gap-2">
                          <h4 className={`text-[14px] leading-tight truncate ${!notif.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                            {notif.title}
                          </h4>
                        </div>
                        <p className={`text-[13px] leading-snug line-clamp-2 ${!notif.isRead ? 'text-slate-700' : 'text-slate-500'}`}>
                          {notif.message}
                        </p>
                        <span className="block text-[11px] font-medium text-slate-400 mt-1.5">
                          {notif.createdAt}
                        </span>
                      </div>

                      {/* Delete Button (appears on hover) */}
                      <button 
                        onClick={(e) => removeNotification(notif.id, e)}
                        className="absolute right-4 top-4 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        title="ลบการแจ้งเตือน"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                  <Bell size={24} className="text-slate-300" />
                </div>
                <h4 className="text-slate-600 font-bold mb-1">ไม่มีการแจ้งเตือนใหม่</h4>
                <p className="text-sm text-slate-400">คุณจะได้รับการแจ้งเตือนเมื่อมีออเดอร์ หรือข้อความใหม่ที่นี่</p>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="p-3 border-t border-gray-50 bg-gray-50/50">
            <Link 
              href="#" 
              onClick={() => setIsOpen(false)}
              className="block w-full py-2 text-center text-sm font-bold text-slate-600 hover:text-orange-600 transition-colors"
            >
              ดูการแจ้งเตือนทั้งหมด
            </Link>
          </div>

        </div>
      )}
    </div>
  );
}
