import type { ReportPeriod, ShopReportResponse, ShopReportOrdersResponse } from "@easyprint/shared";
import { apiFetch } from "./client";

export function getShopReport(shopId: string, period: ReportPeriod) {
  return apiFetch<ShopReportResponse>(`/shops/${shopId}/reports?period=${period}`);
}

export function getShopReportOrders(shopId: string, period: ReportPeriod) {
  return apiFetch<ShopReportOrdersResponse>(`/shops/${shopId}/reports/orders?period=${period}`);
}
