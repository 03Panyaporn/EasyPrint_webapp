import type { AdminNotificationListResponse } from "@easyprint/shared";
import { apiFetch } from "./client";

export function getAdminNotifications() {
  return apiFetch<AdminNotificationListResponse>("/admin/notifications");
}

export function markAdminNotificationRead(id: string) {
  return apiFetch<{ success: boolean }>(`/admin/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllAdminNotificationsRead() {
  return apiFetch<{ success: boolean }>("/admin/notifications/read-all", { method: "PATCH" });
}
