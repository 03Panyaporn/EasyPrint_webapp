"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HardDrive,
  Cloud,
  AlertTriangle,
  FileText,
  Store,
  Search,
  RotateCcw,
  TrendingUp,
  ChevronRight,
  X,
  LayoutGrid,
  List,
  ArrowLeft,
  Trash2,
  Eye,
  Download,
  Share2,
  AlertCircle,
  CheckCircle2,
  Clock,
  MoreVertical,
  CheckSquare,
  Square,
  ShieldAlert,
} from "lucide-react";

// ─────────────────────────────────────────────────────────
// Types & Mock Data
// ─────────────────────────────────────────────────────────

type StorageStatus = "normal" | "warning" | "danger";

interface ShopStorage {
  id: string;
  name: string;
  avatarText: string;
  avatarColor: string;
  usedGb: number;
  totalGb: number;
  fileCount: number;
  largeFileCount: number;
  status: StorageStatus;
}

interface StorageFile {
  id: string;
  name: string;
  type: "pdf" | "jpg" | "png" | "docx" | "ai" | "psd" | "mp4";
  sizeMb: number;
  uploadedBy: string;
  date: string;
  shopName: string;
  isDeleted?: boolean;
}

const MOCK_SHOPS: ShopStorage[] = [
  {
    id: "shop-1",
    name: "Copy Hub",
    avatarText: "C",
    avatarColor: "bg-red-500",
    usedGb: 85.45,
    totalGb: 100,
    fileCount: 2568,
    largeFileCount: 45,
    status: "warning",
  },
  {
    id: "shop-2",
    name: "Print Perfect",
    avatarText: "P",
    avatarColor: "bg-rose-500",
    usedGb: 62.3,
    totalGb: 100,
    fileCount: 1942,
    largeFileCount: 28,
    status: "normal",
  },
  {
    id: "shop-3",
    name: "Quick Print",
    avatarText: "Q",
    avatarColor: "bg-cyan-600",
    usedGb: 92.1,
    totalGb: 100,
    fileCount: 3210,
    largeFileCount: 68,
    status: "danger",
  },
  {
    id: "shop-4",
    name: "Easy Copy",
    avatarText: "E",
    avatarColor: "bg-emerald-500",
    usedGb: 45.65,
    totalGb: 100,
    fileCount: 1235,
    largeFileCount: 12,
    status: "normal",
  },
  {
    id: "shop-5",
    name: "Print & Go",
    avatarText: "P",
    avatarColor: "bg-blue-500",
    usedGb: 23.08,
    totalGb: 100,
    fileCount: 890,
    largeFileCount: 5,
    status: "normal",
  },
  {
    id: "shop-6",
    name: "Johan Printer",
    avatarText: "J",
    avatarColor: "bg-orange-500",
    usedGb: 88.9,
    totalGb: 100,
    fileCount: 2890,
    largeFileCount: 52,
    status: "warning",
  },
];

const INITIAL_MOCK_FILES: StorageFile[] = [
  { id: "f-1", name: "ใบงาน A4.pdf", type: "pdf", sizeMb: 12.4, uploadedBy: "สมชาย", date: "20 พ.ค. 2567", shopName: "Copy Hub" },
  { id: "f-2", name: "ภาพถ่ายโมเดล.psd", type: "psd", sizeMb: 2340, uploadedBy: "วิภา", date: "19 พ.ค. 2567", shopName: "Quick Print" },
  { id: "f-3", name: "โลโก้เอสซี่.jpg", type: "jpg", sizeMb: 8.6, uploadedBy: "สมชาย", date: "20 พ.ค. 2567", shopName: "Copy Hub" },
  { id: "f-4", name: "งานพิมพ์แคตตาล็อก.pdf", type: "pdf", sizeMb: 1850, uploadedBy: "สมชาย", date: "20 พ.ค. 2567", shopName: "Copy Hub" },
  { id: "f-5", name: "รายงานสรุปประจำปี.docx", type: "docx", sizeMb: 2.1, uploadedBy: "สมชาย", date: "19 พ.ค. 2567", shopName: "Copy Hub" },
  { id: "f-6", name: "วิดีโอพรีเซนท์ร้าน.mp4", type: "mp4", sizeMb: 1420, uploadedBy: "พิชิต", date: "19 พ.ค. 2567", shopName: "Print Perfect" },
  { id: "f-7", name: "ปกหนังสือ_v2.png", type: "png", sizeMb: 15.8, uploadedBy: "วิภา", date: "19 พ.ค. 2567", shopName: "Copy Hub" },
  { id: "f-8", name: "แบนเนอร์_ไดคัท.ai", type: "ai", sizeMb: 3120, uploadedBy: "สมชาย", date: "18 พ.ค. 2567", shopName: "Easy Copy" },
];

const RECYCLE_FILES: StorageFile[] = [
  { id: "rf-1", name: "ใบฉลากสินค้า.pdf", type: "pdf", sizeMb: 4.2, uploadedBy: "สมชาย", date: "18 พ.ค. 2567", shopName: "Copy Hub", isDeleted: true },
  { id: "rf-2", name: "รูปหน้าร้าน.jpg", type: "jpg", sizeMb: 3.1, uploadedBy: "วิภา", date: "18 พ.ค. 2567", shopName: "Print Perfect", isDeleted: true },
  { id: "rf-3", name: "งานออกแบบ_old.ai", type: "ai", sizeMb: 9.8, uploadedBy: "สมชาย", date: "17 พ.ค. 2567", shopName: "Easy Copy", isDeleted: true },
];

export default function AdminStoragePage() {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [activeMainTab, setActiveMainTab] = useState<"overview" | "large_files" | "near_limit" | "recycle_bin" | "history">("overview");

  // Shop Detail Slideover / Sub-view State
  const [selectedShop, setSelectedShop] = useState<ShopStorage | null>(null);
  const [shopSubTab, setShopSubTab] = useState<"files" | "folders" | "recycle" | "activity">("files");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Checkbox multi-select state
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [mockFiles, setMockFiles] = useState<StorageFile[]>(INITIAL_MOCK_FILES);

  // Modals & Action Menus
  const [activeMenuFileId, setActiveMenuFileId] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<StorageFile | null>(null);
  const [deleteSelectedModalOpen, setDeleteSelectedModalOpen] = useState(false);
  const [deleteAllShopFilesModalOpen, setDeleteAllShopFilesModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<StorageFile | null>(null);
  const [deletedFilesList, setDeletedFilesList] = useState<StorageFile[]>(RECYCLE_FILES);

  // Filtered Shops List
  const filteredShops = MOCK_SHOPS.filter((shop) => {
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      if (!shop.name.toLowerCase().includes(q)) return false;
    }
    if (statusFilter === "warning" && shop.status !== "warning") return false;
    if (statusFilter === "danger" && shop.status !== "danger") return false;
    if (statusFilter === "normal" && shop.status !== "normal") return false;
    return true;
  });

  const handleDeleteFile = (file: StorageFile) => {
    setFileToDelete(file);
    setActiveMenuFileId(null);
  };

  const confirmDeleteFile = () => {
    if (fileToDelete) {
      setMockFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      setDeletedFilesList((prev) => [...prev, { ...fileToDelete, isDeleted: true }]);
      setSelectedFileIds((prev) => prev.filter((id) => id !== fileToDelete.id));
      setFileToDelete(null);
    }
  };

  const toggleSelectFile = (fileId: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const toggleSelectAllFiles = () => {
    if (selectedFileIds.length === mockFiles.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(mockFiles.map((f) => f.id));
    }
  };

  const confirmDeleteSelectedFiles = () => {
    const filesToRemove = mockFiles.filter((f) => selectedFileIds.includes(f.id));
    setMockFiles((prev) => prev.filter((f) => !selectedFileIds.includes(f.id)));
    setDeletedFilesList((prev) => [...prev, ...filesToRemove.map((f) => ({ ...f, isDeleted: true }))]);
    setSelectedFileIds([]);
    setDeleteSelectedModalOpen(false);
  };

  const confirmDeleteAllShopFiles = () => {
    if (selectedShop) {
      const shopFiles = mockFiles.filter((f) => f.shopName === selectedShop.name);
      setMockFiles((prev) => prev.filter((f) => f.shopName !== selectedShop.name));
      setDeletedFilesList((prev) => [...prev, ...shopFiles.map((f) => ({ ...f, isDeleted: true }))]);
      setSelectedFileIds([]);
      setDeleteAllShopFilesModalOpen(false);
    }
  };

  const handleRestoreFile = (fileId: string) => {
    setDeletedFilesList((prev) => prev.filter((f) => f.id !== fileId));
  };

  return (
    <div className="space-y-4 pb-6">
      {/* ── Page Header (Compact) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <HardDrive size={18} />
            </div>
            <span>จัดการไฟล์และพื้นที่จัดเก็บ</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            จัดการไฟล์ ตรวจสอบพื้นที่ใช้งาน และจัดการข้อมูลของแต่ละร้านค้าในระบบ
          </p>
        </div>
      </div>

      {/* ── 4 Top Overview Metrics Cards (Compact Grid) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: พื้นที่ใช้งานรวมทั้งหมด */}
        <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">พื้นที่ใช้งานรวมทั้งหมด</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Cloud size={16} />
            </div>
          </div>
          <div>
            <p className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">426.58 GB</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">จาก 1,000 GB (42.65%)</p>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: "42.65%" }} />
          </div>
        </div>

        {/* Card 2: ร้านค้าใกล้เต็มพื้นที่ */}
        <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">ร้านค้าใกล้เต็มพื้นที่</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div>
            <p className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">8 ร้านค้า</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">จาก 128 ร้านค้าในระบบ</p>
          </div>
          <div className="flex items-center text-[10px] font-bold text-amber-600 gap-1 pt-0.5">
            <span>ต้องการการตรวจสอบ</span>
          </div>
        </div>

        {/* Card 3: ไฟล์ทั้งหมด */}
        <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">ไฟล์ทั้งหมด</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileText size={16} />
            </div>
          </div>
          <div>
            <p className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">12,458 ไฟล์</p>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
              <span>เพิ่มขึ้น +156 ไฟล์สัปดาห์นี้</span>
            </p>
          </div>
        </div>

        {/* Card 4: ไฟล์ขนาดใหญ่ (เกิน 1 GB) */}
        <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">ไฟล์ขนาดใหญ่ (&gt;1 GB)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertCircle size={16} />
            </div>
          </div>
          <div>
            <p className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">234 ไฟล์</p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">รวมพื้นที่ 5.68 GB</p>
          </div>
        </div>
      </div>

      {/* ── Main Navigation Sub-tabs (Compact) ── */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-1 flex flex-wrap gap-1 shadow-2xs">
        <button
          onClick={() => setActiveMainTab("overview")}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
            activeMainTab === "overview"
              ? "bg-orange-500 text-white shadow-2xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Store size={13} />
          <span>พื้นที่ของแต่ละร้านค้า</span>
        </button>
        <button
          onClick={() => setActiveMainTab("large_files")}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
            activeMainTab === "large_files"
              ? "bg-orange-500 text-white shadow-2xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <FileText size={13} />
          <span>ไฟล์ขนาดใหญ่ (&gt;1 GB)</span>
        </button>
        <button
          onClick={() => setActiveMainTab("near_limit")}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
            activeMainTab === "near_limit"
              ? "bg-orange-500 text-white shadow-2xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <AlertTriangle size={13} />
          <span>ร้านค้าใกล้เต็มพื้นที่</span>
        </button>
        <button
          onClick={() => setActiveMainTab("recycle_bin")}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
            activeMainTab === "recycle_bin"
              ? "bg-orange-500 text-white shadow-2xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Trash2 size={13} />
          <span>ถังขยะ ({deletedFilesList.length})</span>
        </button>
        <button
          onClick={() => setActiveMainTab("history")}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
            activeMainTab === "history"
              ? "bg-orange-500 text-white shadow-2xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Clock size={13} />
          <span>ประวัติการใช้งานพื้นที่</span>
        </button>
      </div>

      {/* ── Filter Bar (Compact) ── */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาร้านค้า หรือไฟล์งาน..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="all">สถานะพื้นที่ทั้งหมด</option>
            <option value="normal">ปกติ</option>
            <option value="warning">ใกล้เต็ม (&gt;65%)</option>
            <option value="danger">ใกล้เต็มมาก (&gt;85%)</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="all">ประเภทไฟล์ทั้งหมด</option>
            <option value="pdf">PDF Documents</option>
            <option value="image">Images (JPG/PNG)</option>
            <option value="design">Design Files (AI/PSD)</option>
          </select>

          <button
            onClick={() => {
              setSearchText("");
              setStatusFilter("all");
              setTypeFilter("all");
            }}
            className="px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-orange-600 bg-slate-100 hover:bg-slate-200/70 rounded-lg transition flex items-center gap-1"
          >
            <RotateCcw size={12} />
            <span>รีเซ็ต</span>
          </button>
        </div>
      </div>

      {/* ── Main View Switcher Content ── */}

      {/* 1. Main Shops Storage Table (Compact Rows) */}
      {activeMainTab === "overview" && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">ร้านค้า</th>
                  <th className="py-2.5 px-3">พื้นที่ใช้ไป</th>
                  <th className="py-2.5 px-3">พื้นที่ทั้งหมด</th>
                  <th className="py-2.5 px-3">เปอร์เซ็นต์</th>
                  <th className="py-2.5 px-3">ไฟล์ทั้งหมด</th>
                  <th className="py-2.5 px-3">ไฟล์ขนาดใหญ่</th>
                  <th className="py-2.5 px-3">สถานะ</th>
                  <th className="py-2.5 px-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-xs">
                {filteredShops.map((shop) => {
                  const percent = Math.round((shop.usedGb / shop.totalGb) * 100);
                  return (
                    <tr key={shop.id} className="hover:bg-orange-50/30 transition">
                      {/* Shop Name & Logo Avatar */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full ${shop.avatarColor} text-white flex items-center justify-center font-black text-[10px] shrink-0 shadow-2xs`}>
                            {shop.avatarText}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 text-xs leading-tight">{shop.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{shop.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Used GB */}
                      <td className="py-2.5 px-3 font-bold text-slate-800">{shop.usedGb} GB</td>

                      {/* Total GB */}
                      <td className="py-2.5 px-3 text-slate-500">{shop.totalGb} GB</td>

                      {/* Percent Bar */}
                      <td className="py-2.5 px-3">
                        <div className="w-28 space-y-1">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className={percent > 85 ? "text-red-600" : percent > 65 ? "text-amber-600" : "text-slate-600"}>
                              {percent}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                percent > 85 ? "bg-red-500" : percent > 65 ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Total Files */}
                      <td className="py-2.5 px-3 text-slate-700 font-bold">{shop.fileCount.toLocaleString()}</td>

                      {/* Large Files */}
                      <td className="py-2.5 px-3 text-slate-700">{shop.largeFileCount}</td>

                      {/* Status Badge */}
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            shop.status === "danger"
                              ? "bg-red-50 text-red-600 border border-red-200"
                              : shop.status === "warning"
                              ? "bg-amber-50 text-amber-600 border border-amber-200"
                              : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          }`}
                        >
                          {shop.status === "danger" ? "ใกล้เต็มมาก" : shop.status === "warning" ? "ใกล้เต็ม" : "ปกติ"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedShop(shop);
                            setSelectedFileIds([]);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition inline-flex items-center gap-1 shadow-2xs"
                        >
                          <span>จัดการ</span>
                          <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Large Files Sub-view */}
      {activeMainTab === "large_files" && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-rose-500" size={18} />
              <h3 className="text-xs font-extrabold text-slate-900">รายการไฟล์ขนาดใหญ่ทั้งหมด (เกิน 1 GB)</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-semibold">พบ {mockFiles.filter((f) => f.sizeMb >= 1000).length} รายการ</span>
          </div>

          <div className="divide-y divide-slate-100">
            {mockFiles.filter((f) => f.sizeMb >= 1000).map((file) => (
              <div key={file.id} className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-lg transition text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 font-black text-[11px] flex items-center justify-center shrink-0 border border-rose-100">
                    {(file.sizeMb / 1024).toFixed(1)} GB
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">ร้านค้า: {file.shopName} • วันที่: {file.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setPreviewFile(file)}
                    className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                  >
                    ดูไฟล์
                  </button>
                  <button
                    onClick={() => handleDeleteFile(file)}
                    className="px-2.5 py-1 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                  >
                    ลบไฟล์
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Shops Near Limit Sub-view */}
      {activeMainTab === "near_limit" && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <AlertTriangle className="text-amber-500" size={18} />
            <h3 className="text-xs font-extrabold text-slate-900">ร้านค้าที่ใช้งานพื้นที่เกิน 85%</h3>
          </div>

          <div className="space-y-2.5">
            {MOCK_SHOPS.filter((s) => s.status !== "normal").map((shop) => (
              <div key={shop.id} className="p-3 rounded-xl border border-amber-200/80 bg-amber-50/40 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full ${shop.avatarColor} text-white font-black text-[10px] flex items-center justify-center shadow-xs`}>
                    {shop.avatarText}
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">{shop.name}</h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      เหลือพื้นที่ { (shop.totalGb - shop.usedGb).toFixed(2) } GB ({Math.round((shop.usedGb / shop.totalGb) * 100)}% ใช้งานแล้ว)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedShop(shop);
                    setSelectedFileIds([]);
                  }}
                  className="px-3 py-1.5 text-[11px] font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition shadow-xs"
                >
                  จัดการพื้นที่ร้านนี้
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Recycle Bin Sub-view */}
      {activeMainTab === "recycle_bin" && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Trash2 className="text-slate-600" size={18} />
              <h3 className="text-xs font-extrabold text-slate-900">ไฟล์ที่ลบแล้ว (สามารถกู้คืนได้)</h3>
            </div>
            <button
              onClick={() => setDeletedFilesList([])}
              className="text-[11px] font-bold text-red-600 hover:underline"
            >
              ล้างถังขยะทั้งหมด
            </button>
          </div>

          {deletedFilesList.length === 0 ? (
            <div className="p-6 text-center text-slate-400 space-y-1">
              <CheckCircle2 size={24} className="mx-auto text-emerald-400" />
              <p className="text-xs font-bold text-slate-700">ไม่มีไฟล์ในถังขยะ</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {deletedFilesList.map((file) => (
                <div key={file.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <FileText size={16} className="text-slate-400" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">{file.name}</p>
                      <p className="text-[10px] text-slate-400">{file.shopName} • {file.sizeMb} MB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestoreFile(file.id)}
                      className="px-2.5 py-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                    >
                      กู้คืน
                    </button>
                    <button
                      onClick={() => setDeletedFilesList((prev) => prev.filter((f) => f.id !== file.id))}
                      className="px-2.5 py-1 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                    >
                      ลบทาวร
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Storage Usage History Sub-view */}
      {activeMainTab === "history" && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp size={16} className="text-orange-500" />
              <span>แนวโน้มการเติบโตของการใช้งานพื้นที่ (Storage Usage Growth)</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold">อัปเดตรากล่าสุดวันนี้</span>
          </div>

          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
            <div className="h-36 w-full flex items-end justify-between gap-2 pt-4 px-2 pb-1 border-b border-slate-200">
              {[40, 55, 62, 70, 75, 82, 85.45].map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-[9px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition">{val} GB</span>
                  <div
                    className="w-full max-w-[28px] bg-gradient-to-t from-orange-500 to-amber-400 rounded-t-md transition-all"
                    style={{ height: `${val}%` }}
                  />
                  <span className="text-[9px] font-semibold text-slate-400 mt-1">{14 + idx} พ.ค.</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-600 font-bold px-1">
              <span>พื้นที่สูงสุด: 92.10 GB</span>
              <span>เฉลี่ยต่อวัน: 68.22 GB</span>
              <span>ไฟล์ใหม่วันนี้: +156 ไฟล์</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Slide-over / Modal: ไฟล์ของแต่ละร้านค้า (Selected Shop File Manager) ── */}
      {selectedShop && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in">
          <div className="w-full max-w-3xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Slide-over Top Bar */}
            <div className="bg-slate-900 text-white p-3.5 sm:p-4 flex items-center justify-between border-b border-slate-800 sticky top-0 z-20">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setSelectedShop(null)}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white transition"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black text-white">ร้านค้า: {selectedShop.name}</h2>
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-orange-500 text-white">
                      {selectedShop.usedGb} GB / {selectedShop.totalGb} GB
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">จัดการไฟล์ ตรวจสอบพื้นที่ และดาวน์โหลดข้อมูลของร้านค้า</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Button: ลบไฟล์ทั้งหมดของร้านนี้ */}
                <button
                  onClick={() => setDeleteAllShopFilesModalOpen(true)}
                  className="px-2.5 py-1.5 text-[11px] font-extrabold text-white bg-red-600 hover:bg-red-700 rounded-lg transition flex items-center gap-1 shadow-xs border border-red-500"
                >
                  <Trash2 size={13} />
                  <span>ลบไฟล์ทั้งหมดของร้านนี้</span>
                </button>

                <button
                  onClick={() => setSelectedShop(null)}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Slide-over Content Body */}
            <div className="p-4 space-y-3 flex-1 bg-slate-50/50">

              {/* Sub-tabs inside Shop Manager & Multi-select Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 gap-2">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setShopSubTab("files")}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                      shopSubTab === "files" ? "bg-orange-500 text-white" : "text-slate-600 hover:bg-slate-200/60"
                    }`}
                  >
                    ไฟล์ทั้งหมด ({mockFiles.length})
                  </button>
                  <button
                    onClick={() => setShopSubTab("folders")}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                      shopSubTab === "folders" ? "bg-orange-500 text-white" : "text-slate-600 hover:bg-slate-200/60"
                    }`}
                  >
                    โฟลเดอร์
                  </button>
                  <button
                    onClick={() => setShopSubTab("recycle")}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                      shopSubTab === "recycle" ? "bg-orange-500 text-white" : "text-slate-600 hover:bg-slate-200/60"
                    }`}
                  >
                    ถังขยะ
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Multi-select Action Toolbar */}
                  {selectedFileIds.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-2 py-1 rounded-lg">
                      <span className="text-[11px] font-extrabold text-orange-700">
                        เลือก {selectedFileIds.length} ไฟล์
                      </span>
                      <button
                        onClick={() => setDeleteSelectedModalOpen(true)}
                        className="px-2 py-0.5 text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 rounded transition"
                      >
                        ลบที่เลือก
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                    <button
                      onClick={() => setViewMode("table")}
                      className={`p-1 rounded transition ${viewMode === "table" ? "bg-orange-50 text-orange-600" : "text-slate-400"}`}
                    >
                      <List size={14} />
                    </button>
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-1 rounded transition ${viewMode === "grid" ? "bg-orange-50 text-orange-600" : "text-slate-400"}`}
                    >
                      <LayoutGrid size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Files View Table */}
              {viewMode === "table" ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                        {/* Checkbox Header Column */}
                        <th className="py-2.5 px-3 w-8">
                          <input
                            type="checkbox"
                            checked={selectedFileIds.length > 0 && selectedFileIds.length === mockFiles.length}
                            onChange={toggleSelectAllFiles}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-orange-500 focus:ring-orange-500/20"
                          />
                        </th>
                        <th className="py-2.5 px-3">ชื่อไฟล์</th>
                        <th className="py-2.5 px-3">ประเภท</th>
                        <th className="py-2.5 px-3">ขนาด</th>
                        <th className="py-2.5 px-3">อัปโหลดโดย</th>
                        <th className="py-2.5 px-3">วันที่</th>
                        <th className="py-2.5 px-3 text-right">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {mockFiles.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            <CheckCircle2 size={24} className="mx-auto text-emerald-400 mb-1" />
                            <p className="text-xs font-bold text-slate-700">ไม่มีไฟล์หลงเหลือในร้านนี้</p>
                          </td>
                        </tr>
                      ) : (
                        mockFiles.map((file) => {
                          const isSelected = selectedFileIds.includes(file.id);
                          return (
                            <tr
                              key={file.id}
                              className={`transition ${isSelected ? "bg-orange-50/60" : "hover:bg-orange-50/20"}`}
                            >
                              {/* Row Checkbox */}
                              <td className="py-2.5 px-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectFile(file.id)}
                                  className="w-3.5 h-3.5 rounded border-slate-300 text-orange-500 focus:ring-orange-500/20"
                                />
                              </td>

                              <td className="py-2.5 px-3 font-bold text-slate-800 flex items-center gap-2">
                                <FileText size={15} className="text-orange-500 shrink-0" />
                                <span className="truncate max-w-[150px]">{file.name}</span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-extrabold uppercase">
                                  {file.type}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 font-bold">
                                {file.sizeMb >= 1000 ? `${(file.sizeMb / 1024).toFixed(1)} GB` : `${file.sizeMb} MB`}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500">{file.uploadedBy}</td>
                              <td className="py-2.5 px-3 text-slate-400">{file.date}</td>
                              <td className="py-2.5 px-3 text-right relative">
                                <button
                                  onClick={() => setActiveMenuFileId(activeMenuFileId === file.id ? null : file.id)}
                                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
                                >
                                  <MoreVertical size={15} />
                                </button>

                                {/* Dropdown Action Menu */}
                                {activeMenuFileId === file.id && (
                                  <div className="absolute right-3 top-8 w-40 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 text-left">
                                    <button
                                      onClick={() => {
                                        setPreviewFile(file);
                                        setActiveMenuFileId(null);
                                      }}
                                      className="w-full px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2"
                                    >
                                      <Eye size={13} />
                                      <span>ดูตัวอย่าง</span>
                                    </button>
                                    <button
                                      onClick={() => setActiveMenuFileId(null)}
                                      className="w-full px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2"
                                    >
                                      <Download size={13} />
                                      <span>ดาวน์โหลด</span>
                                    </button>
                                    <button
                                      onClick={() => setActiveMenuFileId(null)}
                                      className="w-full px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2"
                                    >
                                      <Share2 size={13} />
                                      <span>แชร์ลิงก์</span>
                                    </button>
                                    <div className="border-t border-slate-100 my-1" />
                                    <button
                                      onClick={() => handleDeleteFile(file)}
                                      className="w-full px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                      <Trash2 size={13} />
                                      <span>ลบไฟล์นี้</span>
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Grid View */
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {mockFiles.map((file) => {
                    const isSelected = selectedFileIds.includes(file.id);
                    return (
                      <div
                        key={file.id}
                        onClick={() => toggleSelectFile(file.id)}
                        className={`p-2.5 rounded-xl border space-y-1.5 shadow-2xs text-xs cursor-pointer relative transition ${
                          isSelected ? "bg-orange-50/80 border-orange-400 ring-2 ring-orange-500/20" : "bg-white border-slate-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="absolute top-2.5 right-2.5 w-3.5 h-3.5 rounded text-orange-500"
                        />
                        <div className="h-20 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                          <FileText size={28} className="text-orange-400" />
                        </div>
                        <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-400">{file.sizeMb} MB • {file.date}</p>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ── Modal: ยืนยันการลบไฟล์เดี่ยว ── */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-3 border border-slate-100 animate-in zoom-in-95 text-xs">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto shadow-2xs">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900">ยืนยันการลบไฟล์</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                คุณต้องการย้ายไฟล์ <span className="font-bold text-slate-800">&quot;{fileToDelete.name}&quot;</span> (
                {fileToDelete.sizeMb} MB) ไปยังถังขยะใช่หรือไม่?
              </p>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => setFileToDelete(null)}
                className="flex-1 py-2.5 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDeleteFile}
                className="flex-1 py-2.5 px-3 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition shadow-md shadow-red-200"
              >
                ลบไฟล์
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: ยืนยันการลบไฟล์ที่เลือกทั้งหมด ── */}
      {deleteSelectedModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-3 border border-slate-100 animate-in zoom-in-95 text-xs">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto shadow-2xs">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900">ลบไฟล์ที่เลือกทั้งหมด</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                คุณต้องการลบไฟล์ที่เลือกทั้งหมดจำนวน <span className="font-bold text-red-600">{selectedFileIds.length} รายการ</span> ใช่หรือไม่?
              </p>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => setDeleteSelectedModalOpen(false)}
                className="flex-1 py-2.5 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDeleteSelectedFiles}
                className="flex-1 py-2.5 px-3 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition shadow-md shadow-red-200"
              >
                ยืนยันลบที่เลือก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: ยืนยันการลบไฟล์ทั้งหมดของร้านนี้ (Delete ALL Shop Files Modal) ── */}
      {deleteAllShopFilesModalOpen && selectedShop && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 border border-rose-100 animate-in zoom-in-95 text-xs">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-xs border border-red-200">
              <ShieldAlert size={32} />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-slate-900">⚠️ ยืนยันลบไฟล์ทั้งหมดของร้านค้า</h3>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                คุณกำลังจะลบไฟล์งานทั้งหมดของร้าน <span className="font-black text-red-600 text-sm">{selectedShop.name}</span>
              </p>
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-[11px] text-red-700 space-y-1 text-left font-medium">
                <p>• จำนวนไฟล์ทั้งหมด: <strong className="font-extrabold">{selectedShop.fileCount.toLocaleString()} ไฟล์</strong></p>
                <p>• พื้นที่ที่จะได้คืน: <strong className="font-extrabold">{selectedShop.usedGb} GB</strong></p>
                <p>• ไฟล์ทั้งหมดจะถูกย้ายเข้าถังขยะชั่วคราวและสามารถกู้คืนได้ภายหลัง</p>
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => setDeleteAllShopFilesModalOpen(false)}
                className="flex-1 py-2.5 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDeleteAllShopFiles}
                className="flex-1 py-2.5 px-3 text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-md shadow-red-300 flex items-center justify-center gap-1"
              >
                <Trash2 size={14} />
                <span>ยืนยันลบทั้งหมด</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: พรีวิวไฟล์ (File Preview Modal) ── */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-3 border border-slate-100 animate-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-extrabold text-slate-900 truncate max-w-[260px]">{previewFile.name}</h3>
              <button onClick={() => setPreviewFile(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <div className="h-48 bg-slate-100 rounded-xl flex flex-col items-center justify-center gap-1.5 border border-slate-200">
              <FileText size={40} className="text-orange-500" />
              <p className="text-xs font-bold text-slate-700">{previewFile.name}</p>
              <p className="text-[10px] text-slate-400">{previewFile.sizeMb} MB • {previewFile.type.toUpperCase()}</p>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setPreviewFile(null)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                ปิด
              </button>
              <button
                onClick={() => setPreviewFile(null)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition shadow-xs"
              >
                ดาวน์โหลดไฟล์
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
