import type { ApiOrder } from "@/lib/api/orders";
import type { Order, OrderFileAttachment } from "@/components/shop/orders/types";

// แปลงข้อมูลจริงจาก API ให้เข้ากับ shape ของ Order (เดิมออกแบบไว้คู่กับ mock data) เพื่อใช้ UI component ชุดเดิมที่มีอยู่แล้วได้ทันที
// (backend เก็บแค่ fileUrl/slipUrl เป็น string ไม่มีชื่อไฟล์/ขนาดไฟล์จริงเหมือน mock — เดาชื่อ/ประเภทจาก URL แทน)

function guessFileAttachment(url: string, fallbackName: string): OrderFileAttachment {
  const lastSegment = url.split("/").pop();
  const name = lastSegment && lastSegment.length > 0 ? lastSegment : fallbackName;
  const isPdf = url.toLowerCase().endsWith(".pdf");
  return { name, sizeLabel: "-", type: isPdf ? "pdf" : "image" };
}

function formatCreatedAtLabel(iso: string): string {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toOrder(api: ApiOrder): Order {
  return {
    id: api.id,
    code: api.code,
    ref: api.ref,
    customerName: api.customerName ?? "-",
    customerPhone: api.customerPhone ?? "-",
    category: api.serviceType,
    paperSize: api.paperSize,
    copies: api.copies,
    totalPages: api.pages,
    addOns: api.selectedAddOns,
    file: guessFileAttachment(api.fileUrl, `${api.code}-ไฟล์งาน`),
    paymentSlip: guessFileAttachment(api.slipUrl, `${api.code}-สลิป`),
    delivery: api.delivery,
    price: api.totalPrice / 100,
    status: api.status,
    createdAtLabel: formatCreatedAtLabel(api.createdAt),
    note: api.note,
    cancelReason: api.cancelReason,
    cancelNote: api.cancelNote,
  };
}
