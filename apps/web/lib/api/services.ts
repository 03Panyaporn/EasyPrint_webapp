import type {
  CreateMainServiceInput,
  UpdateMainServiceInput,
  CreateAddOnServiceInput,
  UpdateAddOnServiceInput,
  CreateDeliveryOptionInput,
  UpdateDeliveryOptionInput,
} from "@easyprint/shared";
import type { MainService, AddOnService, DeliveryOption } from "@/components/shop/services/types";
import { apiFetch } from "./client";

export type MyShop = {
  id: string;
  name: string;
  approvalStatus: "pending" | "approved" | "rejected";
  rejectedReason: string | null;
  deliveryEnabled: boolean;
};

export function getMyShop() {
  return apiFetch<{ shop: MyShop }>("/shops/me");
}

// ── บริการหลัก ──────────────────────────────
export function getMainServices(shopId: string) {
  return apiFetch<{ services: MainService[] }>(`/shops/${shopId}/services`);
}

export function createMainService(shopId: string, input: CreateMainServiceInput) {
  return apiFetch<{ service: MainService }>(`/shops/${shopId}/services`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateMainService(shopId: string, id: string, input: UpdateMainServiceInput) {
  return apiFetch<{ service: MainService }>(`/shops/${shopId}/services/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteMainService(shopId: string, id: string) {
  return apiFetch<{ service: MainService }>(`/shops/${shopId}/services/${id}`, {
    method: "DELETE",
  });
}

export function duplicateMainService(shopId: string, id: string) {
  return apiFetch<{ service: MainService }>(`/shops/${shopId}/services/${id}/duplicate`, {
    method: "POST",
  });
}

// ── บริการเสริม ──────────────────────────────
export function getAddOnServices(shopId: string) {
  return apiFetch<{ addOns: AddOnService[] }>(`/shops/${shopId}/addons`);
}

export function createAddOnService(shopId: string, input: CreateAddOnServiceInput) {
  return apiFetch<{ addOn: AddOnService }>(`/shops/${shopId}/addons`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateAddOnService(shopId: string, id: string, input: UpdateAddOnServiceInput) {
  return apiFetch<{ addOn: AddOnService }>(`/shops/${shopId}/addons/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteAddOnService(shopId: string, id: string) {
  return apiFetch<{ addOn: AddOnService }>(`/shops/${shopId}/addons/${id}`, {
    method: "DELETE",
  });
}

// ── ตัวเลือกการจัดส่ง ────────────────────────
export function getDeliveryOptions(shopId: string) {
  return apiFetch<{ deliveryOptions: DeliveryOption[] }>(`/shops/${shopId}/delivery-options`);
}

export function createDeliveryOption(shopId: string, input: CreateDeliveryOptionInput) {
  return apiFetch<{ deliveryOption: DeliveryOption }>(`/shops/${shopId}/delivery-options`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateDeliveryOption(shopId: string, id: string, input: UpdateDeliveryOptionInput) {
  return apiFetch<{ deliveryOption: DeliveryOption }>(`/shops/${shopId}/delivery-options/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteDeliveryOption(shopId: string, id: string) {
  return apiFetch<{ deliveryOption: DeliveryOption }>(`/shops/${shopId}/delivery-options/${id}`, {
    method: "DELETE",
  });
}
