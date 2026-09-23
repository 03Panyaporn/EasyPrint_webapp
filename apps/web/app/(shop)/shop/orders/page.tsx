"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ShoppingBag, CheckCircle, RefreshCw } from "lucide-react";
import OrderStatusCards from "@/components/shop/orders/OrderStatusCards";
import OrdersTable from "@/components/shop/orders/OrdersTable";
import UpdateStatusModal from "@/components/shop/orders/UpdateStatusModal";
import CancelOrderModal from "@/components/shop/orders/CancelOrderModal";
import OrderDetailModal from "@/components/shop/orders/OrderDetailModal";
import FilePreviewLightbox from "@/components/shop/orders/FilePreviewLightbox";
import PdfViewerLightbox from "@/components/shop/orders/PdfViewerLightbox";
import { CancelModalMode, CancelReason, Order, OrderStatus } from "@/components/shop/orders/types";
import { getMyShop } from "@/lib/api/services";
import { listShopOrders, updateOrderStatus } from "@/lib/api/orders";
import { toOrder } from "@/lib/ordersAdapter";
import { ApiError } from "@/lib/api/client";
import { Skeleton, SkeletonRow } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { mergeStatusFields } from "@/lib/ordersAdapter";

export default function OrdersPage() {
  const [shopId, setShopId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [activeStatus, setActiveStatus] = useState<OrderStatus | null>(null);

  const [statusModalOrder, setStatusModalOrder] = useState<Order | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [cancelModal, setCancelModal] = useState<{ order: Order; mode: CancelModalMode } | null>(
    null
  );
  const [previewFile, setPreviewFile] = useState<{ order: Order; kind: "file" | "slip" } | null>(
    null
  );

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const showApiError = (err: unknown, fallback: string) => {
    window.alert(err instanceof ApiError ? err.message : fallback);
  };

  // ── โหลดข้อมูลจริงตอนเข้าหน้า ────────────────
  const loadOrders = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setIsRefreshing(true);
    setLoadError("");
    try {
      const { shop } = await getMyShop();
      setShopId(shop.id);
      const { orders: apiOrders } = await listShopOrders(shop.id);
      setOrders(apiOrders.map(toOrder));
    } catch (err) {
      if (!isSilent) setLoadError(err instanceof ApiError ? err.message : "โหลดข้อมูลออเดอร์ไม่สำเร็จ");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(() => {
      loadOrders(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  // เปิดรายละเอียดออเดอร์จากลิงก์ในแจ้งเตือน (/shop/orders?orderId=...) ครั้งเดียวหลังโหลดรายการเสร็จ
  // อ่านจาก window.location แทน useSearchParams เพื่อไม่ต้องห่อทั้งหน้าด้วย Suspense
  const openedFromLinkRef = useRef(false);
  useEffect(() => {
    if (openedFromLinkRef.current || orders.length === 0) return;
    const linkedId = new URLSearchParams(window.location.search).get("orderId");
    if (!linkedId) return;
    const linked = orders.find((o) => o.id === linkedId);
    if (linked) {
      setDetailOrder(linked);
      openedFromLinkRef.current = true;
    }
  }, [orders]);

  const filteredOrders = activeStatus
    ? orders.filter((o) => o.status === activeStatus)
    : orders;

  // ── Update status flow ─────────────────────────
  const handleAdvanceStatus = async (order: Order, nextStatus: OrderStatus) => {
    try {
      const { order: updated } = await updateOrderStatus(order.id, { status: nextStatus });
      // ใช้ค่าจริงที่ API ตอบกลับ (สถานะ/เวลาที่จบ) — response ไม่มี items แนบมา จึง merge เฉพาะฟิลด์สถานะ ไม่แทนทั้งก้อน
      setOrders((prev) => prev.map((o) => (o.id === order.id ? mergeStatusFields(o, updated) : o)));
      setStatusModalOrder(null);
      showToast(`อัปเดตสถานะออเดอร์ ${order.code} เรียบร้อยแล้ว`);
    } catch (err) {
      showApiError(err, "อัปเดตสถานะไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleOpenCancelFromStatus = (order: Order) => {
    setStatusModalOrder(null);
    setCancelModal({ order, mode: "cancel" });
  };

  const handleOpenRejectPayment = (order: Order) => {
    setStatusModalOrder(null);
    setCancelModal({ order, mode: "reject_payment" });
  };

  const handleConfirmPaymentFromPreview = (order: Order) => {
    handleAdvanceStatus(order, "accepted");
    setPreviewFile(null);
  };

  const handleRejectPaymentFromPreview = (order: Order) => {
    setPreviewFile(null);
    handleOpenRejectPayment(order);
  };

  const handleConfirmCancel = async (order: Order, reason: string, note: string) => {
    const mode = cancelModal?.mode;
    try {
      const { order: updated } = await updateOrderStatus(order.id, {
        status: "cancelled",
        cancelReason: reason as CancelReason,
        cancelNote: note || undefined,
      });
      // เหตุผล/หมายเหตุการยกเลิกต้องขึ้นใน modal รายละเอียดทันที ไม่ต้องรอ poll รอบถัดไป
      setOrders((prev) => prev.map((o) => (o.id === order.id ? mergeStatusFields(o, updated) : o)));
      setCancelModal(null);
      showToast(
        mode === "reject_payment"
          ? `ปฏิเสธการชำระเงินออเดอร์ ${order.code} เรียบร้อยแล้ว`
          : `ยกเลิกออเดอร์ ${order.code} เรียบร้อยแล้ว`
      );
    } catch (err) {
      showApiError(err, "ดำเนินการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-12" aria-live="polite" aria-busy="true">
        {/* Page Heading */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-200">
              <ShoppingBag size={20} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              รายการคำสั่งซื้อ
            </h1>
          </div>
        </div>

        {/* Status Summary Cards skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-4 w-10" />
              </div>
            </div>
          ))}
        </div>

        {/* Orders table skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_32px_-12px_rgba(0,0,0,0.12),inset_0_1px_0_0_rgba(255,255,255,0.8)] overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !shopId) {
    return (
      <div className="space-y-6 pb-12">
        {/* Page Heading */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-200">
              <ShoppingBag size={20} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              รายการคำสั่งซื้อ
            </h1>
          </div>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center border-2 border-dashed border-red-200 space-y-2">
          <p className="text-red-500 font-semibold text-sm sm:text-base">
            {loadError || "ไม่พบร้านค้าของบัญชีนี้"}
          </p>
          <button
            onClick={() => loadOrders()}
            className="inline-flex items-center gap-1.5 text-orange-500 font-bold text-xs sm:text-sm hover:text-orange-600 transition-colors"
          >
            <RefreshCw size={14} />
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gray-900 text-white text-sm rounded-xl shadow-xl animate-fade-in border border-gray-700">
          <CheckCircle size={18} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Heading */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-200">
            <ShoppingBag size={20} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            รายการคำสั่งซื้อ
          </h1>
          {isRefreshing && (
            <span className="flex items-center gap-1.5 text-xs text-gray-400 font-medium" aria-live="polite">
              <Spinner size="sm" />
              กำลังอัปเดต...
            </span>
          )}
        </div>
      </div>

      {/* Status Summary Cards */}
      <OrderStatusCards
        orders={orders}
        activeStatus={activeStatus}
        onSelectStatus={setActiveStatus}
      />

      {/* Orders Table */}
      <OrdersTable
        orders={filteredOrders}
        onOpenStatusModal={setStatusModalOrder}
        onOpenDetail={setDetailOrder}
        onPreviewFile={(order, kind) => setPreviewFile({ order, kind })}
      />

      {/* Update Status Modal */}
      <UpdateStatusModal
        order={statusModalOrder}
        isOpen={!!statusModalOrder}
        onClose={() => setStatusModalOrder(null)}
        onAdvance={handleAdvanceStatus}
        onRejectPayment={handleOpenRejectPayment}
        onCancelOrder={handleOpenCancelFromStatus}
        onPreviewFile={(order, kind) => setPreviewFile({ order, kind })}
      />

      {/* Cancel / Reject Payment Modal */}
      <CancelOrderModal
        order={cancelModal?.order ?? null}
        mode={cancelModal?.mode ?? "cancel"}
        isOpen={!!cancelModal}
        onClose={() => setCancelModal(null)}
        onConfirm={handleConfirmCancel}
      />

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={detailOrder}
        isOpen={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        onPreviewFile={(order, kind) => setPreviewFile({ order, kind })}
      />

      {/* ไฟล์งานที่เป็น PDF ใช้ viewer แบบเต็ม ส่วนสลิป/รูปภาพใช้ lightbox ตัวอย่างธรรมดา */}
      {previewFile?.kind === "file" && previewFile.order.file.type === "pdf" ? (
        <PdfViewerLightbox order={previewFile.order} onClose={() => setPreviewFile(null)} />
      ) : (
        <FilePreviewLightbox
          order={previewFile?.order ?? null}
          kind={previewFile?.kind ?? null}
          onClose={() => setPreviewFile(null)}
          onConfirmPayment={handleConfirmPaymentFromPreview}
          onRejectPayment={handleRejectPaymentFromPreview}
        />
      )}
    </div>
  );
}
