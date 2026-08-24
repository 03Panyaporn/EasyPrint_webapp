import { apiFetch } from "./client";
import type { Notification } from "@easyprint/shared/src/schemas/notification";

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
