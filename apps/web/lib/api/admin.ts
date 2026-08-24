import type {
  RejectShopInput,
  SuspendShopInput,
  AdminDashboardResponse,
  AdminSettingsResponse,
  UpdateAdminSettingsInput,
  AdminStorageOverviewResponse,
  AdminStorageFilesResponse,
} from "@easyprint/shared";
import { apiFetch } from "./client";

export function getAdminDashboard() {
  return apiFetch<AdminDashboardResponse>("/admin/dashboard");
}

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
  serviceTypes: string[] | null;
  deliveryMethods: string[] | null;
  googleMapLink: string | null;
  shopPhotoUrl: string | null;
  socialMedia: string | null;
  openingHours: AdminOpeningHoursDay[] | null;
  approvalStatus: "pending" | "approved" | "rejected" | "suspended";
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

export function deleteShop(id: string) {
  return apiFetch<{ message: string }>(`/admin/shops/${id}`, { method: "DELETE" });
}

export type UpdateShopInput = {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  serviceTypes?: string[];
  storageQuotaMb?: number | null;
};

export function updateAdminShop(id: string, input: UpdateShopInput) {
  return apiFetch<{ shop: unknown }>(`/admin/shops/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
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

export function suspendShop(id: string, input: SuspendShopInput) {
  return apiFetch<{ shop: unknown }>(`/admin/shops/${id}/suspend`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

// คืนสถานะร้านที่เคยถูกระงับกลับเป็น approved — ใช้ endpoint เดียวกับ approveShop() เพราะ backend ทำสิ่งเดียวกันเป๊ะ (ตั้ง approved + ล้างเหตุผลเดิม)
export const reinstateShop = approveShop;

export function getAdminSettings() {
  return apiFetch<{ settings: AdminSettingsResponse }>("/admin/settings");
}

export function updateAdminSettings(input: UpdateAdminSettingsInput) {
  return apiFetch<{ settings: AdminSettingsResponse }>("/admin/settings", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function getAdminStorageOverview() {
  return apiFetch<AdminStorageOverviewResponse>("/admin/storage/overview");
}

export function getAdminStorageFiles(shopId?: string) {
  const qs = shopId ? `?shopId=${encodeURIComponent(shopId)}` : "";
  return apiFetch<AdminStorageFilesResponse>(`/admin/storage/files${qs}`);
}

export function getAdminStorageFileUrl(path: string) {
  return apiFetch<{ url: string }>(`/admin/storage/files/${encodeURIComponent(path)}/url`);
}

export function deleteAdminStorageFile(path: string) {
  return apiFetch<{ message: string }>(`/admin/storage/files/${encodeURIComponent(path)}`, { method: "DELETE" });
}

export function deleteAdminStorageShopFiles(shopId: string) {
  return apiFetch<{ message: string; deletedCount: number }>(`/admin/storage/shops/${shopId}/files`, { method: "DELETE" });
}
