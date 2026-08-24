"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Store,
  Search,
  CheckCircle2,
  Clock,
  CirclePause,
  Eye,
  Phone,
  MapPin,
  ExternalLink,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserX,
  Layers
} from "lucide-react";

import { listAdminShops, approveShop, rejectShop, deleteShop, updateAdminShop, type AdminShop } from "@/lib/api/admin";
import { toMockShop } from "@/lib/adminShopAdapter";
import type { MockShop } from "@/lib/mock/adminShops";
import { ApiError } from "@/lib/api/client";
import ShopStatusBadge from "@/components/admin/shops/ShopStatusBadge";
import NotificationToast, { type ToastType } from "@/components/admin/shops/NotificationToast";

const PAGE_SIZE = 8;

const AVAILABLE_SERVICES = [
  "ถ่ายเอกสาร",
  "ปริ้นเอกสารขาวดำ",
  "ปริ้นเอกสารสี",
  "สแกนเอกสาร",
  "เข้าเล่ม (สันกาว / สันห่วง / สันเกลียว)",
  "เคลือบเอกสาร",
  "ตัดกระดาษ",
  "เจาะรู",
  "เย็บเอกสาร",
  "พิมพ์แบบแปลน",
  "พิมพ์โปสเตอร์",
  "พิมพ์ไวนิล / แบนเนอร์",
  "พิมพ์สติ๊กเกอร์",
  "นามบัตร",
  "ใบปลิว / โบรชัวร์",
  "อื่น ๆ",
];

export default function AdminManageShopsPage() {
  const [shops, setShops] = useState<MockShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Filters & Search
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<string>("all");

  // Pagination
  const [page, setPage] = useState(1);

  // Inspector Modal State
  const [detailShop, setDetailShop] = useState<MockShop | null>(null);

  // Action Modal State (approve / suspend)
  const [actionModal, setActionModal] = useState<{
    shop: MockShop;
    action: "approve" | "suspend";
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendError, setSuspendError] = useState("");

  // Portal mount check
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<MockShop | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Edit Shop Modal State
  const [editShopModal, setEditShopModal] = useState<MockShop | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    serviceTypes: [] as string[],
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Dropdown open state (track by shop id)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Toast State
  const [toast, setToast] = useState<{ type: ToastType; shopName: string } | null>(null);

  // Fetch shop list from API
  const fetchShops = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { shops: rows } = await listAdminShops();
      setShops(rows.map(toMockShop));
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "โหลดข้อมูลร้านค้าไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  // Click outside to close action dropdown
  useEffect(() => {
    if (!openDropdown) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".admin-action-menu")) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [openDropdown]);

  // Statistics
  const stats = useMemo(() => {
    const total = shops.length;
    const approved = shops.filter((s) => s.status === "อนุมัติแล้ว").length;
    const pending = shops.filter((s) => s.status === "รอตรวจสอบ").length;
    const rejected = shops.filter((s) => s.status === "ไม่อนุมัติ").length;
    const deleted = shops.filter((s) => s.status === "ลบบัญชีแล้ว").length;
    return { total, approved, pending, rejected, deleted };
  }, [shops]);

  // Filtered Shops List
  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      // Status Filter
      if (selectedStatus !== "all") {
        if (selectedStatus === "approved" && shop.status !== "อนุมัติแล้ว") return false;
        if (selectedStatus === "pending" && shop.status !== "รอตรวจสอบ") return false;
        if (selectedStatus === "rejected" && shop.status !== "ไม่อนุมัติ") return false;
        if (selectedStatus === "deleted" && shop.status !== "ลบบัญชีแล้ว") return false;
      }

      // Service Filter
      if (selectedService !== "all") {
        if (!shop.serviceTypes.some((s) => s.includes(selectedService))) return false;
      }

      // Search Query Filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = shop.name.toLowerCase().includes(q);
        const matchOwner = `${shop.ownerFirstname} ${shop.ownerLastname}`.toLowerCase().includes(q);
        const matchPhone = shop.phone.toLowerCase().includes(q);
        const matchEmail = shop.email.toLowerCase().includes(q);
        const matchAddress = shop.address.toLowerCase().includes(q);
        return matchName || matchOwner || matchPhone || matchEmail || matchAddress;
      }

      return true;
    });
  }, [shops, selectedStatus, selectedService, search]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredShops.length / PAGE_SIZE) || 1;
  const paginatedShops = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredShops.slice(start, start + PAGE_SIZE);
  }, [filteredShops, page]);

  // Handle Action Approval / Suspension
  const handleConfirmAction = async () => {
    if (!actionModal) return;
    const { shop, action } = actionModal;

    if (action === "suspend") {
      if (!suspendReason.trim()) {
        setSuspendError("กรุณาระบุเหตุผลในการระงับการใช้งานร้านค้า");
        return;
      }
    }

    setActionLoading(true);
    try {
      if (action === "approve") {
        await approveShop(shop.id);
        setToast({ type: "approve", shopName: shop.name });
      } else {
        await rejectShop(shop.id, { reason: suspendReason.trim() });
        setToast({ type: "reject", shopName: shop.name });
      }
      await fetchShops();
      setActionModal(null);
      setSuspendReason("");
      setSuspendError("");
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "ทำรายการไม่สำเร็จ");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Shop
  const handleConfirmDelete = async () => {
    if (!deleteModal) return;
    setDeleteLoading(true);
    try {
      await deleteShop(deleteModal.id);
      setToast({ type: "delete", shopName: deleteModal.name });
      await fetchShops();
      setDeleteModal(null);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "ลบร้านค้าไม่สำเร็จ");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (shop: MockShop) => {
    setEditShopModal(shop);
    setEditForm({
      name: shop.name,
      email: shop.email,
      phone: shop.phone,
      address: shop.address,
      serviceTypes: [...(shop.serviceTypes ?? [])],
    });
    setEditError("");
    setOpenDropdown(null);
  };

  // Save Edit Shop
  const handleSaveEdit = async () => {
    if (!editShopModal) return;
    if (!editForm.name.trim()) {
      setEditError("กรุณากรอกชื่อร้านค้า");
      return;
    }
    if (!editForm.phone.trim()) {
      setEditError("กรุณากรอกเบอร์โทรศัพท์");
      return;
    }
    setEditLoading(true);
    try {
      await updateAdminShop(editShopModal.id, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim(),
        address: editForm.address.trim(),
        serviceTypes: editForm.serviceTypes,
      });
      setShops((prev) =>
        prev.map((s) =>
          s.id === editShopModal.id
            ? {
                ...s,
                name: editForm.name.trim(),
                email: editForm.email.trim(),
                phone: editForm.phone.trim(),
                address: editForm.address.trim(),
                serviceTypes: editForm.serviceTypes,
              }
            : s
        )
      );
      setToast({ type: "edit", shopName: editForm.name.trim() });
      setEditShopModal(null);
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : "บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <NotificationToast
          type={toast.type}
          shopName={toast.shopName}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
            <Store size={21} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-800 md:text-2xl">จัดการร้านค้า</h1>
            <p className="mt-0.5 text-xs text-slate-400 md:text-sm">
              ค้นหา ตรวจสอบข้อมูล และจัดการสถานะร้านค้าถ่ายเอกสารในระบบ EasyPrint
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {loadError && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 text-red-600 border border-red-200 text-sm">
          <AlertCircle size={18} />
          <span>{loadError}</span>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">ร้านค้าทั้งหมด</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <Store size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          <p className="text-[11px] text-slate-400">รายการร้านค้าในระบบ</p>
        </div>

        {/* Approved */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">เปิดใช้งาน (อนุมัติแล้ว)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{stats.approved}</p>
          <p className="text-[11px] text-slate-400">พร้อมให้บริการลูกค้า</p>
        </div>

        {/* Pending */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">รอการตรวจสอบ</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          <p className="text-[11px] text-slate-400">รอดำเนินการอนุมัติ</p>
        </div>

        {/* Rejected/Suspended */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">ระงับ / ไม่อนุมัติ</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <CirclePause size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          <p className="text-[11px] text-slate-400">ถูกระงับการใช้งาน</p>
        </div>

        {/* Deleted */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">ลบบัญชีแล้ว</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
              <UserX size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-500">{stats.deleted}</p>
          <p className="text-[11px] text-slate-400">ร้านลบออกจากระบบ</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="ค้นหาชื่อร้านค้า, เจ้าของร้าน, อีเมล, เบอร์โทร..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="approved">อนุมัติแล้ว (เปิดใช้งาน)</option>
            <option value="pending">รอการตรวจสอบ</option>
            <option value="rejected">ระงับ / ไม่อนุมัติ</option>
            <option value="deleted">ลบบัญชีแล้ว</option>
          </select>

          {/* Service Dropdown */}
          <select
            value={selectedService}
            onChange={(e) => {
              setSelectedService(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="all">ประเภทบริการทั้งหมด</option>
            <option value="พิมพ์">พิมพ์เอกสาร</option>
            <option value="เข้าเล่ม">เข้าเล่ม</option>
            <option value="สแกน">สแกนเอกสาร</option>
          </select>
        </div>

        {/* Search Results Summary */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1 border-t border-slate-100">
          <span>แสดง {filteredShops.length} ร้านค้าจากทั้งหมด {shops.length} ร้าน</span>
          {(search || selectedStatus !== "all" || selectedService !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedStatus("all");
                setSelectedService("all");
                setPage(1);
              }}
              className="text-orange-600 hover:underline cursor-pointer"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* Main Shops Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 size={32} className="animate-spin text-orange-500" />
            <p className="text-sm">กำลังโหลดข้อมูลร้านค้า...</p>
          </div>
        ) : paginatedShops.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Store size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-700 font-medium text-base">ไม่พบร้านค้าตรงตามเงื่อนไข</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองสถานะใหม่อีกครั้ง
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">ร้านค้า</th>
                  <th className="py-3.5 px-4">เจ้าของร้าน / ติดต่อ</th>
                  <th className="py-3.5 px-4">วันที่สมัคร</th>
                  <th className="py-3.5 px-4">สถานะ</th>
                  <th className="py-3.5 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedShops.map((shop, idx) => {
                  const isDropUp = idx >= Math.max(1, paginatedShops.length - 3);
                  return (
                    <tr key={shop.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Shop Info */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 font-bold flex items-center justify-center shrink-0 shadow-xs">
                            {shop.name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 text-sm truncate" title={shop.name}>
                              {shop.name}
                            </p>
                            <p className="text-xs text-slate-400 truncate max-w-xs">
                              {shop.address || "ไม่ระบุที่อยู่"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Owner & Contact */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <p className="font-medium text-slate-800 text-xs sm:text-sm">
                            {shop.ownerFirstname} {shop.ownerLastname}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Phone size={12} /> {shop.phone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Submit Date */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <p className="text-xs text-slate-700">{shop.submitDate}</p>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <ShopStatusBadge status={shop.status} />
                      </td>

                      {/* Action Dropdown */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="relative inline-block admin-action-menu">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdown(openDropdown === shop.id ? null : shop.id);
                            }}
                            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition flex items-center gap-1 cursor-pointer"
                            title="จัดการ"
                          >
                            <MoreHorizontal size={16} />
                          </button>

                          {openDropdown === shop.id && (
                            <div
                              className={`absolute right-0 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden py-1 ${isDropUp ? "bottom-full " : "top-full "
                                }`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* ดูรายละเอียด */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDetailShop(shop);
                                  setOpenDropdown(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition text-left cursor-pointer"
                              >
                                <Eye size={14} className="text-slate-400" />
                                ดูรายละเอียดร้านค้า
                              </button>

                              {/* แก้ไขข้อมูล (แสดงเฉพาะร้านค้าที่ยังไม่ถูกไม่อนุมัติหรือลบ) */}
                              {shop.status !== "ไม่อนุมัติ" && shop.status !== "ลบบัญชีแล้ว" && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditModal(shop);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition text-left cursor-pointer"
                                >
                                  <Pencil size={14} className="text-blue-400" />
                                  แก้ไขข้อมูลร้านค้า
                                </button>
                              )}

                              {/* ระงับ / อนุมัติ (แสดงเฉพาะร้านค้าที่ยังไม่ถูกไม่อนุมัติหรือลบ) */}
                              {shop.status !== "ไม่อนุมัติ" && shop.status !== "ลบบัญชีแล้ว" && (
                                shop.status !== "อนุมัติแล้ว" ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActionModal({ shop, action: "approve" });
                                      setOpenDropdown(null);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition text-left cursor-pointer"
                                  >
                                    <CheckCircle2 size={14} className="text-emerald-500" />
                                    อนุมัติร้านค้า
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActionModal({ shop, action: "suspend" });
                                      setOpenDropdown(null);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-amber-700 hover:bg-amber-50 transition text-left cursor-pointer"
                                  >
                                    <CirclePause size={14} className="text-amber-500" />
                                    ระงับการใช้งานร้านค้า
                                  </button>
                                )
                              )}

                              <div className="border-t border-slate-100 my-1" />

                              {/* ลบร้านค้า */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteModal(shop);
                                  setOpenDropdown(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition text-left cursor-pointer"
                              >
                                <Trash2 size={14} className="text-rose-500" />
                                ลบร้านค้า
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/50">
            <span className="text-xs text-slate-500">
              หน้า {page} จาก {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODALS: Rendered via React Portal for 100% full-screen backdrop
      ───────────────────────────────────────────────────────────── */}
      {mounted && (
        <>
          {/* MODAL 1: Detail Inspector Modal */}
          {detailShop && createPortal(
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fadeIn"
              onClick={() => setDetailShop(null)}
            >
              <div
                className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-xl shadow-2xl border border-slate-100 space-y-5 transform transition"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-lg">
                      {detailShop.name[0]}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{detailShop.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <ShopStatusBadge status={detailShop.status} />
                        <span className="text-xs text-slate-400">ส่งเมื่อ {detailShop.submitDate}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setDetailShop(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-sm text-slate-700">
                  {/* Owner Info */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-orange-600">
                      ข้อมูลเจ้าของร้าน
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-slate-400 block">ชื่อ-นามสกุล</span>
                        <p className="font-semibold">{detailShop.ownerFirstname} {detailShop.ownerLastname}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">เบอร์โทรศัพท์</span>
                        <p className="font-semibold">{detailShop.phone}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-slate-400 block">อีเมลติดต่อ</span>
                        <p className="font-semibold">{detailShop.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Address & Maps */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-orange-600">
                      สถานที่และเวลาทำการ
                    </h4>
                    <p className="text-xs leading-relaxed">{detailShop.address}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>วันทำการ: {detailShop.openDays} ({detailShop.openTime} - {detailShop.closeTime})</span>
                      {detailShop.googleMapLink && (
                        <a
                          href={detailShop.googleMapLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-600 font-semibold hover:underline flex items-center gap-1"
                        >
                          <MapPin size={13} /> แผนที่ Google Maps <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Services & Delivery */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-orange-600">
                      บริการและการจัดส่ง
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-slate-400 block mb-1">ประเภทงานพิมพ์</span>
                        <div className="flex flex-wrap gap-1">
                          {detailShop.serviceTypes.map((st, i) => (
                            <span key={i} className="px-2.5 py-0.5 rounded-lg text-xs bg-white border border-slate-200 font-medium">
                              {st}
                            </span>
                          ))}
                        </div>
                      </div>
                      {detailShop.deliveryMethods.length > 0 && (
                        <div>
                          <span className="text-xs text-slate-400 block mb-1">ช่องทางจัดส่ง</span>
                          <div className="flex flex-wrap gap-1">
                            {detailShop.deliveryMethods.map((dm, i) => (
                              <span key={i} className="px-2.5 py-0.5 rounded-lg text-xs bg-orange-50 text-orange-600 border border-orange-200 font-medium">
                                {dm}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rejected / Suspended Reason */}
                  {detailShop.rejectedReason && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
                      <h4 className="font-bold text-rose-700 text-xs uppercase tracking-wider">
                        เหตุผลที่ไม่อนุมัติ / ระงับการใช้งาน
                      </h4>
                      <p className="text-xs text-rose-600 leading-relaxed font-medium">
                        {detailShop.rejectedReason}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setDetailShop(null)}
                    className="px-5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* MODAL 2: Action Modal (Approve / Suspend) */}
          {actionModal && createPortal(
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fadeIn"
              onClick={() => setActionModal(null)}
            >
              <div
                className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4 text-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${actionModal.action === "approve" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                  }`}>
                  {actionModal.action === "approve" ? <CheckCircle2 size={32} /> : <CirclePause size={32} />}
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-800">
                    {actionModal.action === "approve" ? "ยืนยันการอนุมัติร้านค้า" : "ยืนยันการระงับร้านค้า"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    คุณต้องการ{actionModal.action === "approve" ? "อนุมัติเปิดใช้งาน" : "ระงับการใช้งาน"} ร้านค้า{" "}
                    <span className="font-semibold text-slate-800">"{actionModal.shop.name}"</span> ใช่หรือไม่?
                  </p>
                </div>

                {/* Suspend Reason Input */}
                {actionModal.action === "suspend" && (
                  <div className="text-left space-y-1.5 pt-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      เหตุผลในการระงับการใช้งาน <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={suspendReason}
                      onChange={(e) => {
                        setSuspendReason(e.target.value);
                        setSuspendError("");
                      }}
                      placeholder="กรอกเหตุผลที่ระงับร้านค้า เช่น ทำผิดเงื่อนไขบริการ, ข้อมูลร้านค้าไม่ถูกต้อง..."
                      className={`w-full text-xs p-3 rounded-xl border ${suspendError ? "border-rose-500 bg-rose-50/50" : "border-slate-200 bg-slate-50"
                        } focus:outline-none focus:border-rose-500 focus:bg-white transition resize-none`}
                    />
                    {suspendError && (
                      <p className="text-[11px] text-rose-500 font-medium">{suspendError}</p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setActionModal(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition"
                  >
                    ยกเลิก
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleConfirmAction}
                    className={`px-5 py-2 rounded-xl text-white text-xs font-semibold shadow-md transition disabled:opacity-50 ${actionModal.action === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                      : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                      }`}
                  >
                    {actionLoading ? "กำลังดำเนินการ..." : "ยืนยันทำรายการ"}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* MODAL 3: Delete Confirmation Modal */}
          {deleteModal && createPortal(
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fadeIn"
              onClick={() => !deleteLoading && setDeleteModal(null)}
            >
              <div
                className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 space-y-4 text-center"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-rose-100">
                  <Trash2 size={28} className="text-rose-600" />
                </div>

                {/* Text */}
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-slate-800">ยืนยันการลบร้านค้า</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    คุณต้องการลบร้านค้า{" "}
                    <span className="font-semibold text-slate-800">"{deleteModal.name}"</span>{" "}
                    ออกจากระบบใช่หรือไม่?
                  </p>
                  <p className="text-[11px] text-rose-500 font-medium bg-rose-50 rounded-xl px-3 py-2">
                    ⚠️ การดำเนินการนี้ไม่สามารถย้อนกลับได้
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    disabled={deleteLoading}
                    onClick={() => setDeleteModal(null)}
                    className="px-5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition disabled:opacity-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    disabled={deleteLoading}
                    onClick={handleConfirmDelete}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {deleteLoading ? (
                      <><Loader2 size={13} className="animate-spin" /> กำลังลบ...</>
                    ) : (
                      <> ยืนยันลบร้านค้า</>
                    )}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
          {/* MODAL 4: Edit Shop Modal */}
          {editShopModal && createPortal(
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fadeIn"
              onClick={() => !editLoading && setEditShopModal(null)}
            >
              <div
                className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl border border-slate-100 space-y-5"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Pencil size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">แก้ไขข้อมูลร้านค้า</h3>
                      <p className="text-xs text-slate-400">ปรับเปลี่ยนข้อมูลพื้นฐานของร้านค้าในระบบ</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditShopModal(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Form */}
                <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                  {editError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-600 flex items-center gap-2">
                      <AlertCircle size={14} />
                      <span>{editError}</span>
                    </div>
                  )}

                  {/* ชื่อร้านค้า */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      ชื่อร้านค้า <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="กรอกชื่อร้านค้า..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-orange-500 focus:bg-white transition"
                    />
                  </div>

                  {/* อีเมล & เบอร์โทร */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 block">อีเมลร้านค้า</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        placeholder="example@gmail.com"
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-orange-500 focus:bg-white transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 block">
                        เบอร์โทรศัพท์ <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        placeholder="08X-XXX-XXXX"
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-orange-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  {/* ที่อยู่ */}
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1">
                      <span className="text-orange-400"><MapPin className="w-4 h-4" /></span>
                      ที่อยู่ร้านค้า <span className="text-orange-500">*</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mb-2">
                      ระบุที่อยู่ครบถ้วน เช่น บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์
                    </p>
                    <textarea
                      rows={3}
                      value={editForm.address === "-" ? "" : editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder="เช่น 123/45 ถ.พหลโยธิน ต.สามเสนใน อ.พญาไท จ.กรุงเทพมหานคร 10400"
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-orange-500 focus:bg-white transition resize-none"
                    />
                  </div>

                  {/* บริการของร้าน */}
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1">
                      <span className="text-orange-400"><Layers className="w-4 h-4" /></span>
                      บริการของร้าน <span className="text-orange-500">*</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mb-3">เลือกได้มากกว่า 1 รายการ</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {AVAILABLE_SERVICES.map((service) => {
                        const selected = editForm.serviceTypes.includes(service);
                        return (
                          <label
                            key={service}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border cursor-pointer transition-all ${
                              selected
                                ? "border-orange-500 bg-orange-50 text-orange-600 font-semibold"
                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => {
                                if (selected) {
                                  setEditForm({
                                    ...editForm,
                                    serviceTypes: editForm.serviceTypes.filter((s) => s !== service),
                                  });
                                } else {
                                  setEditForm({
                                    ...editForm,
                                    serviceTypes: [...editForm.serviceTypes, service],
                                  });
                                }
                              }}
                              className="rounded text-orange-500 focus:ring-orange-500"
                            />
                            <span>{service}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={editLoading}
                    onClick={() => setEditShopModal(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition disabled:opacity-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    disabled={editLoading}
                    onClick={handleSaveEdit}
                    className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-md shadow-orange-500/20 transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {editLoading ? (
                      <><Loader2 size={13} className="animate-spin" /> กำลังบันทึก...</>
                    ) : (
                      "บันทึกการแก้ไข"
                    )}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

        </>
      )}
    </div>
  );
}
