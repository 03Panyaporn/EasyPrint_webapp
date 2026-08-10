import { Elysia } from "elysia";
import { and, count, desc, eq } from "drizzle-orm";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  orderListQuerySchema,
  type OrderStatus,
  type CancelReason,
} from "@easyprint/shared";
import { db } from "../db";
import { orders, orderItems, shops, users } from "../../drizzle/schema";
import { verifyAuthToken, AUTH_COOKIE_NAME } from "../auth/jwt";
import { requireShopOwner } from "./services";
import { notifyOrderCreated, notifyOrderCancelled } from "../notifications";

// ต้องตรงกับ statusConfig.ts ฝั่ง frontend (apps/web/components/shop/orders/statusConfig.ts) — ใช้ในข้อความ error ตอนพยายามข้ามขั้นสถานะ
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_review: "รอตรวจสอบ",
  accepted: "รับงานแล้ว",
  in_progress: "กำลังดำเนินการ",
  shipping: "กำลังจัดส่ง",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};

// ต้องตรงกับ cancelReasonLabels ฝั่ง frontend (apps/web/components/shop/orders/statusConfig.ts) — ใช้แค่ในข้อความแจ้งเตือนอีเมลตอนยกเลิก/ปฏิเสธการชำระเงิน
const CANCEL_REASON_LABELS: Record<CancelReason, string> = {
  customer_request: "ลูกค้าขอยกเลิก",
  invalid_payment_slip: "หลักฐานการชำระเงินไม่ถูกต้อง/ไม่ชัดเจน",
  amount_mismatch: "ยอดโอนไม่ตรงกับยอดสั่งซื้อ",
  no_transfer_found: "ไม่พบรายการโอนเงินจริง",
  invalid_file: "ไฟล์งานไม่ถูกต้อง/เสียหาย",
  shop_unavailable: "ร้านไม่สามารถให้บริการได้ตามคำขอ",
  other: "อื่นๆ",
};

// รันเลขที่ออเดอร์ "#0001" ต่อร้าน — นับจำนวนออเดอร์เดิมของร้านนี้ +1 แล้ว pad เป็น 4 หลัก
// ไม่ atomic 100% ในทางทฤษฎี (สั่งพร้อมกันเป๊ะๆ อาจได้เลขซ้ำ) แต่กันไว้อีกชั้นด้วย unique constraint (shop_id, code)
// ที่ endpoint POST /orders ด้านล่างจะลองใหม่อัตโนมัติถ้าเลขชนกันจริง
export async function generateOrderCode(shopId: string): Promise<string> {
  const [row] = await db.select({ total: count() }).from(orders).where(eq(orders.shopId, shopId));
  return `#${String((row?.total ?? 0) + 1).padStart(4, "0")}`;
}

// รหัสอ้างอิงเต็มระบบ ไม่ซ้ำกันทั้งระบบ (วันที่ + สุ่ม 4 ตัวอักษร) เช่น "ORD-20260516-B0F2"
export function generateOrderRef(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase();
  return `ORD-${y}${m}${d}-${rand}`;
}

export function serializeOrder(
  order: typeof orders.$inferSelect,
  customer: { firstname: string; lastname: string; phone: string; email: string } | null,
  items?: (typeof orderItems.$inferSelect)[]
) {
  return {
    id: order.id,
    code: order.code,
    ref: order.ref,
    shopId: order.shopId,
    customerId: order.customerId,
    customerName: customer ? `${customer.firstname} ${customer.lastname}` : null,
    customerPhone: customer?.phone ?? null,
    customerEmail: customer?.email ?? null,
    // Schema v1 fields (legacy)
    serviceType: order.serviceType,
    pages: order.pages,
    copies: order.copies,
    colorMode: order.colorMode,
    paperSize: order.paperSize,
    binding: order.binding,
    lamination: order.lamination,
    selectedAddOns: order.selectedAddOns ?? [],
    fileUrl: order.fileUrl,
    subtotal: order.subtotal != null ? Number(order.subtotal) : undefined,
    shippingFee: order.shippingFeeSnapshot != null ? Number(order.shippingFeeSnapshot) : undefined,
    items: items
      ? items.map((item) => ({
          id: item.id,
          serviceName: item.serviceNameSnapshot,
          pricingType: item.pricingTypeSnapshot,
          baseRate: Number(item.basePriceSnapshot),
          colorTierLabel: item.colorTierLabelSnapshot,
          colorTierPrice: item.colorTierPriceSnapshot != null ? Number(item.colorTierPriceSnapshot) : null,
          quantity: item.quantity,
          pageCount: item.pageCount,
          widthCm: item.widthCmSnapshot != null ? Number(item.widthCmSnapshot) : null,
          heightCm: item.heightCmSnapshot != null ? Number(item.heightCmSnapshot) : null,
          optionsSnapshot: (item.optionsSnapshotJson as Array<{
            optionName: string;
            valueName?: string | null;
            textValue?: string | null;
            extraPrice: number;
            priceScope: string;
          }>) ?? [],
          addOnsSnapshot: (item.additionalServicesSnapshotJson as Array<{
            name: string;
            extraPrice: number;
            scope: string;
          }>) ?? [],
          itemSubtotal: Number(item.itemTotalPrice),
          fileUrl: item.fileUrl,
          note: item.noteSnapshot,
        }))
      : undefined,
    totalPrice: order.totalPrice,
    status: order.status,
    note: order.note ?? undefined,
    delivery: {
      method: order.deliveryMethod,
      address: order.deliveryAddress ?? undefined,
    },
    slipUrl: order.slipUrl,
    slipUploadedAt: order.slipUploadedAt,
    cancelReason: order.cancelReason ?? undefined,
    cancelNote: order.cancelNote ?? undefined,
    createdAt: order.createdAt,
  };
}

// ลำดับสถานะถัดไปที่ "เดินหน้า" ได้จากสถานะปัจจุบัน (ห้ามข้ามขั้น) — null = จบ flow แล้ว เปลี่ยนต่อไม่ได้อีก
// ลูกค้าที่เลือกมารับเองที่ร้านข้ามสถานะ "กำลังจัดส่ง" ไปเลย ตรงกับ getProgressSteps() ฝั่ง frontend (UpdateStatusModal.tsx)
function getAllowedNextStatus(order: typeof orders.$inferSelect): OrderStatus | null {
  switch (order.status as OrderStatus) {
    case "pending_review":
      return "accepted";
    case "accepted":
      return "in_progress";
    case "in_progress":
      return order.deliveryMethod === "self_pickup" ? "completed" : "shipping";
    case "shipping":
      return "completed";
    default:
      return null; // completed / cancelled คือจุดจบ เปลี่ยนสถานะต่อไม่ได้อีก
  }
}

// ยกเลิก/ปฏิเสธการชำระเงินได้เฉพาะออเดอร์ที่ยังไม่จบ flow เท่านั้น
function canCancel(status: OrderStatus): boolean {
  return status !== "completed" && status !== "cancelled";
}

// เช็คว่า request นี้มีสิทธิ์ดูออเดอร์ :id นี้ไหม — เจ้าของร้านที่ออเดอร์นี้เป็นของร้านตัวเอง หรือลูกค้าที่เป็นเจ้าของออเดอร์เอง
async function canViewOrder(
  order: typeof orders.$inferSelect,
  cookie: Record<string, { value?: unknown } | undefined>
): Promise<boolean> {
  const token = cookie[AUTH_COOKIE_NAME]?.value as string | undefined;
  const payload = token ? verifyAuthToken(token) : null;
  if (!payload) return false;
  if (payload.role === "customer") return payload.userId === order.customerId;
  if (payload.role === "shop_owner") {
    const errorOrNull = await requireShopOwner(cookie, order.shopId, { status: undefined });
    return errorOrNull === null;
  }
  return payload.role === "admin";
}

export const ordersRoutes = new Elysia()
  // ── สร้างคำสั่งพิมพ์ใหม่ (ฝั่งลูกค้า) ──────────
  .post("/orders", async ({ body, cookie, set }) => {
    const token = cookie[AUTH_COOKIE_NAME]?.value as string | undefined;
    const payload = token ? verifyAuthToken(token) : null;
    if (!payload || payload.role !== "customer") {
      set.status = 401;
      return { error: "ต้องเข้าสู่ระบบด้วยบัญชีลูกค้าก่อนสั่งซื้อ" };
    }

    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    // TODO: คำนวณราคาจริงตามอัตราของร้าน (ดู docs/proposal.md หัวข้อ 1.3.2.3) — ตอนนี้ยังเป็นสูตรชั่วคราว
    const totalPrice = parsed.data.pages * parsed.data.copies * 100; // หน่วยสตางค์

    // เลขที่ออเดอร์อาจชนกันได้ถ้าสั่งพร้อมกันเป๊ะๆ (ดูคอมเมนต์ generateOrderCode) — ลองใหม่ไม่เกิน 3 ครั้งถ้าเจอ unique violation
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const code = await generateOrderCode(parsed.data.shopId);
        const ref = generateOrderRef();

        const [order] = await db
          .insert(orders)
          .values({
            shopId: parsed.data.shopId,
            customerId: payload.userId,
            code,
            ref,
            serviceType: parsed.data.serviceType,
            pages: parsed.data.pages,
            copies: parsed.data.copies,
            colorMode: parsed.data.colorMode,
            paperSize: parsed.data.paperSize,
            binding: parsed.data.binding,
            lamination: parsed.data.lamination,
            selectedAddOns: parsed.data.selectedAddOns,
            fileUrl: parsed.data.fileUrl,
            slipUrl: parsed.data.slipUrl,
            slipUploadedAt: new Date(),
            deliveryMethod: parsed.data.deliveryMethod,
            deliveryAddress: parsed.data.deliveryAddress,
            totalPrice: Math.round(totalPrice),
            note: parsed.data.note,
          })
          .returning();

        // แจ้งเตือนลูกค้าทางอีเมลว่าสั่งซื้อสำเร็จแบบ best-effort — ส่งไม่สำเร็จก็ไม่ควรทำให้สร้างออเดอร์ (ที่บันทึกลง DB สำเร็จแล้ว) fail ไปด้วย
        const [customer] = await db
          .select({ email: users.email })
          .from(users)
          .where(eq(users.id, payload.userId));
        if (customer) {
          notifyOrderCreated({
            to: customer.email,
            orderCode: order.code,
            totalPrice: Number(order.totalPrice ?? 0),
          }).catch((err) => console.error("ส่งอีเมลยืนยันคำสั่งซื้อไม่สำเร็จ:", err));
        }

        return { order: serializeOrder(order, null) };
      } catch (err) {
        lastError = err;
      }
    }

    console.error("สร้างออเดอร์ไม่สำเร็จหลังลองใหม่ 3 ครั้ง:", lastError);
    set.status = 500;
    return { error: "สร้างออเดอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" };
  })

  // ── รายการออเดอร์ของร้าน (ฝั่งร้านค้า) ──────────
  .get("/shops/:shopId/orders", async ({ params, query, cookie, set }) => {
    const authError = await requireShopOwner(cookie, params.shopId, set);
    if (authError) return authError;

    const parsedQuery = orderListQuerySchema.safeParse(query);
    if (!parsedQuery.success) {
      set.status = 400;
      return { error: "พารามิเตอร์ไม่ถูกต้อง", details: parsedQuery.error.flatten() };
    }

    const rows = await db
      .select({ order: orders, customer: users })
      .from(orders)
      .leftJoin(users, eq(orders.customerId, users.id))
      .where(
        parsedQuery.data.status
          ? and(eq(orders.shopId, params.shopId), eq(orders.status, parsedQuery.data.status))
          : eq(orders.shopId, params.shopId)
      )
      .orderBy(desc(orders.createdAt));
    const result = [];
    for (const r of rows) {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, r.order.id));
      result.push(serializeOrder(r.order, r.customer, items));
    }

    return { orders: result };
  })

  // ── รายการออเดอร์ของลูกค้า (ฝั่งลูกค้า) ──────────
  .get("/customers/orders", async ({ cookie, set }) => {
    const token = cookie[AUTH_COOKIE_NAME]?.value as string | undefined;
    const payload = token ? verifyAuthToken(token) : null;
    if (!payload || payload.role !== "customer") {
      set.status = 401;
      return { error: "ต้องเข้าสู่ระบบด้วยบัญชีลูกค้าก่อนดูประวัติการสั่งซื้อ" };
    }

    const rows = await db
      .select({ order: orders, shop: shops })
      .from(orders)
      .leftJoin(shops, eq(orders.shopId, shops.id))
      .where(eq(orders.customerId, payload.userId))
      .orderBy(desc(orders.createdAt));

    const result = [];
    for (const r of rows) {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, r.order.id));
      result.push({
        ...serializeOrder(r.order, null, items),
        shopName: r.shop?.name ?? "ร้านค้า",
      });
    }

    return { orders: result };
  })

  // ── รายละเอียดออเดอร์เดียว (ร้านดู หรือลูกค้าเจ้าของออเดอร์ดู) ──────────
  .get("/orders/:id", async ({ params, cookie, set }) => {
    const [row] = await db
      .select({ order: orders, customer: users })
      .from(orders)
      .leftJoin(users, eq(orders.customerId, users.id))
      .where(eq(orders.id, params.id));

    if (!row) {
      set.status = 404;
      return { error: "ไม่พบออเดอร์นี้" };
    }
    if (!(await canViewOrder(row.order, cookie))) {
      set.status = 403;
      return { error: "คุณไม่มีสิทธิ์ดูออเดอร์นี้" };
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, row.order.id));

    return { order: serializeOrder(row.order, row.customer, items) };
  })

  // ── เปลี่ยนสถานะออเดอร์ (เดินหน้า / ยกเลิก / ปฏิเสธการชำระเงิน — ใช้ endpoint เดียวกันหมด) ──────────
  .patch("/orders/:id/status", async ({ params, body, cookie, set }) => {
    const [row] = await db
      .select({ order: orders, customer: users })
      .from(orders)
      .leftJoin(users, eq(orders.customerId, users.id))
      .where(eq(orders.id, params.id));

    if (!row) {
      set.status = 404;
      return { error: "ไม่พบออเดอร์นี้" };
    }

    const authError = await requireShopOwner(cookie, row.order.shopId, set);
    if (authError) return authError;

    const parsed = updateOrderStatusSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    const { status: nextStatus, cancelReason, cancelNote } = parsed.data;

    if (nextStatus === "cancelled") {
      if (!canCancel(row.order.status as OrderStatus)) {
        set.status = 400;
        return { error: "ออเดอร์นี้จบสถานะแล้ว ยกเลิกไม่ได้อีก" };
      }
    } else {
      const allowed = getAllowedNextStatus(row.order);
      if (allowed !== nextStatus) {
        set.status = 400;
        return {
          error: allowed
            ? `เปลี่ยนสถานะข้ามขั้นไม่ได้ ต้องเปลี่ยนเป็น "${STATUS_LABELS[allowed]}" ก่อน`
            : "ออเดอร์นี้จบสถานะแล้ว เปลี่ยนสถานะต่อไม่ได้อีก",
        };
      }
    }

    const [updated] = await db
      .update(orders)
      .set({
        status: nextStatus,
        cancelReason: nextStatus === "cancelled" ? cancelReason : null,
        cancelNote: nextStatus === "cancelled" ? cancelNote : null,
      })
      .where(eq(orders.id, params.id))
      .returning();

    // แจ้งเตือนลูกค้าเฉพาะตอนยกเลิก/ปฏิเสธการชำระเงินเท่านั้น — สถานะอื่นๆ ระหว่างทางลูกค้าติดตามผ่านหน้าเว็บแทน (ตาม docs/proposal.md หัวข้อ 1.3.2)
    // แยกข้อความอีเมลตามสถานะ "ก่อน" อัปเดต: ยกเลิกตอนยังรอตรวจสอบ = ปฏิเสธการชำระเงิน, ยกเลิกตอนอื่นๆ = ยกเลิกงาน
    if (nextStatus === "cancelled" && row.customer && cancelReason) {
      notifyOrderCancelled({
        to: row.customer.email,
        orderCode: updated.code,
        kind: row.order.status === "pending_review" ? "reject_payment" : "cancel",
        reasonLabel: CANCEL_REASON_LABELS[cancelReason],
      }).catch((err) => console.error("ส่งอีเมลแจ้งเตือนลูกค้าไม่สำเร็จ:", err));
    }

    return { order: serializeOrder(updated, row.customer) };
  });
