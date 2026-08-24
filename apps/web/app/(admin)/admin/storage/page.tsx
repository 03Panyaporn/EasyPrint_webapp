"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  HardDrive,
  Cloud,
  AlertTriangle,
  FileText,
  Store,
  Search,
  RotateCcw,
  ChevronRight,
  X,
  LayoutGrid,
  List,
  ArrowLeft,
  Trash2,
  Eye,
  Download,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  ShieldAlert,
  Loader2,
  Save,
} from "lucide-react";
import {
  getAdminStorageOverview,
  getAdminStorageFiles,
  getAdminStorageFileUrl,
  deleteAdminStorageFile,
  deleteAdminStorageShopFiles,
  updateAdminShop,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { AdminStorageOverviewResponse, AdminStorageShopSummary, AdminStorageFile, StorageStatus } from "@easyprint/shared";

const STATUS_LABEL: Record<StorageStatus, string> = { normal: "ปกติ", warning: "ใกล้เต็ม", danger: "ใกล้เต็มมาก" };
const LARGE_FILE_MB = 1024; // 1 GB

function formatSize(mb: number) {
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
}

function fileExt(fileName: string | null) {
  if (!fileName) return "-";
  const parts = fileName.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "-";
}

function statusBadgeClass(status: StorageStatus) {
  if (status === "danger") return "bg-red-50 text-red-600 border border-red-200";
  if (status === "warning") return "bg-amber-50 text-amber-600 border border-amber-200";
  return "bg-emerald-50 text-emerald-600 border border-emerald-200";
}

export default function AdminStoragePage() {
  const [overview, setOverview] = useState<AdminStorageOverviewResponse | null>(null);
  const [allFiles, setAllFiles] = useState<AdminStorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeMainTab, setActiveMainTab] = useState<"overview" | "large_files" | "near_limit">("overview");

  const [selectedShop, setSelectedShop] = useState<AdminStorageShopSummary | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [activeMenuFileId, setActiveMenuFileId] = useState<string | null>(null);

  const [fileToDelete, setFileToDelete] = useState<AdminStorageFile | null>(null);
  const [deleteSelectedModalOpen, setDeleteSelectedModalOpen] = useState(false);
  const [deleteAllShopFilesModalOpen, setDeleteAllShopFilesModalOpen] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const [quotaInput, setQuotaInput] = useState("");
  const [quotaSaving, setQuotaSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [overviewRes, filesRes] = await Promise.all([getAdminStorageOverview(), getAdminStorageFiles()]);
      setOverview(overviewRes);
      setAllFiles(filesRes.files);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "โหลดข้อมูลพื้นที่จัดเก็บไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (selectedShop) setQuotaInput(String(Math.round(selectedShop.quotaMb)));
  }, [selectedShop]);

  const largeFiles = useMemo(() => allFiles.filter((f) => f.sizeMb >= LARGE_FILE_MB), [allFiles]);

  const filteredShops = useMemo(() => {
    if (!overview) return [];
    return overview.shops.filter((shop) => {
      if (searchText.trim() && !shop.shopName.toLowerCase().includes(searchText.trim().toLowerCase())) return false;
      if (statusFilter !== "all" && shop.status !== statusFilter) return false;
      return true;
    });
  }, [overview, searchText, statusFilter]);

  const shopFiles = useMemo(
    () => (selectedShop ? allFiles.filter((f) => f.shopId === selectedShop.shopId) : []),
    [allFiles, selectedShop]
  );

  // เปิด shop ที่เลือกอยู่ค้างไว้ (แค่ sync ตัวเลขล่าสุด) หลัง refresh ข้อมูล — ถ้าร้านหายไปจาก overview (เช่นถูกลบ) ให้ปิด slideover
  useEffect(() => {
    if (!selectedShop || !overview) return;
    const fresh = overview.shops.find((s) => s.shopId === selectedShop.shopId);
    if (!fresh) setSelectedShop(null);
    else if (fresh.usedMb !== selectedShop.usedMb || fresh.quotaMb !== selectedShop.quotaMb) setSelectedShop(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overview]);

  const toggleSelectFile = (path: string) => {
    setSelectedFileIds((prev) => (prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]));
  };
  const toggleSelectAllFiles = () => {
    setSelectedFileIds((prev) => (prev.length === shopFiles.length ? [] : shopFiles.map((f) => f.path)));
  };

  const openFile = async (file: AdminStorageFile) => {
    setActionError("");
    try {
      const { url } = await getAdminStorageFileUrl(file.path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "เปิดไฟล์ไม่สำเร็จ");
    }
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;
    setActionBusy(true);
    setActionError("");
    try {
      await deleteAdminStorageFile(fileToDelete.path);
      setSelectedFileIds((prev) => prev.filter((p) => p !== fileToDelete.path));
      setFileToDelete(null);
      await fetchAll();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "ลบไฟล์ไม่สำเร็จ");
    } finally {
      setActionBusy(false);
    }
  };

  const confirmDeleteSelectedFiles = async () => {
    setActionBusy(true);
    setActionError("");
    try {
      await Promise.all(selectedFileIds.map((path) => deleteAdminStorageFile(path)));
      setSelectedFileIds([]);
      setDeleteSelectedModalOpen(false);
      await fetchAll();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "ลบไฟล์ที่เลือกไม่สำเร็จ");
    } finally {
      setActionBusy(false);
    }
  };

  const confirmDeleteAllShopFiles = async () => {
    if (!selectedShop) return;
    setActionBusy(true);
    setActionError("");
    try {
      await deleteAdminStorageShopFiles(selectedShop.shopId);
      setSelectedFileIds([]);
      setDeleteAllShopFilesModalOpen(false);
      await fetchAll();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "ลบไฟล์ทั้งหมดของร้านไม่สำเร็จ");
    } finally {
      setActionBusy(false);
    }
  };

  const saveQuota = async (resetToDefault: boolean) => {
    if (!selectedShop) return;
    setQuotaSaving(true);
    setActionError("");
    try {
      const value = resetToDefault ? null : Number(quotaInput);
      if (!resetToDefault && (!Number.isFinite(value) || (value as number) <= 0)) {
        setActionError("กรุณากรอกโควต้าเป็นตัวเลขมากกว่า 0");
        return;
      }
      await updateAdminShop(selectedShop.shopId, { storageQuotaMb: value });
      await fetchAll();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "บันทึกโควต้าไม่สำเร็จ");
    } finally {
      setQuotaSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
        <Loader2 size={32} className="animate-spin text-orange-500" />
        <p className="text-sm">กำลังโหลดข้อมูลพื้นที่จัดเก็บ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* ── Page Header ── */}
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

      {loadError && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 text-red-600 border border-red-200 text-sm">
          <AlertCircle size={18} />
          <span>{loadError}</span>
        </div>
      )}

      {overview && (
        <>
          {/* ── 4 Top Overview Metrics Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">พื้นที่ใช้งานรวมทั้งหมด</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Cloud size={16} />
                </div>
              </div>
              <div>
                <p className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">{formatSize(overview.summary.totalUsedMb)}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  จาก {formatSize(overview.summary.totalQuotaMb)} (
                  {overview.summary.totalQuotaMb > 0 ? ((overview.summary.totalUsedMb / overview.summary.totalQuotaMb) * 100).toFixed(2) : 0}%)
                </p>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full"
                  style={{ width: `${overview.summary.totalQuotaMb > 0 ? Math.min(100, (overview.summary.totalUsedMb / overview.summary.totalQuotaMb) * 100) : 0}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">ร้านค้าใกล้เต็มพื้นที่</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={16} />
                </div>
              </div>
              <div>
                <p className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">{overview.summary.shopsNearLimitCount} ร้านค้า</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">จาก {overview.summary.totalShopsCount} ร้านค้าในระบบ</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">ไฟล์ทั้งหมด</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FileText size={16} />
                </div>
              </div>
              <p className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">{overview.summary.totalFileCount.toLocaleString()} ไฟล์</p>
            </div>

            <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">ไฟล์ขนาดใหญ่ (&gt;1 GB)</span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertCircle size={16} />
                </div>
              </div>
              <div>
                <p className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">{largeFiles.length} ไฟล์</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  รวมพื้นที่ {formatSize(largeFiles.reduce((s, f) => s + f.sizeMb, 0))}
                </p>
              </div>
            </div>
          </div>

          {/* ── Main Navigation Sub-tabs ── */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-1 flex flex-wrap gap-1 shadow-2xs">
            <button
              onClick={() => setActiveMainTab("overview")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${activeMainTab === "overview" ? "bg-orange-500 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <Store size={13} />
              <span>พื้นที่ของแต่ละร้านค้า</span>
            </button>
            <button
              onClick={() => setActiveMainTab("large_files")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${activeMainTab === "large_files" ? "bg-orange-500 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <FileText size={13} />
              <span>ไฟล์ขนาดใหญ่ (&gt;1 GB)</span>
            </button>
            <button
              onClick={() => setActiveMainTab("near_limit")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${activeMainTab === "near_limit" ? "bg-orange-500 text-white shadow-2xs" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <AlertTriangle size={13} />
              <span>ร้านค้าใกล้เต็มพื้นที่</span>
            </button>
          </div>

          {actionError && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs">
              <AlertCircle size={16} />
              <span>{actionError}</span>
            </div>
          )}

          {/* ── Filter Bar (เฉพาะ overview tab) ── */}
          {activeMainTab === "overview" && (
            <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาร้านค้า..."
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
                <button
                  onClick={() => {
                    setSearchText("");
                    setStatusFilter("all");
                  }}
                  className="px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-orange-600 bg-slate-100 hover:bg-slate-200/70 rounded-lg transition flex items-center gap-1"
                >
                  <RotateCcw size={12} />
                  <span>รีเซ็ต</span>
                </button>
              </div>
            </div>
          )}

          {/* 1. Overview: Shops Storage Table */}
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
                      <th className="py-2.5 px-3">สถานะ</th>
                      <th className="py-2.5 px-3 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-xs">
                    {filteredShops.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          ไม่พบร้านค้าตรงตามเงื่อนไข
                        </td>
                      </tr>
                    ) : (
                      filteredShops.map((shop) => {
                        const percent = Math.round(shop.percent);
                        return (
                          <tr key={shop.shopId} className="hover:bg-orange-50/30 transition">
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black text-[10px] shrink-0 shadow-2xs">
                                  {shop.shopName[0]}
                                </div>
                                <p className="font-extrabold text-slate-900 text-xs leading-tight">{shop.shopName}</p>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-800">{formatSize(shop.usedMb)}</td>
                            <td className="py-2.5 px-3 text-slate-500">{formatSize(shop.quotaMb)}</td>
                            <td className="py-2.5 px-3">
                              <div className="w-28 space-y-1">
                                <span className={percent > 85 ? "text-red-600 text-[10px] font-bold" : percent > 65 ? "text-amber-600 text-[10px] font-bold" : "text-slate-600 text-[10px] font-bold"}>
                                  {percent}%
                                </span>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${percent > 85 ? "bg-red-500" : percent > 65 ? "bg-amber-500" : "bg-emerald-500"}`}
                                    style={{ width: `${Math.min(100, percent)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 font-bold">{shop.fileCount.toLocaleString()}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadgeClass(shop.status)}`}>
                                {STATUS_LABEL[shop.status]}
                              </span>
                            </td>
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
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. Large Files */}
          {activeMainTab === "large_files" && (
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <AlertCircle className="text-rose-500" size={18} />
                  <h3 className="text-xs font-extrabold text-slate-900">รายการไฟล์ขนาดใหญ่ทั้งหมด (เกิน 1 GB)</h3>
                </div>
                <span className="text-[11px] text-slate-400 font-semibold">พบ {largeFiles.length} รายการ</span>
              </div>
              {largeFiles.length === 0 ? (
                <div className="p-6 text-center text-slate-400 space-y-1">
                  <CheckCircle2 size={24} className="mx-auto text-emerald-400" />
                  <p className="text-xs font-bold text-slate-700">ไม่มีไฟล์ขนาดใหญ่ในระบบ</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {largeFiles.map((file) => (
                    <div key={file.path} className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-lg transition text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 font-black text-[11px] flex items-center justify-center shrink-0 border border-rose-100">
                          {(file.sizeMb / 1024).toFixed(1)} GB
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{file.fileName ?? file.path}</p>
                          <p className="text-[10px] text-slate-400 font-medium">ร้านค้า: {file.shopName} • วันที่: {new Date(file.createdAt).toLocaleDateString("th-TH")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => openFile(file)} className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
                          ดูไฟล์
                        </button>
                        <button onClick={() => setFileToDelete(file)} className="px-2.5 py-1 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition">
                          ลบไฟล์
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. Shops Near Limit */}
          {activeMainTab === "near_limit" && (
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <AlertTriangle className="text-amber-500" size={18} />
                <h3 className="text-xs font-extrabold text-slate-900">ร้านค้าที่ใช้งานพื้นที่เกิน 65%</h3>
              </div>
              {overview.shops.filter((s) => s.status !== "normal").length === 0 ? (
                <div className="p-6 text-center text-slate-400 space-y-1">
                  <CheckCircle2 size={24} className="mx-auto text-emerald-400" />
                  <p className="text-xs font-bold text-slate-700">ไม่มีร้านค้าที่ใกล้เต็มพื้นที่</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {overview.shops.filter((s) => s.status !== "normal").map((shop) => (
                    <div key={shop.shopId} className="p-3 rounded-xl border border-amber-200/80 bg-amber-50/40 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-black text-[10px] flex items-center justify-center shadow-xs">
                          {shop.shopName[0]}
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900">{shop.shopName}</h4>
                          <p className="text-[10px] text-slate-500 font-medium">
                            เหลือพื้นที่ {formatSize(Math.max(0, shop.quotaMb - shop.usedMb))} ({Math.round(shop.percent)}% ใช้งานแล้ว)
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
              )}
            </div>
          )}
        </>
      )}

      {/* ── Slide-over: จัดการไฟล์ของร้านค้าที่เลือก ── */}
      {selectedShop && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in">
          <div className="w-full max-w-3xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
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
                    <h2 className="text-sm font-black text-white">ร้านค้า: {selectedShop.shopName}</h2>
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-orange-500 text-white">
                      {formatSize(selectedShop.usedMb)} / {formatSize(selectedShop.quotaMb)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">จัดการไฟล์ ตรวจสอบพื้นที่ และตั้งโควต้าของร้านค้า</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDeleteAllShopFilesModalOpen(true)}
                  disabled={shopFiles.length === 0}
                  className="px-2.5 py-1.5 text-[11px] font-extrabold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition flex items-center gap-1 shadow-xs border border-red-500"
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

            <div className="p-4 space-y-3 flex-1 bg-slate-50/50">
              {/* โควต้าพื้นที่ */}
              <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-end gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 block">โควต้าพื้นที่ของร้านนี้ (MB)</label>
                  <input
                    type="number"
                    min={1}
                    value={quotaInput}
                    onChange={(e) => setQuotaInput(e.target.value)}
                    className="w-32 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <button
                  onClick={() => saveQuota(false)}
                  disabled={quotaSaving}
                  className="px-3 py-1.5 text-[11px] font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 rounded-lg transition flex items-center gap-1"
                >
                  {quotaSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  <span>บันทึกโควต้า</span>
                </button>
                <button
                  onClick={() => saveQuota(true)}
                  disabled={quotaSaving}
                  className="px-3 py-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg transition"
                >
                  ใช้ค่า default กลาง
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 gap-2">
                <span className="text-xs font-bold text-slate-700">ไฟล์ทั้งหมด ({shopFiles.length})</span>
                <div className="flex items-center gap-2">
                  {selectedFileIds.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-2 py-1 rounded-lg">
                      <span className="text-[11px] font-extrabold text-orange-700">เลือก {selectedFileIds.length} ไฟล์</span>
                      <button
                        onClick={() => setDeleteSelectedModalOpen(true)}
                        className="px-2 py-0.5 text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 rounded transition"
                      >
                        ลบที่เลือก
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                    <button onClick={() => setViewMode("table")} className={`p-1 rounded transition ${viewMode === "table" ? "bg-orange-50 text-orange-600" : "text-slate-400"}`}>
                      <List size={14} />
                    </button>
                    <button onClick={() => setViewMode("grid")} className={`p-1 rounded transition ${viewMode === "grid" ? "bg-orange-50 text-orange-600" : "text-slate-400"}`}>
                      <LayoutGrid size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {viewMode === "table" ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                        <th className="py-2.5 px-3 w-8">
                          <input
                            type="checkbox"
                            checked={shopFiles.length > 0 && selectedFileIds.length === shopFiles.length}
                            onChange={toggleSelectAllFiles}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-orange-500 focus:ring-orange-500/20"
                          />
                        </th>
                        <th className="py-2.5 px-3">ชื่อไฟล์</th>
                        <th className="py-2.5 px-3">ประเภท</th>
                        <th className="py-2.5 px-3">ขนาด</th>
                        <th className="py-2.5 px-3">อัปโหลดโดย</th>
                        <th className="py-2.5 px-3">สถานะ</th>
                        <th className="py-2.5 px-3">วันที่</th>
                        <th className="py-2.5 px-3 text-right">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {shopFiles.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            <CheckCircle2 size={24} className="mx-auto text-emerald-400 mb-1" />
                            <p className="text-xs font-bold text-slate-700">ไม่มีไฟล์หลงเหลือในร้านนี้</p>
                          </td>
                        </tr>
                      ) : (
                        shopFiles.map((file) => {
                          const isSelected = selectedFileIds.includes(file.path);
                          return (
                            <tr key={file.path} className={`transition ${isSelected ? "bg-orange-50/60" : "hover:bg-orange-50/20"}`}>
                              <td className="py-2.5 px-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectFile(file.path)}
                                  className="w-3.5 h-3.5 rounded border-slate-300 text-orange-500 focus:ring-orange-500/20"
                                />
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-800">
                                <div className="flex items-center gap-2">
                                  <FileText size={15} className="text-orange-500 shrink-0" />
                                  <span className="truncate max-w-[150px]">{file.fileName ?? file.path}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-extrabold uppercase">{fileExt(file.fileName)}</span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 font-bold">{formatSize(file.sizeMb)}</td>
                              <td className="py-2.5 px-3 text-slate-500">{file.uploadedBy}</td>
                              <td className="py-2.5 px-3">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${file.source === "order" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-600"}`}>
                                  {file.source === "order" ? `ออเดอร์ ${file.orderCode ?? ""}` : "ในตะกร้า"}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-400">{new Date(file.createdAt).toLocaleDateString("th-TH")}</td>
                              <td className="py-2.5 px-3 text-right relative">
                                <button
                                  onClick={() => setActiveMenuFileId(activeMenuFileId === file.path ? null : file.path)}
                                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
                                >
                                  <MoreVertical size={15} />
                                </button>
                                {activeMenuFileId === file.path && (
                                  <div className="absolute right-3 top-8 w-40 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 text-left">
                                    <button
                                      onClick={() => {
                                        setActiveMenuFileId(null);
                                        openFile(file);
                                      }}
                                      className="w-full px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2"
                                    >
                                      <Eye size={13} />
                                      <span>ดูตัวอย่าง</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveMenuFileId(null);
                                        openFile(file);
                                      }}
                                      className="w-full px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2"
                                    >
                                      <Download size={13} />
                                      <span>ดาวน์โหลด</span>
                                    </button>
                                    <div className="border-t border-slate-100 my-1" />
                                    <button
                                      onClick={() => {
                                        setActiveMenuFileId(null);
                                        setFileToDelete(file);
                                      }}
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {shopFiles.map((file) => {
                    const isSelected = selectedFileIds.includes(file.path);
                    return (
                      <div
                        key={file.path}
                        onClick={() => toggleSelectFile(file.path)}
                        className={`p-2.5 rounded-xl border space-y-1.5 shadow-2xs text-xs cursor-pointer relative transition ${isSelected ? "bg-orange-50/80 border-orange-400 ring-2 ring-orange-500/20" : "bg-white border-slate-200"}`}
                      >
                        <input type="checkbox" checked={isSelected} onChange={() => {}} className="absolute top-2.5 right-2.5 w-3.5 h-3.5 rounded text-orange-500" />
                        <div className="h-20 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                          <FileText size={28} className="text-orange-400" />
                        </div>
                        <p className="text-xs font-bold text-slate-800 truncate">{file.fileName ?? file.path}</p>
                        <p className="text-[10px] text-slate-400">
                          {formatSize(file.sizeMb)} • {new Date(file.createdAt).toLocaleDateString("th-TH")}
                        </p>
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
                คุณต้องการลบไฟล์ <span className="font-bold text-slate-800">&quot;{fileToDelete.fileName ?? fileToDelete.path}&quot;</span> ({formatSize(fileToDelete.sizeMb)}) ถาวรใช่หรือไม่?
                การลบนี้ย้อนกลับไม่ได้
              </p>
            </div>
            <div className="flex gap-2.5 pt-1">
              <button onClick={() => setFileToDelete(null)} disabled={actionBusy} className="flex-1 py-2.5 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-50">
                ยกเลิก
              </button>
              <button onClick={confirmDeleteFile} disabled={actionBusy} className="flex-1 py-2.5 px-3 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition shadow-md shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-1.5">
                {actionBusy && <Loader2 size={13} className="animate-spin" />}
                <span>ลบไฟล์</span>
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
                คุณต้องการลบไฟล์ที่เลือกทั้งหมดจำนวน <span className="font-bold text-red-600">{selectedFileIds.length} รายการ</span> ถาวรใช่หรือไม่?
              </p>
            </div>
            <div className="flex gap-2.5 pt-1">
              <button onClick={() => setDeleteSelectedModalOpen(false)} disabled={actionBusy} className="flex-1 py-2.5 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-50">
                ยกเลิก
              </button>
              <button onClick={confirmDeleteSelectedFiles} disabled={actionBusy} className="flex-1 py-2.5 px-3 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition shadow-md shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-1.5">
                {actionBusy && <Loader2 size={13} className="animate-spin" />}
                <span>ยืนยันลบที่เลือก</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: ยืนยันการลบไฟล์ทั้งหมดของร้านนี้ ── */}
      {deleteAllShopFilesModalOpen && selectedShop && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 border border-rose-100 animate-in zoom-in-95 text-xs">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-xs border border-red-200">
              <ShieldAlert size={32} />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-slate-900">⚠️ ยืนยันลบไฟล์ทั้งหมดของร้านค้า</h3>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                คุณกำลังจะลบไฟล์งานทั้งหมดของร้าน <span className="font-black text-red-600 text-sm">{selectedShop.shopName}</span>
              </p>
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-[11px] text-red-700 space-y-1 text-left font-medium">
                <p>• จำนวนไฟล์ทั้งหมด: <strong className="font-extrabold">{shopFiles.length.toLocaleString()} ไฟล์</strong></p>
                <p>• พื้นที่ที่จะได้คืน: <strong className="font-extrabold">{formatSize(selectedShop.usedMb)}</strong></p>
                <p>• การลบนี้เป็นการลบถาวร ย้อนกลับไม่ได้</p>
              </div>
            </div>
            <div className="flex gap-2.5 pt-1">
              <button onClick={() => setDeleteAllShopFilesModalOpen(false)} disabled={actionBusy} className="flex-1 py-2.5 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-50">
                ยกเลิก
              </button>
              <button onClick={confirmDeleteAllShopFiles} disabled={actionBusy} className="flex-1 py-2.5 px-3 text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-md shadow-red-300 disabled:opacity-50 flex items-center justify-center gap-1">
                {actionBusy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>ยืนยันลบทั้งหมด</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
