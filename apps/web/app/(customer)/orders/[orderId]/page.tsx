"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Store, Truck, AlertCircle } from "lucide-react";
import { getOrder, type ApiOrder } from "@/lib/api/orders";
import { getShop } from "@/lib/api/shops";
import { statusConfig, cancelReasonLabels } from "@/components/shop/orders/statusConfig";
import { ApiError } from "@/lib/api/client";

const STEPS: Array<{ key: ApiOrder["status"]; label: string; desc: string }> = [
  { key: "pending_review", label: "รอตรวจสอบ", desc: "ร้านค้ากำลังตรวจสอบสลิปและรายการงาน" },
  { key: "accepted", label: "รับงานแล้ว", desc: "ร้านค้ายืนยันรับงานพิมพ์" },
  { key: "in_progress", label: "กำลังดำเนินการ", desc: "กำลังจัดพิมพ์และเตรียมสินค้า" },
  { key: "shipping", label: "กำลังจัดส่ง", desc: "สินค้าอยู่ระหว่างการจัดส่งหรือพร้อมรับ" },
  { key: "completed", label: "เสร็จสิ้น", desc: "ส่งมอบงานเรียบร้อยแล้ว" },
];

export default function OrderStatusPage({ params }: { params: { orderId: string } }) {
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
      .catch((err) => setError(err instanceof ApiError ? err.message : "ไม่พบออเดอร์นี้"))
      .finally(() => setLoading(false));
  }, [params.orderId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 size={24} className="animate-spin" />
        <span className="text-sm">กำลังโหลดรายละเอียดออเดอร์...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <main className="max-w-3xl mx-auto p-6 text-center space-y-4">
        <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm flex items-center justify-center gap-2 border border-red-200">
          <AlertCircle size={18} /> {error || "ไม่พบออเดอร์นี้"}
        </div>
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition"
        >
          <ArrowLeft size={16} /> กลับไปยังประวัติสั่งพิมพ์
        </Link>
      </main>
    );
  }

  const meta = statusConfig[order.status];
  const dateStr = new Date(order.createdAt).toLocaleString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Calculate current step index for timeline
  const stepIndex = order.status === "cancelled" ? -1 : STEPS.findIndex((s) => s.key === order.status);

  return (
    <main className="max-w-3xl mx-auto p-4 md:p-8 space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <Link
          href="/orders"
          className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">คำสั่งซื้อ {order.code}</h1>
            <span className="text-xs font-mono text-slate-400">({order.ref})</span>
          </div>
          <p className="text-xs text-slate-500">ร้าน: {shopName} · สั่งเมื่อ {dateStr}</p>
        </div>
      </div>

      {/* Header status card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400">สถานะปัจจุบัน</span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}>
            {meta.label}
          </span>
        </div>

        {order.status === "cancelled" ? (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs space-y-1">
            <p className="font-bold">ออเดอร์นี้ถูกยกเลิกแล้ว</p>
            {order.cancelReason && (
              <p>เหตุผล: {cancelReasonLabels[order.cancelReason] || order.cancelReason}</p>
            )}
            {order.cancelNote && <p>หมายเหตุเพิ่มเติม: {order.cancelNote}</p>}
          </div>
        ) : (
          /* Progress Timeline */
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {STEPS.map((step, idx) => {
                const isPassed = idx <= stepIndex;
                const isCurrent = idx === stepIndex;

                return (
                  <div key={step.key} className="relative flex items-start gap-3">
                    <div
                      className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                        isPassed
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "bg-white border-slate-300"
                      }`}
                    >
                      {isPassed && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${isCurrent ? "text-orange-600 text-base" : isPassed ? "text-slate-800" : "text-slate-400"}`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Snapshot Items Details */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-lg text-slate-800 border-b pb-3">รายการสินค้าที่สั่ง</h2>

        {order.items && order.items.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-3.5 space-y-1 text-xs">
                <div className="flex justify-between font-bold text-slate-800 text-sm">
                  <span>{item.serviceName}</span>
                  <span className="text-orange-600">฿{item.itemSubtotal.toLocaleString()}</span>
                </div>
                <p className="text-slate-500">
                  อัตราพื้นฐาน: ฿{item.baseRate} {item.colorTierLabel ? `(${item.colorTierLabel} ฿${item.colorTierPrice})` : ""} · จำนวน {item.quantity} ชุด
                  {item.pageCount ? ` · ${item.pageCount} หน้า` : ""}
                  {item.widthCm && item.heightCm ? ` · ${item.widthCm}×${item.heightCm} ซม.` : ""}
                </p>

                {item.optionsSnapshot && item.optionsSnapshot.length > 0 && (
                  <div className="text-slate-600 pl-2.5 border-l-2 border-slate-200 space-y-0.5 mt-1">
                    {item.optionsSnapshot.map((opt, oIdx) => (
                      <p key={oIdx}>
                        {opt.optionName}: <span className="font-semibold">{opt.valueName || opt.textValue}</span>
                        {opt.extraPrice > 0 ? ` (+฿${opt.extraPrice})` : ""}
                      </p>
                    ))}
                  </div>
                )}

                {item.addOnsSnapshot && item.addOnsSnapshot.length > 0 && (
                  <p className="text-orange-600 pl-2.5 border-l-2 border-orange-200 mt-1">
                    บริการเสริม: {item.addOnsSnapshot.map((a) => `${a.name} (+฿${a.extraPrice})`).join(", ")}
                  </p>
                )}

                {item.note && <p className="text-amber-700 bg-amber-50 p-2 rounded-lg mt-1">โน้ต: {item.note}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-600 space-y-1">
            <p>ประเภทงาน: <span className="font-semibold">{order.serviceType || "-"}</span></p>
            <p>ขนาดกระดาษ: <span className="font-semibold">{order.paperSize || "-"}</span></p>
            <p>จำนวน: <span className="font-semibold">{order.copies ?? 1} ชุด ({order.pages ?? 0} หน้า)</span></p>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 space-y-2 text-sm">
          {order.subtotal != null && (
            <div className="flex justify-between text-slate-600">
              <span>ราคารวมสินค้า</span>
              <span>฿{order.subtotal.toLocaleString()}</span>
            </div>
          )}
          {order.shippingFee != null && (
            <div className="flex justify-between text-slate-600">
              <span>ค่าจัดส่ง</span>
              <span>{order.shippingFee > 0 ? `฿${order.shippingFee.toLocaleString()}` : "ฟรี / มารับเอง"}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-base font-bold text-slate-800 pt-2 border-t">
            <span>ยอดชำระทั้งหมด</span>
            <span className="text-xl font-black text-orange-600">฿{order.totalPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Delivery & Notes */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-lg text-slate-800">ข้อมูลการจัดส่งและหมายเหตุ</h2>
        <div className="text-xs text-slate-600 space-y-2">
          <div className="flex items-center gap-2">
            {order.delivery.method === "self_pickup" ? (
              <>
                <Store className="text-orange-500" size={18} />
                <span className="font-semibold text-slate-800">รับสินค้าเองที่หน้าร้าน</span>
              </>
            ) : (
              <>
                <Truck className="text-orange-500" size={18} />
                <span className="font-semibold text-slate-800">ร้านจัดส่งให้</span>
              </>
            )}
          </div>
          {order.delivery.address && (
            <p className="pl-6 text-slate-700">ที่อยู่จัดส่ง: {order.delivery.address}</p>
          )}
          {order.note && (
            <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <p className="font-bold text-slate-700 mb-1">หมายเหตุถึงร้านค้า:</p>
              <p className="text-slate-600">{order.note}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

