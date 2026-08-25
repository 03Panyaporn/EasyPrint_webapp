"use client";

import { useCallback, useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Loader2, BarChart3, TrendingUp } from "lucide-react";
import { getMyShop } from "@/lib/api/services";
import { getShopReport } from "@/lib/api/reports";
import type { ShopReportResponse } from "@easyprint/shared";

// สีวนตามลำดับหมวด — หมวดมาจาก serviceNameSnapshot จริงของแต่ละร้าน (ไม่ตายตัว) เหมือนที่ใช้ในหน้า /shop/reports
const CATEGORY_COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f97316", "#ec4899", "#6366f1", "#f59e0b"];

export default function DashboardCharts() {
  const [report, setReport] = useState<ShopReportResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    getMyShop()
      .then(({ shop }) => getShopReport(shop.id, "today"))
      .then(setReport)
      .catch((err) => console.error("โหลดข้อมูลกราฟรายได้ไม่สำเร็จ:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
    // รีเฟรชกราฟทันทีเมื่อสถานะออเดอร์เปลี่ยน (เช่น เพิ่งกดยืนยัน/เสร็จงาน) ไม่ต้องรอ mount ใหม่
    window.addEventListener("order-status-updated", loadData);
    return () => window.removeEventListener("order-status-updated", loadData);
  }, [loadData]);

  const categories = (report?.categories ?? []).map((c, i) => ({
    ...c,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));
  const todayRevenue = report?.metrics.todayRevenue ?? 0;
  const series = report?.series ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

      {/* Donut Chart - รายได้วันนี้ (แยกตามประเภทสินค้า) */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col h-[350px]">
        <h2 className="text-base font-bold text-slate-800 mb-4">รายได้วันนี้ (แยกตามประเภทสินค้า)</h2>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-300">
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <BarChart3 size={32} className="mb-2 opacity-30" />
            <span className="text-sm font-medium">ยังไม่มีออเดอร์ที่เสร็จสิ้นวันนี้</span>
          </div>
        ) : (
          <div className="flex-1 flex items-center relative">

            <div className="w-[180px] h-[180px] shrink-0 relative">
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-slate-500 font-medium">รวม</span>
                <span className="text-xl font-bold text-slate-800 leading-tight">
                  {todayRevenue.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400">บาท</span>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="revenue"
                    stroke="none"
                  >
                    {categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${Number(value).toLocaleString()} บาท`, "รายได้"]}
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 pl-4 flex flex-col gap-3 justify-center">
              {categories.map((item, idx) => (
                <div key={idx} className="flex items-center justify-start">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium text-slate-700">{item.name}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>

      {/* Area Chart - รายได้ตลอดวัน */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col h-[350px]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800">รายได้ตลอดวัน (บาท)</h2>
          <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg">
            วันนี้
          </span>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-300">
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : series.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <TrendingUp size={32} className="mb-2 opacity-30" />
            <span className="text-sm font-medium">ยังไม่มีข้อมูลสำหรับวันนี้</span>
          </div>
        ) : (
          <div className="flex-1 w-full relative -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={series}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(value) => (value >= 1000 ? `${value / 1000}K` : value)}
                  dx={-5}
                />
                <Tooltip
                  formatter={(value: any) => [`${Number(value).toLocaleString()} บาท`, "รายได้"]}
                  labelStyle={{ color: "#475569", fontWeight: "bold", marginBottom: "4px" }}
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  activeDot={{ r: 6, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    </div>
  );
}
