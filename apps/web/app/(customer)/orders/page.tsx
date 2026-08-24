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
  MessageCircle,
  CheckCircle2,
  Star,
  Send,
  X,
} from "lucide-react";

import {
  getCustomerOrders,
  type ApiOrder,
} from "@/lib/api/orders";
import { statusConfig } from "@/components/shop/orders/statusConfig";
import { ApiError, apiFetch } from "@/lib/api/client";

// ── Types ─────────────────────────────────────────────
type ReviewData = {
  rating: number;
  comment: string;
};

// ── Star Rating Component ──────────────────────────────
function StarRating({
  value,
  onChange,
  readonly = false,
  size = 28,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: number;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`transition-transform duration-150 ${!readonly ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
        >
          <Star
            size={size}
            className={`transition-colors duration-150 ${star <= (hovered || value)
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-100 text-slate-200"
              }`}
          />
        </button>
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────
export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // — Cancel
  const [cancelOrder, setCancelOrder] = useState<ApiOrder | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // — Chat (cancelled orders)
  const [chatOrder, setChatOrder] = useState<ApiOrder | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatSent, setChatSent] = useState(false);

  // — Confirm received (completed orders)
  const [confirmOrder, setConfirmOrder] = useState<ApiOrder | null>(null);
  const [confirming, setConfirming] = useState(false);

  // — Review
  const [reviewOrder, setReviewOrder] = useState<ApiOrder | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // — Local review store (mock — replace with API when ready)
  const [reviews, setReviews] = useState<Record<string, ReviewData>>({});

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

  // ── Filters ────────────────────────────────────────────
  const statusFilters = [
    {
      key: "all",
      label: "ทั้งหมด",
      countClass: "bg-slate-100 text-slate-600 border-slate-200",
      activeClass: "border-slate-400 bg-slate-400 text-white",
    },
    {
      key: "pending_review",
      label: "รอตรวจสอบ",
      countClass: "bg-orange-50 text-orange-600 border-orange-200",
      activeClass: "border-orange-500 bg-orange-500 text-white",
    },
    {
      key: "accepted",
      label: "รับงานแล้ว",
      countClass: "bg-violet-50 text-violet-600 border-violet-200",
      activeClass: "border-violet-500 bg-violet-500 text-white",
    },
    {
      key: "in_progress",
      label: "กำลังดำเนินการ",
      countClass: "bg-blue-50 text-blue-700 border-blue-200",
      activeClass: "border-blue-500 bg-blue-500 text-white",
    },
    {
      key: "shipping",
      label: "กำลังจัดส่ง",
      countClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
      activeClass: "border-cyan-500 bg-cyan-500 text-white",
    },
    {
      key: "completed",
      label: "เสร็จสิ้น",
      countClass: "bg-green-50 text-green-600 border-green-200",
      activeClass: "border-green-500 bg-green-500 text-white"
    },
    {
      key: "cancelled",
      label: "ยกเลิกแล้ว",
      countClass: "bg-red-50 text-red-600 border-red-200",
      activeClass: "border-red-500 bg-red-500 text-white",
    },
  ];

  const canCancel = (status: string) => status === "pending_review";

  const filteredOrders = useMemo(() => {
    if (selectedStatus === "all") return orders;
    return orders.filter((order) => order.status === selectedStatus);
  }, [orders, selectedStatus]);

  const getStatusCount = (status: string) => {
    if (status === "all") return orders.length;
    return orders.filter((o) => o.status === status).length;
  };

  // ── Handlers ──────────────────────────────────────────

  const handleConfirmCancel = async () => {
    if (!cancelOrder) return;
    try {
      setCancelling(true);
      const res = await apiFetch(`/customers/orders/${cancelOrder.id}/cancel`, {
        method: "PATCH",
      }) as any;

      if (res.error) throw new Error(res.error);

      setOrders((prev) =>
        prev.map((o) => (o.id === cancelOrder.id ? { ...o, status: "cancelled" } : o))
      );
      setCancelOrder(null);
    } catch {
      setError("ไม่สามารถยกเลิกคำสั่งซื้อได้");
    } finally {
      setCancelling(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatMessage.trim()) return;
    setChatSending(true);
    await new Promise((r) => setTimeout(r, 600));
    setChatSending(false);
    setChatSent(true);
  };

  const handleOpenChat = (order: ApiOrder) => {
    setChatOrder(order);
    setChatMessage("");
    setChatSent(false);
  };

  const handleConfirmReceived = async () => {
    if (!confirmOrder) return;
    setConfirming(true);
    await new Promise((r) => setTimeout(r, 600));
    setConfirming(false);
    setConfirmOrder(null);
    // open review modal right after
    setReviewOrder(confirmOrder);
    setReviewRating(5);
    setReviewComment("");
  };

  const handleSubmitReview = async () => {
    if (!reviewOrder) return;
    setSubmittingReview(true);
    await new Promise((r) => setTimeout(r, 700));
    setReviews((prev) => ({
      ...prev,
      [reviewOrder.id]: { rating: reviewRating, comment: reviewComment },
    }));
    setSubmittingReview(false);
    setReviewOrder(null);
  };

  // ── Loading ───────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto flex max-w-4xl items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={30} className="animate-spin text-orange-500" />
            <p className="text-sm text-slate-500">กำลังโหลดประวัติสั่งพิมพ์...</p>
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
          <div className="flex items-center justify-between gap-4">
            {/* Title */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm"> <Package size={21} />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-slate-800 md:text-2xl"> ติดตามคำสั่งซื้อ </h1>
                <p className="mt-0.5 text-xs text-slate-400 md:text-sm"> ตรวจสอบสถานะงานพิมพ์ของคุณ </p>
              </div>
            </div>
            {/* ประวัติการสั่งซื้อ */}
            <Link href="/orders/history" className=" flex shrink-0 items-center gap-1.5 rounded-xl bg-orange-500 px-3.5 py-2.5 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:bg-orange-600 hover:shadow-md active:scale-95 md:px-4 md:py-2.5 md:text-sm " > <span>ประวัติการสั่งซื้อ</span> <ArrowRight size={16} /> </Link>
          </div>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Status Filters ── */}
        {orders.length > 0 && (
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">สถานะคำสั่งซื้อ</p>
              <p className="text-s text-slate-400">{orders.length} รายการ</p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {statusFilters.map((filter) => {
                const count = getStatusCount(filter.key);
                const isActive = selectedStatus === filter.key;
                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setSelectedStatus(filter.key)}
                    className={`
                      flex shrink-0 items-center gap-2
                      rounded-xl border px-3 py-2
                      text-xs font-medium
                      transition-all duration-200
                      ${isActive
                        ? filter.activeClass
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }
                    `}
                  >
                    <span>{filter.label}</span>
                    <span
                      className={`
                        flex h-6 min-w-6 items-center justify-center
                        rounded-md border px-1.5
                        text-[11px] font-semibold
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
            EMPTY / NO-MATCH STATES
        ================================= */}
        {orders.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
              <ShoppingBag size={30} />
            </div>
            <h2 className="text-lg font-semibold text-slate-700">ยังไม่มีคำสั่งซื้อ</h2>
            <p className="mt-1 text-sm text-slate-400">
              เมื่อคุณสั่งพิมพ์งาน รายการคำสั่งซื้อจะแสดงที่หน้านี้
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
          <div className="rounded-3xl border border-slate-100 bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Package size={26} />
            </div>
            <h2 className="font-semibold text-slate-700">ไม่พบคำสั่งซื้อ</h2>
            <p className="mt-1 text-xs text-slate-400">ยังไม่มีคำสั่งซื้อในสถานะนี้</p>
            <button
              type="button"
              onClick={() => setSelectedStatus("all")}
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
                statusConfig[order.status] ?? statusConfig.pending_review;
              const firstItem = order.items?.[0];
              const title = firstItem
                ? firstItem.serviceName
                : order.serviceType || "สั่งพิมพ์งาน";
              const dateStr = new Date(order.createdAt).toLocaleString("th-TH", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              const orderCanCancel = canCancel(order.status);
              const isCancelled = order.status === "cancelled";
              const isCompleted = order.status === "completed";
              const orderReview = reviews[order.id];

              return (
                <div
                  key={order.id}
                  className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-lg transition hover:shadow-xl"
                >
                  {/* ORDER HEADER */}
                  <div className="border-b border-slate-100 px-5 py-4 md:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[11px] text-slate-400">หมายเลขคำสั่งซื้อ</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800">
                            {order.code}
                          </span>
                          <span className="text-[11px] text-slate-400">{order.ref}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Review badge */}
                        {orderReview && (
                          <div className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1">
                            <Star
                              size={11}
                              className="fill-amber-400 text-amber-400"
                            />
                            <span className="text-[11px] font-semibold text-amber-700">
                              {orderReview.rating}.0
                            </span>
                          </div>
                        )}
                        <span
                          className={`
                            inline-flex w-fit items-center rounded-full border
                            px-3 py-1.5 text-xs font-medium
                            ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}
                          `}
                        >
                          {meta.label}
                        </span>
                      </div>
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
                        <p className="text-[11px] text-slate-400">ร้าน</p>
                        <p className="truncate text-sm text-slate-700">{order.shopName}</p>
                      </div>
                    </div>

                    {/* ITEM */}
                    <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[11px] text-slate-400">รายการ</p>
                          <p className="mt-1 text-sm text-slate-700">{title}</p>
                          {order.items && order.items.length > 1 && (
                            <p className="mt-1 text-xs text-slate-400">
                              และอีก {order.items.length - 1} รายการ
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[11px] text-slate-400">ยอดรวม</p>
                          <p className="mt-0.5 text-lg font-semibold text-orange-600">
                            ฿{order.totalPrice.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* DATE */}
                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                      <Clock size={14} />
                      <span>สั่งซื้อเมื่อ {dateStr}</span>
                    </div>

                    {/* REVIEW TEXT (if reviewed) */}
                    {orderReview?.comment && (
                      <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
                        <p className="text-[11px] text-amber-600 font-medium mb-1">
                          รีวิวของคุณ
                        </p>
                        <p className="text-xs text-amber-800 leading-relaxed">
                          &ldquo;{orderReview.comment}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ACTION */}
                  <div className="border-t border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">

                      {/* Cancel button */}
                      {orderCanCancel && (
                        <button
                          type="button"
                          onClick={() => setCancelOrder(order)}
                          className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-2.5 text-xs text-red-500 transition hover:border-red-300 hover:bg-red-50"
                        >
                          <XCircle size={15} />
                          ยกเลิกคำสั่งซื้อ
                        </button>
                      )}

                      {/* Chat button (cancelled) */}
                      {isCancelled && (
                        <button
                          type="button"
                          onClick={() => handleOpenChat(order)}
                          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          <MessageCircle size={15} />
                          ติดต่อร้านค้า
                        </button>
                      )}

                      {/* Confirm received button (completed, not yet reviewed) */}
                      {isCompleted && !orderReview && (
                        <button
                          type="button"
                          onClick={() => setConfirmOrder(order)}
                          className="flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-5 py-2.5 text-xs font-medium text-green-700 transition hover:bg-green-100"
                        >
                          <CheckCircle2 size={15} />
                          ยืนยันรับงาน &amp; รีวิว
                        </button>
                      )}

                      {/* View detail button */}
                      <Link
                        href={`/orders/${order.id}`}
                        className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs text-white shadow-sm transition hover:bg-orange-600"
                      >
                        ดูรายละเอียด
                      </Link>
                    </div>

                    {/* Info banners */}
                    {orderCanCancel && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
                        <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-500" />
                        <p className="text-[11px] leading-relaxed text-amber-700">
                          ร้านยังไม่ได้รับงาน สามารถยกเลิกคำสั่งซื้อได้
                        </p>
                      </div>
                    )}

                    {isCancelled && (
                      <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5">
                        <XCircle size={15} className="text-red-500" />
                        <p className="text-[11px] text-red-600">
                          คำสั่งซื้อนี้ถูกยกเลิกแล้ว — กดติดต่อร้านค้าหากต้องการสอบถาม
                        </p>
                      </div>
                    )}

                    {isCompleted && orderReview && (
                      <div className="mt-3 flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-3 py-2.5">
                        <CheckCircle2 size={15} className="text-green-500" />
                        <p className="text-[11px] text-green-700">
                          รับงานและรีวิวเรียบร้อยแล้ว — ดูได้ในประวัติสั่งซื้อ
                        </p>
                      </div>
                    )}

                    {isCompleted && !orderReview && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl border border-green-100 bg-green-50 px-3 py-2.5">
                        <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-green-500" />
                        <p className="text-[11px] leading-relaxed text-green-700">
                          งานเสร็จสิ้นแล้ว กรุณายืนยันรับงานและให้คะแนนรีวิว
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

      {/* ================================================
          MODAL: CANCEL CONFIRM
      ================================================ */}
      {cancelOrder && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]"
          onClick={() => { if (!cancelling) setCancelOrder(null); }}
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
              <h2 className="text-xl font-semibold text-slate-800">ยืนยันการยกเลิก?</h2>
              <p className="mt-2 text-sm text-slate-500">คุณต้องการยกเลิกคำสั่งซื้อ</p>
              <p className="mt-1 font-medium text-slate-800">{cancelOrder.code}</p>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                เมื่อยกเลิกแล้ว คำสั่งซื้อนี้จะถูกเปลี่ยนเป็น &ldquo;ยกเลิกแล้ว&rdquo;
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setCancelOrder(null)}
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
                    <Loader2 size={16} className="animate-spin" />
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

      {/* ================================================
          MODAL: CHAT (cancelled orders)
      ================================================ */}
      {chatOrder && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 px-4 pb-0 backdrop-blur-[2px] sm:items-center sm:pb-0"
          onClick={() => { if (!chatSending) setChatOrder(null); }}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Chat header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <MessageCircle size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">ติดต่อร้านค้า</p>
                  <p className="text-[11px] text-slate-400">{chatOrder.shopName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChatOrder(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              {/* Order info */}
              <div className="mb-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-[11px] text-slate-400">เกี่ยวกับคำสั่งซื้อ</p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">{chatOrder.code}</p>
                <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2 py-0.5">
                  <XCircle size={10} className="text-red-500" />
                  <span className="text-[10px] text-red-600">ยกเลิกแล้ว</span>
                </div>
              </div>

              {chatSent ? (
                /* Success state */
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-500">
                    <CheckCircle2 size={28} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">ส่งข้อความสำเร็จ</p>
                    <p className="mt-1 text-xs text-slate-400">
                      ร้านค้าจะตอบกลับภายใน 24 ชั่วโมง
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChatOrder(null)}
                    className="mt-2 rounded-xl bg-slate-100 px-5 py-2.5 text-sm text-slate-600 transition hover:bg-slate-200"
                  >
                    ปิด
                  </button>
                </div>
              ) : (
                /* Input state */
                <>
                  <label className="mb-2 block text-xs font-medium text-slate-600">
                    ข้อความถึงร้านค้า
                  </label>
                  <textarea
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="เช่น ต้องการสอบถามเกี่ยวกับการคืนเงิน หรือสาเหตุการยกเลิก..."
                    rows={4}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder-slate-300 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
                  />
                  <p className="mt-1.5 text-right text-[11px] text-slate-300">
                    {chatMessage.length}/500
                  </p>
                  <button
                    type="button"
                    disabled={!chatMessage.trim() || chatSending}
                    onClick={handleSendChat}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-50"
                  >
                    {chatSending ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        กำลังส่ง...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        ส่งข้อความ
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================
          MODAL: CONFIRM RECEIVED
      ================================================ */}
      {confirmOrder && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]"
          onClick={() => { if (!confirming) setConfirmOrder(null); }}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-500">
                <CheckCircle2 size={32} />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-800">ยืนยันรับงานแล้ว?</h2>
              <p className="mt-2 text-sm text-slate-500">
                ยืนยันว่าคุณได้รับงานพิมพ์จาก
              </p>
              <p className="mt-0.5 font-medium text-slate-800">{confirmOrder.shopName}</p>
              <p className="mt-1 text-xs text-slate-400">{confirmOrder.code}</p>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                หลังยืนยัน คุณจะสามารถให้คะแนนรีวิวร้านค้าได้
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={confirming}
                onClick={() => setConfirmOrder(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                ยังไม่ได้รับ
              </button>
              <button
                type="button"
                disabled={confirming}
                onClick={handleConfirmReceived}
                className="flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 text-sm text-white transition hover:bg-green-600 disabled:opacity-50"
              >
                {confirming ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    กำลังยืนยัน
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    รับงานแล้ว
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================
          MODAL: REVIEW
      ================================================ */}
      {reviewOrder && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 px-4 backdrop-blur-[2px] sm:items-center"
          onClick={() => { if (!submittingReview) setReviewOrder(null); }}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-500">
                  <Star size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">รีวิวร้านค้า</p>
                  <p className="text-[11px] text-slate-400">{reviewOrder.shopName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReviewOrder(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              {/* Star rating */}
              <div className="mb-5 flex flex-col items-center gap-3 rounded-2xl bg-slate-50 py-5">
                <p className="text-sm font-medium text-slate-600">
                  คุณพอใจกับบริการแค่ไหน?
                </p>
                <StarRating value={reviewRating} onChange={setReviewRating} />
                <p className="text-xs text-slate-400">
                  {reviewRating === 5 && "ยอดเยี่ยม!"}
                  {reviewRating === 4 && "ดีมาก"}
                  {reviewRating === 3 && "พอใช้ได้"}
                  {reviewRating === 2 && "ต้องปรับปรุง"}
                  {reviewRating === 1 && "ไม่พอใจ"}
                </p>
              </div>

              {/* Comment */}
              <label className="mb-2 block text-xs font-medium text-slate-600">
                ความคิดเห็น{" "}
                <span className="font-normal text-slate-400">(ไม่บังคับ)</span>
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="บอกเล่าประสบการณ์ของคุณ เช่น คุณภาพงาน ความรวดเร็ว..."
                rows={3}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder-slate-300 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
              />

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={submittingReview}
                  onClick={() => setReviewOrder(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  ข้ามไปก่อน
                </button>
                <button
                  type="button"
                  disabled={submittingReview}
                  onClick={handleSubmitReview}
                  className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-amber-600 disabled:opacity-50"
                >
                  {submittingReview ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      กำลังส่ง
                    </>
                  ) : (
                    <>
                      <Star size={16} />
                      ส่งรีวิว
                    </>
                  )}
                </button>
              </div>

              <p className="mt-3 text-center text-[11px] text-slate-300">
                รีวิวของคุณจะช่วยให้ร้านค้าพัฒนาบริการดียิ่งขึ้น
              </p>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}