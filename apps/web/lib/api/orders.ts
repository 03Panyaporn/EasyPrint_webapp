import type { OrderStatus, CancelReason, DeliveryMethod } from "@easyprint/shared";
import { apiFetch } from "./client";

export type ApiOrder = {
  id: string;
  code: string;
  ref: string;
  shopId: string;
  customerId: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  serviceType: string;
  pages: number;
  copies: number;
  colorMode: string;
  paperSize: string;
  binding: boolean;
  lamination: boolean;
  selectedAddOns: string[];
  fileUrl: string | null;
  cartSnapshot?: unknown; // รายละเอียดเต็มของแต่ละรายการตอน checkout จากตะกร้า (มีเฉพาะออเดอร์ที่มาจาก POST /shops/:shopId/cart/checkout)
  totalPrice: number; // หน่วยสตางค์
  status: OrderStatus;
  note?: string;
  delivery: { method: DeliveryMethod; address?: string };
  slipUrl: string;
  slipUploadedAt: string | null;
  cancelReason?: CancelReason;
  cancelNote?: string;
  createdAt: string;
};

export function listShopOrders(shopId: string, status?: OrderStatus) {
  const query = status ? `?status=${status}` : "";
  return apiFetch<{ orders: ApiOrder[] }>(`/shops/${shopId}/orders${query}`);
}

export function getOrder(id: string) {
  return apiFetch<{ order: ApiOrder }>(`/orders/${id}`);
}

export function updateOrderStatus(
  id: string,
  input: { status: OrderStatus; cancelReason?: CancelReason; cancelNote?: string }
) {
  return apiFetch<{ order: ApiOrder }>(`/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
