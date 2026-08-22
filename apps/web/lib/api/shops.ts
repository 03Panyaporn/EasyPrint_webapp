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
  tempCloseStart: string | null;
  tempCloseEnd: string | null;
};

export type PublicShopDetail = PublicShopListItem & {
  description: string | null;
  phone: string | null;
  email: string | null;
  facebook: string | null;
  lineId: string | null;
  shopPhotoUrl: string | null;
  googleMapLink: string | null;
  socialMedia: string | null;
  tempCloseStart: string | null;
  tempCloseEnd: string | null;
  tempCloseReason: string | null;
};

export type MyShopProfile = {
  id: string;
  name: string;
  description: string | null;
  approvalStatus: string;
  rejectedReason: string | null;
  deliveryEnabled: boolean;
  phone: string | null;
  email: string | null;
  facebook: string | null;
  lineId: string | null;
  latitude: string | null;
  longitude: string | null;
  address: string | null;
  openingHours: ShopOpeningHours[] | null;
  shopPhotoUrl: string | null;
  googleMapLink: string | null;
  tempCloseStart: string | null;
  tempCloseEnd: string | null;
  tempCloseReason: string | null;
  bankAccountName: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  promptpayNumber: string | null;
  promptpayQrUrl: string | null;
  notificationSettings: any | null;
};

// endpoint สาธารณะ ไม่ต้องส่ง cookie — คืนเฉพาะร้านที่แอดมินอนุมัติแล้วเท่านั้น
export function getShops() {
  return apiFetch<{ shops: PublicShopListItem[] }>("/shops");
}

// endpoint สาธารณะ ไม่ต้องส่ง cookie — ดูรายละเอียดร้านเดี่ยว (คืน 404 ถ้าร้านยังไม่อนุมัติ/ไม่มีจริง)
export function getShop(id: string) {
  return apiFetch<{ shop: PublicShopDetail }>(`/shops/${id}`);
}

export function getMyShopProfile() {
  return apiFetch<{ shop: MyShopProfile }>("/shops/me");
}

import type { UpdateShopProfileInput } from "@easyprint/shared";

export function updateShopProfile(data: UpdateShopProfileInput) {
  return apiFetch<{ success: boolean }>("/shops/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

