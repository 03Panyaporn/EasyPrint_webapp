import { apiFetch } from "./client";

export type ShopOpeningHours = {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
};

export type PublicShopListItem = {
  id: string;
  name: string;
  address: string | null;
  serviceTypes: string[] | null;
  deliveryMethods: string[] | null;
  openingHours: ShopOpeningHours[] | null;
  shopPhotoUrl: string | null;
};

// endpoint สาธารณะ ไม่ต้องส่ง cookie — คืนเฉพาะร้านที่แอดมินอนุมัติแล้วเท่านั้น
export function getShops() {
  return apiFetch<{ shops: PublicShopListItem[] }>("/shops");
}
