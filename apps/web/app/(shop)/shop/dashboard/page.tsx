import type { Metadata } from "next";
import StatCards from "@/components/shop/dashboard/StatCards";
import LatestOrders from "@/components/shop/dashboard/LatestOrders";
import DashboardCharts from "@/components/shop/dashboard/DashboardCharts";
import DashboardNotifications from "@/components/shop/dashboard/DashboardNotifications";

export const metadata: Metadata = { title: "หน้าหลัก" };

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <StatCards />
      <LatestOrders />
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8">
          <DashboardCharts />
        </div>
        <div className="xl:col-span-4">
          <DashboardNotifications />
        </div>
      </div>
    </div>
  );
}
