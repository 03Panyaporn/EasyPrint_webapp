"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Loader2,
  ArrowRight,
  Clock,
  AlertCircle,
  Store,
  Package,
  XCircle,
} from "lucide-react";

import {
  getCustomerOrders,
  type ApiOrder,
} from "@/lib/api/orders";
import { statusConfig } from "@/components/shop/orders/statusConfig";
import { ApiError } from "@/lib/api/client";

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [cancelOrder, setCancelOrder] =
    useState<ApiOrder | null>(null);

  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    getCustomerOrders()
      .then((res) => {
        setOrders(res.orders);
      })
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? err.message
            : "โหลดประวัติการสั่งซื้อไม่สำเร็จ"
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);
  const statusFilters = [
    {
      key: "all",
      label: "ทั้งหมด",
      countClass:
        "bg-slate-100 text-slate-600 border-slate-200",
      activeClass:
        "border-slate-400 bg-slate-400 text-white",
    },
    {
      key: "pending_review",
      label: "รอตรวจสอบ",
      countClass:
        "bg-orange-50 text-orange-600 border-orange-200",
      activeClass:
        "border-orange-500 bg-orange-500 text-white",
    },
    {
      key: "accepted",
      label: "รับงานแล้ว",
      countClass:
        "bg-violet-50 text-violet-600 border-violet-200",
      activeClass:
        "border-violet-500 bg-violet-500 text-white",
    },
    {
      key: "in_progress",
      label: "กำลังดำเนินการ",
      countClass:
        "bg-blue-50 text-blue-700 border-blue-200",
      activeClass:
        "border-blue-500 bg-blue-500 text-white",
    },
    {
      key: "shipping",
      label: "กำลังจัดส่ง",
      countClass:
        "bg-cyan-50 text-cyan-700 border-cyan-200",
      activeClass:
        "border-cyan-500 bg-cyan-500 text-white",
    },
    {
      key: "completed",
      label: "เสร็จสิ้น",
      countClass:
        "bg-green-50 text-green-600 border-green-200",
      activeClass:
        "border-green-500 bg-green-500 text-white",
    },
    {
      key: "cancelled",
      label: "ยกเลิกแล้ว",
      countClass:
        "bg-red-50 text-red-600 border-red-200",
      activeClass:
        "border-red-500 bg-red-500 text-white",
    },
  ];

  const canCancel = (status: string) => {
    return status === "pending_review";
  };

  const filteredOrders = useMemo(() => {
    if (selectedStatus === "all") {
      return orders;
    }

    return orders.filter(
      (order) => order.status === selectedStatus
    );
  }, [orders, selectedStatus]);

  const getStatusCount = (status: string) => {
    if (status === "all") {
      return orders.length;
    }

    return orders.filter(
      (order) => order.status === status
    ).length;
  };

  const handleConfirmCancel = async () => {
    if (!cancelOrder) return;

    try {
      setCancelling(true);

      await new Promise((resolve) =>
        setTimeout(resolve, 500)
      );

      setOrders((prev) =>
        prev.map((order) =>
          order.id === cancelOrder.id
            ? {
              ...order,
              status: "cancelled",
            }
            : order
        )
      );

      setCancelOrder(null);
    } catch {
      setError("ไม่สามารถยกเลิกคำสั่งซื้อได้");
    } finally {
      setCancelling(false);
    }
  };

  // -----------------------------------------
  // Loading
  // -----------------------------------------
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto flex max-w-4xl items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2
              size={30}
              className="animate-spin text-orange-500"
            />

            <p className="text-sm text-slate-500">
              กำลังโหลดประวัติสั่งพิมพ์...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-4xl">

        {/* ================================
            HEADER
        ================================= */}
        <div className="mb-6">
          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
              <Package size={21} />
            </div>

            <div>
              <h1 className="text-xl font-semibold text-slate-800 md:text-2xl">
                ติดตามคำสั่งซื้อ
              </h1>

              <p className="mt-0.5 text-xs text-slate-400 md:text-sm">
                ตรวจสอบสถานะงานพิมพ์ของคุณ
              </p>
            </div>

          </div>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>{error}</span>
          </div>
        )}

        {orders.length > 0 && (
          <div className="mb-6">

            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">
                สถานะคำสั่งซื้อ
              </p>

              <p className="text-s text-slate-400">
                {orders.length} รายการ
              </p>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">

              {statusFilters.map((filter) => {
                const count = getStatusCount(filter.key);
                const isActive =
                  selectedStatus === filter.key;

                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() =>
                      setSelectedStatus(filter.key)
                    }
                    className={`
                      flex shrink-0 items-center gap-2
                      rounded-xl border
                      px-3 py-2
                      text-xs font-medium
                      transition-all duration-200
                      ${isActive
                        ? filter.activeClass
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }
                    `}
                  >
                    <span>{filter.label}</span>

                    {/* ตัวเลขแบบกรอบสี่เหลี่ยม */}
                    <span
                      className={`
                        flex h-6 min-w-6
                        items-center justify-center
                        rounded-md
                        border
                        px-1.5
                        text-[11px]
                        font-semibold
                        ${isActive
                          ? "border-white/30 bg-white/20 text-white"
                          : filter.countClass
                        }
                      `}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}

            </div>
          </div>
        )}

        {/* ================================
            EMPTY ORDERS
        ================================= */}
        {orders.length === 0 ? (

          <div className="rounded-3xl border border-slate-100 bg-white px-6 py-14 text-center shadow-sm">

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
              <ShoppingBag size={30} />
            </div>

            <h2 className="text-lg font-semibold text-slate-700">
              ยังไม่มีคำสั่งซื้อ
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              เมื่อคุณสั่งพิมพ์งาน
              รายการคำสั่งซื้อจะแสดงที่หน้านี้
            </p>

            <Link
              href="/dashboard"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm text-white shadow-sm transition hover:bg-orange-600"
            >
              ค้นหาร้านถ่ายเอกสาร
              <ArrowRight size={16} />
            </Link>

          </div>

        ) : filteredOrders.length === 0 ? (

          /* ================================
             NO ORDER IN SELECTED STATUS
          ================================= */
          <div className="rounded-3xl border border-slate-100 bg-white px-6 py-12 text-center shadow-sm">

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Package size={26} />
            </div>

            <h2 className="font-semibold text-slate-700">
              ไม่พบคำสั่งซื้อ
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              ยังไม่มีคำสั่งซื้อในสถานะนี้
            </p>

            <button
              type="button"
              onClick={() =>
                setSelectedStatus("all")
              }
              className="mt-5 rounded-xl bg-orange-50 px-4 py-2.5 text-xs font-medium text-orange-600 transition hover:bg-orange-100"
            >
              ดูคำสั่งซื้อทั้งหมด
            </button>

          </div>

        ) : (

          /* ================================
             ORDER LIST
          ================================= */
          <div className="space-y-5">

            {filteredOrders.map((order) => {

              const meta =
                statusConfig[order.status] ??
                statusConfig.pending_review;

              const firstItem =
                order.items?.[0];

              const title = firstItem
                ? firstItem.serviceName
                : order.serviceType ||
                "สั่งพิมพ์งาน";

              const dateStr =
                new Date(
                  order.createdAt
                ).toLocaleString(
                  "th-TH",
                  {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                );

              const orderCanCancel =
                canCancel(order.status);

              return (
                <div
                  key={order.id}
                  className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-lg transition hover:shadow-xl"
                >

                  {/* ORDER HEADER */}
                  <div className="border-b border-slate-100 px-5 py-4 md:px-6">

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                      <div>
                        <p className="text-[11px] text-slate-400">
                          หมายเลขคำสั่งซื้อ
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-2">

                          <span className="text-sm font-semibold text-slate-800">
                            {order.code}
                          </span>

                          <span className="text-[11px] text-slate-400">
                            {order.ref}
                          </span>

                        </div>
                      </div>

                      {/* STATUS */}
                      <span
                        className={`
                          inline-flex w-fit
                          items-center
                          rounded-full
                          border
                          px-3 py-1.5
                          text-xs font-medium
                          ${meta.badgeBg}
                          ${meta.badgeText}
                          ${meta.badgeBorder}
                        `}
                      >
                        {meta.label}
                      </span>

                    </div>
                  </div>

                  {/* ORDER CONTENT */}
                  <div className="px-5 py-5 md:px-6">

                    {/* SHOP */}
                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                        <Store size={19} />
                      </div>

                      <div className="min-w-0">

                        <p className="text-[11px] text-slate-400">
                          ร้าน
                        </p>

                        <p className="truncate text-sm text-slate-700">
                          {order.shopName}
                        </p>

                      </div>

                    </div>

                    {/* ITEM */}
                    <div className="mt-5 rounded-2xl bg-slate-50 p-4">

                      <div className="flex items-start justify-between gap-4">

                        <div className="min-w-0">

                          <p className="text-[11px] text-slate-400">
                            รายการ
                          </p>

                          <p className="mt-1 text-sm text-slate-700">
                            {title}
                          </p>

                          {order.items &&
                            order.items.length > 1 && (
                              <p className="mt-1 text-xs text-slate-400">
                                และอีก{" "}
                                {order.items.length - 1}{" "}
                                รายการ
                              </p>
                            )}

                        </div>

                        <div className="shrink-0 text-right">

                          <p className="text-[11px] text-slate-400">
                            ยอดรวม
                          </p>

                          <p className="mt-0.5 text-lg font-semibold text-orange-600">
                            ฿
                            {order.totalPrice.toLocaleString()}
                          </p>

                        </div>

                      </div>

                    </div>

                    {/* DATE */}
                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">

                      <Clock size={14} />

                      <span>
                        สั่งซื้อเมื่อ {dateStr}
                      </span>

                    </div>

                  </div>

                  {/* ACTION */}
                  <div className="border-t border-slate-100 bg-slate-50/70 p-4">

                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">

                      {orderCanCancel && (
                        <button
                          type="button"
                          onClick={() =>
                            setCancelOrder(order)
                          }
                          className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-2.5 text-xs text-red-500 transition hover:border-red-300 hover:bg-red-50"
                        >
                          <XCircle size={15} />

                          ยกเลิกคำสั่งซื้อ
                        </button>
                      )}

                      <Link
                        href={`/orders/${order.id}`}
                        className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs text-white shadow-sm transition hover:bg-orange-600"
                      >
                        ดูรายละเอียด

                        <ArrowRight size={15} />
                      </Link>

                    </div>

                    {orderCanCancel && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">

                        <AlertCircle
                          size={15}
                          className="mt-0.5 shrink-0 text-amber-500"
                        />

                        <p className="text-[11px] leading-relaxed text-amber-700">
                          ร้านยังไม่ได้รับงาน
                          สามารถยกเลิกคำสั่งซื้อได้
                        </p>

                      </div>
                    )}

                    {order.status === "cancelled" && (
                      <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5">

                        <XCircle
                          size={15}
                          className="text-red-500"
                        />

                        <p className="text-[11px] text-red-600">
                          คำสั่งซื้อนี้ถูกยกเลิกแล้ว
                        </p>

                      </div>
                    )}

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>

      {/* ================================
          CANCEL MODAL
      ================================= */}
      {cancelOrder && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]"
          onClick={() => {
            if (!cancelling) {
              setCancelOrder(null);
            }
          }}
        >

          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="mb-4 flex justify-center">

              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
                <AlertCircle size={32} />
              </div>

            </div>

            <div className="text-center">

              <h2 className="text-xl font-semibold text-slate-800">
                ยืนยันการยกเลิก?
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                คุณต้องการยกเลิกคำสั่งซื้อ
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {cancelOrder.code}
              </p>

              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                เมื่อยกเลิกแล้ว
                คำสั่งซื้อนี้จะถูกเปลี่ยนเป็น
                "ยกเลิกแล้ว"
              </p>

            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">

              <button
                type="button"
                disabled={cancelling}
                onClick={() =>
                  setCancelOrder(null)
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                ไม่ยกเลิก
              </button>

              <button
                type="button"
                disabled={cancelling}
                onClick={handleConfirmCancel}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm text-white transition hover:bg-red-600 disabled:opacity-50"
              >

                {cancelling ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />

                    กำลังยกเลิก
                  </>
                ) : (
                  <>
                    <XCircle size={16} />

                    ยืนยันยกเลิก
                  </>
                )}

              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}