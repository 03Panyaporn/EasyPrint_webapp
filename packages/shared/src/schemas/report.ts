import { z } from "zod";
import type { OrderStatus } from "./order";

// GET /shops/:shopId/reports?period=... — ใช้ทั้งฝั่ง apps/web (เรียก API) และ apps/api (validate query)
export const reportPeriodSchema = z.enum(["today", "7days", "30days", "thisMonth", "thisYear"]);
export type ReportPeriod = z.infer<typeof reportPeriodSchema>;

export const reportQuerySchema = z.object({
  period: reportPeriodSchema.default("today"),
});

// change = null หมายถึง "ไม่มีข้อมูลช่วงก่อนหน้าให้เทียบ" (เช่นร้านเพิ่งเปิด) — ฝั่ง UI ต้องซ่อน %/แสดงข้อความแทนการหารด้วยศูนย์
export interface ReportCategory {
  name: string;
  orders: number;
  revenue: number;
  percentage: number;
  change: number | null;
}

export interface ReportSeriesPoint {
  label: string;
  revenue: number;
}

// จำนวน/ยอดขายแยกตามสถานะออเดอร์ ในช่วงเวลาที่เลือก (นับทุกสถานะ ไม่ใช่แค่ completed เหมือน metrics ด้านบน)
// revenue คำนวณจาก order_items เหมือน metrics อื่นๆ แต่มีความหมายเป็น "ยอดตามใบสั่งซื้อ" ไม่ใช่ "รายได้ที่รับแล้วจริง" สำหรับสถานะที่ยังไม่ completed
export interface ReportStatusBreakdown {
  status: OrderStatus;
  count: number;
  revenue: number;
}

export interface ReportMetrics {
  totalRevenue: number;
  totalRevenueChange: number | null;
  todayRevenue: number;
  todayRevenueChange: number | null;
  totalOrders: number;
  totalOrdersChange: number | null;
  completedOrders: number;
  completedOrdersChange: number | null;
}

export interface ShopReportResponse {
  period: ReportPeriod;
  dateLabel: string;
  metrics: ReportMetrics;
  categories: ReportCategory[];
  series: ReportSeriesPoint[];
  ordersByStatus: ReportStatusBreakdown[];
}

// รายการออเดอร์แบบละเอียดในช่วงเวลาที่เลือก — ใช้ประกอบ Excel export เท่านั้น (แยก endpoint จาก /reports หลักเพราะข้อมูลหนักกว่ามาก)
export interface ReportOrderDetail {
  code: string;
  ref: string;
  createdAt: string;
  status: OrderStatus;
  customerName: string;
  itemsSummary: string; // สรุปชื่อบริการ+จำนวนของทุก item ต่อออเดอร์ เป็นข้อความเดียว เช่น "พิมพ์เอกสาร A4 x2, เข้าเล่มสันกาว x1"
  subtotal: number;
  shippingFee: number;
  totalRevenue: number; // subtotal + shippingFee
}

export interface ShopReportOrdersResponse {
  orders: ReportOrderDetail[];
}
