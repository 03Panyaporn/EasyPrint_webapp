"use client";

import { useEffect, useState } from "react";
import { Wallet, Clock, UserCog, Truck, CheckCircle2, XCircle, ArrowUp, ArrowDown } from "lucide-react";
import { getMyShop } from "@/lib/api/services";
import { listShopOrders } from "@/lib/api/orders";
import { getShopReport } from "@/lib/api/reports";
import { toBangkokDateStr } from "@/lib/shopHours";
import { toOrder } from "@/lib/ordersAdapter";
import { Order } from "../orders/types";
import { Skeleton } from "@/components/ui/Skeleton";


export default function StatCards() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    {
      title: "รายได้วันนี้",
      value: "0",
      unit: "บาท",
      trend: "up",
      trendValue: "0%",
      trendText: "จากเมื่อวาน",
      icon: Wallet,
      iconColor: "text-orange-600",
      iconBg: "bg-orange-500",
      bgColor: "bg-orange-50/50",
      isHighlighted: true,
    },
    {
      title: "รอตรวจสอบ",
      value: "0",
      unit: "รายการ",
      trend: "none",
      trendValue: "",
      trendText: "ค้างอยู่ตอนนี้",
      icon: Clock,
      iconColor: "text-orange-500",
      iconBg: "bg-orange-50",
      bgColor: "bg-white",
      isHighlighted: false,
    },
    {
      title: "กำลังดำเนินการ",
      value: "0",
      unit: "รายการ",
      trend: "none",
      trendValue: "",
      trendText: "ค้างอยู่ตอนนี้",
      icon: UserCog,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
      bgColor: "bg-white",
      isHighlighted: false,
    },
    {
      title: "กำลังจัดส่ง",
      value: "0",
      unit: "รายการ",
      trend: "none",
      trendValue: "",
      trendText: "ค้างอยู่ตอนนี้",
      icon: Truck,
      iconColor: "text-violet-600",
      iconBg: "bg-violet-100",
      bgColor: "bg-white",
      isHighlighted: false,
    },
    {
      title: "เสร็จสิ้นวันนี้",
      value: "0",
      unit: "รายการ",
      trend: "up",
      trendValue: "0",
      trendText: "จากเมื่อวาน",
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-100",
      bgColor: "bg-white",
      isHighlighted: false,
    },
    {
      title: "ยกเลิกวันนี้",
      value: "0",
      unit: "รายการ",
      trend: "down",
      trendValue: "0",
      trendText: "จากเมื่อวาน",
      icon: XCircle,
      iconColor: "text-red-500",
      iconBg: "bg-red-100",
      bgColor: "bg-white",
      isHighlighted: false,
    },
  ]);

  useEffect(() => {
    async function loadData(isSilent = false) {
      if (!isSilent) setLoading(true);
      try {
        const { shop } = await getMyShop();
        // รายได้วันนี้ใช้ตัวเลขจาก /reports ชุดเดียวกับหน้ารายงาน (ยอดจริง ไม่ปัดเศษ, นับตามวันที่งานเสร็จ,
        // เทียบกับเมื่อวานช่วงเวลาเดียวกัน) — เดิมคำนวณเองฝั่งเว็บคนละสูตร ทำให้ 2 หน้าแสดงรายได้ไม่ตรงกัน
        const [{ orders: apiOrders }, report] = await Promise.all([
          listShopOrders(shop.id),
          getShopReport(shop.id, "today"),
        ]);
        const allOrders = apiOrders.map(toOrder);

        const now = new Date();
        const todayStr = toBangkokDateStr(now);
        const yesterdayStr = toBangkokDateStr(new Date(now.getTime() - 24 * 60 * 60 * 1000));

        // "เสร็จสิ้น/ยกเลิกวันนี้" นับตามวันที่ออเดอร์จบจริง (finishedAt) ไม่ใช่วันที่สั่ง
        const finishedOn = (o: Order, dateStr: string) =>
          !!o.finishedAt && toBangkokDateStr(new Date(o.finishedAt)) === dateStr;

        // null = เมื่อวานไม่มีข้อมูลให้เทียบ (ไม่แสดง %) — ตรงกับ pctChange ฝั่ง API
        const calculateTrend = (today: number, yesterday: number): number | null => {
          if (yesterday === 0) return null;
          return Math.round(((today - yesterday) / yesterday) * 100);
        };

        // คิว (รอตรวจ/กำลังทำ/กำลังส่ง) = งานที่ค้างอยู่ตอนนี้ทั้งหมด ไม่ว่าจะสั่งวันไหน — ออเดอร์เมื่อวานที่ยังไม่รับต้องไม่หายไปจากการ์ด
        const pendingNow = allOrders.filter((o) => o.status === "pending_review").length;
        const processingNow = allOrders.filter((o) => o.status === "accepted" || o.status === "in_progress").length;
        const shippingNow = allOrders.filter((o) => o.status === "shipping").length;

        const compToday = allOrders.filter((o) => o.status === "completed" && finishedOn(o, todayStr)).length;
        const compYesterday = allOrders.filter((o) => o.status === "completed" && finishedOn(o, yesterdayStr)).length;
        const cancToday = allOrders.filter((o) => o.status === "cancelled" && finishedOn(o, todayStr)).length;
        const cancYesterday = allOrders.filter((o) => o.status === "cancelled" && finishedOn(o, yesterdayStr)).length;

        const applyTrend = (stat: (typeof stats)[number], change: number | null) => {
          stat.trend = change === null ? "none" : change >= 0 ? "up" : "down";
          stat.trendValue = change === null ? "-" : `${Math.abs(change)}%`;
        };

        setStats((prev) => {
          const newStats = prev.map((st) => ({ ...st }));

          newStats[0].value = report.metrics.todayRevenue.toLocaleString("th-TH", { maximumFractionDigits: 2 });
          applyTrend(newStats[0], report.metrics.todayRevenueChange);

          newStats[1].value = pendingNow.toString();
          newStats[2].value = processingNow.toString();
          newStats[3].value = shippingNow.toString();

          newStats[4].value = compToday.toString();
          applyTrend(newStats[4], calculateTrend(compToday, compYesterday));

          newStats[5].value = cancToday.toString();
          applyTrend(newStats[5], calculateTrend(cancToday, cancYesterday));

          return newStats;
        });

      } catch (err) {
        console.error("Failed to load stat cards data:", err);
      } finally {
        if (!isSilent) setLoading(false);
      }
    }
    
    loadData();

    // Listen for custom event from LatestOrders to refresh silently
    const handleOrderUpdate = () => loadData(true);
    window.addEventListener("order-status-updated", handleOrderUpdate);
    return () => window.removeEventListener("order-status-updated", handleOrderUpdate);
  }, []);

  if (loading) {
    return (
      <div
        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4"
        aria-live="polite"
        aria-busy="true"
      >
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-2xl p-4 sm:p-5 border bg-white border-gray-100 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
              <Skeleton className="h-3.5 w-20" />
            </div>
            <Skeleton className="h-7 w-16 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        const TrendIcon = stat.trend === "up" ? ArrowUp : ArrowDown;
        // การ์ดยกเลิก: ยิ่งเพิ่มยิ่งแย่ → เพิ่ม = แดง, ลด = เขียว (การ์ดอื่นกลับกัน)
        const isBadWhenUp = stat.title.startsWith("ยกเลิก");
        const isGood = stat.trend === "up" ? !isBadWhenUp : isBadWhenUp;
        const trendColor = isGood ? "text-emerald-500" : "text-red-500";

        return (
          <div
            key={idx}
            className={`rounded-2xl p-4 sm:p-5 border flex flex-col justify-between ${
              stat.isHighlighted ? "bg-orange-50/30 border-orange-100" : "bg-white border-gray-100 shadow-sm"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.iconBg}`}>
                <Icon size={20} className={stat.isHighlighted ? "text-white" : stat.iconColor} />
              </div>
              <h3 className="text-sm font-semibold text-slate-700 leading-tight">
                {stat.title}
              </h3>
            </div>
            
            <div className="mb-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
                {stat.value}
              </span>
              <span className="text-sm font-medium text-slate-500">{stat.unit}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-medium">
              {stat.trend !== "none" && (
                <span className={`flex items-center gap-0.5 ${trendColor}`}>
                  <TrendIcon size={12} strokeWidth={3} />
                  {stat.trendValue}
                </span>
              )}
              <span className="text-slate-400">{stat.trendText}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
