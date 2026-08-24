import type {
  ContactAdminMessageItem,
  CreateContactAdminMessageInput,
  ReplyContactAdminMessageInput,
} from "@easyprint/shared";
import { apiFetch } from "./client";

export function submitContactAdminMessage(shopId: string, input: CreateContactAdminMessageInput) {
  return apiFetch<{ message: ContactAdminMessageItem }>(`/shops/${shopId}/contact-admin`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getShopContactAdminMessages(shopId: string) {
  return apiFetch<{ messages: ContactAdminMessageItem[] }>(`/shops/${shopId}/contact-admin`);
}

export function getAllContactAdminMessages() {
  return apiFetch<{ messages: ContactAdminMessageItem[] }>("/admin/contact-messages");
}

export function replyContactAdminMessage(id: string, input: ReplyContactAdminMessageInput) {
  return apiFetch<{ message: ContactAdminMessageItem }>(`/admin/contact-messages/${id}/reply`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
