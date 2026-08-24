import { apiFetch } from "./client";
import type { Notification } from "@easyprint/shared/src/schemas/notification";
import type { AdminNotificationListResponse } from "@easyprint/shared";

export async function getNotifications(): Promise<{ notifications: Notification[] }> {
  return await apiFetch("/notifications");
}

export async function markNotificationAsRead(id: string): Promise<{ success: boolean }> {
  return await apiFetch(`/notifications/${id}/read`, {
    method: "PUT",
  });
}

export async function markAllNotificationsAsRead(): Promise<{ success: boolean }> {
  return await apiFetch("/notifications/read-all", {
    method: "PUT",
  });
}

export function getAdminNotifications() {
  return apiFetch<AdminNotificationListResponse>("/admin/notifications");
}

export function markAdminNotificationRead(id: string) {
  return apiFetch<{ success: boolean }>(`/admin/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllAdminNotificationsRead() {
  return apiFetch<{ success: boolean }>("/admin/notifications/read-all", { method: "PATCH" });
}
