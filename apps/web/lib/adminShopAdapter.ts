import type { MockShop, MockDocument, ShopStatus } from "@/lib/mock/adminShops";
import type { AdminShop, AdminShopDetail, AdminOpeningHoursDay } from "@/lib/api/admin";

// แปลงข้อมูลจริงจาก API ให้เข้ากับ shape ของ MockShop เพื่อใช้ UI component ชุดเดิมที่มีอยู่แล้วได้ทันที
// (ตารางเวลาทำการ/ที่อยู่ ของจริงเก็บต่างจาก mock เดิม เลยต้องสรุป/แปลงรูปแบบตรงนี้)

const STATUS_MAP: Record<AdminShop["approvalStatus"], ShopStatus> = {
  pending: "รอตรวจสอบ",
  approved: "อนุมัติแล้ว",
  rejected: "ไม่อนุมัติ",
};

export function summarizeOpeningHours(hours: AdminOpeningHoursDay[] | null) {
  if (!hours || hours.length === 0) return { openDays: "ไม่ระบุเวลาทำการ", openTime: "-", closeTime: "-" };
  const openDays = hours.filter((h) => h.isOpen);
  if (openDays.length === 0) return { openDays: "ปิดทำการทุกวัน", openTime: "-", closeTime: "-" };
  const dayLabel = openDays.length === 7 ? "ทุกวัน" : openDays.map((d) => d.day).join(", ");
  return { openDays: dayLabel, openTime: openDays[0].openTime, closeTime: openDays[0].closeTime };
}

function formatSubmitDate(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toMockShop(shop: AdminShop | AdminShopDetail): MockShop {
  const { openDays, openTime, closeTime } = summarizeOpeningHours(shop.openingHours);

  const documents: MockDocument[] = [];
  if ("idCardSignedUrl" in shop && shop.idCardSignedUrl) {
    documents.push({ id: `${shop.id}-id-card`, name: "รูปบัตรประชาชน", type: "image", size: "-", url: shop.idCardSignedUrl });
  }
  if (shop.shopPhotoUrl) {
    documents.push({ id: `${shop.id}-shop-photo`, name: "รูปภาพร้านค้า", type: "image", size: "-", url: shop.shopPhotoUrl });
  }

  return {
    id: shop.id,
    name: shop.name,
    email: shop.ownerEmail ?? "-",
    phone: shop.phone ?? "-",
    ownerFirstname: shop.ownerFirstname ?? "-",
    ownerLastname: shop.ownerLastname ?? "",
    shopType: shop.category ?? "-",
    address: shop.address ?? "-",
    district: "",
    province: "",
    googleMapLink: shop.googleMapLink ?? "",
    lineId: "",
    socialUrl: shop.socialMedia ?? "",
    openTime,
    closeTime,
    openDays,
    submitDate: formatSubmitDate(shop.createdAt),
    docCount: documents.length,
    status: STATUS_MAP[shop.approvalStatus],
    rejectedReason: shop.rejectedReason ?? undefined,
    documents,
  };
}
