import type { RejectShopInput } from "@easyprint/shared";
import { apiFetch } from "./client";

export type AdminOpeningHoursDay = {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
};

export type AdminShop = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  category: string | null;
  googleMapLink: string | null;
  shopPhotoUrl: string | null;
  socialMedia: string | null;
  openingHours: AdminOpeningHoursDay[] | null;
  approvalStatus: "pending" | "approved" | "rejected";
  rejectedReason: string | null;
  createdAt: string;
  ownerEmail: string | null;
  ownerFirstname: string | null;
  ownerLastname: string | null;
};

export type AdminShopDetail = AdminShop & {
  idCardSignedUrl: string | null;
};

export function listAdminShops() {
  return apiFetch<{ shops: AdminShop[] }>("/admin/shops");
}

export function getAdminShop(id: string) {
  return apiFetch<{ shop: AdminShopDetail }>(`/admin/shops/${id}`);
}

export function approveShop(id: string) {
  return apiFetch<{ shop: unknown }>(`/admin/shops/${id}/approve`, { method: "PATCH" });
}

export function rejectShop(id: string, input: RejectShopInput) {
  return apiFetch<{ shop: unknown }>(`/admin/shops/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
