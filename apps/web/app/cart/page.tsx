"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Loader2, LogIn, ShoppingCart, Minus, Plus } from "lucide-react";
import { getCarts, updateCartItem, removeCartItem, setCartDeliveryOption, type Cart } from "@/lib/api/cart";
import { getDeliveryOptions } from "@/lib/api/services";
import { ApiError } from "@/lib/api/client";
import type { DeliveryOption } from "@/components/shop/services/types";

export default function CartPage() {
  const [carts, setCarts] = useState<Cart[]>([]);
  const [deliveryOptionsByShop, setDeliveryOptionsByShop] = useState<Record<string, DeliveryOption[]>>({});
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setLoadError("");
    setNeedsLogin(false);
    getCarts()
      .then(async (res) => {
        setCarts(res.carts);
        const entries = await Promise.all(
          res.carts.map(async (cart) => {
            const { deliveryOptions: opts } = await getDeliveryOptions(cart.shopId);
            return [cart.shopId, opts.filter((o) => o.isActive)] as const;
          })
        );
        setDeliveryOptionsByShop(Object.fromEntries(entries));
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) setNeedsLogin(true);
        else setLoadError("โหลดตะกร้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const replaceCart = (updated: Cart) => {
    setCarts((prev) => prev.map((c) => (c.shopId === updated.shopId ? updated : c)));
  };

  const handleQuantityChange = async (item: Cart["items"][number], delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    setBusyItemId(item.id);
    try {
      const { cart: updated } = await updateCartItem(item.id, {
        mainServiceId: item.mainServiceId,
        optionSelections: item.optionSelections.map((s) => ({
          optionId: s.optionId,
          valueId: s.valueId,
          textValue: s.textValue,
        })),
        widthCm: item.unitBreakdown?.mode === "per_sqm" ? item.unitBreakdown.widthCm : undefined,
        heightCm: item.unitBreakdown?.mode === "per_sqm" ? item.unitBreakdown.heightCm : undefined,
        addOnIds: item.addOns.map((a) => a.addOnServiceId),
        quantity: newQty,
        fileUrl: item.fileUrl,
        note: item.note,
      });
      replaceCart(updated);
    } catch {
      setLoadError("แก้ไขจำนวนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setBusyItemId(null);
    }
  };

  const handleRemove = async (itemId: string) => {
    setBusyItemId(itemId);
    try {
      const { cart: updated } = await removeCartItem(itemId);
      if (updated.items.length === 0) {
        setCarts((prev) => prev.filter((c) => c.shopId !== updated.shopId));
      } else {
        replaceCart(updated);
      }
    } catch {
      setLoadError("ลบรายการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setBusyItemId(null);
    }
  };

  const handleDeliverySelect = async (shopId: string, deliveryOptionId: string) => {
    try {
      const { cart: updated } = await setCartDeliveryOption(shopId, { deliveryOptionId: deliveryOptionId || null });
      replaceCart(updated);
    } catch {
      setLoadError("เลือกวิธีจัดส่งไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 px-4 sm:px-6 lg:px-16 py-3.5 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-orange-500 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-black text-slate-800">ตะกร้าของฉัน</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-slate-400">
            <Loader2 size={24} className="animate-spin" />
            <p className="text-sm">กำลังโหลดตะกร้า...</p>
          </div>
        ) : needsLogin ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
              <LogIn size={22} />
            </div>
            <p className="text-sm font-semibold text-slate-800">ต้องเข้าสู่ระบบก่อนดูตะกร้า</p>
            <Link
              href={`/login?redirect=${encodeURIComponent("/cart")}`}
              className="px-5 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-md shadow-orange-200 transition"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        ) : carts.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-center">
            <ShoppingCart className="w-10 h-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">ตะกร้าว่างเปล่า</p>
            <Link href="/" className="text-orange-500 text-sm font-bold hover:underline">
              เลือกร้านค้าเพื่อสั่งพิมพ์
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {loadError && <p className="text-sm text-red-500 font-semibold">{loadError}</p>}

            {carts.map((cart) => (
              <div key={cart.shopId} className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-100 p-4">
                  <h2 className="font-bold text-slate-800">{cart.shopName}</h2>
                  {!cart.isShopApproved && (
                    <p className="text-xs text-red-500 mt-1">ร้านนี้ไม่พร้อมให้บริการแล้ว กรุณาลบสินค้าออกจากตะกร้า</p>
                  )}
                </div>

                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-800 text-sm truncate">{item.mainServiceName}</h3>
                          {!item.isServiceActive && <p className="text-[11px] text-red-500 mt-0.5">บริการนี้ปิดให้บริการไปแล้ว</p>}
                          {item.unitBreakdown?.mode === "per_page" && (
                            <p className="text-xs text-slate-500 mt-0.5">{item.unitBreakdown.pageCount} หน้า</p>
                          )}
                          {item.unitBreakdown?.mode === "per_sqm" && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {item.unitBreakdown.widthCm}×{item.unitBreakdown.heightCm} ซม.
                            </p>
                          )}
                          {item.optionSelections.length > 0 && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {item.optionSelections
                                .map((s) => `${s.optionName}: ${s.valueName ?? s.textValue ?? "-"}`)
                                .join(" · ")}
                            </p>
                          )}
                          {item.addOns.length > 0 && (
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              + {item.addOns.map((a) => a.name).join(", ")}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemove(item.id)}
                          disabled={busyItemId === item.id}
                          className="text-slate-400 hover:text-red-500 transition shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 border border-slate-200 rounded-full px-1">
                          <button
                            onClick={() => handleQuantityChange(item, -1)}
                            disabled={busyItemId === item.id || item.quantity <= 1}
                            className="w-6 h-6 flex items-center justify-center text-slate-500 disabled:opacity-30"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item, 1)}
                            disabled={busyItemId === item.id}
                            className="w-6 h-6 flex items-center justify-center text-slate-500"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="font-bold text-orange-600 text-sm">฿{item.lineTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {(deliveryOptionsByShop[cart.shopId]?.length ?? 0) > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
                    <h3 className="text-xs font-bold text-slate-700">วิธีจัดส่ง</h3>
                    <select
                      value={cart.deliveryOption?.id ?? ""}
                      onChange={(e) => handleDeliverySelect(cart.shopId, e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 bg-white"
                    >
                      <option value="">ยังไม่เลือก</option>
                      {deliveryOptionsByShop[cart.shopId].map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.name} — ฿{opt.baseFee}
                          {opt.freeShippingThreshold ? ` (ฟรีเมื่อครบ ฿${opt.freeShippingThreshold})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>ยอดรวมสินค้า</span>
                    <span>฿{cart.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>ค่าจัดส่ง</span>
                    <span>฿{cart.deliveryFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-black text-orange-600 text-base pt-1.5 border-t border-slate-100">
                    <span>ยอดรวมทั้งหมด</span>
                    <span>฿{cart.total.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  disabled
                  title="ระบบสั่งซื้อ/ชำระเงินจะเปิดให้ใช้งานเร็วๆ นี้"
                  className="w-full py-3.5 font-bold rounded-full bg-slate-300 text-white cursor-not-allowed"
                >
                  ยืนยันสั่งซื้อ (เร็วๆ นี้)
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
