// ห้ามใช้ localhost:3000 เป็นค่า default — ชนกับพอร์ตเริ่มต้นของ Next.js เอง (apps/web ก็รันที่ 3000)
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function doFetch<T>(path: string, options: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include", // ส่ง/รับ JWT httpOnly cookie ข้าม origin (web:3000 -> api:3001)
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(data?.error ?? "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง", res.status, data?.details);
  }

  return data as T;
}

// GET request ที่กำลังยิงอยู่ตอนนี้ (key = path) — ใช้ dedupe ไม่ให้หลาย component ที่ mount พร้อมกัน
// (เช่น sidebar/topbar/dashboard การ์ดต่างๆ ที่ต่างคนต่างเรียก getMe()/getShopMe() เอง) ยิง network request
// ซ้ำๆ กันแบบไม่จำเป็นตอนโหลดหน้าเดียวกัน (ยืนยันบั๊กจริงจาก QA Phase 01 — BUG-01-03, `/shops/me` ยิงซ้ำ 8 ครั้ง)
// ไม่ dedupe POST/PATCH/PUT/DELETE เพราะ mutation ต้องยิงจริงทุกครั้งตามที่ผู้ใช้สั่ง
const inflightGetRequests = new Map<string, Promise<unknown>>();

export function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  if (method !== "GET") {
    return doFetch<T>(path, options);
  }

  const existing = inflightGetRequests.get(path);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = doFetch<T>(path, options).finally(() => {
    inflightGetRequests.delete(path);
  });
  inflightGetRequests.set(path, promise);
  return promise as Promise<T>;
}
