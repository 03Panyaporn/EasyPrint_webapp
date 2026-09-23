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

export function deleteNotification(id: string) {
  return apiFetch<{ success: boolean }>(`/notifications/${id}`, { method: "DELETE" });
}

export async function markAllNotificationsAsRead(): Promise<{ success: boolean }> {
  return await apiFetch("/notifications/read-all", {
    method: "PUT",
  });
}

// event ที่ยิงหลังแอดมินมาร์คอ่านในหน้า /admin/notifications — ให้กระดิ่งใน AdminTopbar รีโหลดตัวเลขทันที
export const ADMIN_NOTIFICATIONS_UPDATED_EVENT = "admin-notifications-updated";

export function getAdminNotifications() {
  return apiFetch<AdminNotificationListResponse>("/admin/notifications");
}

export function markAdminNotificationRead(id: string) {
  return apiFetch<{ success: boolean }>(`/admin/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllAdminNotificationsRead() {
  return apiFetch<{ success: boolean }>("/admin/notifications/read-all", { method: "PATCH" });
}
