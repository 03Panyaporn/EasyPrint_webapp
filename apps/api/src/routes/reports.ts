import { Elysia } from "elysia";
import { and, eq, gte, lt, or } from "drizzle-orm";
import {
  reportQuerySchema,
  orderStatusSchema,
  type ReportPeriod,
  type ReportCategory,
  type ReportSeriesPoint,
  type ReportStatusBreakdown,
  type ReportOrderDetail,
  type ShopReportResponse,
  type ShopReportOrdersResponse,
  type OrderStatus,
} from "@easyprint/shared";
import { db } from "../db";
import { orders, orderItems, users } from "../../drizzle/schema";
import { requireShopOwner } from "./services";

// เวลาไทยคงที่ UTC+7 ตลอดปี (ไม่มี DST) — createdAt ใน DB เก็บเป็น UTC instant (timestamp ไม่มี tz, Postgres session เป็น UTC)
// ต้องแปลงขอบเขตวัน/เดือน/ปีจากมุมมองเวลาไทยกลับเป็น UTC ก่อน query เสมอ ไม่งั้น "วันนี้" จะเริ่ม/จบผิดเวลาไป 7 ชั่วโมง
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function bangkokMidnightUtc(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m, d, 0, 0, 0) - BANGKOK_OFFSET_MS);
}

function bangkokYMD(date: Date): { y: number; m: number; d: number } {
  const bkk = new Date(date.getTime() + BANGKOK_OFFSET_MS);
  return { y: bkk.getUTCFullYear(), m: bkk.getUTCMonth(), d: bkk.getUTCDate() };
}

function bangkokHour(date: Date): number {
  const bkk = new Date(date.getTime() + BANGKOK_OFFSET_MS);
  return bkk.getUTCHours();
}

function formatThaiDate(date: Date): string {
  const { y, m, d } = bangkokYMD(date);
  return `${String(d).padStart(2, "0")}/${String(m + 1).padStart(2, "0")}/${y}`;
}

const THAI_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function periodStart(period: ReportPeriod, todayStart: Date, y: number, m: number, d: number): Date {
  switch (period) {
    case "today":
      return todayStart;
    case "7days":
      return new Date(todayStart.getTime() - 6 * DAY_MS);
    case "30days":
      return new Date(todayStart.getTime() - 29 * DAY_MS);
    case "thisMonth":
      return bangkokMidnightUtc(y, m, 1);
    case "thisYear":
      return bangkokMidnightUtc(y, 0, 1);
  }
}

function dateLabelFor(period: ReportPeriod, start: Date, now: Date, y: number): string {
  if (period === "today") return formatThaiDate(now);
  if (period === "thisYear") return `ปี ${y}`;
  return `${formatThaiDate(start)} - ${formatThaiDate(now)}`;
}

// % เปลี่ยนแปลงเทียบกับช่วงก่อนหน้าที่ "ยาวเท่ากัน" — ถ้าช่วงก่อนหน้าไม่มีข้อมูลเลย (=0) ให้เป็น null (ไม่โชว์ %) แทนหารด้วยศูนย์
function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

interface OrderRow {
  id: string;
  status: string;
  createdAt: Date;
  // วันที่ใช้นับ "รายได้" = วันที่งานเสร็จ (finishedAt) — ออเดอร์ที่สั่งเมื่อวานแต่เสร็จวันนี้ต้องเป็นรายได้ของวันนี้
  // ออเดอร์เก่าที่ไม่มี finishedAt fallback เป็น createdAt; ส่วน "จำนวนออเดอร์"/สถานะยังนับตามวันที่สั่ง (createdAt) เหมือนเดิม
  revenueAt: Date;
  shippingFee: number;
  items: { service: string; total: number }[];
}

const SHIPPING_CATEGORY_NAME = "ค่าจัดส่ง";

// "รายได้รวม" = ยอดสินค้า (order_items.itemTotalPrice) + ค่าจัดส่ง — รวมเป็นก้อนเดียวเหมือน orders.totalPrice เดิม
// แต่แยกค่าจัดส่งออกมาเป็น "หมวดสินค้า" หนึ่งแถวในตาราง/กราฟวงกลมด้วย (ดู buildCategories) เพื่อให้ยอดรวมบวกกับผลรวมของตารางลงตัวเป๊ะ
function orderRevenue(o: OrderRow): number {
  return o.items.reduce((s, it) => s + it.total, 0) + o.shippingFee;
}

function sumRevenue(list: OrderRow[], start: Date, end: Date): number {
  return list
    .filter((o) => o.status === "completed" && o.revenueAt >= start && o.revenueAt < end)
    .reduce((sum, o) => sum + orderRevenue(o), 0);
}

function countOrders(list: OrderRow[], start: Date, end: Date, statusFilter: (s: string) => boolean): number {
  return list.filter((o) => statusFilter(o.status) && o.createdAt >= start && o.createdAt < end).length;
}

function buildCategories(list: OrderRow[], start: Date, end: Date, prevStart: Date, prevEnd: Date): ReportCategory[] {
  // orderIds = ออเดอร์ที่มีหมวดนี้อยู่ (ไม่ซ้ำ) — คอลัมน์ "จำนวนออเดอร์" ต้องนับเป็นออเดอร์ ไม่ใช่นับทีละรายการสินค้า
  const current = new Map<string, { revenue: number; orderIds: Set<string> }>();
  const previous = new Map<string, number>();

  const addToMap = (name: string, orderId: string, amount: number) => {
    const c = current.get(name) ?? { revenue: 0, orderIds: new Set<string>() };
    c.revenue += amount;
    c.orderIds.add(orderId);
    current.set(name, c);
  };

  for (const o of list) {
    if (o.status !== "completed") continue;
    const inCurrent = o.revenueAt >= start && o.revenueAt < end;
    const inPrevious = o.revenueAt >= prevStart && o.revenueAt < prevEnd;
    if (!inCurrent && !inPrevious) continue;
    for (const item of o.items) {
      if (inCurrent) addToMap(item.service, o.id, item.total);
      else previous.set(item.service, (previous.get(item.service) ?? 0) + item.total);
    }
    // ค่าจัดส่งไม่ผูกกับหมวดสินค้าไหน — แยกเป็นแถวของตัวเอง ไม่งั้นยอดรวมของตาราง/กราฟวงกลมจะขาดหายไปจาก "รายได้รวม" ที่รวมค่าจัดส่งด้วย
    if (o.shippingFee > 0) {
      if (inCurrent) addToMap(SHIPPING_CATEGORY_NAME, o.id, o.shippingFee);
      else previous.set(SHIPPING_CATEGORY_NAME, (previous.get(SHIPPING_CATEGORY_NAME) ?? 0) + o.shippingFee);
    }
  }

  const totalRevenue = [...current.values()].reduce((s, c) => s + c.revenue, 0);

  return [...current.entries()]
    .map(([name, c]) => ({
      name,
      orders: c.orderIds.size,
      revenue: c.revenue,
      percentage: totalRevenue > 0 ? Math.round((c.revenue / totalRevenue) * 1000) / 10 : 0,
      change: pctChange(c.revenue, previous.get(name) ?? 0),
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

// แจกแจงจำนวน/ยอดตามสถานะออเดอร์ — นับ "ทุกสถานะ" ไม่ filter เฉพาะ completed เหมือน metrics ด้านบน
// รวมสถานะที่ไม่มีออเดอร์เลยในช่วงนี้ไว้ด้วย (count/revenue = 0) เพื่อให้ฝั่ง UI แสดงครบทุกสถานะเสมอ ไม่ต้องเช็ค missing key เอง
function buildStatusBreakdown(list: OrderRow[], start: Date, end: Date): ReportStatusBreakdown[] {
  const inRange = list.filter((o) => o.createdAt >= start && o.createdAt < end);
  const byStatus = new Map<OrderStatus, { count: number; revenue: number }>();
  for (const status of orderStatusSchema.options) {
    byStatus.set(status, { count: 0, revenue: 0 });
  }
  for (const o of inRange) {
    const entry = byStatus.get(o.status as OrderStatus);
    if (!entry) continue; // สถานะแปลกที่ไม่รู้จัก (ไม่ควรเกิด) ข้ามไปกันพัง
    entry.count += 1;
    entry.revenue += orderRevenue(o);
  }
  return orderStatusSchema.options.map((status) => ({ status, ...byStatus.get(status)! }));
}

// bucket ยอดขายตามช่วงเวลาไว้ขึ้นกราฟ — granularity ต่างกันตาม period เพื่อไม่ให้กราฟรกเกินไปเมื่อช่วงยาว
function buildSeries(period: ReportPeriod, start: Date, now: Date, completed: OrderRow[]): ReportSeriesPoint[] {
  const inRange = completed.filter((o) => o.status === "completed" && o.revenueAt >= start && o.revenueAt < now);

  if (period === "today") {
    const buckets = Array.from({ length: 24 }, (_, h) => ({ label: `${String(h).padStart(2, "0")}:00`, revenue: 0 }));
    for (const o of inRange) buckets[bangkokHour(o.revenueAt)].revenue += orderRevenue(o);
    return buckets;
  }

  // ช่วงเป็นวัน (7days/30days/thisMonth) — แบ่งเป็นก้อนตามจำนวนวันที่กำหนด แล้ว sum ยอดของแต่ละก้อน
  const chunkDays = period === "7days" ? 1 : period === "30days" ? 6 : 7; // thisMonth = รายสัปดาห์
  if (period !== "thisYear") {
    // ปัดขึ้นเสมอ — วันนี้ (ที่ยังไม่ครบ 24 ชม.) ต้องมีก้อนของตัวเอง เดิมใช้ Math.round ทำให้ช่วงก่อนเที่ยงไม่มีก้อนของวันนี้เลย
    const totalDays = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / DAY_MS));
    const points: ReportSeriesPoint[] = [];
    for (let offset = 0; offset < totalDays; offset += chunkDays) {
      const chunkStart = new Date(start.getTime() + offset * DAY_MS);
      const chunkEnd = new Date(Math.min(chunkStart.getTime() + chunkDays * DAY_MS, now.getTime() + 1));
      const revenue = inRange
        .filter((o) => o.revenueAt >= chunkStart && o.revenueAt < chunkEnd)
        .reduce((s, o) => s + orderRevenue(o), 0);
      // วันสุดท้ายของก้อน = instant สุดท้ายก่อน chunkEnd (ก้อนสุดท้ายจบที่ "ตอนนี้" ต้องได้วันนี้ ไม่ใช่เมื่อวาน)
      const label = chunkDays === 1 ? formatThaiDate(chunkStart) : `${formatThaiDate(chunkStart)}-${formatThaiDate(new Date(chunkEnd.getTime() - 1))}`;
      points.push({ label, revenue });
    }
    return points;
  }

  // thisYear — รายเดือน ม.ค. ถึงเดือนปัจจุบัน
  const { y, m: currentMonth } = bangkokYMD(now);
  const points: ReportSeriesPoint[] = [];
  for (let month = 0; month <= currentMonth; month++) {
    const monthStart = bangkokMidnightUtc(y, month, 1);
    const monthEnd = month === currentMonth ? now : bangkokMidnightUtc(y, month + 1, 1);
    const revenue = inRange
      .filter((o) => o.revenueAt >= monthStart && o.revenueAt < monthEnd)
      .reduce((s, o) => s + orderRevenue(o), 0);
    points.push({ label: THAI_MONTHS_SHORT[month], revenue });
  }
  return points;
}

export const reportsRoutes = new Elysia().get("/shops/:shopId/reports", async ({ params, query, cookie, set }) => {
  const authError = await requireShopOwner(cookie, params.shopId, set);
  if (authError) return authError;

  const parsedQuery = reportQuerySchema.safeParse(query);
  if (!parsedQuery.success) {
    set.status = 400;
    return { error: "พารามิเตอร์ไม่ถูกต้อง", details: parsedQuery.error.flatten() };
  }
  const period = parsedQuery.data.period;

  const now = new Date();
  const { y, m, d } = bangkokYMD(now);
  const todayStart = bangkokMidnightUtc(y, m, d);
  const yesterdayStart = new Date(todayStart.getTime() - DAY_MS);
  const elapsedTodayMs = now.getTime() - todayStart.getTime();
  const yesterdayElapsedEnd = new Date(yesterdayStart.getTime() + elapsedTodayMs);

  const start = periodStart(period, todayStart, y, m, d);
  const periodLengthMs = now.getTime() - start.getTime();
  const prevStart = new Date(start.getTime() - periodLengthMs);
  const prevEnd = start;

  const widestStart = new Date(Math.min(start.getTime(), prevStart.getTime(), yesterdayStart.getTime()));

  const rows = await db
    .select({
      orderId: orders.id,
      status: orders.status,
      createdAt: orders.createdAt,
      finishedAt: orders.finishedAt,
      shippingFeeSnapshot: orders.shippingFeeSnapshot,
      legacyServiceType: orders.serviceType,
      legacyTotalPrice: orders.totalPrice,
      itemService: orderItems.serviceNameSnapshot,
      itemTotal: orderItems.itemTotalPrice,
    })
    .from(orders)
    .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
    // ดึงทั้งออเดอร์ที่สั่งในช่วงนี้ และออเดอร์เก่าที่ "เสร็จ" ในช่วงนี้ (รายได้นับตาม finishedAt)
    .where(
      and(
        eq(orders.shopId, params.shopId),
        or(gte(orders.createdAt, widestStart), gte(orders.finishedAt, widestStart)),
        lt(orders.createdAt, now)
      )
    );

  // rows เป็นผลจาก leftJoin (1 แถวต่อ order_item) — รวมกลับเป็น 1 ออเดอร์ต่อ 1 entry ก่อนคำนวณต่อ
  // ออเดอร์เก่าก่อนมีระบบ snapshot (Schema v1) ไม่มีแถวใน order_items เลย (itemService เป็น null) — fallback ไปใช้ totalPrice/serviceType เดิมของออเดอร์แทน (totalPrice เดิมรวมค่าจัดส่งอยู่แล้ว จึงไม่ต้องบวก shippingFee ซ้ำ — ออเดอร์เก่ากลุ่มนี้ไม่มี shippingFeeSnapshot อยู่แล้ว)
  // ไม่งั้นออเดอร์กลุ่มนี้จะหายไปจากรายได้/หมวดสินค้าทั้งหมด (item-based sum ได้ 0 เสมอ) ทั้งที่จ่ายเงินจริง
  const orderMap = new Map<string, OrderRow>();
  for (const r of rows) {
    let entry = orderMap.get(r.orderId);
    if (!entry) {
      entry = {
        id: r.orderId,
        status: r.status,
        createdAt: r.createdAt,
        revenueAt: r.finishedAt ?? r.createdAt,
        shippingFee: Number(r.shippingFeeSnapshot ?? 0),
        items: [],
      };
      orderMap.set(r.orderId, entry);
    }
    if (r.itemService) {
      entry.items.push({ service: r.itemService, total: Number(r.itemTotal ?? 0) });
    } else if (entry.items.length === 0 && r.legacyTotalPrice != null) {
      entry.items.push({ service: r.legacyServiceType ?? "อื่นๆ", total: Number(r.legacyTotalPrice) });
    }
  }
  const list = [...orderMap.values()];

  const notCancelled = (s: string) => s !== "cancelled";
  const isCompleted = (s: string) => s === "completed";

  const totalRevenue = sumRevenue(list, start, now);
  const prevTotalRevenue = sumRevenue(list, prevStart, prevEnd);
  const todayRevenue = sumRevenue(list, todayStart, now);
  const prevTodayRevenue = sumRevenue(list, yesterdayStart, yesterdayElapsedEnd);
  const totalOrders = countOrders(list, start, now, notCancelled);
  const prevTotalOrders = countOrders(list, prevStart, prevEnd, notCancelled);
  // ออเดอร์ที่สำเร็จนับตามวันที่งานเสร็จ (revenueAt) ให้ตรงกับรายได้และตารางหมวดสินค้า
  const countCompleted = (from: Date, to: Date) =>
    list.filter((o) => isCompleted(o.status) && o.revenueAt >= from && o.revenueAt < to).length;
  const completedOrders = countCompleted(start, now);
  const prevCompletedOrders = countCompleted(prevStart, prevEnd);

  const response: ShopReportResponse = {
    period,
    dateLabel: dateLabelFor(period, start, now, y),
    metrics: {
      totalRevenue,
      totalRevenueChange: pctChange(totalRevenue, prevTotalRevenue),
      todayRevenue,
      todayRevenueChange: pctChange(todayRevenue, prevTodayRevenue),
      totalOrders,
      totalOrdersChange: pctChange(totalOrders, prevTotalOrders),
      completedOrders,
      completedOrdersChange: pctChange(completedOrders, prevCompletedOrders),
    },
    categories: buildCategories(list, start, now, prevStart, prevEnd),
    series: buildSeries(period, start, now, list),
    ordersByStatus: buildStatusBreakdown(list, start, now),
  };

  return response;
})

  // ── รายการออเดอร์แบบละเอียดในช่วงเวลาที่เลือก — ใช้ประกอบ Excel export เท่านั้น (แยกจาก /reports หลักเพราะข้อมูลหนักกว่า ไม่ต้องดึงทุกครั้งที่เปิดหน้า) ──────────
  .get("/shops/:shopId/reports/orders", async ({ params, query, cookie, set }) => {
    const authError = await requireShopOwner(cookie, params.shopId, set);
    if (authError) return authError;

    const parsedQuery = reportQuerySchema.safeParse(query);
    if (!parsedQuery.success) {
      set.status = 400;
      return { error: "พารามิเตอร์ไม่ถูกต้อง", details: parsedQuery.error.flatten() };
    }
    const period = parsedQuery.data.period;

    const now = new Date();
    const { y, m, d } = bangkokYMD(now);
    const todayStart = bangkokMidnightUtc(y, m, d);
    const start = periodStart(period, todayStart, y, m, d);

    const rows = await db
      .select({
        orderId: orders.id,
        code: orders.code,
        ref: orders.ref,
        createdAt: orders.createdAt,
        status: orders.status,
        shippingFeeSnapshot: orders.shippingFeeSnapshot,
        legacyServiceType: orders.serviceType,
        legacyTotalPrice: orders.totalPrice,
        customerFirstname: users.firstname,
        customerLastname: users.lastname,
        itemService: orderItems.serviceNameSnapshot,
        itemQuantity: orderItems.quantity,
        itemTotal: orderItems.itemTotalPrice,
      })
      .from(orders)
      .leftJoin(users, eq(orders.customerId, users.id))
      .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(and(eq(orders.shopId, params.shopId), gte(orders.createdAt, start), lt(orders.createdAt, now)))
      .orderBy(orders.createdAt);

    // rows เป็นผลจาก leftJoin (1 แถวต่อ order_item) — รวมกลับเป็น 1 ออเดอร์ต่อ 1 entry เหมือนที่ /reports หลักทำ
    const orderMap = new Map<string, ReportOrderDetail & { itemsList: string[] }>();
    for (const r of rows) {
      let entry = orderMap.get(r.orderId);
      if (!entry) {
        entry = {
          code: r.code,
          ref: r.ref,
          createdAt: r.createdAt.toISOString(),
          status: r.status as OrderStatus,
          customerName: r.customerFirstname ? `${r.customerFirstname} ${r.customerLastname ?? ""}`.trim() : "-",
          itemsSummary: "",
          itemsList: [],
          subtotal: 0,
          shippingFee: Number(r.shippingFeeSnapshot ?? 0),
          totalRevenue: 0,
        };
        orderMap.set(r.orderId, entry);
      }
      if (r.itemService) {
        entry.itemsList.push(`${r.itemService} x${r.itemQuantity ?? 1}`);
        entry.subtotal += Number(r.itemTotal ?? 0);
      } else if (entry.itemsList.length === 0 && r.legacyTotalPrice != null) {
        entry.itemsList.push(r.legacyServiceType ?? "อื่นๆ");
        entry.subtotal += Number(r.legacyTotalPrice);
      }
    }

    const orderDetails: ReportOrderDetail[] = [...orderMap.values()].map(({ itemsList, ...rest }) => ({
      ...rest,
      itemsSummary: itemsList.join(", ") || "-",
      totalRevenue: rest.subtotal + rest.shippingFee,
    }));

    const response: ShopReportOrdersResponse = { orders: orderDetails };
    return response;
  });
