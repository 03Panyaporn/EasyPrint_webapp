import type { OrderStatus, CancelReason, DeliveryMethod } from "@easyprint/shared";
import { apiFetch } from "./client";

export type ApiOrderItem = {
  id: string;
  serviceName: string;
  pricingType: string;
  baseRate: number;
  colorTierLabel: string | null;
  colorTierPrice: number | null;
  quantity: number;
  pageCount: number | null;
  widthCm: number | null;
  heightCm: number | null;
  optionsSnapshot: Array<{
    optionName: string;
    valueName?: string | null;
    textValue?: string | null;
    extraPrice: number;
    priceScope: string;
  }>;
  addOnsSnapshot: Array<{
    name: string;
    extraPrice: number;
    scope: string;
  }>;
  itemSubtotal: number;
  fileUrl: string | null;
  note: string | null;
};

export type ApiOrder = {
  id: string;
  code: string;
  ref: string;
  shopId: string;
  shopName?: string;
  customerId: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  // Schema v1 fields (legacy)
  serviceType: string | null;
  pages: number | null;
  copies: number | null;
  colorMode: string | null;
  paperSize: string | null;
  binding: boolean | null;
  lamination: boolean | null;
  selectedAddOns: string[];
  fileUrl: string | null;
  // Schema v2 fields (snapshot)
  subtotal: number | null;
  shippingFee: number | null;
  totalPrice: number; // บาท
  items?: ApiOrderItem[];
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

export function getCustomerOrders() {
  return apiFetch<{ orders: ApiOrder[] }>("/customers/orders");
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
