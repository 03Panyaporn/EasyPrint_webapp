import type { AddCartItemInput, UpdateCartItemInput, SetCartDeliveryOptionInput } from "@easyprint/shared";
import { apiFetch } from "./client";

export type CartItemAddOn = {
  addOnServiceId: string;
  name: string;
  extraPrice: number;
};

export type CartItemOptionSelection = {
  optionId: string;
  optionName: string;
  valueId?: string;
  valueName?: string;
  textValue?: string;
  extraPrice: number;
};

export type CartItemUnitBreakdown =
  | { mode: "per_page"; pageCount: number }
  | { mode: "per_sqm"; widthCm: number; heightCm: number }
  | null;

export type CartItem = {
  id: string;
  mainServiceId: string;
  mainServiceName: string;
  imageUrl?: string;
  isServiceActive: boolean;
  pricingModel: "per_page" | "per_piece" | "per_sqm" | "fixed";
  unitBreakdown: CartItemUnitBreakdown;
  optionSelections: CartItemOptionSelection[];
  addOns: CartItemAddOn[];
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  fileUrl?: string;
  note?: string;
};

export type Cart = {
  id: string;
  shopId: string;
  shopName: string;
  shopPhotoUrl?: string;
  isShopApproved: boolean;
  deliveryOption?: { id: string; name: string; baseFee: number; freeShippingThreshold?: number };
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
};

// ตะกร้าทั้งหมดของลูกค้า (คนละร้านคนละใบ) — ใช้แสดงหน้า /cart ที่รวมทุกร้าน
export function getCarts() {
  return apiFetch<{ carts: Cart[] }>("/carts");
}

// ตะกร้าของร้านนี้ร้านเดียว (null ถ้ายังไม่เคยเพิ่มของจากร้านนี้) — ใช้เช็ค badge ตอนเปิดหน้ารายละเอียดร้าน
export function getShopCart(shopId: string) {
  return apiFetch<{ cart: Cart | null }>(`/shops/${shopId}/cart`);
}

export function addCartItem(shopId: string, input: AddCartItemInput) {
  return apiFetch<{ cart: Cart }>(`/shops/${shopId}/cart/items`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCartItem(id: string, input: UpdateCartItemInput) {
  return apiFetch<{ cart: Cart }>(`/cart/items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function removeCartItem(id: string) {
  return apiFetch<{ cart: Cart }>(`/cart/items/${id}`, { method: "DELETE" });
}

export function setCartDeliveryOption(shopId: string, input: SetCartDeliveryOptionInput) {
  return apiFetch<{ cart: Cart }>(`/shops/${shopId}/cart`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function clearShopCart(shopId: string) {
  return apiFetch<{ cart: null }>(`/shops/${shopId}/cart`, { method: "DELETE" });
}
