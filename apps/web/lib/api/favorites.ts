import type { FavoriteShopListResponse } from "@easyprint/shared";
import { apiFetch } from "./client";

// ร้านโปรดของลูกค้า (เฉพาะบัญชีลูกค้า — บัญชีอื่นได้ 403)
export function getFavoriteShops() {
  return apiFetch<FavoriteShopListResponse>("/favorites");
}

export function addFavoriteShop(shopId: string) {
  return apiFetch<{ isFavorite: boolean }>(`/favorites/${shopId}`, { method: "PUT" });
}

export function removeFavoriteShop(shopId: string) {
  return apiFetch<{ isFavorite: boolean }>(`/favorites/${shopId}`, { method: "DELETE" });
}
