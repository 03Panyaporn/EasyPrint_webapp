"use client";

import { useState } from "react";
import { ShoppingBag, CheckCircle } from "lucide-react";
import OrderStatusCards from "@/components/shop/orders/OrderStatusCards";
import OrdersTable from "@/components/shop/orders/OrdersTable";
import UpdateStatusModal from "@/components/shop/orders/UpdateStatusModal";
import CancelOrderModal from "@/components/shop/orders/CancelOrderModal";
import OrderDetailModal from "@/components/shop/orders/OrderDetailModal";
import FilePreviewLightbox from "@/components/shop/orders/FilePreviewLightbox";
import PdfViewerLightbox from "@/components/shop/orders/PdfViewerLightbox";
import { CancelModalMode, CancelReason, Order, OrderStatus } from "@/components/shop/orders/types";
import { initialOrders } from "@/lib/mock-data/orders-mock";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
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

  const filteredOrders = activeStatus
    ? orders.filter((o) => o.status === activeStatus)
    : orders;

  // ── Update status flow ─────────────────────────
  const handleAdvanceStatus = (order: Order, nextStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: nextStatus } : o))
    );
    setStatusModalOrder(null);
    showToast(`อัปเดตสถานะออเดอร์ ${order.code} เรียบร้อยแล้ว`);
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

  const handleConfirmCancel = (order: Order, reason: string, note: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id
          ? {
              ...o,
              status: "cancelled",
              cancelReason: reason as CancelReason,
              cancelNote: note || undefined,
            }
          : o
      )
    );
    setCancelModal(null);
    showToast(
      cancelModal?.mode === "reject_payment"
        ? `ปฏิเสธการชำระเงินออเดอร์ ${order.code} เรียบร้อยแล้ว`
        : `ยกเลิกออเดอร์ ${order.code} เรียบร้อยแล้ว`
    );
  };

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
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-200">
          <ShoppingBag size={20} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          รายการคำสั่งซื้อ
        </h1>
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
