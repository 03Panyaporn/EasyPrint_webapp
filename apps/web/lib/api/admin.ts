import type {
  ShopApprovalStatus,
  RejectShopInput,
  SuspendShopInput,
  AdminDashboardResponse,
  AdminSettingsResponse,
  UpdateAdminSettingsInput,
  AdminStorageOverviewResponse,
  AdminStorageFilesResponse,
  AnnouncementItem,
  AnnouncementListResponse,
  CreateAnnouncementInput,
  AdminCustomerListQuery,
  AdminCustomerListResponse,
  AdminCustomerDetail,
  AdminCustomerStatus,
  SuspendCustomerInput,
  AdminAuditLogQuery,
  AdminAuditLogListResponse,
  AdminLoginHistoryQuery,
  AdminLoginHistoryListResponse,
  SystemHealthResponse,
} from "@easyprint/shared";
import { apiFetch } from "./client";

export function getAnnouncements() {
  return apiFetch<AnnouncementListResponse>("/admin/announcements");
}

// ส่งประกาศจริง: บันทึกประวัติ + ส่งแจ้งเตือนในแอปถึงกลุ่มเป้าหมาย (ไม่รวมแอดมิน)
export function createAnnouncement(input: CreateAnnouncementInput) {
  return apiFetch<{ announcement: AnnouncementItem }>("/admin/announcements", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

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
  email: string | null; // อีเมลติดต่อของร้าน (shops.email) — ไม่ใช่อีเมล login ของเจ้าของ (ownerEmail)
  address: string | null;
  serviceTypes: string[] | null;
  deliveryMethods: string[] | null;
  googleMapLink: string | null;
  shopPhotoUrl: string | null;
  socialMedia: string | null;
  openingHours: AdminOpeningHoursDay[] | null;
  approvalStatus: ShopApprovalStatus;
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

// ── จัดการบัญชีลูกค้า (หน้า /admin/users) ──
export function listAdminCustomers(params: Partial<AdminCustomerListQuery> = {}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  const query = qs.toString();
  return apiFetch<AdminCustomerListResponse>(`/admin/customers${query ? `?${query}` : ""}`);
}

export function getAdminCustomer(id: string) {
  return apiFetch<{ customer: AdminCustomerDetail }>(`/admin/customers/${id}`);
}

type CustomerStatusResult = { customer: { id: string; status: AdminCustomerStatus; suspendedAt: string | null } };

export function suspendCustomer(id: string, input: SuspendCustomerInput) {
  return apiFetch<CustomerStatusResult>(`/admin/customers/${id}/suspend`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function reinstateCustomer(id: string) {
  return apiFetch<CustomerStatusResult>(`/admin/customers/${id}/reinstate`, { method: "PATCH" });
}

export function deleteCustomer(id: string) {
  return apiFetch<{ message: string }>(`/admin/customers/${id}`, { method: "DELETE" });
}

// ── ประวัติและสถานะระบบ (หน้า /admin/logs) ──
function toQueryString(params: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "" && value !== "all") qs.set(key, String(value));
  }
  const query = qs.toString();
  return query ? `?${query}` : "";
}

export function listAdminAuditLogs(params: Partial<AdminAuditLogQuery> = {}) {
  return apiFetch<AdminAuditLogListResponse>(`/admin/audit-logs${toQueryString(params)}`);
}

export function listAdminLoginHistory(params: Partial<AdminLoginHistoryQuery> = {}) {
  return apiFetch<AdminLoginHistoryListResponse>(`/admin/login-history${toQueryString(params)}`);
}

export function getSystemHealth() {
  return apiFetch<SystemHealthResponse>("/admin/system-health");
}
