"use client";

import { useEffect, useState } from "react";
import { Wallet, Clock, UserCog, Package, CheckCircle2, XCircle, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { getMyShop } from "@/lib/api/services";
import { listShopOrders } from "@/lib/api/orders";
import { toOrder } from "@/lib/ordersAdapter";
import { Order } from "../orders/types";

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
      trend: "up",
      trendValue: "0",
      trendText: "จากเมื่อวาน",
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
      trend: "up",
      trendValue: "0",
      trendText: "จากเมื่อวาน",
      icon: UserCog,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
      bgColor: "bg-white",
      isHighlighted: false,
    },
    {
      title: "เสร็จสิ้น",
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
      title: "ยกเลิก",
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
        const { orders: apiOrders } = await listShopOrders(shop.id);
        const allOrders = apiOrders.map(toOrder);
        
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const todayOrders = allOrders.filter(o => o.createdAt.startsWith(todayStr));
        const yesterdayOrders = allOrders.filter(o => o.createdAt.startsWith(yesterdayStr));

        const calculateTrend = (today: number, yesterday: number) => {
          if (today === 0 && yesterday === 0) return 0;
          if (yesterday === 0) return 100;
          return Math.round(((today - yesterday) / yesterday) * 100);
        };

        // 1. Income
        const todayIncome = todayOrders
          .filter(o => o.status === "completed")
          .reduce((sum, o) => sum + (o.price || 0), 0);
          
        const yesterdayIncome = yesterdayOrders
          .filter(o => o.status === "completed")
          .reduce((sum, o) => sum + (o.price || 0), 0);

        const incomeTrend = calculateTrend(todayIncome, yesterdayIncome);

        // 2. New Orders (รอตรวจสอบ)
        const newToday = todayOrders.filter(o => o.status === "pending_review").length;
        const newYesterday = yesterdayOrders.filter(o => o.status === "pending_review").length;
        const newTrend = calculateTrend(newToday, newYesterday);

        // 3. Processing Orders (กำลังดำเนินการ)
        const procToday = todayOrders.filter(o => o.status === "in_progress" || o.status === "accepted").length;
        const procYesterday = yesterdayOrders.filter(o => o.status === "in_progress" || o.status === "accepted").length;
        const procTrend = calculateTrend(procToday, procYesterday);
        
        // 4. Completed (เสร็จสิ้น)
        const compToday = todayOrders.filter(o => o.status === "completed").length;
        const compYesterday = yesterdayOrders.filter(o => o.status === "completed").length;
        const compTrend = calculateTrend(compToday, compYesterday);

        // 5. Cancelled (ยกเลิก)
        const cancToday = todayOrders.filter(o => o.status === "cancelled").length;
        const cancYesterday = yesterdayOrders.filter(o => o.status === "cancelled").length;
        const cancTrend = calculateTrend(cancToday, cancYesterday);

        setStats(prev => {
          const newStats = [...prev];
          
          newStats[0].value = todayIncome.toLocaleString();
          newStats[0].trendValue = `${Math.abs(incomeTrend)}%`;
          newStats[0].trend = incomeTrend >= 0 ? "up" : "down";
          
          newStats[1].value = newToday.toString();
          newStats[1].trendValue = `${Math.abs(newTrend)}%`;
          newStats[1].trend = newTrend >= 0 ? "up" : "down";
          
          newStats[2].value = procToday.toString();
          newStats[2].trendValue = `${Math.abs(procTrend)}%`;
          newStats[2].trend = procTrend >= 0 ? "up" : "down";
          
          newStats[3].value = compToday.toString();
          newStats[3].trendValue = `${Math.abs(compTrend)}%`;
          newStats[3].trend = compTrend >= 0 ? "up" : "down";
          
          newStats[4].value = cancToday.toString();
          newStats[4].trendValue = `${Math.abs(cancTrend)}%`;
          newStats[4].trend = cancTrend >= 0 ? "up" : "down";

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

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 relative">
      {loading && (
        <div className="absolute inset-0 z-10 bg-white/50 flex items-center justify-center rounded-2xl">
          <Loader2 size={24} className="animate-spin text-orange-500" />
        </div>
      )}
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        const TrendIcon = stat.trend === "up" ? ArrowUp : ArrowDown;
        const trendColor = stat.trend === "up" ? "text-emerald-500" : "text-red-500";

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
              <span className={`flex items-center gap-0.5 ${trendColor}`}>
                <TrendIcon size={12} strokeWidth={3} />
                {stat.trendValue}
              </span>
              <span className="text-slate-400">{stat.trendText}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
