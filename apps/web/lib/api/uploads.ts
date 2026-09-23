import { ApiError } from "./client";

// ห้ามใช้ localhost:3000 เป็นค่า default — ชนกับพอร์ตเริ่มต้นของ Next.js เอง (apps/web ก็รันที่ 3000)
// ต้องตรงกับค่า default เดียวกับ client.ts เสมอ (ดู comment เต็มที่นั่น) — เรียกผ่าน proxy route แทนโดเมน Render ตรงๆ
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export type UploadType = "shop-photo" | "id-card" | "service-image" | "delivery-logo" | "order-file" | "payment-slip" | "contact-admin-attachment" | "system-logo";
export type UploadResult = { path: string; url: string | null };

// แยกจาก apiFetch ใน client.ts เพราะ multipart/form-data ห้ามตั้ง Content-Type เอง (browser ต้องคำนวณ boundary ให้)
export async function uploadFile(file: File, type: UploadType): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);

  const res = await fetch(`${API_URL}/uploads`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(data?.error ?? "อัปโหลดไฟล์ไม่สำเร็จ", res.status, data?.details);
  }

  return data as UploadResult;
}
