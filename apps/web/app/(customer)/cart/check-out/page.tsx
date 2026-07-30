"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Store,
  Truck,
  Upload,
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { getCarts, checkoutCart, type Cart } from "@/lib/api/cart";
import { getShop } from "@/lib/api/shops";
import { uploadFile } from "@/lib/api/uploads";
import { ApiError } from "@/lib/api/client";

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shopId = searchParams.get("shopId");

  const [cart, setCart] = useState<Cart | null>(null);
  const [shopName, setShopName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [deliveryMethod, setDeliveryMethod] = useState<"self_pickup" | "shop_delivery">("self_pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [note, setNote] = useState("");
  const [slip, setSlip] = useState<File | null>(null);

  useEffect(() => {
    async function loadCart() {
      if (!shopId) {
        setLoading(false);
        return;
      }
      try {
        const { carts } = await getCarts();
        const selected = carts.find((c) => c.shopId === shopId);
        setCart(selected ?? null);

        if (selected) {
          try {
            const { shop } = await getShop(selected.shopId);
            setShopName(shop.name);
          } catch {
            setShopName(selected.shopName);
          }
        }
      } catch (err) {
        console.error("Failed to load cart for checkout", err);
      } finally {
        setLoading(false);
      }
    }

    loadCart();
  }, [shopId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId || !cart) return;

    if (!slip) {
      setSubmitError("กรุณาอัปโหลดหลักฐานการชำระเงิน (สลิปโอนเงิน)");
      return;
    }

    if (deliveryMethod === "shop_delivery" && !deliveryAddress.trim()) {
      setSubmitError("กรุณาระบุที่อยู่สำหรับจัดส่ง");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      // 1. Upload payment slip
      const { path: slipUrl } = await uploadFile(slip, "payment-slip");

      // 2. Submit Checkout API
      const res = await checkoutCart(shopId, {
        slipUrl,
        deliveryMethod,
        deliveryAddress: deliveryMethod === "shop_delivery" ? deliveryAddress : undefined,
        note: note.trim() || undefined,
      });

      // 3. Redirect to order details
      router.push(`/orders/${res.order.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("เกิดข้อผิดพลาดในการทำรายการ กรุณาลองใหม่อีกครั้ง");
      }
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-400">
        <Loader2 className="animate-spin mr-2" size={24} />
        <span>กำลังโหลดข้อมูลสั่งซื้อ...</span>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-slate-500 font-semibold mb-4">ไม่พบข้อมูลสินค้าในตะกร้า</p>
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition"
        >
          <ArrowLeft size={18} /> กลับไปยังตะกร้า
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-slate-50 to-orange-50/30 pb-20">
      <div className="w-full max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/cart"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">ชำระเงิน / ยืนยันคำสั่งซื้อ</h1>
            <p className="text-xs text-slate-500">ร้าน: {shopName || cart.shopName}</p>
          </div>
        </div>

        {submitError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* รายการสินค้า */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6 space-y-4">
            <h2 className="font-bold text-lg text-slate-800 border-b pb-3">สรุปรายการสั่งซื้อ</h2>
            <div className="divide-y divide-slate-100">
              {cart.items.map((item) => (
                <div key={item.id} className="py-3 flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-slate-800">{item.mainServiceName}</p>
                    <div className="text-xs text-slate-500 space-y-0.5">
                      {item.optionSelections.map((opt) => (
                        <p key={opt.optionId}>
                          {opt.optionName}: <span className="text-slate-700">{opt.valueName || opt.textValue}</span>
                        </p>
                      ))}
                      {item.addOns.map((add) => (
                        <p key={add.addOnServiceId} className="text-orange-600">
                          + {add.name} (+฿{add.extraPrice})
                        </p>
                      ))}
                      <p className="text-slate-400">จำนวน: {item.quantity} ชุด</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-800 text-sm shrink-0">฿{item.lineTotal.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>ราคารวมสินค้า</span>
                <span>฿{cart.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>ค่าจัดส่ง</span>
                <span>{cart.deliveryFee > 0 ? `฿${cart.deliveryFee.toLocaleString()}` : "ฟรี / มารับเอง"}</span>
              </div>
              <div className="flex justify-between items-center text-base font-bold text-slate-800 pt-2 border-t">
                <span>ยอดชำระทั้งหมด</span>
                <span className="text-xl font-black text-orange-600">฿{cart.total.toLocaleString()}</span>
              </div>
            </div>
          </section>

          {/* วิธีรับสินค้า */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6 space-y-4">
            <h2 className="font-bold text-lg text-slate-800">วิธีรับสินค้า</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <label
                className={`cursor-pointer border rounded-2xl p-4 flex gap-3 items-center transition-all ${
                  deliveryMethod === "self_pickup" ? "border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20" : "border-slate-200 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="delivery"
                  checked={deliveryMethod === "self_pickup"}
                  onChange={() => setDeliveryMethod("self_pickup")}
                  className="text-orange-500 focus:ring-orange-500"
                />
                <Store className="text-orange-500 shrink-0" size={20} />
                <div>
                  <p className="font-bold text-sm text-slate-800">รับที่ร้าน</p>
                  <p className="text-xs text-slate-500">เดินทางไปรับสินค้าด้วยตนเองที่หน้าร้าน</p>
                </div>
              </label>

              <label
                className={`cursor-pointer border rounded-2xl p-4 flex gap-3 items-center transition-all ${
                  deliveryMethod === "shop_delivery" ? "border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20" : "border-slate-200 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="delivery"
                  checked={deliveryMethod === "shop_delivery"}
                  onChange={() => setDeliveryMethod("shop_delivery")}
                  className="text-orange-500 focus:ring-orange-500"
                />
                <Truck className="text-orange-500 shrink-0" size={20} />
                <div>
                  <p className="font-bold text-sm text-slate-800">ร้านจัดส่งให้</p>
                  <p className="text-xs text-slate-500">จัดส่งไปยังที่อยู่ของคุณ</p>
                </div>
              </label>
            </div>

            {deliveryMethod === "shop_delivery" && (
              <div className="pt-3 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">ที่อยู่จัดส่ง *</label>
                <textarea
                  rows={3}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="กรอกชื่อ-นามสกุล, เบอร์โทรศัพท์ และที่อยู่จัดส่งโดยละเอียด"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
                />
              </div>
            )}

            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">หมายเหตุถึงร้านค้า (ถ้ามี)</label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="ระบุข้อความเพิ่มเติมหรือข้อจำกัดในการรับงาน"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
              />
            </div>
          </section>

          {/* สลิปโอนเงิน */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6 space-y-4">
            <h2 className="font-bold text-lg text-slate-800">แนบหลักฐานการชำระเงิน</h2>
            <div className="bg-orange-50/60 rounded-2xl p-4 text-center border border-orange-100 space-y-2">
              <p className="text-xs font-bold text-orange-800">ชำระเงินผ่าน QR / เลขบัญชีร้านค้า</p>
              <p className="text-2xl font-black text-orange-600">฿{cart.total.toLocaleString()}</p>
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-orange-400 transition cursor-pointer relative bg-slate-50/50">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSlip(e.target.files?.[0] ?? null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="mx-auto text-orange-500 mb-2" size={28} />
              <p className="text-sm font-semibold text-slate-700">
                {slip ? slip.name : "คลิกหรือลากไฟล์สลิปมาวางที่นี่"}
              </p>
              <p className="text-xs text-slate-400 mt-1">รองรับไฟล์รูปภาพ JPG, PNG, WEBP (ไม่เกิน 5MB)</p>
            </div>
          </section>

          {/* Submit */}
          <div className="flex gap-4 pt-2">
            <Link
              href="/cart"
              className="w-1/3 py-3.5 rounded-xl border border-slate-200 text-center font-bold text-slate-600 hover:bg-slate-50 transition text-sm"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-2/3 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md shadow-orange-200 transition text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>กำลังทำรายการ...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>ยืนยันคำสั่งซื้อ (฿{cart.total.toLocaleString()})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}