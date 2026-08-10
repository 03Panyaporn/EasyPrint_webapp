"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Loader2, LogIn, ShoppingCart, Minus, Plus, FileText, MapPin } from "lucide-react";
import { getCarts, updateCartItem, removeCartItem, setCartDeliveryOption, type Cart } from "@/lib/api/cart";
import { getDeliveryOptions } from "@/lib/api/services";
import { getAddresses } from "@/lib/api/addresses";
import { ApiError } from "@/lib/api/client";
import type { DeliveryOption } from "@/components/shop/services/types";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const router = useRouter();
  const [carts, setCarts] = useState<Cart[]>([]);
  const [deliveryOptionsByShop, setDeliveryOptionsByShop] = useState<Record<string, DeliveryOption[]>>({});
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [hasAddress, setHasAddress] = useState(true); // เริ่มที่ true กันไม่ให้ banner กระพริบก่อนโหลดเสร็จ
  const handleCheckout = () => {
    if (selectedItems.length === 0) return;

    router.push(
      `/cart/check-out?items=${selectedItems.join(",")}`
    );
  };
  const selectedCartItems = carts.flatMap((cart) =>
    cart.items.filter((item) => selectedItems.includes(item.id))
  );



  const subtotal = selectedCartItems.reduce(
    (sum, item) => sum + item.lineTotal,
    0
  );
  const deliveryTotal = carts.reduce((sum, cart) => {
    const hasSelected = cart.items.some((item) =>
      selectedItems.includes(item.id)
    );

    return hasSelected ? sum + cart.deliveryFee : sum;
  }, 0);
  const grandTotal = subtotal + deliveryTotal;

  const load = async () => {
    try {
      setLoading(true);
      setLoadError("");
      setNeedsLogin(false);

      const [res, addressesRes] = await Promise.all([getCarts(), getAddresses()]);
      console.log(carts);

      setCarts(
        res.carts.filter((cart) => cart.items.length > 0)
      );
      setHasAddress(addressesRes.addresses.length > 0);

      const entries = await Promise.all(
        res.carts.map(async (cart) => {
          const { deliveryOptions: opts } =
            await getDeliveryOptions(cart.shopId);

          return [
            cart.shopId,
            opts.filter((o) => o.isActive),
          ] as const;
        })
      );

      setDeliveryOptionsByShop(
        Object.fromEntries(entries)
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setNeedsLogin(true);
      } else {
        setLoadError("โหลดตะกร้าไม่สำเร็จ");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
        colorTierId: item.colorTierId,
        widthCm: item.unitBreakdown?.mode === "per_sqm" ? item.unitBreakdown.widthCm : undefined,
        heightCm: item.unitBreakdown?.mode === "per_sqm" ? item.unitBreakdown.heightCm : undefined,
        addOnIds: item.addOns.map((a) => a.addOnServiceId),
        quantity: newQty,
        fileUrl: item.fileUrl,
        fileName: item.fileName,
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
      await removeCartItem(itemId);
      setSelectedItems((prev) =>
        prev.filter((id) => id !== itemId)
      );
      load();

    } catch {
      setLoadError("ลบรายการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setBusyItemId(null);
    }
  };

  const handleDeliverySelect = async (shopId: string, deliveryOptionId: string) => {
    // เลือกวิธีจัดส่งแบบ "ส่ง" (ไม่ใช่ "ยังไม่เลือก") ต้องมีที่อยู่จัดส่งบันทึกไว้ก่อนเสมอ
    // ไม่งั้นตอน checkout จะไม่มีที่อยู่ให้ร้านจัดส่งไปส่ง (ดู cart/check-out/page.tsx)
    if (deliveryOptionId && !hasAddress) {
      alert("กรุณาเพิ่มที่อยู่จัดส่งก่อน จึงจะเลือกวิธีจัดส่งแบบนี้ได้");
      return;
    }

    try {
      const { cart: updated } = await setCartDeliveryOption(shopId, { deliveryOptionId: deliveryOptionId || null });
      replaceCart(updated);
    } catch {
      setLoadError("เลือกวิธีจัดส่งไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };
  const toggleItem = (cart: Cart, itemId: string) => {
    const item = cart.items.find(
      (i) => i.id === itemId
    );

    if (!cart.isShopApproved) {
      alert("ร้านนี้ปิดให้บริการ ไม่สามารถสั่งซื้อได้");
      return;
    }


    if (!item?.isServiceActive) {
      alert("บริการนี้ปิดให้บริการ ไม่สามารถสั่งซื้อได้");
      return;
    }


    if (selectedItems.includes(itemId)) {
      setSelectedItems((prev) =>
        prev.filter((id) => id !== itemId)
      );
      return;
    }


    const selectedShop = carts.find((c) =>
      c.items.some((i) =>
        selectedItems.includes(i.id)
      )
    );


    if (
      selectedShop &&
      selectedShop.shopId !== cart.shopId
    ) {
      alert("สามารถเลือกสินค้าได้ครั้งละ 1 ร้าน");
      return;
    }


    setSelectedItems((prev) => [
      ...prev,
      itemId
    ]);
  };
  return (
    <div className="min-h-screen bg-slate-50 ">
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 px-4 sm:px-6 lg:px-16 py-3.5 flex items-center gap-3">
        <Link href="/Dashboard" className="flex items-center gap-2 text-slate-600 hover:text-orange-500 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className=" text-slate-800">ตะกร้าของฉัน</h1>
      </header>

      <main className="w-full lg:max-w-4xl mx-auto p-6 space-y-6">
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
            <p className="text-sm text-slate-800">ต้องเข้าสู่ระบบก่อนดูตะกร้า</p>
            <Link
              href={`/login?redirect=${encodeURIComponent("/cart")}`}
              className="px-5 py-2 text-sm  text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-md shadow-orange-200 transition"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        ) : carts.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-center">
            <ShoppingCart className="w-10 h-10 text-slate-300" />
            <p className="text-sm text-slate-500">ตะกร้าว่างเปล่า</p>
            <Link href="/" className="text-orange-500 text-sm hover:underline">
              เลือกร้านค้าเพื่อสั่งพิมพ์
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {loadError && <p className="text-sm text-red-500 ">{loadError}</p>}

            {carts.map((cart) => (
              <div key={cart.shopId} className=" text-xl rounded-2xl border-2 border-orange-50 bg-white shadow-md overflow-hidden">
                <div className="bg-white rounded-2xl border border-slate-100 p-4">
                  <h2 className="text-orange-500">{cart.shopName}</h2>
                  {!cart.isShopApproved && (
                    <p className="text-xs text-red-500 mt-1">ร้านนี้ไม่พร้อมให้บริการแล้ว กรุณาลบสินค้าออกจากตะกร้า</p>
                  )}
                </div>

                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-2xl p-4 space-y-2.5 border transition
        ${selectedItems.includes(item.id)
                          ? " border-slate-100 bg-orange-50"
                          : "border-slate-100 bg-white"
                        }`}
                    >
                      <div className="flex items-start gap-3">

                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          disabled={!cart.isShopApproved || !item.isServiceActive}
                          onChange={() => toggleItem(cart, item.id)}
                          className="mt-1 h-5 w-5 accent-orange-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        />

                        <div className="flex-1">

                          <div className="flex items-start justify-between gap-2">

                            <div className="min-w-0">

                              <h3 className=" text-slate-800 text-sm truncate">
                                {item.mainServiceName}
                              </h3>
                              {item.fileUrl && (
                                <h2 className="text-sm flex items-center gap-2 mt-1 min-w-0">
                                  <FileText size={15} className="text-orange-500 shrink-0" />
                                  <span className="truncate">{item.fileUrl.split("/").pop()}</span>
                                </h2>
                              )}
                              {!item.isServiceActive && (
                                <p className="text-[11px] text-red-500 mt-0.5">
                                  บริการนี้ปิดให้บริการไปแล้ว
                                </p>
                              )}

                              <p className="text-xs text-slate-500 mt-0.5">
                                สี: {item.colorTierLabel ?? "ขาวดำ"}
                              </p>

                              {item.unitBreakdown?.mode === "per_page" && (
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {item.unitBreakdown.pageCount} หน้า
                                </p>
                              )}

                              {item.unitBreakdown?.mode === "per_sqm" && (
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {item.unitBreakdown.widthCm} × {item.unitBreakdown.heightCm} ซม.
                                </p>
                              )}

                              {item.optionSelections.length > 0 && (
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {item.optionSelections
                                    .map(
                                      (s) =>
                                        `${s.optionName}: ${s.valueName ?? s.textValue ?? "-"}`
                                    )
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
                              <Trash2 color="red" size={16} />
                            </button>

                          </div>

                          <div className="flex items-center justify-between mt-3">

                            <div className="flex items-center gap-2 border border-slate-200 rounded-full px-1">

                              <button
                                onClick={() => handleQuantityChange(item, -1)}
                                disabled={busyItemId === item.id || item.quantity <= 1}
                                className="w-6 h-6 flex items-center justify-center text-slate-500 disabled:opacity-30"
                              >
                                <Minus size={12} />
                              </button>

                              <span className="text-xs  w-5 text-center">
                                {item.quantity}
                              </span>

                              <button
                                onClick={() => handleQuantityChange(item, 1)}
                                disabled={busyItemId === item.id}
                                className="w-6 h-6 flex items-center justify-center text-slate-500"
                              >
                                <Plus size={12} />
                              </button>

                            </div>

                            <span className=" text-orange-600 text-sm">
                              ฿{item.lineTotal.toLocaleString()}
                            </span>

                          </div>

                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {(deliveryOptionsByShop[cart.shopId]?.length ?? 0) > 0 && (
                  <div className=" rounded-2xl border border-slate-100 p-4 space-y-2">
                    <h3 className="text-xs text-slate-700">วิธีจัดส่ง</h3>
                    <select
                      value={cart.deliveryOption?.id ?? ""}
                      onChange={(e) => handleDeliverySelect(cart.shopId, e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 bg-orange-100"
                    >
                      <option value="">ยังไม่เลือก</option>
                      {deliveryOptionsByShop[cart.shopId].map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.name} — ฿{opt.baseFee}
                          {opt.freeShippingThreshold ? ` (ฟรีเมื่อครบ ฿${opt.freeShippingThreshold})` : ""}
                        </option>
                      ))}
                    </select>
                    {!hasAddress && (
                      <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-700">
                        <MapPin size={14} className="shrink-0 mt-0.5" />
                        <span>
                          คุณยังไม่มีที่อยู่จัดส่ง กรุณา
                          <Link href="/profile" className="font-semibold underline hover:text-amber-800">
                            เพิ่มที่อยู่
                          </Link>
                          {" "}ก่อน จึงจะเลือกวิธีจัดส่งแบบส่งได้
                        </span>
                      </div>
                    )}
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
                  <div className="flex justify-between text-orange-600 text-base pt-1.5 border-t border-slate-100">
                    <span>ยอดรวมทั้งหมด</span>
                    <span>฿{cart.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur-md shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">

          <div>
            <p className="text-xs text-slate-500">
              เลือกแล้ว {selectedItems.length} รายการ
            </p>

            <div>
              <p className="text-xs text-slate-500">
                สินค้า ฿{subtotal.toLocaleString()}
              </p>
              <p className="text-lg  text-orange-600">
                ฿{grandTotal.toLocaleString()}
              </p>
            </div>
          </div>

          <button
            className="flex  px-6
    h-12 py-3.5 text-center  rounded-full bg-orange-500 hover:bg-orange-600 text-white transition"
            onClick={handleCheckout}
            disabled={
              selectedItems.length === 0 ||
              selectedCartItems.some(
                (item) => !item.isServiceActive
              ) ||
              carts.some(
                (cart) =>
                  selectedItems.some(id =>
                    cart.items.some(
                      item =>
                        item.id === id
                    )
                  )
                  &&
                  !cart.isShopApproved
              )
            }
          >
            ชำระเงิน ({selectedItems.length})
          </button>

        </div>
      </div>
    </div>
  );
}
