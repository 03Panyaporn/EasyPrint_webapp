"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
import OrdersTable from "../orders/OrdersTable";
import UpdateStatusModal from "@/components/shop/orders/UpdateStatusModal";
import CancelOrderModal from "@/components/shop/orders/CancelOrderModal";
import OrderDetailModal from "@/components/shop/orders/OrderDetailModal";
import FilePreviewLightbox from "@/components/shop/orders/FilePreviewLightbox";
import PdfViewerLightbox from "@/components/shop/orders/PdfViewerLightbox";
import { CancelModalMode, CancelReason, Order, OrderStatus } from "../orders/types";
import { getMyShop } from "@/lib/api/services";
import { listShopOrders, updateOrderStatus } from "@/lib/api/orders";
import { toOrder } from "@/lib/ordersAdapter";
import { ApiError } from "@/lib/api/client";
import { CheckCircle } from "lucide-react";

export default function LatestOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [statusModalOrder, setStatusModalOrder] = useState<Order | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [cancelModal, setCancelModal] = useState<{ order: Order; mode: CancelModalMode } | null>(null);
  const [previewFile, setPreviewFile] = useState<{ order: Order; kind: "file" | "slip" } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const showApiError = (err: unknown, fallback: string) => {
    window.alert(err instanceof ApiError ? err.message : fallback);
  };

  // Action Handlers
  const handleAdvanceStatus = async (order: Order, nextStatus: OrderStatus) => {
    try {
      await updateOrderStatus(order.id, { status: nextStatus });
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: nextStatus } : o)));
      setStatusModalOrder(null);
      showToast(`อัปเดตสถานะออเดอร์ ${order.code} เรียบร้อยแล้ว`);
      window.dispatchEvent(new Event("order-status-updated"));
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
      await updateOrderStatus(order.id, {
        status: "cancelled",
        cancelReason: reason as CancelReason,
        cancelNote: note || undefined,
      });
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: "cancelled" } : o)));
      setCancelModal(null);
      showToast(
        mode === "reject_payment"
          ? `ปฏิเสธการชำระเงินออเดอร์ ${order.code} เรียบร้อยแล้ว`
          : `ยกเลิกออเดอร์ ${order.code} เรียบร้อยแล้ว`
      );
      window.dispatchEvent(new Event("order-status-updated"));
    } catch (err) {
      showApiError(err, "ดำเนินการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const { shop } = await getMyShop();
        const { orders: apiOrders } = await listShopOrders(shop.id);
        const mappedOrders = apiOrders.map(toOrder);
        
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        // กรองเฉพาะออเดอร์ของวันนี้
        const todayOrders = mappedOrders.filter(o => o.createdAt.startsWith(todayStr));
        
        // เลือกมาไม่เกิน 5 ออเดอร์แรก (ล่าสุดของวันนี้)
        setOrders(todayOrders.slice(0, 5));
      } catch (err) {
        console.error("Failed to load latest orders:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="relative">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gray-900 text-white text-sm rounded-xl shadow-xl animate-fade-in border border-gray-700">
          <CheckCircle size={18} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 z-10 bg-white/50 flex items-center justify-center rounded-2xl">
          <Loader2 size={24} className="animate-spin text-orange-500" />
        </div>
      )}
      <OrdersTable 
        orders={orders}
        onOpenStatusModal={setStatusModalOrder}
        onOpenDetail={setDetailOrder}
        onPreviewFile={(order, kind) => setPreviewFile({ order, kind })}
        title="คำสั่งซื้อล่าสุด"
        headerAction={
          <Link 
            href="/shop/orders" 
            className="text-xs font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            ดูทั้งหมด <ChevronRight size={14} />
          </Link>
        }
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

      {/* ไฟล์งาน/สลิป */}
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
