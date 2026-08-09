import type { ShopOpeningHours } from "./api/shops";

// index 0 = วันอาทิตย์ ให้ตรงกับ Date.getDay() ของ JS
const THAI_DAY_BY_JS_INDEX = [
  "อาทิตย์",
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
];

function findTodayEntry(openingHours: ShopOpeningHours[] | null): ShopOpeningHours | null {
  if (!openingHours || openingHours.length === 0) return null;
  const today = THAI_DAY_BY_JS_INDEX[new Date().getDay()];
  return openingHours.find((entry) => entry.day === today) ?? null;
}

export function isShopOpenNow(openingHours: ShopOpeningHours[] | null): boolean {
  const todayEntry = findTodayEntry(openingHours);
  if (!todayEntry || !todayEntry.isOpen) return false;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = todayEntry.openTime.split(":").map(Number);
  const [closeH, closeM] = todayEntry.closeTime.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
}

export function formatTodayHours(openingHours: ShopOpeningHours[] | null): string {
  const todayEntry = findTodayEntry(openingHours);
  if (!todayEntry) return "ไม่ระบุเวลาทำการ";
  if (!todayEntry.isOpen) return "ปิดทำการวันนี้";
  return `เปิด ${todayEntry.openTime} - ${todayEntry.closeTime}`;
}
