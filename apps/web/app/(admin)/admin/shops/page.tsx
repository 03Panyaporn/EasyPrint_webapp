"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, ChevronLeft, ChevronRight, Filter, Calendar, Loader2 } from "lucide-react";
import { type MockShop, type ShopStatus } from "@/lib/mock/adminShops";
import { listAdminShops, approveShop, rejectShop } from "@/lib/api/admin";
import { toMockShop } from "@/lib/adminShopAdapter";
import { ApiError } from "@/lib/api/client";
import ShopStatusBadge from "@/components/admin/shops/ShopStatusBadge";
import ActionMenu from "@/components/admin/shops/ActionMenu";
import DocumentViewer from "@/components/admin/shops/DocumentViewer";
import ApproveModal from "@/components/admin/shops/ApproveModal";
import RejectModal from "@/components/admin/shops/RejectModal";
import NotificationToast, { type ToastType } from "@/components/admin/shops/NotificationToast";

// ─── Constants ───────────────────────────────────────────
const PAGE_SIZE = 5;
const TABS: { label: string; status: ShopStatus | "all" }[] = [
  { label: "รอตรวจสอบ", status: "รอตรวจสอบ" },
  { label: "อนุมัติแล้ว", status: "อนุมัติแล้ว" },
  { label: "ไม่อนุมัติ", status: "ไม่อนุมัติ" },
];

type ModalType = "documents" | "approve" | "reject" | null;

export default function AdminShopsPage() {
  const router = useRouter();

  // ข้อมูลจริงจาก API (ไม่ใช่ mock แล้ว)
  const [shops, setShops] = useState<MockShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Active tab
  const [activeTab, setActiveTab] = useState<ShopStatus>("รอตรวจสอบ");

  // Search / filter
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");

  // Pagination
  const [page, setPage] = useState(1);

  // Modal state
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedShop, setSelectedShop] = useState<MockShop | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: ToastType; shopName: string } | null>(null);

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

  // ── Derived data ──────────────────────────────────────
  const tabCounts = useMemo(
    () => ({
      "รอตรวจสอบ": shops.filter((s) => s.status === "รอตรวจสอบ").length,
      "อนุมัติแล้ว": shops.filter((s) => s.status === "อนุมัติแล้ว").length,
      "ไม่อนุมัติ": shops.filter((s) => s.status === "ไม่อนุมัติ").length,
    }),
    [shops]
  );

  const filtered = useMemo(() => {
    let result = shops.filter((s) => s.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.ownerFirstname.toLowerCase().includes(q) ||
          s.ownerLastname.toLowerCase().includes(q)
      );
    }
    if (filterType) {
      result = result.filter((s) => s.shopType === filterType);
    }
    return result;
  }, [shops, activeTab, search, filterType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const allTypes = useMemo(
    () => [...new Set(shops.map((s) => s.shopType))],
    [shops]
  );

  // ── Handlers ──────────────────────────────────────────
  const openModal = useCallback((type: ModalType, shop: MockShop) => {
    setSelectedShop(shop);
    setModalType(type);
  }, []);

  const closeModal = useCallback(() => {
    setModalType(null);
    setSelectedShop(null);
  }, []);

  const handleApprove = useCallback(async () => {
    if (!selectedShop) return;
    try {
      await approveShop(selectedShop.id);
      setToast({ type: "approve", shopName: selectedShop.name });
      setPage(1);
      await fetchShops();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : "อนุมัติร้านค้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  }, [selectedShop, fetchShops]);

  const handleReject = useCallback(
    async (reason: string) => {
      if (!selectedShop) return;
      try {
        await rejectShop(selectedShop.id, { reason });
        setToast({ type: "reject", shopName: selectedShop.name });
        setPage(1);
        await fetchShops();
      } catch (err) {
        window.alert(err instanceof ApiError ? err.message : "ปฏิเสธร้านค้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      }
    },
    [selectedShop, fetchShops]
  );

  const handleTabChange = (status: ShopStatus) => {
    setActiveTab(status);
    setPage(1);
    setSearch("");
    setFilterType("");
  };

  // ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ตรวจสอบร้านค้า</h1>
        <p className="text-sm text-gray-500 mt-1">
          ตรวจสอบรายชื่อร้านค้าที่รอการตรวจสอบ สามารถค้นหา กรอง และจัดการได้
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 pt-4 gap-1">
          {TABS.map((tab) => {
            const count = tabCounts[tab.status as ShopStatus];
            const active = activeTab === tab.status;
            return (
              <button
                key={tab.status}
                onClick={() => handleTabChange(tab.status as ShopStatus)}
                className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors ${
                  active
                    ? "text-orange-600 bg-orange-50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab.label}
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                    active ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {count}
                </span>
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 px-6 py-4 border-b border-gray-100">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="ค้นหาร้าน, ชื่อ, อีเมล"
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
            />
          </div>

          {/* Shop type filter */}
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              className="pl-8 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all appearance-none cursor-pointer text-gray-700"
            >
              <option value="">ประเภทร้านค้า</option>
              {allTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Clear filters */}
          {(search || filterType) && (
            <button
              onClick={() => { setSearch(""); setFilterType(""); setPage(1); }}
              className="text-xs text-orange-500 font-semibold hover:underline self-center"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">ร้านค้า</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">ประเภทร้านค้า</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">ผู้มอบ</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">วันที่สมัคร</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">เอกสาร</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">สถานะ</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-gray-400 text-sm">
                    <Loader2 size={20} className="inline-block animate-spin mr-2" />
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-sm">
                    <p className="text-red-500 mb-2">{loadError}</p>
                    <button
                      onClick={fetchShops}
                      className="text-orange-500 font-semibold hover:underline"
                    >
                      ลองใหม่อีกครั้ง
                    </button>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-gray-400 text-sm">
                    ไม่พบข้อมูลร้านค้า
                  </td>
                </tr>
              ) : (
                paginated.map((shop) => (
                  <ShopRow
                    key={shop.id}
                    shop={shop}
                    onViewDetail={() => router.push(`/admin/shops/${shop.id}`)}
                    onViewDocuments={() => openModal("documents", shop)}
                    onApprove={() => openModal("approve", shop)}
                    onReject={() => openModal("reject", shop)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              แสดง {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–
              {Math.min(page * PAGE_SIZE, filtered.length)} จาก {filtered.length} รายการ
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${
                    p === page
                      ? "bg-orange-500 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modalType === "documents" && selectedShop && (
        <DocumentViewer shop={selectedShop} onClose={closeModal} />
      )}
      {modalType === "approve" && selectedShop && (
        <ApproveModal
          shopName={selectedShop.name}
          onConfirm={handleApprove}
          onClose={closeModal}
        />
      )}
      {modalType === "reject" && selectedShop && (
        <RejectModal
          shopName={selectedShop.name}
          onConfirm={handleReject}
          onClose={closeModal}
        />
      )}

      {/* Toast */}
      {toast && (
        <NotificationToast
          type={toast.type}
          shopName={toast.shopName}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

// ─── Shop Row ─────────────────────────────────────────────
function ShopRow({
  shop,
  onViewDetail,
  onViewDocuments,
  onApprove,
  onReject,
}: {
  shop: MockShop;
  onViewDetail: () => void;
  onViewDocuments: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const initials = shop.name.slice(0, 2).toUpperCase();
  const colors = [
    "bg-orange-500",
    "bg-teal-500",
    "bg-purple-500",
    "bg-blue-500",
    "bg-rose-500",
  ];
  const color = colors[shop.id.charCodeAt(shop.id.length - 1) % colors.length];

  return (
    <tr className="hover:bg-gray-50/60 transition-colors group">
      {/* Shop name + email + phone */}
      <td className="px-6 py-4">
        <button
          onClick={onViewDetail}
          className="flex items-center gap-3 text-left group/name"
        >
          <div
            className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm`}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate group-hover/name:text-orange-600 transition-colors">
              {shop.name}
            </p>
            <p className="text-xs text-gray-500 truncate">{shop.email}</p>
            <p className="text-xs text-gray-400">{shop.phone}</p>
          </div>
        </button>
      </td>

      {/* Type */}
      <td className="px-4 py-4 hidden md:table-cell">
        <span className="text-sm text-gray-700">{shop.shopType}</span>
      </td>

      {/* Owner */}
      <td className="px-4 py-4 hidden lg:table-cell">
        <span className="text-sm text-gray-700">
          {shop.ownerFirstname} {shop.ownerLastname}
        </span>
      </td>

      {/* Date */}
      <td className="px-4 py-4 hidden lg:table-cell">
        <span className="text-sm text-gray-600">{shop.submitDate}</span>
      </td>

      {/* Documents */}
      <td className="px-4 py-4">
        <button
          onClick={onViewDocuments}
          className="flex items-center gap-1.5 text-gray-600 hover:text-orange-600 transition-colors"
        >
          <FileText size={15} className="shrink-0" />
          <span className="text-sm font-semibold">{shop.docCount}</span>
        </button>
      </td>

      {/* Status */}
      <td className="px-4 py-4">
        <ShopStatusBadge status={shop.status} />
      </td>

      {/* Action menu */}
      <td className="px-4 py-4 text-right">
        <ActionMenu
          shopId={shop.id}
          shopStatus={shop.status}
          onViewDetail={onViewDetail}
          onViewDocuments={onViewDocuments}
          onApprove={onApprove}
          onReject={onReject}
        />
      </td>
    </tr>
  );
}
