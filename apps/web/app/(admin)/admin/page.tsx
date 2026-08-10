"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Store,
  ShieldCheck,
  Clock,
  HardDrive,
  Users,
  ChevronRight,
  FileText,
  Bell,
  MessageSquare,
  Sparkles,
  MoreVertical,
  Send,
  CloudLightning,
  ShieldAlert,
  Plus,
} from "lucide-react";

// ─────────────────────────────────────────────────────────
// Interfaces & Types
// ─────────────────────────────────────────────────────────

interface StorageUsageItem {
  id: string;
  name: string;
  logoBg: string;
  logoText: string;
  plan: string;
  usedGB: number;
  totalGB: number;
  percentage: number;
  status: "normal" | "near_full" | "full";
}

interface PendingShopItem {
  id: string;
  name: string;
  email: string;
  registeredDate: string;
  registeredTime: string;
  docsCount: number;
  avatarBg: string;
}

interface NotificationItem {
  id: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  timeAgo: string;
}

interface SystemAnnouncement {
  id: string;
  type: "update" | "feature" | "security";
  title: string;
  content: string;
  date: string;
}

// ─────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────

const STORAGE_SHOPS: StorageUsageItem[] = [
  { id: "1", name: "Copy Hub", logoBg: "bg-red-500", logoText: "CH", plan: "Free", usedGB: 85.45, totalGB: 100, percentage: 85, status: "near_full" },
  { id: "2", name: "Print Perfect", logoBg: "bg-pink-500", logoText: "PP", plan: "Free", usedGB: 62.3, totalGB: 100, percentage: 62, status: "normal" },
  { id: "3", name: "Quick Print", logoBg: "bg-cyan-600", logoText: "QP", plan: "Free", usedGB: 92.1, totalGB: 100, percentage: 92, status: "near_full" },
  { id: "4", name: "Easy Copy", logoBg: "bg-amber-500", logoText: "EC", plan: "Free", usedGB: 45.65, totalGB: 100, percentage: 46, status: "normal" },
  { id: "5", name: "Print & Go", logoBg: "bg-emerald-600", logoText: "PG", plan: "Free", usedGB: 23.08, totalGB: 100, percentage: 23, status: "normal" },
];

const PENDING_SHOPS: PendingShopItem[] = [
  { id: "p1", name: "Speed Print", email: "speedprint@gmail.com", registeredDate: "19 พ.ค. 2567", registeredTime: "10:30 น.", docsCount: 3, avatarBg: "bg-blue-900" },
  { id: "p2", name: "Master Copy", email: "mastercopy@gmail.com", registeredDate: "19 พ.ค. 2567", registeredTime: "09:15 น.", docsCount: 2, avatarBg: "bg-purple-800" },
  { id: "p3", name: "Top Print", email: "topprint@gmail.com", registeredDate: "18 พ.ค. 2567", registeredTime: "16:45 น.", docsCount: 3, avatarBg: "bg-teal-700" },
];

const NOTIFICATIONS: NotificationItem[] = [
  { id: "n1", icon: Store, iconBg: "bg-orange-100", iconColor: "text-orange-600", title: 'ร้านค้า "Copy Hub"', description: "ส่งคำขอสมัครร้านค้าใหม่", timeAgo: "5 นาทีที่แล้ว" },
  { id: "n2", icon: ShieldCheck, iconBg: "bg-red-100", iconColor: "text-red-500", title: 'ร้านค้า "Print Perfect"', description: "รอการอนุมัติเอกสารเพิ่มเติม", timeAgo: "20 นาทีที่แล้ว" },
  { id: "n3", icon: CloudLightning, iconBg: "bg-amber-100", iconColor: "text-amber-600", title: 'พื้นที่จัดเก็บของร้าน "Quick Print"', description: "ใกล้เต็ม 90%", timeAgo: "1 ชม.ที่แล้ว" },
  { id: "n4", icon: FileText, iconBg: "bg-purple-100", iconColor: "text-purple-600", title: "รายงานประจำวัน", description: "สรุปการใช้งานประจำวัน พร้อมแล้ว", timeAgo: "2 ชม.ที่แล้ว" },
  { id: "n5", icon: HardDrive, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", title: 'ร้านค้า "Easy Copy"', description: "อัปโหลดไฟล์จำนวนมาก", timeAgo: "3 ชม.ที่แล้ว" },
];

const INITIAL_ANNOUNCEMENTS: SystemAnnouncement[] = [
  { id: "a1", type: "update", title: "อัปเดตระบบ", content: "ระบบ EasyPrint จะปิดปรับปรุงในวันที่ 25 พ.ค. 2567 02:00 - 04:00 น.", date: "20 พ.ค." },
  { id: "a2", type: "feature", title: "ฟีเจอร์ใหม่", content: "เพิ่มฟีเจอร์จัดการไฟล์และพื้นที่จัดเก็บของร้านค้า", date: "18 พ.ค." },
  { id: "a3", type: "security", title: "แจ้งเตือนความปลอดภัย", content: "แนะนำให้เปลี่ยนรหัสผ่านอย่างสม่ำเสมอเพื่อความปลอดภัย", date: "17 พ.ค." },
];

export default function AdminDashboardPage() {
  const [selectedShopModal, setSelectedShopModal] = useState<PendingShopItem | null>(null);
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>(INITIAL_ANNOUNCEMENTS);
  const [isAddAnnouncementOpen, setIsAddAnnouncementOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState<"update" | "feature" | "security">("update");

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    const created: SystemAnnouncement = {
      id: "ann-" + Date.now(),
      type: newType,
      title: newTitle.trim(),
      content: newContent.trim(),
      date: "วันนี้",
    };
    setAnnouncements((prev) => [created, ...prev]);
    setNewTitle("");
    setNewContent("");
    setNewType("update");
    setIsAddAnnouncementOpen(false);
  };

  return (
    <div className="-mt-2 lg:-mt-4 space-y-2.5 pb-2 max-w-[1600px] mx-auto">
      {/* ─────────────────────────────────────────────────────────
          Header (Transparent & Flush to Top)
         ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0 pb-1 bg-transparent">
        {/* Left: Title + Role Badge + Subtitle */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-2xs shrink-0">
            <Store size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base lg:text-lg font-bold text-gray-900 tracking-tight leading-none">
                หน้าหลัก
              </h1>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-md text-[11px] font-semibold">
                ระบบจัดการผู้ดูแล
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              ภาพรวมระบบและการบริหารจัดการร้านถ่ายเอกสาร EasyPrint
            </p>
          </div>
        </div>

        {/* Right: Formal Status & Date Indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white text-gray-700 border border-gray-200 rounded-lg text-[11px] font-medium shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>สถานะระบบ: ปกติ</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-700 bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-2xs">
            <Clock size={13} className="text-gray-400" />
            <span>{new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          Stat Cards (Ultra Compact 5 Columns Grid)
         ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {/* Card 1: ร้านค้าทั้งหมด */}
        <div className="bg-white border border-gray-100 rounded-2xl p-2.5 shadow-2xs hover:shadow-xs transition-all group flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 group-hover:scale-105 transition-transform shrink-0">
              <Store size={16} />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              +8
            </span>
          </div>
          <div className="mt-1.5">
            <p className="text-[10px] font-semibold text-gray-500 leading-none">ร้านค้าทั้งหมด</p>
            <p className="text-xl font-black text-gray-900 mt-0.5 tracking-tight leading-tight">128</p>
          </div>
          <Link
            href="/admin/shops"
            className="mt-1.5 pt-1 border-t border-gray-50 flex items-center justify-between text-[10px] font-bold text-orange-500 hover:text-orange-600"
          >
            <span>ดูทั้งหมด</span>
            <ChevronRight size={12} />
          </Link>
        </div>

        {/* Card 2: ร้านค้าที่อนุมัติแล้ว */}
        <div className="bg-white border border-gray-100 rounded-2xl p-2.5 shadow-2xs hover:shadow-xs transition-all group flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform shrink-0">
              <ShieldCheck size={16} />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              +5
            </span>
          </div>
          <div className="mt-1.5">
            <p className="text-[10px] font-semibold text-gray-500 leading-none">อนุมัติแล้ว</p>
            <p className="text-xl font-black text-gray-900 mt-0.5 tracking-tight leading-tight">98</p>
          </div>
          <Link
            href="/admin/shops"
            className="mt-1.5 pt-1 border-t border-gray-50 flex items-center justify-between text-[10px] font-bold text-orange-500 hover:text-orange-600"
          >
            <span>ดูทั้งหมด</span>
            <ChevronRight size={12} />
          </Link>
        </div>

        {/* Card 3: รอการตรวจสอบ */}
        <div className="bg-white border border-gray-100 rounded-2xl p-2.5 shadow-2xs hover:shadow-xs transition-all group flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform shrink-0">
              <Clock size={16} />
            </div>
            <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md">
              -2
            </span>
          </div>
          <div className="mt-1.5">
            <p className="text-[10px] font-semibold text-gray-500 leading-none">รอตรวจสอบ</p>
            <p className="text-xl font-black text-gray-900 mt-0.5 tracking-tight leading-tight">12</p>
          </div>
          <Link
            href="/admin/shops"
            className="mt-1.5 pt-1 border-t border-gray-50 flex items-center justify-between text-[10px] font-bold text-orange-500 hover:text-orange-600"
          >
            <span>ดูทั้งหมด</span>
            <ChevronRight size={12} />
          </Link>
        </div>

        {/* Card 4: พื้นที่จัดเก็บรวม */}
        <div className="bg-white border border-gray-100 rounded-2xl p-2.5 shadow-2xs hover:shadow-xs transition-all group flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform shrink-0">
              <HardDrive size={16} />
            </div>
            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-md">
              42.6%
            </span>
          </div>
          <div className="mt-1">
            <p className="text-[10px] font-semibold text-gray-500 leading-none">พื้นที่รวม</p>
            <p className="text-base font-black text-gray-900 mt-0.5 tracking-tight leading-tight">426.58 GB</p>
            {/* Progress Bar */}
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-1 overflow-hidden">
              <div className="bg-purple-600 h-full rounded-full w-[42.66%]" />
            </div>
          </div>
          <Link
            href="/admin/storage"
            className="mt-1 pt-1 border-t border-gray-50 flex items-center justify-between text-[10px] font-bold text-orange-500 hover:text-orange-600"
          >
            <span>ดูรายละเอียด</span>
            <ChevronRight size={12} />
          </Link>
        </div>

        {/* Card 5: ผู้ใช้งานทั้งหมด */}
        <div className="bg-white border border-gray-100 rounded-2xl p-2.5 shadow-2xs hover:shadow-xs transition-all group flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-600 group-hover:scale-105 transition-transform shrink-0">
              <Users size={16} />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
              +156
            </span>
          </div>
          <div className="mt-1.5">
            <p className="text-[10px] font-semibold text-gray-500 leading-none">ผู้ใช้ทั้งหมด</p>
            <p className="text-xl font-black text-gray-900 mt-0.5 tracking-tight leading-tight">2,456</p>
          </div>
          <Link
            href="/admin/users"
            className="mt-1.5 pt-1 border-t border-gray-50 flex items-center justify-between text-[10px] font-bold text-orange-500 hover:text-orange-600"
          >
            <span>ดูทั้งหมด</span>
            <ChevronRight size={12} />
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          Main Layout Grid (Left 8 Cols, Right 4 Cols)
         ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
        {/* Left Column (8 Cols): Tables */}
        <div className="lg:col-span-8 space-y-2.5">
          {/* Table A: การใช้พื้นที่จัดเก็บของแต่ละร้านค้า */}
          <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-extrabold text-gray-900">
                การใช้พื้นที่จัดเก็บของแต่ละร้านค้า
              </h2>
              <Link
                href="/admin/storage"
                className="text-[11px] font-bold text-orange-500 hover:text-orange-600 flex items-center gap-0.5"
              >
                <span>ดูทั้งหมด</span>
                <ChevronRight size={12} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="text-gray-400 text-[10px] font-bold border-b border-gray-100">
                    <th className="py-1.5 px-2">ร้านค้า</th>
                    <th className="py-1.5 px-2">แผน</th>
                    <th className="py-1.5 px-2">พื้นที่ใช้</th>
                    <th className="py-1.5 px-2">พื้นที่รวม</th>
                    <th className="py-1.5 px-2 w-28">การใช้งาน</th>
                    <th className="py-1.5 px-2">สถานะ</th>
                    <th className="py-1.5 px-2 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {STORAGE_SHOPS.map((shop) => (
                    <tr key={shop.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-1.5 px-2 font-bold text-gray-900">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-lg ${shop.logoBg} flex items-center justify-center text-white font-extrabold text-[9px] shadow-2xs shrink-0`}
                          >
                            {shop.logoText}
                          </div>
                          <span className="truncate max-w-[100px]">{shop.name}</span>
                        </div>
                      </td>
                      <td className="py-1.5 px-2 text-[11px] font-semibold text-gray-500">{shop.plan}</td>
                      <td className="py-1.5 px-2 text-xs font-bold text-gray-800">{shop.usedGB} GB</td>
                      <td className="py-1.5 px-2 text-[11px] font-semibold text-gray-500">{shop.totalGB} GB</td>
                      <td className="py-1.5 px-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[10px] text-gray-700 w-6">{shop.percentage}%</span>
                          <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                shop.percentage > 85
                                  ? "bg-rose-500"
                                  : shop.percentage > 60
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${shop.percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-1.5 px-2 font-semibold">
                        {shop.status === "near_full" ? (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full font-bold text-[10px] inline-block">
                            ใกล้เต็ม
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold text-[10px] inline-block">
                            ปกติ
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 px-2 text-right">
                        <button className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                          <MoreVertical size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table B: รอการตรวจสอบร้านค้า */}
          <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-extrabold text-gray-900">
                รอการตรวจสอบร้านค้า
              </h2>
              <Link
                href="/admin/shops"
                className="text-[11px] font-bold text-orange-500 hover:text-orange-600 flex items-center gap-0.5"
              >
                <span>ดูทั้งหมด</span>
                <ChevronRight size={12} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[450px]">
                <thead>
                  <tr className="text-gray-400 text-[10px] font-bold border-b border-gray-100">
                    <th className="py-1.5 px-2">ร้านค้า</th>
                    <th className="py-1.5 px-2">วันที่สมัคร</th>
                    <th className="py-1.5 px-2 text-center">เอกสาร</th>
                    <th className="py-1.5 px-2 text-center">สถานะ</th>
                    <th className="py-1.5 px-2 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {PENDING_SHOPS.map((shop) => (
                    <tr key={shop.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-1.5 px-2 font-bold text-gray-900">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-full ${shop.avatarBg} flex items-center justify-center text-white font-extrabold text-[10px] shrink-0`}
                          >
                            {shop.name.slice(0, 1)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-xs leading-none">{shop.name}</p>
                            <p className="text-[10px] text-gray-400 font-medium leading-none mt-0.5">{shop.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-1.5 px-2 font-semibold text-gray-600 text-[11px]">
                        <span>{shop.registeredDate}</span>
                        <span className="text-[10px] text-gray-400 ml-1">({shop.registeredTime})</span>
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md font-bold text-[10px]">
                          <FileText size={11} className="text-gray-500" />
                          {shop.docsCount}
                        </span>
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <span className="px-2 py-0.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-full font-bold text-[10px] inline-block">
                          รอตรวจสอบ
                        </span>
                      </td>
                      <td className="py-1.5 px-2 text-right">
                        <button
                          onClick={() => setSelectedShopModal(shop)}
                          className="px-2.5 py-1 bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white border border-orange-300 rounded-lg text-[11px] font-bold transition-all"
                        >
                          ตรวจสอบ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (4 Cols): Widgets */}
        <div className="lg:col-span-4 space-y-2.5">

          {/* Widget 2: ติดต่อสอบถาม */}
          <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <MessageSquare size={15} className="text-orange-500" />
                <h2 className="text-xs font-extrabold text-gray-900">ติดต่อสอบถาม</h2>
              </div>
              <Link
                href="/admin/contact"
                className="text-[10px] font-bold text-orange-500 hover:text-orange-600"
              >
                ดูทั้งหมด
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              {/* Stat Card 1: จากร้านค้า */}
              <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-2 text-center">
                <p className="text-[10px] font-bold text-rose-600 flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  จากร้านค้า
                </p>
                <p className="text-lg font-black text-gray-900 mt-0.5 leading-none">3</p>
                <p className="text-[9px] font-semibold text-gray-400">รอตอบกลับ</p>
              </div>

              {/* Stat Card 2: จากแอดมิน */}
              <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-2 text-center">
                <p className="text-[10px] font-bold text-sky-600 flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  จากแอดมิน
                </p>
                <p className="text-lg font-black text-gray-900 mt-0.5 leading-none">1</p>
                <p className="text-[9px] font-semibold text-gray-400">รอตอบกลับ</p>
              </div>
            </div>

            <Link
              href="/admin/contact"
              className="w-full py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 font-extrabold text-[11px] rounded-xl flex items-center justify-center gap-1 transition-colors"
            >
              <Send size={12} />
              <span>ไปยังกล่องข้อความ</span>
            </Link>
          </div>

          {/* Widget 3: ประกาศจากระบบ */}
          <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <ShieldAlert size={15} className="text-orange-500" />
                <h2 className="text-xs font-extrabold text-gray-900">ประกาศจากระบบ</h2>
              </div>
              <button
                onClick={() => setIsAddAnnouncementOpen(true)}
                className="w-5 h-5 rounded-md bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white border border-orange-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                title="เพิ่มข้อความประกาศ"
              >
                <Plus size={12} />
              </button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {announcements.map((item) => (
                <div
                  key={item.id}
                  className="p-2 rounded-xl bg-gray-50/80 border border-gray-100 text-[10px] space-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                        item.type === "update"
                          ? "bg-red-100 text-red-600"
                          : item.type === "feature"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {item.title}
                    </span>
                    <span className="text-[9px] text-gray-400 font-medium">{item.date}</span>
                  </div>
                  <p className="text-gray-700 font-medium leading-tight truncate">{item.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          Footer Notice
         ───────────────────────────────────────────────────────── */}
      <footer className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-medium">
        <p>© 2024 EasyPrint Admin System. All rights reserved.</p>
        <p>เวอร์ชัน 1.0.0</p>
      </footer>

      {/* ─────────────────────────────────────────────────────────
          Modal 1: Shop Review Modal
         ───────────────────────────────────────────────────────── */}
      {selectedShopModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedShopModal(null)}
        >
          <div
            className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-3 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-full ${selectedShopModal.avatarBg} flex items-center justify-center text-white font-extrabold text-xs`}
                >
                  {selectedShopModal.name.slice(0, 1)}
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm">
                    {selectedShopModal.name}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-medium">{selectedShopModal.email}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full text-[10px] font-bold border border-orange-200">
                รอตรวจสอบ
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400 font-medium">วันที่สมัคร:</span>
                <span className="font-bold text-gray-800 text-[11px]">
                  {selectedShopModal.registeredDate} ({selectedShopModal.registeredTime})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400 font-medium">เอกสารแนบ:</span>
                <span className="font-bold text-gray-800 text-[11px]">
                  {selectedShopModal.docsCount} ฉบับ (บัตรประชาชน, ใบทะเบียน)
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setSelectedShopModal(null)}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition"
              >
                ปิด
              </button>
              <button
                onClick={() => {
                  alert(`อนุมัติร้านค้า "${selectedShopModal.name}" เรียบร้อยแล้ว`);
                  setSelectedShopModal(null);
                }}
                className="flex-1 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 transition shadow-2xs"
              >
                อนุมัติร้านค้า
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          Modal 2: Add Announcement Modal
         ───────────────────────────────────────────────────────── */}
      {isAddAnnouncementOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setIsAddAnnouncementOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-4 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center">
                  <Plus size={16} />
                </div>
                <h3 className="font-extrabold text-gray-900 text-sm">
                  เพิ่มประกาศจากระบบ
                </h3>
              </div>
              <button
                onClick={() => setIsAddAnnouncementOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold px-1.5 py-0.5 rounded-md hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAnnouncement} className="space-y-3 text-xs">
              {/* Type Select */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  ประเภทประกาศ
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNewType("update")}
                    className={`py-1.5 rounded-lg border font-bold text-[10px] transition-all ${
                      newType === "update"
                        ? "bg-red-50 text-red-600 border-red-300 shadow-2xs"
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    อัปเดตระบบ
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType("feature")}
                    className={`py-1.5 rounded-lg border font-bold text-[10px] transition-all ${
                      newType === "feature"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs"
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    ฟีเจอร์ใหม่
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType("security")}
                    className={`py-1.5 rounded-lg border font-bold text-[10px] transition-all ${
                      newType === "security"
                        ? "bg-amber-50 text-amber-700 border-amber-300 shadow-2xs"
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    ความปลอดภัย
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  หัวข้อประกาศ
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ปิดปรับปรุงระบบประจำสัปดาห์"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition"
                />
              </div>

              {/* Content Input */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  ข้อความรายละเอียด
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="กรอกรายละเอียดข้อความประกาศ..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddAnnouncementOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-orange-500 text-white font-bold text-xs hover:bg-orange-600 transition shadow-2xs"
                >
                  บันทึกประกาศ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
