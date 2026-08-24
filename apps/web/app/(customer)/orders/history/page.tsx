"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Clock,
    Loader2,
    Package,
    ShoppingBag,
    Star,
    Store,
} from "lucide-react";

import {
    getCustomerOrders,
    type ApiOrder,
} from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";

type HistoryOrder = ApiOrder;

export default function OrderHistoryPage() {
    const [orders, setOrders] = useState<HistoryOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        getCustomerOrders()
            .then((res) => {
                const completedOrders = res.orders.filter(
                    (order) => order.status === "completed"
                );

                setOrders(completedOrders);
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

    const totalSpent = useMemo(() => {
        return orders.reduce(
            (sum, order) => sum + Number(order.totalPrice || 0),
            0
        );
    }, [orders]);

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-8">
                <div className="mx-auto flex max-w-4xl items-center justify-center py-24">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2
                            size={30}
                            className="animate-spin text-orange-500"
                        />
                        <p className="text-sm text-slate-500">
                            กำลังโหลดประวัติการสั่งซื้อ...
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-6 md:py-8">
            <div className="mx-auto max-w-4xl">

                {/* HEADER */}
                <div className="mb-6">
                    <Link
                        href="/orders"
                        className="mb-4 inline-flex items-center gap-1.5 text-xs text-orange-500 transition hover:text-slate-600"
                    >
                        <ArrowLeft size={15} />
                        กลับไปติดตามคำสั่งซื้อ
                    </Link>

                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
                                <Package size={21} />
                            </div>

                            <div>
                                <h1 className="text-xl text-slate-800 md:text-2xl">
                                    ประวัติการสั่งซื้อ
                                </h1>

                                <p className="mt-0.5 text-xs text-slate-400 md:text-sm">
                                    งานที่เสร็จสิ้นเรียบร้อยแล้ว
                                </p>
                            </div>
                        </div>

                        {/* จำนวนรายการ */}
                        <div className="hidden rounded-xl border border-orange-100 bg-orange-50 px-4 py-2 text-right sm:block">
                            <p className="text-sm text-orange-600">
                                {orders.length} รายการ
                            </p>
                        </div>
                    </div>
                </div>

                {/* ERROR */}
                {error && (
                    <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {/* SUMMARY */}
                {orders.length > 0 && (
                    <div className="mb-6 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                            <div className="flex items-center gap-2">
                                <CheckCircle2
                                    size={17}
                                    className="text-green-500"
                                />
                                <span className="text-xs text-slate-400">
                                    เสร็จสิ้นแล้ว
                                </span>
                            </div>

                            <p className="mt-2 text-xl text-slate-800">
                                {orders.length}
                            </p>

                            <p className="text-[11px] text-slate-400">
                                รายการ
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                            <div className="flex items-center gap-2">
                                <ShoppingBag
                                    size={17}
                                    className="text-orange-500"
                                />
                                <span className="text-xs text-slate-400">
                                    ยอดรวมทั้งหมด
                                </span>
                            </div>

                            <p className="mt-2 text-xl text-orange-600">
                                ฿{totalSpent.toLocaleString()}
                            </p>

                            <p className="text-[11px] text-slate-400">
                                จากคำสั่งซื้อที่เสร็จสิ้นแล้ว
                            </p>
                        </div>
                    </div>
                )}

                {/* EMPTY */}
                {orders.length === 0 ? (
                    <div className="rounded-3xl border border-slate-100 bg-white px-6 py-16 text-center shadow-sm">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                            <ShoppingBag size={30} />
                        </div>

                        <h2 className="text-lg text-slate-700">
                            ยังไม่มีประวัติการสั่งซื้อ
                        </h2>

                        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
                            เมื่อคำสั่งซื้อของคุณเสร็จสิ้น
                            รายการจะถูกบันทึกไว้ในหน้านี้
                        </p>

                        <Link
                            href="/orders"
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm text-white shadow-sm transition hover:bg-orange-600"
                        >
                            ดูคำสั่งซื้อ
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                ) : (
                    /* ORDER LIST */
                    <div className="space-y-4">
                        {orders.map((order) => {
                            const firstItem = order.items?.[0];

                            const title = firstItem
                                ? firstItem.serviceName
                                : order.serviceType || "สั่งพิมพ์งาน";

                            const dateStr = new Date(
                                order.createdAt
                            ).toLocaleString("th-TH", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            });

                            return (
                                <div
                                    key={order.id}
                                    className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md"
                                >
                                    {/* HEADER */}
                                    <div className="border-b border-slate-100 px-5 py-4 md:px-6">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-[11px] text-slate-400">
                                                    หมายเลขคำสั่งซื้อ
                                                </p>

                                                <p className="mt-1 text-sm text-slate-800">
                                                    {order.code}
                                                </p>

                                                {order.ref && (
                                                    <p className="mt-0.5 text-[11px] text-slate-400">
                                                        {order.ref}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1.5 rounded-full border border-green-100 bg-green-50 px-3 py-1.5">
                                                <CheckCircle2
                                                    size={13}
                                                    className="text-green-500"
                                                />

                                                <span className="text-[11px] text-green-600">
                                                    เสร็จสิ้นแล้ว
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CONTENT */}
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
                                                                {order.items.length - 1} รายการ
                                                            </p>
                                                        )}
                                                </div>

                                                <div className="shrink-0 text-right">
                                                    <p className="text-[11px] text-slate-400">
                                                        ยอดรวม
                                                    </p>

                                                    <p className="mt-0.5 text-lg text-orange-600">
                                                        ฿
                                                        {Number(
                                                            order.totalPrice || 0
                                                        ).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* DATE */}
                                        <div className="mt-4 flex flex-col gap-1.5 text-xs text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} />
                                                <span>
                                                    สั่งซื้อเมื่อ {dateStr}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ACTION */}
                                    <div className="border-t border-slate-100 bg-slate-50/70 p-4">
                                        <Link
                                            href={`/orders/${order.id}`}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-xs text-white shadow-sm transition hover:bg-orange-600"
                                        >
                                            ดูรายละเอียดคำสั่งซื้อ
                                            <ArrowRight size={15} />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* MOBILE COUNT */}
                {orders.length > 0 && (
                    <p className="mt-5 text-center text-[11px] text-slate-400 sm:hidden">
                        {orders.length} รายการที่เสร็จสิ้นแล้ว
                    </p>
                )}
            </div>
        </main>
    );
}