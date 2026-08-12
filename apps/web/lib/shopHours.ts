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

  if (closeMinutes < openMinutes) {
    // ร้านเปิดข้ามคืน (เช่น 18:00 - 02:00)
    return nowMinutes >= openMinutes || nowMinutes < closeMinutes;
  }
  
  if (openMinutes === closeMinutes) {
    // เปิด 24 ชั่วโมง (00:00 - 00:00)
    return true;
  }

  return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
}

export function formatTodayHours(openingHours: ShopOpeningHours[] | null): string {
  const todayEntry = findTodayEntry(openingHours);
  if (!todayEntry) return "ไม่ระบุเวลาทำการ";
  if (!todayEntry.isOpen) return "ปิดทำการวันนี้";
  return `เปิด ${todayEntry.openTime} - ${todayEntry.closeTime}`;
}

export function isShopTempClosed(tempCloseStart: string | null, tempCloseEnd: string | null): boolean {
  if (!tempCloseStart) return false;
  
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  // If tempCloseStart is today or in the past, and tempCloseEnd is not set or in the future
  if (tempCloseStart <= todayStr) {
    if (!tempCloseEnd || tempCloseEnd >= todayStr) {
      return true;
    }
  }
  return false;
}
