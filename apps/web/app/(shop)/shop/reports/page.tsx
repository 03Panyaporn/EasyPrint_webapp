"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Wallet,
  Coins,
  ShoppingCart,
  CheckCircle2,
  Calendar as CalendarIcon,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { ReportPeriod, ShopReportResponse } from "@easyprint/shared";
import { getMyShop, type MyShop } from "@/lib/api/services";
import { getShopReport, getShopReportOrders } from "@/lib/api/reports";
import { ApiError } from "@/lib/api/client";
import { statusConfig } from "@/components/shop/orders/statusConfig";

// สีวนตามลำดับหมวด — หมวดมาจาก serviceNameSnapshot จริงของแต่ละร้าน (ไม่ตายตัว) จึงกำหนดสีตาม index แทนที่จะ hardcode ต่อชื่อ
const CATEGORY_PALETTE: { color: string; dotBg: string }[] = [
  { color: "#7C3AED", dotBg: "bg-purple-600" },
  { color: "#06B6D4", dotBg: "bg-cyan-500" },
  { color: "#10B981", dotBg: "bg-emerald-500" },
  { color: "#F97316", dotBg: "bg-orange-500" },
  { color: "#EC4899", dotBg: "bg-pink-500" },
  { color: "#6366F1", dotBg: "bg-indigo-500" },
  { color: "#F59E0B", dotBg: "bg-amber-500" },
];

const PERIOD_TABS: { key: ReportPeriod; label: string }[] = [
  { key: "today", label: "วันนี้" },
  { key: "7days", label: "7 วัน" },
  { key: "30days", label: "30 วัน" },
  { key: "thisMonth", label: "เดือนนี้" },
  { key: "thisYear", label: "ปีนี้" },
];

// การ์ด/แถวราคาที่มี % เปลี่ยนแปลง — change เป็น null เมื่อช่วงก่อนหน้าไม่มีข้อมูลให้เทียบ (กันหารด้วยศูนย์) ต้องซ่อน %/โชว์ข้อความแทน
function ChangeBadge({ change, size = 11 }: { change: number | null; size?: number }) {
  if (change === null) {
    return <span className="text-[10px] font-semibold text-gray-400">ไม่มีข้อมูลเทียบ</span>;
  }
  const isUp = change >= 0;
  const Icon = isUp ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-0.5 font-bold ${isUp ? "text-emerald-600" : "text-rose-500"}`}>
      <Icon size={size} />
      {isUp ? "↑" : "↓"} {Math.abs(change)}%
    </span>
  );
}

export default function ReportsPage() {
  const [shopId, setShopId] = useState<string | null>(null);
  const [activePeriod, setActivePeriod] = useState<ReportPeriod>("today");
  const [report, setReport] = useState<ShopReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [exporting, setExporting] = useState(false);

  // โหลด shopId ครั้งเดียวตอนเข้าหน้า
  useEffect(() => {
    getMyShop()
      .then(({ shop }: { shop: MyShop }) => setShopId(shop.id))
      .catch((err: unknown) => setLoadError(err instanceof ApiError ? err.message : "โหลดข้อมูลร้านค้าไม่สำเร็จ"));
  }, []);

  const loadReport = useCallback((id: string, period: ReportPeriod) => {
    setLoading(true);
    setLoadError("");
    getShopReport(id, period)
      .then(setReport)
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "โหลดรายงานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (shopId) loadReport(shopId, activePeriod);
  }, [shopId, activePeriod, loadReport]);

  const categories = (report?.categories ?? []).map((c, i) => ({ ...c, ...CATEGORY_PALETTE[i % CATEGORY_PALETTE.length] }));
  const metrics = report?.metrics;
  const ordersByStatus = report?.ordersByStatus ?? [];

  const handleExportExcel = async () => {
    if (!report || !shopId) return;
    setExporting(true);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const { orders: orderDetails } = await getShopReportOrders(shopId, activePeriod);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "EasyPrint";
      workbook.created = new Date();

      // Sheet 1: สรุปตามหมวดสินค้า + แยกตามสถานะออเดอร์
      const summarySheet = workbook.addWorksheet("สรุป");
      summarySheet.addRow(["รายงานร้านค้า", report.dateLabel]);
      summarySheet.addRow([]);
      summarySheet.addRow(["รายได้รวม (บาท)", metrics?.totalRevenue ?? 0]);
      summarySheet.addRow(["รายได้วันนี้ (บาท)", metrics?.todayRevenue ?? 0]);
      summarySheet.addRow(["จำนวนออเดอร์", metrics?.totalOrders ?? 0]);
      summarySheet.addRow(["ออเดอร์ที่สำเร็จ", metrics?.completedOrders ?? 0]);
      summarySheet.addRow([]);

      summarySheet.addRow(["ประเภทสินค้า", "จำนวนออเดอร์", "รายได้รวม (บาท)", "สัดส่วน", "เปลี่ยนแปลงจากช่วงก่อนหน้า"]).font = { bold: true };
      for (const c of categories) {
        summarySheet.addRow([
          c.name,
          c.orders,
          c.revenue,
          `${c.percentage}%`,
          c.change === null ? "-" : `${c.change > 0 ? "+" : ""}${c.change}%`,
        ]);
      }
      summarySheet.addRow([]);

      summarySheet.addRow(["สถานะออเดอร์", "จำนวนออเดอร์", "ยอดตามใบสั่งซื้อ (บาท)"]).font = { bold: true };
      for (const s of ordersByStatus) {
        summarySheet.addRow([statusConfig[s.status].label, s.count, s.revenue]);
      }
      summarySheet.columns.forEach((col) => (col.width = 22));

      // Sheet 2: รายการออเดอร์แบบละเอียด
      const ordersSheet = workbook.addWorksheet("รายการออเดอร์");
      const header = ordersSheet.addRow([
        "เลขที่ออเดอร์",
        "รหัสอ้างอิง",
        "วันที่สั่งซื้อ",
        "สถานะ",
        "ลูกค้า",
        "รายการสินค้า",
        "ยอดสินค้า (บาท)",
        "ค่าจัดส่ง (บาท)",
        "ยอดรวม (บาท)",
      ]);
      header.font = { bold: true };
      for (const o of orderDetails) {
        ordersSheet.addRow([
          o.code,
          o.ref,
          new Date(o.createdAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }),
          statusConfig[o.status].label,
          o.customerName,
          o.itemsSummary,
          o.subtotal,
          o.shippingFee,
          o.totalRevenue,
        ]);
      }
      ordersSheet.columns.forEach((col) => (col.width = 18));
      ordersSheet.getColumn(6).width = 45;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `EasyPrint_Report_${activePeriod}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "ส่งออกรายงานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-3 pb-2 max-w-[1600px] mx-auto">
      {/* ─────────────────────────────────────────────────────────
          Header & Filter Controls Combined Row (Ultra Compact)
         ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 bg-white/60 p-2.5 rounded-2xl border border-gray-100/80 shadow-2xs">
        {/* Left: Title */}
        <div>
          <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none">
            รายงาน
          </h1>
          <p className="text-[11px] text-gray-500 font-medium mt-0.5">
            ดูรายได้ รายการสั่งซื้อ และวิเคราะห์ข้อมูลร้านค้า
          </p>
        </div>

        {/* Right: Filters & Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Buttons */}
          <div className="inline-flex items-center p-0.5 bg-gray-100/80 rounded-xl gap-0.5">
            {PERIOD_TABS.map((tab) => {
              const isActive = activePeriod === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActivePeriod(tab.key)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all duration-150 select-none ${
                    isActive
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-purple-700 hover:bg-white/60"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Date Range Label */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl shadow-2xs">
            <CalendarIcon size={13} className="text-purple-600" />
            <span>{report?.dateLabel ?? "-"}</span>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportExcel}
            disabled={exporting || !report}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <FileSpreadsheet size={14} />
            <span>{exporting ? "ส่งออก..." : "Export Excel"}</span>
          </button>
        </div>
      </div>

      {loadError && (
        <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-600 font-semibold">
          {loadError}
        </div>
      )}

      {loading && !report ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <Loader2 size={24} className="animate-spin" />
          <p className="text-sm">กำลังโหลดรายงาน...</p>
        </div>
      ) : metrics ? (
        <>
          {/* ─────────────────────────────────────────────────────────
              KPI Summary Cards (Ultra Compact 4 Columns)
             ───────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Card 1: รายได้รวม */}
            <div className="bg-purple-50/50 border border-purple-100/70 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-xs shrink-0">
                  <Wallet size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-gray-500 leading-none">รายได้รวม</p>
                  <p className="text-lg font-black text-gray-900 mt-0.5 tracking-tight leading-tight">
                    {metrics.totalRevenue.toLocaleString()}{" "}
                    <span className="text-xs font-bold text-gray-600">บาท</span>
                  </p>
                  <div className="mt-0.5 text-[10px]">
                    <ChangeBadge change={metrics.totalRevenueChange} />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: รายได้วันนี้ */}
            <div className="bg-emerald-50/50 border border-emerald-100/70 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-xs shrink-0">
                  <Coins size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-gray-500 leading-none">รายได้วันนี้</p>
                  <p className="text-lg font-black text-gray-900 mt-0.5 tracking-tight leading-tight">
                    {metrics.todayRevenue.toLocaleString()}{" "}
                    <span className="text-xs font-bold text-gray-600">บาท</span>
                  </p>
                  <div className="mt-0.5 text-[10px]">
                    <ChangeBadge change={metrics.todayRevenueChange} />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: จำนวนออเดอร์ */}
            <div className="bg-sky-50/50 border border-sky-100/70 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-xs shrink-0">
                  <ShoppingCart size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-gray-500 leading-none">จำนวนออเดอร์</p>
                  <p className="text-lg font-black text-gray-900 mt-0.5 tracking-tight leading-tight">
                    {metrics.totalOrders.toLocaleString()}{" "}
                    <span className="text-xs font-bold text-gray-600">ออเดอร์</span>
                  </p>
                  <div className="mt-0.5 text-[10px]">
                    <ChangeBadge change={metrics.totalOrdersChange} />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: ออเดอร์ที่สำเร็จ */}
            <div className="bg-amber-50/50 border border-amber-100/70 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-xs shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-gray-500 leading-none">ออเดอร์ที่สำเร็จ</p>
                  <p className="text-lg font-black text-gray-900 mt-0.5 tracking-tight leading-tight">
                    {metrics.completedOrders.toLocaleString()}{" "}
                    <span className="text-xs font-bold text-gray-600">ออเดอร์</span>
                  </p>
                  <div className="mt-0.5 text-[10px]">
                    <ChangeBadge change={metrics.completedOrdersChange} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              Orders by Status
             ───────────────────────────────────────────────────────── */}
          {ordersByStatus.some((s) => s.count > 0) && (
            <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-2xs overflow-hidden">
              <h2 className="text-xs font-bold text-gray-800 mb-2">
                ออเดอร์แยกตามสถานะ
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {ordersByStatus.map((s) => {
                  const meta = statusConfig[s.status];
                  return (
                    <div
                      key={s.status}
                      className={`rounded-xl border p-2.5 ${meta.badgeBg} ${meta.badgeBorder}`}
                    >
                      <p className={`text-[10px] font-bold ${meta.badgeText}`}>{meta.label}</p>
                      <p className="text-lg font-black text-gray-900 mt-0.5 leading-none">{s.count}</p>
                      <p className="text-[10px] font-semibold text-gray-500 mt-1">
                        {s.revenue.toLocaleString()} บาท
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {categories.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-2xs text-center text-sm text-gray-400">
              ยังไม่มีออเดอร์ที่เสร็จสิ้นในช่วงเวลานี้
            </div>
          ) : (
            <>
              {/* ─────────────────────────────────────────────────────────
                  Charts Grid (Ultra Compact Heights)
                 ───────────────────────────────────────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
                {/* Left Chart: Doughnut */}
                <div className="lg:col-span-5 bg-white border border-gray-100 rounded-2xl p-3 shadow-2xs flex flex-col justify-between">
                  <h2 className="text-xs font-bold text-gray-800 mb-1">
                    รายได้ (แยกตามประเภทสินค้า)
                  </h2>

                  <div className="flex items-center justify-between gap-3 my-auto">
                    {/* Pie Container */}
                    <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categories}
                            cx="50%"
                            cy="50%"
                            innerRadius={36}
                            outerRadius={58}
                            paddingAngle={2}
                            dataKey="revenue"
                          >
                            {categories.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: any) => [
                              `${Number(value || 0).toLocaleString()} บาท`,
                              "รายได้",
                            ]}
                            contentStyle={{
                              backgroundColor: "#fff",
                              borderRadius: "10px",
                              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                              border: "none",
                              fontSize: "11px",
                              padding: "4px 8px",
                              fontWeight: 600,
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      {/* Center Badge */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                        <span className="text-[9px] font-semibold text-gray-400 leading-none">รวม</span>
                        <span className="text-xs font-black text-gray-900 leading-tight">
                          {metrics.totalRevenue.toLocaleString()}
                        </span>
                        <span className="text-[9px] font-bold text-gray-500 leading-none">บาท</span>
                      </div>
                    </div>

                    {/* Category Breakdown List */}
                    <div className="flex-1 w-full space-y-1">
                      {categories.map((cat) => (
                        <div
                          key={cat.name}
                          className="flex items-center justify-between text-[11px] font-semibold"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-gray-700 truncate">{cat.name}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-gray-900 font-bold">
                              {cat.revenue.toLocaleString()}
                            </span>
                            <span className="text-gray-400 font-medium text-[10px] w-9 text-right">
                              ({cat.percentage}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Chart: Line Area Chart */}
                <div className="lg:col-span-7 bg-white border border-gray-100 rounded-2xl p-3 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-xs font-bold text-gray-800">
                      รายได้ตามช่วงเวลา (บาท)
                    </h2>
                  </div>

                  <div className="w-full h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={report?.series ?? []}
                        margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis
                          dataKey="label"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "#64748B", fontSize: 10, fontWeight: 600 }}
                          dy={4}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "#64748B", fontSize: 9, fontWeight: 600 }}
                          tickFormatter={(val) => (val >= 1000 ? `${val / 1000}K` : `${val}`)}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white px-3 py-1.5 rounded-xl shadow-lg border border-purple-100 text-[11px] font-semibold space-y-0.5">
                                  <p className="text-gray-400">{data.label}</p>
                                  <p className="text-purple-600 text-xs font-bold">
                                    รายได้ {payload[0].value?.toLocaleString()} บาท
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#7C3AED"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                          activeDot={{
                            r: 5,
                            fill: "#7C3AED",
                            stroke: "#fff",
                            strokeWidth: 2,
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────
                  Summary Table Section (Ultra Compact Rows)
                 ───────────────────────────────────────────────────────── */}
              <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-2xs overflow-hidden">
                <h2 className="text-xs font-bold text-gray-800 mb-2">
                  สรุปข้อมูลรายได้ตามประเภทสินค้า
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-purple-50/60 text-gray-600 text-[11px] font-bold rounded-xl">
                        <th className="py-2 px-3 rounded-l-xl">ประเภทสินค้า</th>
                        <th className="py-2 px-3">จำนวนออเดอร์</th>
                        <th className="py-2 px-3">รายได้รวม (บาท)</th>
                        <th className="py-2 px-3">สัดส่วน</th>
                        <th className="py-2 px-3 rounded-r-xl">เปลี่ยนแปลงจากช่วงก่อนหน้า</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-[11px]">
                      {categories.map((row) => (
                        <tr key={row.name} className="hover:bg-purple-50/20 transition-colors">
                          <td className="py-2 px-3 font-semibold text-gray-800">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: row.color }}
                              />
                              <span>{row.name}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 font-semibold text-gray-700">{row.orders}</td>
                          <td className="py-2 px-3 font-bold text-gray-900">{row.revenue.toLocaleString()}</td>
                          <td className="py-2 px-3 font-semibold text-gray-700">{row.percentage}%</td>
                          <td className="py-2 px-3 font-semibold">
                            <ChangeBadge change={row.change} size={12} />
                          </td>
                        </tr>
                      ))}

                      {/* Total Summary Row */}
                      <tr className="bg-purple-50/80 text-purple-950 font-bold border-t border-purple-100 rounded-xl">
                        <td className="py-2 px-3 text-purple-900 rounded-l-xl">รวมทั้งหมด</td>
                        <td className="py-2 px-3 text-purple-900 font-extrabold">
                          {categories.reduce((s, c) => s + c.orders, 0)}
                        </td>
                        <td className="py-2 px-3 text-purple-900 font-black text-xs">
                          {metrics.totalRevenue.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-purple-900 font-extrabold">100%</td>
                        <td className="py-2 px-3 text-purple-700 font-extrabold rounded-r-xl">
                          <ChangeBadge change={metrics.totalRevenueChange} size={12} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
