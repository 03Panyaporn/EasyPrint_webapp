import { apiFetch } from "./client";

export interface ChatMessageItem {
  id: string;
  orderId: string;
  senderId: string;
  shopId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  isFile: boolean;
  fileUrl: string | null;
  fileName: string | null;
}

export interface ChatRoomItem {
  orderId: string;
  orderCode: string;
  shopId: string;
  shopName: string;
  customerId: string;
  customerName: string;
  lastMessageContent: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export function getChatRooms() {
  return apiFetch<{ rooms: ChatRoomItem[] }>("/messages/rooms");
}

export function getOrderMessages(orderId: string) {
  return apiFetch<{ messages: ChatMessageItem[] }>(`/messages/${orderId}`);
}

export function sendChatMessage(orderId: string, content: string) {
  return apiFetch<{ message: ChatMessageItem }>("/messages", {
    method: "POST",
    body: JSON.stringify({ orderId, content }),
  });
}

export function sendChatFile(orderId: string, filePath: string, fileName: string) {
  return apiFetch<{ message: ChatMessageItem }>("/messages", {
    method: "POST",
    body: JSON.stringify({ orderId, filePath, fileName }),
  });
}

export function markOrderMessagesRead(orderId: string) {
  return apiFetch<{ success: boolean }>(`/messages/${orderId}/read`, {
    method: "PATCH",
  });
}
