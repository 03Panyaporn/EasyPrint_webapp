import type { ApiOrder } from "@/lib/api/orders";
import type { Order, OrderFileAttachment } from "@/components/shop/orders/types";

// แปลงข้อมูลจริงจาก API ให้เข้ากับ shape ของ Order (เดิมออกแบบไว้คู่กับ mock data) เพื่อใช้ UI component ชุดเดิมที่มีอยู่แล้วได้ทันที
// (backend เก็บแค่ fileUrl/slipUrl เป็น string ไม่มีชื่อไฟล์/ขนาดไฟล์จริงเหมือน mock — เดาชื่อ/ประเภทจาก URL แทน)

// ใช้ชื่อไฟล์จริงที่ลูกค้าอัปโหลด (realName) ถ้ามี — ไม่งั้นเดาจาก URL (ออเดอร์เก่าก่อนมี fileName บันทึกไว้)
function guessFileAttachment(url: string | null, fallbackName: string, realName?: string | null): OrderFileAttachment {
  const isPdf = (url?.toLowerCase().endsWith(".pdf") || realName?.toLowerCase().endsWith(".pdf")) ?? false;
  if (realName) return { name: realName, sizeLabel: "-", type: isPdf ? "pdf" : "image" };
  if (!url) return { name: fallbackName, sizeLabel: "-", type: "image" };
  const lastSegment = url.split("/").pop();
  const name = lastSegment && lastSegment.length > 0 ? lastSegment : fallbackName;
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
  const firstItem = api.items?.[0];
  const category = firstItem ? firstItem.serviceName : (api.serviceType ?? "สั่งพิมพ์งาน");
  const paperSize = firstItem?.optionsSnapshot.find((o) => o.optionName.includes("กระดาษ") || o.optionName.includes("ขนาด"))?.valueName || api.paperSize || "-";
  const copies = firstItem ? firstItem.quantity : (api.copies ?? 1);
  const totalPages = firstItem?.pageCount ?? api.pages ?? 0;
  const addOns = firstItem
    ? firstItem.addOnsSnapshot.map((a) => a.name)
    : (api.selectedAddOns ?? []);

  // total_price เก็บเป็นบาท (numeric) เสมอ — ไม่ต้องแปลงหน่วย
  const finalPrice = typeof api.totalPrice === "number" ? api.totalPrice : Number(api.totalPrice ?? 0);

  return {
    id: api.id,
    code: api.code,
    ref: api.ref,
    customerName: api.customerName ?? "-",
    customerPhone: api.customerPhone ?? "-",
    category,
    colorMode: api.colorMode,
    paperSize,
    copies,
    totalPages,
    addOns,
    file: guessFileAttachment(firstItem?.fileUrl || api.fileUrl || "", `${api.code}-ไฟล์งาน`, firstItem?.fileName),
    paymentSlip: guessFileAttachment(api.slipUrl, `${api.code}-สลิป`),
    delivery: api.delivery,
    subtotal: api.subtotal,
    shippingFee: api.shippingFee,
    price: finalPrice,
    items: api.items,
    fileUrl: firstItem?.fileUrl || api.fileUrl || null,
    rawFileUrl: firstItem?.fileSignedUrl || api.fileSignedUrl || null,
    rawSlipUrl: api.slipSignedUrl || null,
    status: api.status,
    createdAt: api.createdAt,
    finishedAt: api.finishedAt ?? null,
    createdAtLabel: formatCreatedAtLabel(api.createdAt),
    note: api.note,
    cancelReason: api.cancelReason,
    cancelNote: api.cancelNote,
  };
}

// อัปเดตเฉพาะฟิลด์ที่เปลี่ยนตามสถานะจาก response ของ PATCH /orders/:id/status ลงออเดอร์ที่มีอยู่แล้วใน state
// (response ไม่มี items/signed URL แนบมา ถ้าแทนทั้งก้อนด้วย toOrder() รายการสินค้า/ไฟล์ในตารางจะหายไป)
export function mergeStatusFields(existing: Order, updated: ApiOrder): Order {
  return {
    ...existing,
    status: updated.status,
    finishedAt: updated.finishedAt ?? null,
    cancelReason: updated.cancelReason,
    cancelNote: updated.cancelNote,
  };
}
