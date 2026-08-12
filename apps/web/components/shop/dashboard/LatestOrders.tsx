"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
import OrdersTable from "../orders/OrdersTable";
import { Order } from "../orders/types";
import { getMyShop } from "@/lib/api/services";
import { listShopOrders } from "@/lib/api/orders";
import { toOrder } from "@/lib/ordersAdapter";

export default function LatestOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { shop } = await getMyShop();
        const { orders: apiOrders } = await listShopOrders(shop.id);
        const mappedOrders = apiOrders.map(toOrder);
        // เลือกมาแค่ 4 ออเดอร์แรก (ล่าสุด)
        setOrders(mappedOrders.slice(0, 4));
      } catch (err) {
        console.error("Failed to load latest orders:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 z-10 bg-white/50 flex items-center justify-center rounded-2xl">
          <Loader2 size={24} className="animate-spin text-orange-500" />
        </div>
      )}
      <OrdersTable 
        orders={orders}
        onOpenStatusModal={() => {}}
        onOpenDetail={() => {}}
        onPreviewFile={() => {}}
        title="คำสั่งซื้อล่าสุด"
        headerAction={
          <Link 
            href="/shop/orders" 
            className="text-xs font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            ดูทั้งหมด <ChevronRight size={14} />
          </Link>
        }
      />
    </div>
  );
}
