import type { ShopOpeningHours } from "./api/shops";

// index 0 = วันอาทิตย์ ให้ตรงกับลำดับ weekday ของ Intl.DateTimeFormat ด้านล่าง (Sun=0 ... Sat=6)
const THAI_DAY_BY_JS_INDEX = [
  "อาทิตย์",
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
];

// mapping จาก day id (en) → ภาษาไทย (เพื่อรองรับข้อมูลที่บันทึกด้วย id เช่น "mon", "tue")
const DAY_ID_TO_THAI: Record<string, string> = {
  sun: "อาทิตย์",
  mon: "จันทร์",
  tue: "อังคาร",
  wed: "พุธ",
  thu: "พฤหัสบดี",
  fri: "ศุกร์",
  sat: "เสาร์",
};

const WEEKDAY_TO_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// เวลาเปิด/ปิดร้านตั้งไว้เป็นเวลาไทยเสมอ (ร้านอยู่ในไทย) — ต้องอ่าน "ตอนนี้" เป็นเวลาไทยเสมอเช่นกัน ไม่ว่าเครื่อง/เบราว์เซอร์ของ
// ผู้ใช้จะตั้งเขตเวลาอะไรไว้ก็ตาม ใช้ Intl.DateTimeFormat กับ timeZone: "Asia/Bangkok" แทน new Date().getHours()/toISOString()
// ตรงๆ (ซึ่งจะได้เวลาเครื่อง/เวลา UTC ตามลำดับ ผิดพลาดได้ถ้าเครื่องผู้ใช้ไม่ได้ตั้งเป็นเวลาไทย หรือช่วง 00:00-06:59 น. ไทยที่วันที่ UTC ยังเป็นเมื่อวาน)
function nowInBangkok(): { y: number; m: number; d: number; hour: number; minute: number; weekdayIndex: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    y: Number(get("year")),
    m: Number(get("month")),
    d: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    weekdayIndex: WEEKDAY_TO_INDEX[get("weekday")] ?? 0,
  };
}

function findTodayEntry(openingHours: ShopOpeningHours[] | null): ShopOpeningHours | null {
  if (!openingHours || openingHours.length === 0) return null;
  const todayThai = THAI_DAY_BY_JS_INDEX[nowInBangkok().weekdayIndex];
  return (
    openingHours.find(
      (entry) =>
        entry.day === todayThai ||
        DAY_ID_TO_THAI[entry.day] === todayThai
    ) ?? null
  );
}

export function isShopOpenNow(openingHours: ShopOpeningHours[] | null): boolean {
  const todayEntry = findTodayEntry(openingHours);
  if (!todayEntry || !todayEntry.isOpen) return false;

  const { hour, minute } = nowInBangkok();
  const nowMinutes = hour * 60 + minute;
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

  const { y, m, d } = nowInBangkok();
  const todayStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  // If tempCloseStart is today or in the past, and tempCloseEnd is not set or in the future
  if (tempCloseStart <= todayStr) {
    if (!tempCloseEnd || tempCloseEnd >= todayStr) {
      return true;
    }
  }
  return false;
}
