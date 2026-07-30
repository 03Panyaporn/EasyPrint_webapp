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

export type PublicShopDetail = PublicShopListItem & {
  phone: string | null;
  googleMapLink: string | null;
  socialMedia: string | null;
};

// endpoint สาธารณะ ไม่ต้องส่ง cookie — คืนเฉพาะร้านที่แอดมินอนุมัติแล้วเท่านั้น
export function getShops() {
  return apiFetch<{ shops: PublicShopListItem[] }>("/shops");
}

// endpoint สาธารณะ ไม่ต้องส่ง cookie — ดูรายละเอียดร้านเดี่ยว (คืน 404 ถ้าร้านยังไม่อนุมัติ/ไม่มีจริง)
export function getShop(id: string) {
  return apiFetch<{ shop: PublicShopDetail }>(`/shops/${id}`);
}
