"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Store,
  Truck,
  AlertCircle,
  Check,
  Package,
  MessageCircle,
} from "lucide-react";

import { getOrder, type ApiOrder } from "@/lib/api/orders";
import { getShop } from "@/lib/api/shops";
import OrderReviewSection from "@/components/customer/OrderReviewSection";
import {
  statusConfig,
  cancelReasonLabels,
} from "@/components/shop/orders/statusConfig";
import { ApiError } from "@/lib/api/client";


const STEPS: Array<{
  key: ApiOrder["status"];
  label: string;
  desc: string;
}> = [
    {
      key: "pending_review",
      label: "รอตรวจสอบ",
      desc: "ร้านกำลังตรวจสอบรายการ",
    },
    {
      key: "accepted",
      label: "รับงานแล้ว",
      desc: "ร้านยืนยันรับงาน",
    },
    {
      key: "in_progress",
      label: "กำลังดำเนินการ",
      desc: "กำลังจัดพิมพ์งาน",
    },
    {
      key: "shipping",
      label: "กำลังจัดส่ง",
      desc: "กำลังจัดส่งหรือพร้อมรับ",
    },
    {
      key: "completed",
      label: "เสร็จสิ้น",
      desc: "ส่งมอบงานเรียบร้อย",
    },
  ];

export default function OrderStatusPage({
  params,
}: {
  params: { orderId: string };
}) {
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [shopName, setShopName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrder(params.orderId)
      .then(async (res) => {
        setOrder(res.order);
        try {
          const { shop } = await getShop(res.order.shopId);
          setShopName(shop.name);
        } catch {
          setShopName("ร้านค้า");
        }
      })
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? err.message
            : "ไม่พบออเดอร์นี้"
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params.orderId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto flex max-w-4xl items-center justify-center">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-5 shadow-sm">
            <Loader2
              size={20}
              className="animate-spin text-orange-500"
            />
            <p className="text-sm text-slate-500">
              กำลังโหลดรายละเอียดออเดอร์...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-md">
          <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <AlertCircle size={28} />
            </div>

            <h1 className="mt-4 text-lg text-slate-800">
              ไม่พบคำสั่งซื้อ
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {error || "ไม่พบออเดอร์นี้"}
            </p>

            <Link
              href="/orders"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm  text-white transition hover:bg-orange-600"
            >
              <ArrowLeft size={16} />
              ย้อนกลับ
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const meta =
    statusConfig[order.status] ??
    statusConfig.pending_review;

  const dateStr = new Date(
    order.createdAt
  ).toLocaleString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const stepIndex =
    order.status === "cancelled"
      ? -1
      : STEPS.findIndex(
        (step) => step.key === order.status
      );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-4 md:py-6">
      <div className="mx-auto max-w-4xl">

        <div className="mb-6">
          <Link
            href="/orders"
            className=" inline-flex items-center gap-2 text-xs text-orange-500 transition hover:text-orange-500"
          >
            <ArrowLeft size={16} />
            ย้อนกลับ
          </Link>
          <h2 className="text-2xl text-center flex items-center justify-center mb-5  text-orange-500">รายละเอียดคำสั่งซื้อ</h2>
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-md md:p-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

              <div className="min-w-0">
                <p className="text-xs text-slate-400">
                  คำสั่งซื้อ
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h1 className="text-xl  text-slate-800">
                    {order.code}
                  </h1>

                  <span className=" text-xs text-slate-400">
                    {order.ref}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                  <span>
                    ร้าน:{" "}
                    <span className=" text-slate-600">
                      {shopName}
                    </span>
                  </span>

                  <span className="hidden sm:inline">
                    ·
                  </span>

                  <span>
                    สั่งเมื่อ {dateStr}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`inline-flex w-fit items-center rounded-full border px-3.5 py-2 text-xs  ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                >
                  {meta.label}
                </span>

                <Link
                  href={`/chat?orderId=${order.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-2 text-xs text-orange-600 transition hover:bg-orange-100"
                >
                  <MessageCircle size={14} />
                  แชทกับร้าน
                </Link>
              </div>

            </div>

          </div>
        </div>

        <div className="mb-5 rounded-3xl border border-slate-100 bg-white p-5 shadow-md md:p-6">

          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
              <Package size={20} />
            </div>

            <div>
              <h2 className="text-base text-slate-800">
                สถานะคำสั่งซื้อ
              </h2>

              <p className="text-xs text-slate-400">
                ติดตามความคืบหน้าของงานพิมพ์
              </p>
            </div>
          </div>

          {order.status === "cancelled" ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-500">
                  <AlertCircle size={19} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm  text-red-700">
                    ออเดอร์นี้ถูกยกเลิกแล้ว
                  </p>

                  {order.cancelReason && (
                    <p className="mt-1 text-xs text-red-600">
                      เหตุผล:{" "}
                      {cancelReasonLabels[
                        order.cancelReason
                      ] || order.cancelReason}
                    </p>
                  )}

                  {order.cancelNote && (
                    <p className="mt-1 text-xs text-red-600">
                      หมายเหตุเพิ่มเติม:{" "}
                      {order.cancelNote}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop horizontal status */}
              <div className="hidden md:block">

                <div className="relative">
                  {/* line */}
                  <div className="absolute left-[10%] right-[10%] top-5 h-1 rounded-full bg-slate-100" />

                  {/* progress */}
                  <div
                    className="absolute left-[10%] top-5 h-1 rounded-full bg-orange-500 transition-all duration-500"
                    style={{
                      width:
                        stepIndex <= 0
                          ? "0%"
                          : `${Math.min(
                            (stepIndex /
                              (STEPS.length - 1)) *
                            80,
                            80
                          )}%`,
                    }}
                  />

                  <div className="relative grid grid-cols-5">
                    {STEPS.map((step, idx) => {
                      const isPassed =
                        idx <= stepIndex;
                      const isCurrent =
                        idx === stepIndex;

                      return (
                        <div
                          key={step.key}
                          className="flex flex-col items-center text-center"
                        >
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full border-4 transition-all ${isPassed
                              ? "border-orange-100 bg-orange-500 text-white"
                              : "border-slate-100 bg-white text-slate-300"
                              } ${isCurrent
                                ? "ring-4 ring-orange-50"
                                : ""
                              }`}
                          >
                            {isPassed ? (
                              <Check size={17} strokeWidth={3} />
                            ) : (
                              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                            )}
                          </div>

                          <p
                            className={`mt-3 text-xs  ${isCurrent
                              ? "text-orange-600"
                              : isPassed
                                ? "text-slate-700"
                                : "text-slate-400"
                              }`}
                          >
                            {step.label}
                          </p>

                          <p className="mt-1 max-w-[120px] text-[10px] leading-relaxed text-slate-400">
                            {step.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Mobile horizontal scroll */}
              <div className="md:hidden">

                <div className="overflow-x-auto pb-2">
                  <div className="min-w-[620px]">

                    <div className="relative">
                      <div className="absolute left-[10%] right-[10%] top-5 h-1 rounded-full bg-slate-100" />

                      <div
                        className="absolute left-[10%] top-5 h-1 rounded-full bg-orange-500"
                        style={{
                          width:
                            stepIndex <= 0
                              ? "0%"
                              : `${Math.min(
                                (stepIndex /
                                  (STEPS.length - 1)) *
                                80,
                                80
                              )}%`,
                        }}
                      />

                      <div className="relative grid grid-cols-5">
                        {STEPS.map((step, idx) => {
                          const isPassed =
                            idx <= stepIndex;
                          const isCurrent =
                            idx === stepIndex;

                          return (
                            <div
                              key={step.key}
                              className="flex flex-col items-center text-center"
                            >
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full border-4 ${isPassed
                                  ? "border-orange-100 bg-orange-500 text-white"
                                  : "border-slate-100 bg-white text-slate-300"
                                  } ${isCurrent
                                    ? "ring-4 ring-orange-50"
                                    : ""
                                  }`}
                              >
                                {isPassed ? (
                                  <Check
                                    size={17}
                                    strokeWidth={3}
                                  />
                                ) : (
                                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                                )}
                              </div>

                              <p
                                className={`mt-3 text-xs  ${isCurrent
                                  ? "text-orange-600"
                                  : isPassed
                                    ? "text-slate-700"
                                    : "text-slate-400"
                                  }`}
                              >
                                {step.label}
                              </p>

                              <p className="mt-1 max-w-[110px] text-[10px] leading-relaxed text-slate-400">
                                {step.desc}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                </div>

                <p className="mt-2 text-center text-[10px] text-slate-400">
                  เลื่อนเพื่อดูสถานะทั้งหมด →
                </p>

              </div>

              {/* Current status */}
              {stepIndex >= 0 && (
                <div className="mt-6 rounded-2xl bg-orange-50 px-4 py-3">
                  <p className="text-[11px] text-orange-500">
                    สถานะปัจจุบัน
                  </p>

                  <p className="mt-0.5 text-sm  text-orange-700">
                    {STEPS[stepIndex]?.label}
                  </p>

                  <p className="mt-0.5 text-xs text-orange-600">
                    {STEPS[stepIndex]?.desc}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mb-5 rounded-3xl border border-slate-100 bg-white p-5 shadow-md md:p-6">

          <h2 className="border-b border-slate-100 pb-4 text-l  text-slate-800">
            รายการสินค้าที่สั่ง
          </h2>

          {order.items &&
            order.items.length > 0 ? (
            <div className="divide-y divide-slate-100">

              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="space-y-2 py-4"
                >
                  <div className="flex items-start justify-between gap-4">

                    <p className="text-sm text-slate-800">
                      {item.serviceName}
                    </p>

                    <p className="shrink-0 text-sm  text-orange-600">
                      ฿
                      {item.itemSubtotal.toLocaleString()}
                    </p>

                  </div>

                  <p className="text-xs leading-relaxed text-slate-500">
                    อัตราพื้นฐาน: ฿
                    {item.baseRate}

                    {item.colorTierLabel
                      ? ` (${item.colorTierLabel} ฿${item.colorTierPrice})`
                      : ""}

                    {" · "}จำนวน{" "}
                    {item.quantity} ชุด

                    {item.pageCount
                      ? ` · ${item.pageCount} หน้า`
                      : ""}

                    {item.widthCm &&
                      item.heightCm
                      ? ` · ${item.widthCm}×${item.heightCm} ซม.`
                      : ""}
                  </p>

                  {item.optionsSnapshot &&
                    item.optionsSnapshot.length >
                    0 && (
                      <div className="space-y-1 rounded-xl border-l-2 border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        {item.optionsSnapshot.map(
                          (opt, oIdx) => (
                            <p key={oIdx}>
                              {opt.optionName}:{" "}
                              <span>
                                {opt.valueName ||
                                  opt.textValue}
                              </span>

                              {opt.extraPrice > 0
                                ? ` (+฿${opt.extraPrice})`
                                : ""}
                            </p>
                          )
                        )}
                      </div>
                    )}

                  {item.addOnsSnapshot &&
                    item.addOnsSnapshot.length >
                    0 && (
                      <div className="rounded-xl border-l-2 border-orange-300 bg-orange-50 px-3 py-2 text-xs text-orange-700">
                        <span>
                          บริการเสริม:
                        </span>{" "}
                        {item.addOnsSnapshot
                          .map(
                            (a) =>
                              `${a.name} (+฿${a.extraPrice})`
                          )
                          .join(", ")}
                      </div>
                    )}

                  {item.note && (
                    <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      <span>
                        โน้ต:
                      </span>{" "}
                      {item.note}
                    </div>
                  )}
                </div>
              ))}

            </div>
          ) : (
            <div className="space-y-2 py-4 text-xs text-slate-600">
              <p>
                ประเภทงาน:{" "}
                <span>
                  {order.serviceType || "-"}
                </span>
              </p>

              <p>
                ขนาดกระดาษ:{" "}
                <span>
                  {order.paperSize || "-"}
                </span>
              </p>

              <p>
                จำนวน:{" "}
                <span>
                  {order.copies ?? 1} ชุด (
                  {order.pages ?? 0} หน้า)
                </span>
              </p>
            </div>
          )}

          {/* TOTAL */}

          <div className="space-y-2 border-t border-slate-100 pt-4 text-sm">

            {order.subtotal != null && (
              <div className="flex justify-between text-slate-600">
                <span>ราคารวมสินค้า</span>
                <span>
                  ฿{order.subtotal.toLocaleString()}
                </span>
              </div>
            )}

            {order.shippingFee != null && (
              <div className="flex justify-between text-slate-600">
                <span>ค่าจัดส่ง</span>

                <span>
                  {order.shippingFee > 0
                    ? `฿${order.shippingFee.toLocaleString()}`
                    : "ฟรี / มารับเอง"}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-slate-800">
                ยอดชำระทั้งหมด
              </span>

              <span className="text-xl text-orange-600">
                ฿{order.totalPrice.toLocaleString()}
              </span>
            </div>

          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-md md:p-6">

          <h2 className="mb-4 text-lg text-slate-800">
            ข้อมูลการจัดส่งและหมายเหตุ
          </h2>

          <div className="space-y-4 text-xs text-slate-600">

            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">

              {order.delivery.method ===
                "self_pickup" ? (
                <>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                    <Store size={18} />
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400">
                      วิธีรับสินค้า
                    </p>

                    <p className="text-slate-800">
                      รับสินค้าเองที่หน้าร้าน
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                    <Truck size={18} />
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400">
                      วิธีรับสินค้า
                    </p>

                    <p className="text-slate-800">
                      ร้านจัดส่งให้
                    </p>
                  </div>
                </>
              )}

            </div>

            {order.delivery.address && (
              <div className="rounded-2xl border border-slate-100 p-4">
                <p className="text-[12px]  text-slate-400">
                  ที่อยู่จัดส่ง
                </p>

                <div className="mt-1 leading-relaxed text-slate-700 ">
                  {(() => {
                    let addr: Record<string, unknown> | null = null;
                    if (typeof order.delivery.address === "object" && order.delivery.address !== null) {
                      addr = order.delivery.address as Record<string, unknown>;
                    } else if (typeof order.delivery.address === "string") {
                      try {
                        const parsed = JSON.parse(order.delivery.address);
                        if (typeof parsed === "object" && parsed !== null) {
                          addr = parsed as Record<string, unknown>;
                        }
                      } catch {
                      }
                    }

                    if (addr) {
                      const receiver = (addr.receiverName || addr.name || "") as string;
                      const phone = (addr.phone || "") as string;
                      const addressLine = (addr.address || "") as string;
                      const subdistrict = (addr.subdistrict || "") as string;
                      const district = (addr.district || "") as string;
                      const province = (addr.province || "") as string;
                      const postalCode = (addr.postalCode || "") as string;

                      const locationParts = [
                        addressLine,
                        subdistrict ? `ต.${subdistrict}` : "",
                        district ? `อ.${district}` : "",
                        province ? `จ.${province}` : "",
                        postalCode,
                      ].filter(Boolean).join(" ");

                      return (
                        <div className="space-y-1 text-sl">
                          {(receiver || phone) && (
                            <p className="text-slate-800">
                              {receiver}
                            </p>
                          )}
                          <p className="text-slate-800">{phone}</p>
                          <p>{locationParts || String(order.delivery.address)}</p>
                        </div>
                      );
                    }

                    return <p>{String(order.delivery.address)}</p>;
                  })()}
                </div>
              </div>
            )}

            {order.note && (
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="mb-1 text-amber-800">
                  หมายเหตุถึงร้านค้า
                </p>

                <p className="leading-relaxed text-amber-700">
                  {order.note}
                </p>
              </div>
            )}

          </div>
        </div>

        {order.status === "completed" && (
          <div className="mt-5">
            <OrderReviewSection orderId={order.id} />
          </div>
        )}

      </div>
    </main>
  );
}

