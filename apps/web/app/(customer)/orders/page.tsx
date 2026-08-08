"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, Loader2, ArrowRight, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { getCustomerOrders, type ApiOrder } from "@/lib/api/orders";
import { statusConfig } from "@/components/shop/orders/statusConfig";
import { ApiError } from "@/lib/api/client";

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getCustomerOrders()
      .then((res) => setOrders(res.orders))
      .catch((err) => setError(err instanceof ApiError ? err.message : "โหลดประวัติการสั่งซื้อไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 size={24} className="animate-spin" />
        <span className="text-sm">กำลังโหลดประวัติสั่งพิมพ์...</span>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ประวัติสั่งพิมพ์</h1>
          <p className="text-xs text-slate-500 mt-1">รายการคำสั่งพิมพ์ทั้งหมดที่คุณเคยสั่งซื้อ</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm flex items-center gap-2 border border-red-200">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
            <ShoppingBag size={28} />
          </div>
          <div>
            <p className="font-bold text-slate-700">ยังไม่มีประวัติการสั่งพิมพ์</p>
            <p className="text-xs text-slate-400 mt-1">เลือกค้นหาร้านค้าและสั่งพิมพ์ออนไลน์ได้ทันที</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition"
          >
            ค้นหาร้านถ่ายเอกสาร
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const meta = statusConfig[order.status];
            const firstItem = order.items?.[0];
            const title = firstItem ? firstItem.serviceName : (order.serviceType || "สั่งพิมพ์งาน");
            const dateStr = new Date(order.createdAt).toLocaleString("th-TH", {
              day: "numeric",
              month: "short",
              year: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:border-orange-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-base">{order.code}</span>
                    <span className="text-xs font-mono text-slate-400">({order.ref})</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                    >
                      {meta.label}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-0.5">
                    <p>
                      ร้าน: <span className="font-bold text-slate-700">{order.shopName}</span>
                    </p>
                    <p>
                      รายการ: <span className="font-semibold text-slate-700">{title}</span>
                      {order.items && order.items.length > 1 ? ` และอีก ${order.items.length - 1} รายการ` : ""}
                    </p>
                    <p className="text-slate-400 flex items-center gap-1">
                      <Clock size={12} /> {dateStr}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400">ยอดรวมทั้งหมด</p>
                    <p className="text-lg font-black text-orange-600">฿{order.totalPrice.toLocaleString()}</p>
                  </div>

                  <Link
                    href={`/orders/${order.id}`}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-orange-50 text-orange-600 font-bold text-xs hover:bg-orange-100 transition shrink-0"
                  >
                    <span>ดูรายละเอียด</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

