import type {
  ContactAdminMessageItem,
  CreateContactAdminMessageInput,
  ReplyContactAdminMessageInput,
} from "@easyprint/shared";
import { apiFetch } from "./client";

// ── ฝั่งร้านค้า ──────────────────────────────────────────────────
export function submitContactAdminMessage(shopId: string, input: CreateContactAdminMessageInput) {
  return apiFetch<{ message: ContactAdminMessageItem }>(`/shops/${shopId}/contact-admin`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getShopContactAdminMessages(shopId: string) {
  return apiFetch<{ messages: ContactAdminMessageItem[] }>(`/shops/${shopId}/contact-admin`);
}

// ── ฝั่งแอดมิน ───────────────────────────────────────────────────
export function getAllContactAdminMessages() {
  return apiFetch<{ messages: ContactAdminMessageItem[] }>("/admin/contact-messages");
}

export function replyContactAdminMessage(id: string, input: ReplyContactAdminMessageInput) {
  return apiFetch<{ message: ContactAdminMessageItem }>(`/admin/contact-messages/${id}/reply`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

// ── ฝั่งลูกค้า (customer) ─────────────────────────────────────────
export function submitCustomerContactMessage(input: CreateContactAdminMessageInput) {
  return apiFetch<{ message: ContactAdminMessageItem }>("/users/contact-admin", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getCustomerContactMessages() {
  return apiFetch<{ messages: ContactAdminMessageItem[] }>("/users/contact-admin");
}

export function deleteContactAdminMessage(id: string) {
  return apiFetch<{ success: boolean }>(`/admin/contact-messages/${id}`, {
    method: "DELETE",
  });
}
