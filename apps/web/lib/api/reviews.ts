import type { CreateReviewInput, ReplyReviewInput, ReviewResponse, ShopReviewsResponse, AdminReviewResponse } from "@easyprint/shared";
import { apiFetch } from "./client";

export function createReview(orderId: string, input: CreateReviewInput) {
  return apiFetch<{ review: ReviewResponse }>(`/orders/${orderId}/review`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getOrderReview(orderId: string) {
  return apiFetch<{ review: ReviewResponse | null }>(`/orders/${orderId}/review`);
}

export function getShopReviews(shopId: string) {
  return apiFetch<ShopReviewsResponse>(`/shops/${shopId}/reviews`);
}

export function replyToReview(shopId: string, reviewId: string, input: ReplyReviewInput) {
  return apiFetch<{ review: ReviewResponse }>(`/shops/${shopId}/reviews/${reviewId}/reply`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteReview(reviewId: string) {
  return apiFetch<{ message: string }>(`/reviews/${reviewId}`, { method: "DELETE" });
}

export function getAdminReviews() {
  return apiFetch<{ reviews: AdminReviewResponse[] }>("/admin/reviews");
}
