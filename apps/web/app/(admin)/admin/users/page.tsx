"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  UserCheck,
  UserX,
  Search,
  X,
  AlertCircle,
  Eye,
  MoreHorizontal,
  CirclePause,
  CheckCircle2,
  Trash2,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import type { AdminCustomerListItem, AdminCustomerListResponse } from "@easyprint/shared";

import {
  listAdminCustomers,
  getAdminCustomer,
  suspendCustomer,
  reinstateCustomer,
  deleteCustomer,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { SkeletonRow } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import CustomerStatusBadge from "@/components/admin/users/CustomerStatusBadge";
import CustomerDetailModal from "@/components/admin/users/CustomerDetailModal";
import CustomerActionToast, { type CustomerToastType } from "@/components/admin/users/CustomerActionToast";
import { formatThaiDate, customerFullName } from "@/components/admin/users/format";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 350;

// ข้อมูลขั้นต่ำที่ modal ยืนยันต้องใช้ — มาได้ทั้งจากแถวในตารางและจาก modal รายละเอียด (AdminCustomerDetail extends รายการนี้)
type CustomerRef = Pick<AdminCustomerListItem, "id" | "firstname" | "lastname" | "status" | "orderCount">;
type StatusFilter = "all" | "active" | "suspended";

export default function AdminUsersPage() {
  const [data, setData] = useState<AdminCustomerListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Filters & Search (ค้นหา/แบ่งหน้าฝั่ง server — debounce คำค้นหาก่อนยิง API)
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  // Modals
  const [mounted, setMounted] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{ customer: CustomerRef; action: "suspend" | "reinstate" } | null>(null);
  const [activeOrderCount, setActiveOrderCount] = useState<number | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState<CustomerRef | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: CustomerToastType; name: string } | null>(null);

  // กัน response เก่าที่ตอบกลับช้ามาทับผลการค้นหาล่าสุด (เช่น พิมพ์เร็วๆ แล้ว request แรกตอบทีหลัง)
  const requestSeq = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCustomers = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setLoadError("");
    try {
      const res = await listAdminCustomers({
        q: debouncedSearch || undefined,
        status: statusFilter,
        page,
        pageSize: PAGE_SIZE,
      });
      if (seq !== requestSeq.current) return;
      // หน้าปัจจุบันว่างหลังลบ/ระงับรายการสุดท้าย (หรือกรองแล้วเหลือน้อยลง) — ถอยไปหน้าสุดท้ายที่ยังมีข้อมูล
      if (res.customers.length === 0 && page > 1 && res.pagination.total > 0) {
        setPage(res.pagination.totalPages);
        return;
      }
      setData(res);
    } catch (err) {
      if (seq !== requestSeq.current) return;
      setLoadError(err instanceof ApiError ? err.message : "โหลดข้อมูลบัญชีลูกค้าไม่สำเร็จ");
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [debouncedSearch, statusFilter, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Click outside to close action dropdown
  useEffect(() => {
    if (!openDropdown) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".admin-action-menu")) setOpenDropdown(null);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [openDropdown]);

  const openActionModal = (customer: CustomerRef, action: "suspend" | "reinstate") => {
    setActionModal({ customer, action });
    setSuspendReason("");
    setActionError("");
    setActiveOrderCount(null);
    setOpenDropdown(null);
    setDetailId(null);
    // ระงับบัญชี: ดึงจำนวนออเดอร์ที่ยังไม่จบมาเตือนแอดมินก่อนยืนยัน (ร้านค้ายังต้องทำงานกับออเดอร์เหล่านี้ต่อ)
    if (action === "suspend" && customer.orderCount > 0) {
      getAdminCustomer(customer.id)
        .then(({ customer: detail }) => setActiveOrderCount(detail.orderStats.active))
        .catch(() => setActiveOrderCount(null));
    }
  };

  const openDeleteModal = (customer: CustomerRef) => {
    setDeleteModal(customer);
    setDeleteError("");
    setOpenDropdown(null);
    setDetailId(null);
  };

  const handleConfirmAction = async () => {
    if (!actionModal) return;
    const { customer, action } = actionModal;
    if (action === "suspend" && !suspendReason.trim()) {
      setActionError("กรุณาระบุเหตุผลในการระงับการใช้งาน");
      return;
    }

    setActionLoading(true);
    setActionError("");
    try {
      if (action === "suspend") {
        await suspendCustomer(customer.id, { reason: suspendReason.trim() });
      } else {
        await reinstateCustomer(customer.id);
      }
      setToast({ type: action, name: customerFullName(customer) });
      setActionModal(null);
      await fetchCustomers();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "ทำรายการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await deleteCustomer(deleteModal.id);
      setToast({ type: "delete", name: customerFullName(deleteModal) });
      setDeleteModal(null);
      await fetchCustomers();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "ลบบัญชีไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setDeleteLoading(false);
    }
  };

  const stats = data?.stats ?? { total: 0, active: 0, suspended: 0 };
  const customers = data?.customers ?? [];
  const pagination = data?.pagination;
  const hasFilter = !!debouncedSearch || statusFilter !== "all";
  const deleteBlocked = !!deleteModal && deleteModal.orderCount > 0;

  return (
    <div className="space-y-6 pb-12">
      {toast && <CustomerActionToast type={toast.type} name={toast.name} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
          <Users size={21} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-800 md:text-2xl">จัดการบัญชีผู้ใช้</h1>
          <p className="mt-0.5 text-xs text-slate-400 md:text-sm">
            ค้นหา ตรวจสอบข้อมูล และจัดการสถานะบัญชีลูกค้าในระบบ EasyPrint
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {loadError && (
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-red-50 text-red-600 border border-red-200 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span className="flex-1 min-w-0">{loadError}</span>
          <button
            onClick={fetchCustomers}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-red-200 text-xs font-semibold hover:bg-red-100 transition"
          >
            <RefreshCw size={13} /> ลองใหม่
          </button>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">ลูกค้าทั้งหมด</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{data ? stats.total.toLocaleString() : "-"}</p>
          <p className="text-[11px] text-slate-400">บัญชีลูกค้าในระบบ</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">ใช้งานปกติ</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{data ? stats.active.toLocaleString() : "-"}</p>
          <p className="text-[11px] text-slate-400">เข้าสู่ระบบและสั่งงานได้</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">ระงับการใช้งาน</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
              <UserX size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-500">{data ? stats.suspended.toLocaleString() : "-"}</p>
          <p className="text-[11px] text-slate-400">ถูกแอดมินระงับบัญชี</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              maxLength={100}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="ค้นหาชื่อ-นามสกุล, อีเมล, เบอร์โทร..."
              aria-label="ค้นหาบัญชีลูกค้า"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                aria-label="ล้างคำค้นหา"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter);
              setPage(1);
            }}
            aria-label="กรองตามสถานะบัญชี"
            className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="active">ใช้งานปกติ</option>
            <option value="suspended">ระงับการใช้งาน</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1 border-t border-slate-100">
          <span>
            {pagination
              ? `แสดง ${pagination.total.toLocaleString()} บัญชีจากทั้งหมด ${stats.total.toLocaleString()} บัญชี`
              : "กำลังโหลด..."}
          </span>
          {(search || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setPage(1);
              }}
              className="text-orange-600 hover:underline cursor-pointer"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* Main Customers Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading && !data ? (
          <div className="divide-y divide-slate-100" aria-live="polite" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Users size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-700 font-medium text-base">
              {loadError && !data
                ? "ไม่สามารถแสดงรายการบัญชีลูกค้าได้"
                : hasFilter
                  ? "ไม่พบบัญชีลูกค้าตรงตามเงื่อนไข"
                  : "ยังไม่มีบัญชีลูกค้าในระบบ"}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              {loadError && !data
                ? "กดปุ่ม \"ลองใหม่\" ด้านบนเพื่อโหลดข้อมูลอีกครั้ง"
                : hasFilter
                  ? "ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองสถานะใหม่อีกครั้ง"
                  : "บัญชีลูกค้าจะแสดงที่นี่เมื่อมีผู้สมัครสมาชิก"}
            </p>
          </div>
        ) : (
          <div className={`overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">ลูกค้า</th>
                  <th className="py-3.5 px-4">ติดต่อ</th>
                  <th className="py-3.5 px-4">วันที่สมัคร</th>
                  <th className="py-3.5 px-4 text-center">คำสั่งซื้อ</th>
                  <th className="py-3.5 px-4">สถานะ</th>
                  <th className="py-3.5 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {customers.map((customer, idx) => {
                  const isDropUp = idx >= Math.max(1, customers.length - 3);
                  const name = customerFullName(customer);
                  return (
                    <tr key={customer.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-5">
                        <button
                          type="button"
                          onClick={() => setDetailId(customer.id)}
                          className="flex items-center gap-3 text-left cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 font-bold flex items-center justify-center shrink-0 shadow-xs">
                            {customer.firstname[0]}
                          </div>
                          <p className="font-semibold text-slate-800 text-sm truncate max-w-[12rem] hover:text-orange-600" title={name}>
                            {name}
                          </p>
                        </button>
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-0.5 text-xs text-slate-500">
                          <p className="flex items-center gap-1 truncate max-w-[16rem]" title={customer.email}>
                            <Mail size={12} className="shrink-0" /> {customer.email}
                          </p>
                          <p className="flex items-center gap-1">
                            <Phone size={12} className="shrink-0" /> {customer.phone || "-"}
                          </p>
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <p className="text-xs text-slate-700">{formatThaiDate(customer.createdAt)}</p>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="text-sm font-semibold text-slate-700">{customer.orderCount.toLocaleString()}</span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <CustomerStatusBadge status={customer.status} />
                      </td>

                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="relative inline-block admin-action-menu">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdown(openDropdown === customer.id ? null : customer.id);
                            }}
                            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition flex items-center gap-1 cursor-pointer"
                            title="จัดการ"
                            aria-label={`จัดการบัญชี ${name}`}
                          >
                            <MoreHorizontal size={16} />
                          </button>

                          {openDropdown === customer.id && (
                            <div
                              className={`absolute right-0 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden py-1 min-w-[12rem] ${isDropUp ? "bottom-full" : "top-full"}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setDetailId(customer.id);
                                  setOpenDropdown(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition text-left cursor-pointer"
                              >
                                <Eye size={14} className="text-slate-400" />
                                ดูรายละเอียดบัญชี
                              </button>

                              {customer.status === "active" ? (
                                <button
                                  type="button"
                                  onClick={() => openActionModal(customer, "suspend")}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-amber-700 hover:bg-amber-50 transition text-left cursor-pointer"
                                >
                                  <CirclePause size={14} className="text-amber-500" />
                                  ระงับการใช้งานบัญชี
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openActionModal(customer, "reinstate")}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition text-left cursor-pointer"
                                >
                                  <CheckCircle2 size={14} className="text-emerald-500" />
                                  เปิดใช้งานบัญชีอีกครั้ง
                                </button>
                              )}

                              <div className="border-t border-slate-100 my-1" />

                              <button
                                type="button"
                                onClick={() => openDeleteModal(customer)}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition text-left cursor-pointer"
                              >
                                <Trash2 size={14} className="text-rose-500" />
                                ลบบัญชี
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
        {pagination && pagination.totalPages > 1 && customers.length > 0 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/50">
            <span className="text-xs text-slate-500">
              หน้า {pagination.page} จาก {pagination.totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
                aria-label="หน้าก่อนหน้า"
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page >= pagination.totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                aria-label="หน้าถัดไป"
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {mounted && (
        <>
          {/* MODAL 1: Detail */}
          {detailId && (
            <CustomerDetailModal
              customerId={detailId}
              onClose={() => setDetailId(null)}
              onSuspend={(c) => openActionModal(c, "suspend")}
              onReinstate={(c) => openActionModal(c, "reinstate")}
              onDelete={openDeleteModal}
            />
          )}

          {/* MODAL 2: Suspend / Reinstate */}
          {actionModal &&
            createPortal(
              <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fadeIn"
                onClick={() => !actionLoading && setActionModal(null)}
              >
                <div
                  role="dialog"
                  aria-modal="true"
                  className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4 text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
                      actionModal.action === "suspend" ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                    }`}
                  >
                    {actionModal.action === "suspend" ? <CirclePause size={32} /> : <CheckCircle2 size={32} />}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-800">
                      {actionModal.action === "suspend" ? "ยืนยันการระงับบัญชี" : "ยืนยันการเปิดใช้งานบัญชี"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      คุณต้องการ{actionModal.action === "suspend" ? "ระงับการใช้งาน" : "เปิดใช้งานอีกครั้งให้"}บัญชี{" "}
                      <span className="font-semibold text-slate-800">"{customerFullName(actionModal.customer)}"</span> ใช่หรือไม่?
                    </p>
                  </div>

                  {actionModal.action === "suspend" && (
                    <>
                      <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-left leading-relaxed">
                        ลูกค้าจะถูกออกจากระบบทันทีและเข้าสู่ระบบไม่ได้จนกว่าจะเปิดใช้งานอีกครั้ง — คำสั่งซื้อเดิมยังอยู่ครบ
                        ร้านค้ายังดำเนินการต่อได้ตามปกติ
                      </p>
                      {activeOrderCount !== null && activeOrderCount > 0 && (
                        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-left font-medium">
                          ⚠️ ลูกค้ารายนี้มีคำสั่งซื้อที่ยังไม่เสร็จสิ้น {activeOrderCount} รายการ
                          ระหว่างถูกระงับลูกค้าจะติดตามสถานะหรือแชทกับร้านไม่ได้
                        </p>
                      )}
                      <div className="text-left space-y-1.5 pt-1">
                        <label htmlFor="suspend-reason" className="text-xs font-semibold text-slate-700 block">
                          เหตุผลในการระงับการใช้งาน <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          id="suspend-reason"
                          rows={3}
                          maxLength={500}
                          value={suspendReason}
                          onChange={(e) => {
                            setSuspendReason(e.target.value);
                            setActionError("");
                          }}
                          placeholder="กรอกเหตุผล เช่น ใช้งานผิดเงื่อนไขบริการ, แนบสลิปปลอมซ้ำหลายครั้ง..."
                          className={`w-full text-xs p-3 rounded-xl border ${
                            actionError ? "border-rose-500 bg-rose-50/50" : "border-slate-200 bg-slate-50"
                          } focus:outline-none focus:border-rose-500 focus:bg-white transition resize-none`}
                        />
                      </div>
                    </>
                  )}

                  {actionError && <p className="text-[11px] text-rose-500 font-medium text-left">{actionError}</p>}

                  <div className="flex items-center justify-center gap-3 pt-3">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => setActionModal(null)}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition disabled:opacity-50"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleConfirmAction}
                      className={`px-5 py-2 rounded-xl text-white text-xs font-semibold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                        actionModal.action === "suspend"
                          ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                          : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                      }`}
                    >
                      {actionLoading && <Spinner size="sm" />}
                      <span>{actionLoading ? "กำลังดำเนินการ..." : "ยืนยันทำรายการ"}</span>
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}

          {/* MODAL 3: Delete */}
          {deleteModal &&
            createPortal(
              <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fadeIn"
                onClick={() => !deleteLoading && setDeleteModal(null)}
              >
                <div
                  role="dialog"
                  aria-modal="true"
                  className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 space-y-4 text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
                      deleteBlocked ? "bg-amber-100" : "bg-rose-100"
                    }`}
                  >
                    {deleteBlocked ? (
                      <AlertCircle size={28} className="text-amber-600" />
                    ) : (
                      <Trash2 size={28} className="text-rose-600" />
                    )}
                  </div>

                  {deleteBlocked ? (
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-bold text-slate-800">ไม่สามารถลบบัญชีนี้ได้</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        บัญชี <span className="font-semibold text-slate-800">"{customerFullName(deleteModal)}"</span> มีประวัติคำสั่งซื้อ{" "}
                        {deleteModal.orderCount.toLocaleString()} รายการผูกอยู่ ซึ่งต้องเก็บไว้เป็นประวัติของร้านค้า
                      </p>
                      <p className="text-[11px] text-amber-700 font-medium bg-amber-50 rounded-xl px-3 py-2">
                        หากต้องการหยุดการใช้งานบัญชีนี้ ให้ใช้ "ระงับการใช้งานบัญชี" แทน
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-bold text-slate-800">ยืนยันการลบบัญชี</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        คุณต้องการลบบัญชี <span className="font-semibold text-slate-800">"{customerFullName(deleteModal)}"</span>{" "}
                        ออกจากระบบใช่หรือไม่? ตะกร้าสินค้า ที่อยู่ที่บันทึกไว้ และการแจ้งเตือนของบัญชีนี้จะถูกลบไปด้วย
                      </p>
                      <p className="text-[11px] text-rose-500 font-medium bg-rose-50 rounded-xl px-3 py-2">
                        ⚠️ การดำเนินการนี้ไม่สามารถย้อนกลับได้
                      </p>
                    </div>
                  )}

                  {deleteError && <p className="text-[11px] text-rose-500 font-medium">{deleteError}</p>}

                  <div className="flex items-center justify-center gap-3 pt-1">
                    <button
                      type="button"
                      disabled={deleteLoading}
                      onClick={() => setDeleteModal(null)}
                      className="px-5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition disabled:opacity-50"
                    >
                      {deleteBlocked ? "ปิดหน้าต่าง" : "ยกเลิก"}
                    </button>
                    {deleteBlocked && deleteModal.status === "active" && (
                      <button
                        type="button"
                        onClick={() => {
                          const target = deleteModal;
                          setDeleteModal(null);
                          openActionModal(target, "suspend");
                        }}
                        className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-md shadow-amber-500/20 transition flex items-center gap-1.5"
                      >
                        <CirclePause size={13} /> ระงับบัญชีแทน
                      </button>
                    )}
                    {!deleteBlocked && (
                      <button
                        type="button"
                        disabled={deleteLoading}
                        onClick={handleConfirmDelete}
                        className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {deleteLoading && <Spinner size="sm" />}
                        <span>{deleteLoading ? "กำลังลบ..." : "ยืนยันลบบัญชี"}</span>
                      </button>
                    )}
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
