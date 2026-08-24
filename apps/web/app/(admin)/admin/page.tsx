"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Store,
  ShieldCheck,
  Clock,
  Users,
  ChevronRight,
  FileText,
  ShieldAlert,
  Plus,
  Loader2,
} from "lucide-react";
import { getAdminDashboard, approveShop } from "@/lib/api/admin";
import type { AdminDashboardResponse, AdminDashboardPendingShop } from "@easyprint/shared";
import { ApiError } from "@/lib/api/client";

// ─────────────────────────────────────────────────────────
// Types & Mock Data (เฉพาะส่วนที่ยังไม่มี backend รองรับ — ดูแผนเฟส 2/3 ในแชท)
// ─────────────────────────────────────────────────────────

interface SystemAnnouncement {
  id: string;
  type: "update" | "feature" | "security";
  title: string;
  content: string;
  date: string;
}

// TODO(เฟส 2): ยังไม่มีตาราง announcements ใน backend — ค้างเป็น mock ไปก่อน
const INITIAL_ANNOUNCEMENTS: SystemAnnouncement[] = [
  { id: "a1", type: "update", title: "อัปเดตระบบ", content: "ระบบ EasyPrint จะปิดปรับปรุงในวันที่ 25 พ.ค. 2567 02:00 - 04:00 น.", date: "20 พ.ค." },
  { id: "a2", type: "feature", title: "ฟีเจอร์ใหม่", content: "เพิ่มฟีเจอร์จัดการไฟล์และพื้นที่จัดเก็บของร้านค้า", date: "18 พ.ค." },
  { id: "a3", type: "security", title: "แจ้งเตือนความปลอดภัย", content: "แนะนำให้เปลี่ยนรหัสผ่านอย่างสม่ำเสมอเพื่อความปลอดภัย", date: "17 พ.ค." },
];

function formatThaiDate(iso: string): string {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

function formatThaiTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) + " น.";
}

// การ์ดตัวเลขเปลี่ยนแปลง — null = ไม่มีวิธีคำนวณที่แม่นยำ (ดูคอมเมนต์ apps/api/src/routes/admin.ts) ไม่แสดง badge เลยแทนการเดา
function ChangeBadge({ change }: { change: number | null }) {
  if (change === null) return null;
  const isUp = change >= 0;
  return (
    <span
      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isUp ? "text-emerald-600 bg-emerald-50" : "text-rose-500 bg-rose-50"}`}
    >
      {isUp ? "+" : ""}
      {change}
    </span>
  );
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedShopModal, setSelectedShopModal] = useState<AdminDashboardPendingShop | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>(INITIAL_ANNOUNCEMENTS);
  const [isAddAnnouncementOpen, setIsAddAnnouncementOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState<"update" | "feature" | "security">("update");

  useEffect(() => {
    getAdminDashboard()
      .then(setDashboard)
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "โหลดข้อมูลแดชบอร์ดไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, []);

  const handleApproveFromModal = async (shop: AdminDashboardPendingShop) => {
    setIsApproving(true);
    try {
      await approveShop(shop.id);
      setDashboard((prev) =>
        prev
          ? {
              ...prev,
              shops: { ...prev.shops, approved: prev.shops.approved + 1, pending: prev.shops.pending - 1 },
              pendingShops: prev.pendingShops.filter((s) => s.id !== shop.id),
            }
          : prev
      );
      setSelectedShopModal(null);
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : "อนุมัติร้านค้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsApproving(false);
    }
  };

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

      {loadError && (
        <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-600 font-semibold">
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <Loader2 size={24} className="animate-spin" />
          <p className="text-sm">กำลังโหลดข้อมูล...</p>
        </div>
      ) : dashboard ? (
        <>
          {/* ─────────────────────────────────────────────────────────
              Stat Cards
             ───────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {/* Card 1: ร้านค้าทั้งหมด */}
            <div className="bg-white border border-gray-100 rounded-2xl p-2.5 shadow-2xs hover:shadow-xs transition-all group flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 group-hover:scale-105 transition-transform shrink-0">
                  <Store size={16} />
                </div>
                <ChangeBadge change={dashboard.shops.totalChange} />
              </div>
              <div className="mt-1.5">
                <p className="text-[10px] font-semibold text-gray-500 leading-none">ร้านค้าทั้งหมด</p>
                <p className="text-xl font-black text-gray-900 mt-0.5 tracking-tight leading-tight">
                  {dashboard.shops.total.toLocaleString()}
                </p>
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
              </div>
              <div className="mt-1.5">
                <p className="text-[10px] font-semibold text-gray-500 leading-none">อนุมัติแล้ว</p>
                <p className="text-xl font-black text-gray-900 mt-0.5 tracking-tight leading-tight">
                  {dashboard.shops.approved.toLocaleString()}
                </p>
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
              </div>
              <div className="mt-1.5">
                <p className="text-[10px] font-semibold text-gray-500 leading-none">รอตรวจสอบ</p>
                <p className="text-xl font-black text-gray-900 mt-0.5 tracking-tight leading-tight">
                  {dashboard.shops.pending.toLocaleString()}
                </p>
              </div>
              <Link
                href="/admin/shops"
                className="mt-1.5 pt-1 border-t border-gray-50 flex items-center justify-between text-[10px] font-bold text-orange-500 hover:text-orange-600"
              >
                <span>ดูทั้งหมด</span>
                <ChevronRight size={12} />
              </Link>
            </div>

            {/* Card 4: ผู้ใช้งานทั้งหมด */}
            <div className="bg-white border border-gray-100 rounded-2xl p-2.5 shadow-2xs hover:shadow-xs transition-all group flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-600 group-hover:scale-105 transition-transform shrink-0">
                  <Users size={16} />
                </div>
                <ChangeBadge change={dashboard.users.totalChange} />
              </div>
              <div className="mt-1.5">
                <p className="text-[10px] font-semibold text-gray-500 leading-none">ลูกค้าทั้งหมด</p>
                <p className="text-xl font-black text-gray-900 mt-0.5 tracking-tight leading-tight">
                  {dashboard.users.total.toLocaleString()}
                </p>
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
            {/* Left Column (8 Cols): Pending Shops Table */}
            <div className="lg:col-span-8 space-y-2.5">
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

                {dashboard.pendingShops.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-8">ไม่มีร้านค้าที่รอตรวจสอบตอนนี้</p>
                ) : (
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
                        {dashboard.pendingShops.map((shop) => (
                          <tr key={shop.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-1.5 px-2 font-bold text-gray-900">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-white font-extrabold text-[10px] shrink-0">
                                  {shop.name.slice(0, 1)}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900 text-xs leading-none">{shop.name}</p>
                                  <p className="text-[10px] text-gray-400 font-medium leading-none mt-0.5">{shop.ownerEmail ?? "-"}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-1.5 px-2 font-semibold text-gray-600 text-[11px]">
                              <span>{formatThaiDate(shop.createdAt)}</span>
                              <span className="text-[10px] text-gray-400 ml-1">({formatThaiTime(shop.createdAt)})</span>
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md font-bold text-[10px]">
                                <FileText size={11} className="text-gray-500" />
                                {shop.hasIdCard ? 1 : 0}
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
                )}
              </div>
            </div>

            {/* Right Column (4 Cols): Widgets */}
            <div className="lg:col-span-4 space-y-2.5">
              {/* Widget: ประกาศจากระบบ */}
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
                          className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${item.type === "update"
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
        </>
      ) : null}

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
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-extrabold text-xs">
                  {selectedShopModal.name.slice(0, 1)}
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm">
                    {selectedShopModal.name}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-medium">{selectedShopModal.ownerEmail ?? "-"}</p>
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
                  {formatThaiDate(selectedShopModal.createdAt)} ({formatThaiTime(selectedShopModal.createdAt)})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400 font-medium">เอกสารแนบ:</span>
                <span className="font-bold text-gray-800 text-[11px]">
                  {selectedShopModal.hasIdCard ? "1 ฉบับ (บัตรประชาชน)" : "ยังไม่แนบเอกสาร"}
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
              <Link
                href={`/admin/shops/${selectedShopModal.id}`}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition text-center"
              >
                ดูรายละเอียด
              </Link>
              <button
                onClick={() => handleApproveFromModal(selectedShopModal)}
                disabled={isApproving}
                className="flex-1 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 transition shadow-2xs disabled:opacity-60"
              >
                {isApproving ? "กำลังอนุมัติ..." : "อนุมัติร้านค้า"}
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
                    className={`py-1.5 rounded-lg border font-bold text-[10px] transition-all ${newType === "update"
                        ? "bg-red-50 text-red-600 border-red-300 shadow-2xs"
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                      }`}
                  >
                    อัปเดตระบบ
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType("feature")}
                    className={`py-1.5 rounded-lg border font-bold text-[10px] transition-all ${newType === "feature"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs"
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                      }`}
                  >
                    ฟีเจอร์ใหม่
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType("security")}
                    className={`py-1.5 rounded-lg border font-bold text-[10px] transition-all ${newType === "security"
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
