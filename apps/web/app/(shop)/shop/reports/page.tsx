"use client";

import { useState } from "react";
import {
  Wallet,
  Coins,
  ShoppingCart,
  CheckCircle2,
  Calendar as CalendarIcon,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  ChevronDown,
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

// ─────────────────────────────────────────────────────────
// Types & Data Definitions
// ─────────────────────────────────────────────────────────

type PeriodKey = "today" | "7days" | "30days" | "thisMonth" | "thisYear";

interface CategoryData {
  name: string;
  orders: number;
  revenue: number;
  percentage: number;
  change: number;
  color: string;
  dotBg: string;
}

interface HourlyData {
  time: string;
  revenue: number;
}

interface SummaryMetrics {
  totalRevenue: number;
  totalRevenueChange: number;
  todayRevenue: number;
  todayRevenueChange: number;
  totalOrders: number;
  totalOrdersChange: number;
  completedOrders: number;
  completedOrdersChange: number;
}

const REPORT_DATA: Record<
  PeriodKey,
  {
    metrics: SummaryMetrics;
    categories: CategoryData[];
    hourly: HourlyData[];
    dateLabel: string;
  }
> = {
  today: {
    dateLabel: "26/05/2024",
    metrics: {
      totalRevenue: 8540,
      totalRevenueChange: 12,
      todayRevenue: 8540,
      todayRevenueChange: 12,
      totalOrders: 95,
      totalOrdersChange: 14,
      completedOrders: 73,
      completedOrdersChange: 10,
    },
    categories: [
      { name: "โปสเตอร์", orders: 38, revenue: 3650, percentage: 42.7, change: 15, color: "#7C3AED", dotBg: "bg-purple-600" },
      { name: "ปริ้นสี", orders: 26, revenue: 2450, percentage: 28.7, change: 10, color: "#06B6D4", dotBg: "bg-cyan-500" },
      { name: "ปริ้นขาวดำ", orders: 15, revenue: 1520, percentage: 17.8, change: 8, color: "#10B981", dotBg: "bg-emerald-500" },
      { name: "สติ๊กเกอร์", orders: 11, revenue: 720, percentage: 8.4, change: -3, color: "#F97316", dotBg: "bg-orange-500" },
      { name: "อื่น ๆ", orders: 5, revenue: 200, percentage: 2.4, change: 5, color: "#EC4899", dotBg: "bg-pink-500" },
    ],
    hourly: [
      { time: "00:00", revenue: 1200 },
      { time: "04:00", revenue: 2500 },
      { time: "08:00", revenue: 2700 },
      { time: "12:00", revenue: 6840 },
      { time: "16:00", revenue: 4700 },
      { time: "20:00", revenue: 6500 },
      { time: "23:59", revenue: 3900 },
    ],
  },
  "7days": {
    dateLabel: "20/05/2024 - 26/05/2024",
    metrics: {
      totalRevenue: 56800,
      totalRevenueChange: 18,
      todayRevenue: 8540,
      todayRevenueChange: 12,
      totalOrders: 620,
      totalOrdersChange: 15,
      completedOrders: 590,
      completedOrdersChange: 14,
    },
    categories: [
      { name: "โปสเตอร์", orders: 240, revenue: 24500, percentage: 43.1, change: 18, color: "#7C3AED", dotBg: "bg-purple-600" },
      { name: "ปริ้นสี", orders: 175, revenue: 16200, percentage: 28.5, change: 12, color: "#06B6D4", dotBg: "bg-cyan-500" },
      { name: "ปริ้นขาวดำ", orders: 110, revenue: 9800, percentage: 17.2, change: 9, color: "#10B981", dotBg: "bg-emerald-500" },
      { name: "สติ๊กเกอร์", orders: 65, revenue: 4800, percentage: 8.5, change: 4, color: "#F97316", dotBg: "bg-orange-500" },
      { name: "อื่น ๆ", orders: 30, revenue: 1500, percentage: 2.7, change: 2, color: "#EC4899", dotBg: "bg-pink-500" },
    ],
    hourly: [
      { time: "จันทร์", revenue: 7200 },
      { time: "อังคาร", revenue: 8100 },
      { time: "พุธ", revenue: 7800 },
      { time: "พฤหัส", revenue: 8900 },
      { time: "ศุกร์", revenue: 9400 },
      { time: "เสาร์", revenue: 6860 },
      { time: "อาทิตย์", revenue: 8540 },
    ],
  },
  "30days": {
    dateLabel: "27/04/2024 - 26/05/2024",
    metrics: {
      totalRevenue: 245000,
      totalRevenueChange: 22,
      todayRevenue: 8540,
      todayRevenueChange: 12,
      totalOrders: 2750,
      totalOrdersChange: 19,
      completedOrders: 2680,
      completedOrdersChange: 20,
    },
    categories: [
      { name: "โปสเตอร์", orders: 1100, revenue: 105000, percentage: 42.8, change: 24, color: "#7C3AED", dotBg: "bg-purple-600" },
      { name: "ปริ้นสี", orders: 780, revenue: 70000, percentage: 28.6, change: 16, color: "#06B6D4", dotBg: "bg-cyan-500" },
      { name: "ปริ้นขาวดำ", orders: 510, revenue: 43000, percentage: 17.6, change: 11, color: "#10B981", dotBg: "bg-emerald-500" },
      { name: "สติ๊กเกอร์", orders: 240, revenue: 21000, percentage: 8.6, change: 6, color: "#F97316", dotBg: "bg-orange-500" },
      { name: "อื่น ๆ", orders: 120, revenue: 6000, percentage: 2.4, change: 3, color: "#EC4899", dotBg: "bg-pink-500" },
    ],
    hourly: [
      { time: "สัปดาห์ 1", revenue: 54000 },
      { time: "สัปดาห์ 2", revenue: 59000 },
      { time: "สัปดาห์ 3", revenue: 64000 },
      { time: "สัปดาห์ 4", revenue: 68000 },
    ],
  },
  thisMonth: {
    dateLabel: "01/05/2024 - 26/05/2024",
    metrics: {
      totalRevenue: 212000,
      totalRevenueChange: 20,
      todayRevenue: 8540,
      todayRevenueChange: 12,
      totalOrders: 2380,
      totalOrdersChange: 17,
      completedOrders: 2310,
      completedOrdersChange: 18,
    },
    categories: [
      { name: "โปสเตอร์", orders: 960, revenue: 90000, percentage: 42.5, change: 22, color: "#7C3AED", dotBg: "bg-purple-600" },
      { name: "ปริ้นสี", orders: 680, revenue: 61000, percentage: 28.8, change: 15, color: "#06B6D4", dotBg: "bg-cyan-500" },
      { name: "ปริ้นขาวดำ", orders: 440, revenue: 37500, percentage: 17.7, change: 10, color: "#10B981", dotBg: "bg-emerald-500" },
      { name: "สติ๊กเกอร์", orders: 200, revenue: 18000, percentage: 8.5, change: 5, color: "#F97316", dotBg: "bg-orange-500" },
      { name: "อื่น ๆ", orders: 100, revenue: 5500, percentage: 2.5, change: 4, color: "#EC4899", dotBg: "bg-pink-500" },
    ],
    hourly: [
      { time: "1-5 พ.ค.", revenue: 38000 },
      { time: "6-10 พ.ค.", revenue: 42000 },
      { time: "11-15 พ.ค.", revenue: 41000 },
      { time: "16-20 พ.ค.", revenue: 44000 },
      { time: "21-26 พ.ค.", revenue: 47000 },
    ],
  },
  thisYear: {
    dateLabel: "ปี 2024",
    metrics: {
      totalRevenue: 1280000,
      totalRevenueChange: 35,
      todayRevenue: 8540,
      todayRevenueChange: 12,
      totalOrders: 14500,
      totalOrdersChange: 28,
      completedOrders: 14200,
      completedOrdersChange: 30,
    },
    categories: [
      { name: "โปสเตอร์", orders: 6100, revenue: 550000, percentage: 43.0, change: 38, color: "#7C3AED", dotBg: "bg-purple-600" },
      { name: "ปริ้นสี", orders: 4100, revenue: 365000, percentage: 28.5, change: 30, color: "#06B6D4", dotBg: "bg-cyan-500" },
      { name: "ปริ้นขาวดำ", orders: 2600, revenue: 225000, percentage: 17.6, change: 22, color: "#10B981", dotBg: "bg-emerald-500" },
      { name: "สติ๊กเกอร์", orders: 1200, revenue: 108000, percentage: 8.4, change: 15, color: "#F97316", dotBg: "bg-orange-500" },
      { name: "อื่น ๆ", orders: 500, revenue: 32000, percentage: 2.5, change: 10, color: "#EC4899", dotBg: "bg-pink-500" },
    ],
    hourly: [
      { time: "ม.ค.", revenue: 95000 },
      { time: "ก.พ.", revenue: 110000 },
      { time: "มี.ค.", revenue: 125000 },
      { time: "เม.ย.", revenue: 130000 },
      { time: "พ.ค.", revenue: 212000 },
    ],
  },
};

const PERIOD_TABS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "วันนี้" },
  { key: "7days", label: "7 วัน" },
  { key: "30days", label: "30 วัน" },
  { key: "thisMonth", label: "เดือนนี้" },
  { key: "thisYear", label: "ปีนี้" },
];

export default function ReportsPage() {
  const [activePeriod, setActivePeriod] = useState<PeriodKey>("today");
  const [exporting, setExporting] = useState(false);

  const currentData = REPORT_DATA[activePeriod];
  const { metrics, categories, hourly, dateLabel } = currentData;

  const handleExportExcel = () => {
    setExporting(true);
    setTimeout(() => {
      const content =
        "ประเภทสินค้า,จำนวนออเดอร์,รายได้รวม (บาท),สัดส่วน,เปลี่ยนแปลงจากเมื่อวาน\n" +
        categories
          .map(
            (c) =>
              `${c.name},${c.orders},${c.revenue},${c.percentage}%,${c.change > 0 ? "+" : ""}${c.change}%`
          )
          .join("\n");

      const blob = new Blob(["\uFEFF" + content], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `EasyPrint_Report_${activePeriod}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExporting(false);
    }, 600);
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

          {/* Date Picker Button */}
          <button className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl shadow-2xs hover:border-purple-300 hover:bg-purple-50/30 transition-all">
            <CalendarIcon size={13} className="text-purple-600" />
            <span>{dateLabel}</span>
            <ChevronDown size={12} className="text-gray-400" />
          </button>

          {/* Export Button */}
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-xl shadow-sm transition-all disabled:opacity-70 cursor-pointer"
          >
            <FileSpreadsheet size={14} />
            <span>{exporting ? "ส่งออก..." : "Export Excel"}</span>
          </button>
        </div>
      </div>

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
              <div className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 mt-0.5">
                <TrendingUp size={11} />
                <span>↑ {metrics.totalRevenueChange}% จากเมื่อวาน</span>
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
              <div className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 mt-0.5">
                <TrendingUp size={11} />
                <span>↑ {metrics.todayRevenueChange}% จากเมื่อวาน</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: จำนวนออเดอร์วันนี้ */}
        <div className="bg-sky-50/50 border border-sky-100/70 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-xs shrink-0">
              <ShoppingCart size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-gray-500 leading-none">จำนวนออเดอร์วันนี้</p>
              <p className="text-lg font-black text-gray-900 mt-0.5 tracking-tight leading-tight">
                {metrics.totalOrders.toLocaleString()}{" "}
                <span className="text-xs font-bold text-gray-600">ออเดอร์</span>
              </p>
              <div className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 mt-0.5">
                <TrendingUp size={11} />
                <span>↑ {metrics.totalOrdersChange}% จากเมื่อวาน</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: ออเดอร์ที่สำเร็จวันนี้ */}
        <div className="bg-amber-50/50 border border-amber-100/70 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-xs shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-gray-500 leading-none">ออเดอร์ที่สำเร็จวันนี้</p>
              <p className="text-lg font-black text-gray-900 mt-0.5 tracking-tight leading-tight">
                {metrics.completedOrders.toLocaleString()}{" "}
                <span className="text-xs font-bold text-gray-600">ออเดอร์</span>
              </p>
              <div className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 mt-0.5">
                <TrendingUp size={11} />
                <span>↑ {metrics.completedOrdersChange}% จากเมื่อวาน</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          Charts Grid (Ultra Compact Heights)
         ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
        {/* Left Chart: Doughnut */}
        <div className="lg:col-span-5 bg-white border border-gray-100 rounded-2xl p-3 shadow-2xs flex flex-col justify-between">
          <h2 className="text-xs font-bold text-gray-800 mb-1">
            รายได้วันนี้ (แยกตามประเภทสินค้า)
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
                  {metrics.todayRevenue.toLocaleString()}
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
              รายได้ตลอดวัน (บาท)
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full">
              เรียลไทม์
            </span>
          </div>

          <div className="w-full h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={hourly}
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
                  dataKey="time"
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
                          <p className="text-gray-400">{data.time} น.</p>
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
                <th className="py-2 px-3 rounded-r-xl">เปลี่ยนแปลงจากเมื่อวาน</th>
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
                    {row.change >= 0 ? (
                      <span className="inline-flex items-center gap-0.5 text-emerald-600 font-bold">
                        <TrendingUp size={12} />
                        ↑ {row.change}%
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-rose-500 font-bold">
                        <TrendingDown size={12} />↓ {Math.abs(row.change)}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {/* Total Summary Row */}
              <tr className="bg-purple-50/80 text-purple-950 font-bold border-t border-purple-100 rounded-xl">
                <td className="py-2 px-3 text-purple-900 rounded-l-xl">รวมทั้งหมด</td>
                <td className="py-2 px-3 text-purple-900 font-extrabold">{metrics.totalOrders}</td>
                <td className="py-2 px-3 text-purple-900 font-black text-xs">
                  {metrics.todayRevenue.toLocaleString()}
                </td>
                <td className="py-2 px-3 text-purple-900 font-extrabold">100%</td>
                <td className="py-2 px-3 text-purple-700 font-extrabold rounded-r-xl">
                  <span className="inline-flex items-center gap-0.5 text-emerald-600">
                    <TrendingUp size={12} />
                    ↑ {metrics.todayRevenueChange}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
