"use client";

import { useCallback, useEffect, useState } from "react";
import { ShoppingBag, CheckCircle, Loader2, RefreshCw } from "lucide-react";
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

  const filteredOrders = activeStatus
    ? orders.filter((o) => o.status === activeStatus)
    : orders;

  // ── Update status flow ─────────────────────────
  const handleAdvanceStatus = async (order: Order, nextStatus: OrderStatus) => {
    try {
      const { order: updated } = await updateOrderStatus(order.id, { status: nextStatus });
      setOrders((prev) => prev.map((o) => (o.id === order.id ? toOrder(updated) : o)));
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
      setOrders((prev) => prev.map((o) => (o.id === order.id ? toOrder(updated) : o)));
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-gray-400">
        <Loader2 size={24} className="animate-spin" />
        <p className="text-sm">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (loadError || !shopId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-4">
        <p className="text-sm text-red-500 font-semibold">{loadError || "ไม่พบร้านค้าของบัญชีนี้"}</p>
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
        </div>

        <button
          onClick={() => loadOrders(true)}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition shadow-xs disabled:opacity-50"
        >
          <RefreshCw size={13} className={isRefreshing ? "animate-spin text-orange-500" : ""} />
          <span>{isRefreshing ? "กำลังอัปเดต..." : "รีเฟรชออเดอร์"}</span>
        </button>
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
