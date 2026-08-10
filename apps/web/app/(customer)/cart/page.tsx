"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Trash2,
  Loader2,
  LogIn,
  ShoppingCart,
  Minus,
  Plus,
  FileText,
  Store,
  Truck,
  MapPin,
} from "lucide-react";
import {
  getCarts,
  updateCartItem,
  removeCartItem,
  setCartDeliveryOption,
  type Cart,
} from "@/lib/api/cart";
import { getDeliveryOptions } from "@/lib/api/services";
import { getAddresses } from "@/lib/api/addresses";
import { ApiError } from "@/lib/api/client";
import type { DeliveryOption } from "@/components/shop/services/types";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const router = useRouter();

  const [carts, setCarts] = useState<Cart[]>([]);
  const [deliveryOptionsByShop, setDeliveryOptionsByShop] = useState<
    Record<string, DeliveryOption[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [hasAddress, setHasAddress] = useState(true); // เริ่มที่ true กันไม่ให้ banner กระพริบก่อนโหลดเสร็จ

  const handleCheckout = () => {
    if (selectedItems.length === 0) return;

    // หาร้านที่มีสินค้าที่ถูกเลือก
    const selectedShop = carts.find((cart) =>
      cart.items.some((item) =>
        selectedItems.includes(item.id)
      )
    );

    if (!selectedShop) return;

    // ร้านต้องพร้อมให้บริการ
    if (!selectedShop.isShopApproved) {
      alert("ร้านนี้ไม่พร้อมให้บริการ");
      return;
    }

    // ต้องเลือกวิธีจัดส่งก่อน
    if (!selectedShop.deliveryOption?.id) {
      alert("กรุณาเลือกวิธีจัดส่งก่อนชำระเงิน");
      return;
    }

    // ตรวจสอบว่าสินค้าที่เลือกยังเปิดให้บริการอยู่
    const hasInactiveService = selectedShop.items.some(
      (item) =>
        selectedItems.includes(item.id) &&
        !item.isServiceActive
    );

    if (hasInactiveService) {
      alert(
        "มีบริการที่ปิดให้บริการ ไม่สามารถดำเนินการต่อได้"
      );
      return;
    }

    // ผ่านทุกเงื่อนไขแล้วค่อยไป Checkout
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

      const [res, addressesRes] = await Promise.all([
        getCarts(),
        getAddresses(),
      ]);

      const validCarts = res.carts.filter(
        (cart) => cart.items.length > 0
      );
      setHasAddress(addressesRes.addresses.length > 0);

      setCarts(validCarts);

      const entries = await Promise.all(
        validCarts.map(async (cart) => {
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
    setCarts((prev) =>
      prev.map((c) =>
        c.shopId === updated.shopId ? updated : c
      )
    );
  };

  const handleQuantityChange = async (
    item: Cart["items"][number],
    delta: number
  ) => {
    const newQty = item.quantity + delta;

    if (newQty < 1) return;

    setBusyItemId(item.id);

    try {
      const { cart: updated } = await updateCartItem(
        item.id,
        {
          mainServiceId: item.mainServiceId,
          optionSelections: item.optionSelections.map(
            (s) => ({
              optionId: s.optionId,
              valueId: s.valueId,
              textValue: s.textValue,
            })
          ),
          colorTierId: item.colorTierId,
          widthCm:
            item.unitBreakdown?.mode === "per_sqm"
              ? item.unitBreakdown.widthCm
              : undefined,
          heightCm:
            item.unitBreakdown?.mode === "per_sqm"
              ? item.unitBreakdown.heightCm
              : undefined,
          addOnIds: item.addOns.map(
            (a) => a.addOnServiceId
          ),
          quantity: newQty,
          fileUrl: item.fileUrl,
          fileName: item.fileName,
          note: item.note,
        }
      );

      replaceCart(updated);
    } catch {
      setLoadError(
        "แก้ไขจำนวนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
      );
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

      await load();
    } catch {
      setLoadError(
        "ลบรายการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setBusyItemId(null);
    }
  };

  const handleDeliverySelect = async (
    shopId: string,
    deliveryOptionId: string
  ) => {
    // เลือกวิธีจัดส่งแบบ "ส่ง" (ไม่ใช่ "ยังไม่เลือก") ต้องมีที่อยู่จัดส่งบันทึกไว้ก่อนเสมอ
    // ไม่งั้นตอน checkout จะไม่มีที่อยู่ให้ร้านจัดส่งไปส่ง (ดู cart/check-out/page.tsx)
    if (deliveryOptionId && !hasAddress) {
      alert("กรุณาเพิ่มที่อยู่จัดส่งก่อน จึงจะเลือกวิธีจัดส่งแบบนี้ได้");
      return;
    }

    try {
      const { cart: updated } =
        await setCartDeliveryOption(
          shopId,
          {
            deliveryOptionId:
              deliveryOptionId || null,
          }
        );

      replaceCart(updated);
    } catch {
      setLoadError(
        "เลือกวิธีจัดส่งไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
      );
    }
  };

  const toggleItem = (
    cart: Cart,
    itemId: string
  ) => {
    const item = cart.items.find(
      (i) => i.id === itemId
    );

    if (!cart.isShopApproved) {
      alert(
        "ร้านนี้ปิดให้บริการ ไม่สามารถสั่งซื้อได้"
      );
      return;
    }

    if (!item?.isServiceActive) {
      alert(
        "บริการนี้ปิดให้บริการ ไม่สามารถสั่งซื้อได้"
      );
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
      alert(
        "สามารถเลือกสินค้าได้ครั้งละ 1 ร้าน"
      );
      return;
    }

    setSelectedItems((prev) => [
      ...prev,
      itemId,
    ]);
  };
  return (
    <div className="min-h-screen bg-orange-50/40 via-white to-white pb-32">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="
      w-11 h-11
      rounded-2xl
      bg-orange-500
      text-white
      flex items-center justify-center
      shadow-md shadow-orange-200
    ">
              <ShoppingCart size={20} />
            </div>

            <div>
              <h1 className="
        text-xl sm:text-2xl
        text-slate-800
      ">
                ตะกร้าสินค้า
              </h1>

              <p className="text-xs text-slate-400 mt-0.5">
                ตรวจสอบรายการสั่งพิมพ์ก่อนดำเนินการชำระเงิน
              </p>
            </div>
          </div>
        </div>
        {loading ? (

          <div className="min-h-[55vh] flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center">
              <Loader2
                size={24}
                className="animate-spin text-orange-500 "
              />
            </div>

            <p className="text-sm text-slate-500">
              กำลังโหลดตะกร้า...
            </p>
          </div>

        ) : needsLogin ? (

          <div className="min-h-[55vh] flex items-center justify-center">
            <div className="
            w-full max-w-sm
            bg-white
            rounded-3xl
            border border-orange-100
            shadow-lg shadow-orange-100/50
            p-7
            text-center
          ">

              <div className="
              w-16 h-16 mx-auto
              rounded-2xl
              bg-gradient-to-br from-orange-100 to-orange-50
              text-orange-500
              flex items-center justify-center
            ">
                <LogIn size={25} />
              </div>

              <h2 className="mt-5 text-base text-slate-800">
                ต้องเข้าสู่ระบบก่อนดูตะกร้า
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                กรุณาเข้าสู่ระบบเพื่อดูรายการสั่งพิมพ์ของคุณ
              </p>

              <Link
                href={`/login?redirect=${encodeURIComponent("/cart")}`}
                className="
                inline-flex
                mt-5
                px-6 py-2.5
                rounded-xl
                bg-orange-500
                hover:bg-orange-600
                text-white
                text-xs
                shadow-md shadow-orange-200
                transition
              "
              >
                เข้าสู่ระบบ
              </Link>

            </div>
          </div>

        ) : carts.length === 0 ? (

          <div className="min-h-[55vh] flex items-center justify-center">
            <div className="text-center">

              <div className="
              w-20 h-20 mx-auto
              rounded-3xl
              bg-gradient-to-br from-orange-100 to-orange-50
              flex items-center justify-center
              shadow-sm
            ">
                <ShoppingCart
                  size={34}
                  className="text-orange-400 "
                />
              </div>

              <h2 className="mt-5 text-base text-slate-700">
                ตะกร้าของคุณยังว่าง
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                เลือกร้านค้าและบริการที่ต้องการสั่งพิมพ์
              </p>

              <Link
                href="/"
                className="
                inline-flex
                mt-5
                px-6 py-2.5
                rounded-xl
                bg-orange-500
                hover:bg-orange-600
                text-white
                text-xs
                shadow-md shadow-orange-200
                transition
              "
              >
                เลือกร้านค้า
              </Link>

            </div>
          </div>

        ) : (

          <div className="space-y-5">

            {/* ERROR */}
            {loadError && (
              <div className="
              rounded-xl
              border border-red-100
              bg-red-50
              px-4 py-3
            ">
                <p className="text-xs text-red-500">
                  {loadError}
                </p>
              </div>
            )}

            {/* ================= SHOP ================= */}
            {carts.map((cart) => (

              <section
                key={cart.shopId}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md shadow-slate-200"
              >

                {/* SHOP HEADER */}
                <div className="px-4 sm:px-5 py-4 ">

                  <div className="flex items-center justify-between gap-3">

                    <div className="flex items-center gap-3 min-w-0">

                      <div className="w-11 h-11 shrink-0 rounded-2xl text-orange-500 flex items-center justify-center bg-orange-100
                    ">
                        <Store size={18} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] text-orange-500 ">
                          ร้านค้า
                        </p>

                        <h2 className="text-sm sm:text-base  text-slate-800 truncate">
                          {cart.shopName}
                        </h2>
                      </div>

                    </div>
                  </div>

                  {!cart.isShopApproved && (
                    <div className="mt-3 rounded-xl bg-red-50 border border-red-100 px-3 py-2">
                      <p className="text-[10px] text-red-500">
                        ร้านนี้ไม่พร้อมให้บริการแล้ว กรุณาลบสินค้าออกจากตะกร้า
                      </p>
                    </div>
                  )}
                </div>

                {/* ================= ITEMS ================= */}
                <div>

                  {cart.items.map((item) => {
                    const selected =
                      selectedItems.includes(item.id);

                    return (
                      <div
                        key={item.id}
                        className={`
                        px-4 sm:px-5
                        py-4
                        border-b border-slate-100
                        transition
                        ${selected
                            ? "bg-orange-50/70"
                            : "bg-white hover:bg-orange-50/20"
                          }
                      `}
                      >

                        <div className="flex gap-3">

                          {/* CHECKBOX */}
                          <div className="pt-1">
                            <input
                              type="checkbox"
                              checked={selected}
                              disabled={
                                !cart.isShopApproved ||
                                !item.isServiceActive
                              }
                              onChange={() =>
                                toggleItem(
                                  cart,
                                  item.id
                                )
                              }
                              className="
                              w-5 h-5
                              accent-orange-500
                              cursor-pointer
                              disabled:opacity-40
                            "
                            />
                          </div>

                          <div className="flex-1 min-w-0">

                            {/* NAME */}
                            <div className="flex justify-between gap-3">

                              <div className="min-w-0">

                                <h3 className="text-sm text-slate-800 truncate">
                                  {item.mainServiceName}
                                </h3>

                                {item.fileUrl && (
                                  <div className="
                                  flex items-center gap-1.5
                                  mt-1
                                  min-w-0
                                ">
                                    <FileText
                                      size={14}
                                      className="text-orange-500 shrink-0"
                                    />

                                    <span className="
                                    text-[11px]
                                    text-slate-500
                                    truncate
                                  ">
                                      {item.fileUrl
                                        .split("/")
                                        .pop()}
                                    </span>
                                  </div>
                                )}

                              </div>

                              {/* DELETE */}
                              <button
                                onClick={() =>
                                  handleRemove(item.id)
                                }
                                disabled={
                                  busyItemId ===
                                  item.id
                                }
                                className="
                                w-8 h-8
                                shrink-0
                                rounded-xl
                                bg-red-50
                                text-red-400
                                hover:bg-red-100
                                hover:text-red-500
                                flex items-center justify-center
                                transition
                              "
                              >
                                {busyItemId ===
                                  item.id ? (
                                  <Loader2
                                    size={14}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2 size={15} />
                                )}
                              </button>

                            </div>

                            {/* DETAILS */}
                            <div className="flex flex-wrap gap-1.5 mt-3">

                              <span className="
                              px-2.5 py-1
                              rounded-lg
                              bg-orange-100
                              text-orange-600
                              text-[10px]
                            ">
                                สี:{" "}
                                {item.colorTierLabel ??
                                  "ขาวดำ"}
                              </span>

                              {item.unitBreakdown
                                ?.mode ===
                                "per_page" && (
                                  <span className="
                                px-2.5 py-1
                                rounded-lg
                                bg-slate-100
                                text-slate-600
                                text-[10px]
                              ">
                                    {
                                      item
                                        .unitBreakdown
                                        .pageCount
                                    }{" "}
                                    หน้า
                                  </span>
                                )}

                              {item.unitBreakdown
                                ?.mode ===
                                "per_sqm" && (
                                  <span className="
                                px-2.5 py-1
                                rounded-lg
                                bg-slate-100
                                text-slate-600
                                text-[10px]
                              ">
                                    {
                                      item
                                        .unitBreakdown
                                        .widthCm
                                    }{" "}
                                    ×{" "}
                                    {
                                      item
                                        .unitBreakdown
                                        .heightCm
                                    }{" "}
                                    ซม.
                                  </span>
                                )}

                            </div>

                            {/* OPTIONS */}
                            {item.optionSelections.length >
                              0 && (
                                <p className="
                              mt-2
                              text-[11px]
                              text-slate-500
                              leading-relaxed
                            ">
                                  {item.optionSelections
                                    .map(
                                      (s) =>
                                        `${s.optionName}: ${s.valueName ??
                                        s.textValue ??
                                        "-"
                                        }`
                                    )
                                    .join(" · ")}
                                </p>
                              )}

                            {/* ADDONS */}
                            {item.addOns.length > 0 && (
                              <p className="
                              mt-1
                              text-[10px]
                              text-orange-400
                            ">
                                +{" "}
                                {item.addOns
                                  .map(
                                    (a) => a.name
                                  )
                                  .join(", ")}
                              </p>
                            )}

                            {/* SERVICE OFF */}
                            {!item.isServiceActive && (
                              <p className="
                              mt-2
                              text-[10px]
                              text-red-500
                            ">
                                บริการนี้ปิดให้บริการแล้ว
                              </p>
                            )}

                            {/* QUANTITY + PRICE */}
                            <div className="
                            flex
                            items-center
                            justify-between
                            mt-4
                          ">

                              <div className="
                              flex items-center
                              h-9
                              rounded-xl
                              border border-orange-100
                              bg-orange-50
                              overflow-hidden
                            ">

                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      item,
                                      -1
                                    )
                                  }
                                  disabled={
                                    busyItemId ===
                                    item.id ||
                                    item.quantity <=
                                    1
                                  }
                                  className="
                                  w-9 h-9
                                  flex items-center justify-center
                                  text-orange-500
                                  hover:bg-orange-100
                                  disabled:opacity-30
                                "
                                >
                                  <Minus size={13} />
                                </button>

                                <span className="
                                w-8
                                text-center
                                text-xs
                                text-slate-700
                              ">
                                  {item.quantity}
                                </span>

                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      item,
                                      1
                                    )
                                  }
                                  disabled={
                                    busyItemId ===
                                    item.id
                                  }
                                  className="
                                  w-9 h-9
                                  flex items-center justify-center
                                  text-orange-500
                                  hover:bg-orange-100
                                  disabled:opacity-30
                                "
                                >
                                  <Plus size={13} />
                                </button>

                              </div>

                              <span className="
                              text-base
                              text-orange-600
                            ">
                                ฿
                                {item.lineTotal.toLocaleString()}
                              </span>

                            </div>

                          </div>
                        </div>
                      </div>
                    );
                  })}

                </div>

                {/* ================= DELIVERY ================= */}
                {(deliveryOptionsByShop[cart.shopId]?.length ?? 0) > 0 && (
                  <div className="mx-auto my-2 w-11/12 p-2 rounded-xl border border-orange-200 bg-orange-50/50">

                    {/* หัวข้อ */}
                    <div className="flex items-center gap-2 mb-2">

                      <div className="w-8 h-8 shrink-0 rounded-lg bg-orange-100 text-orange-500 flex items-center justify-center">
                        <Truck size={14} />
                      </div>

                      <div>
                        <p className="text-xs text-slate-700">
                          วิธีจัดส่ง
                        </p>

                        <p className="text-[10px] text-slate-400">
                          เลือกวิธีรับสินค้า
                        </p>
                      </div>

                    </div>

                    {/* Select */}
                    <select
                      value={cart.deliveryOption?.id ?? ""}
                      onChange={(e) =>
                        handleDeliverySelect(
                          cart.shopId,
                          e.target.value
                        )
                      }
                      className="w-full h-10 px-3 rounded-lg border border-orange-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                    >
                      <option value="">
                        เลือกวิธีจัดส่ง
                      </option>

                      {deliveryOptionsByShop[cart.shopId].map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.name} — ฿{opt.baseFee}
                          {opt.freeShippingThreshold
                            ? ` (ฟรีเมื่อครบ ฿${opt.freeShippingThreshold})`
                            : ""}
                        </option>
                      ))}
                    </select>

                    {!hasAddress && (
                      <div className="mt-2 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-700">
                        <MapPin size={14} className="shrink-0 mt-0.5" />
                        <span>
                          คุณยังไม่มีที่อยู่จัดส่ง กรุณา{" "}
                          <Link
                            href="/profile"
                            className="font-semibold underline hover:text-amber-800"
                          >
                            เพิ่มที่อยู่
                          </Link>{" "}
                          ก่อน จึงจะเลือกวิธีจัดส่งแบบส่งได้
                        </span>
                      </div>
                    )}

                  </div>
                )}

                {/* ================= SHOP TOTAL ================= */}
                <div className="mx-4 sm:mx-5 my-4 rounded-2xl bg-slate-50 border border-slate-100 p-4">

                  <div className="space-y-2 text-xs">

                    <div className="flex justify-between text-slate-500">
                      <span>ยอดรวมสินค้า</span>
                      <span>
                        ฿
                        {cart.subtotal.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-500">
                      <span>ค่าจัดส่ง</span>
                      <span>
                        ฿
                        {cart.deliveryFee.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-200">
                      <span className="text-slate-700">
                        ยอดรวมทั้งหมด
                      </span>

                      <span className="
                      text-base
                      text-orange-600
                    ">
                        ฿
                        {cart.total.toLocaleString()}
                      </span>
                    </div>

                  </div>
                </div>

              </section>
            ))}
          </div>
        )}
      </main>

      {/* ================= BOTTOM CHECKOUT ================= */}
      {!loading &&
        !needsLogin &&
        carts.length > 0 && (

          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-orange-100 shadow-[0_-6px_25px_rgba(249,115,22,0.10)]">

            <div className="
            max-w-5xl
            mx-auto
            px-4 sm:px-6
            py-3
          ">

              <div className="
              flex items-center
              justify-between
              gap-3
            ">

                {/* TOTAL */}
                <div>

                  <p className="
                  text-[10px]
                  text-slate-400
                ">
                    เลือกแล้ว{" "}
                    <span className="text-orange-500 ">
                      {selectedItems.length}
                    </span>{" "}
                    รายการ
                  </p>

                  <div className="
                  flex items-baseline
                  gap-2
                ">
                    <span className="text-[10px] text-slate-500">
                      ยอดชำระ
                    </span>

                    <span className="
                    text-xl
                    text-orange-600
                  ">
                      ฿
                      {grandTotal.toLocaleString()}
                    </span>
                  </div>

                </div>

                {/* BUTTON */}
                <button
                  onClick={handleCheckout}
                  disabled={
                    selectedItems.length === 0 ||
                    selectedCartItems.some(
                      (item) =>
                        !item.isServiceActive
                    ) ||
                    carts.some(
                      (cart) =>
                        selectedItems.some(
                          (id) =>
                            cart.items.some(
                              (item) =>
                                item.id === id
                            )
                        ) &&
                        !cart.isShopApproved
                    )
                  }
                  className="h-11 px-5 sm:px-8 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none text-white text-xs  shadow-md shadow-orange-200
                  transition-all
                "
                >
                  ชำระเงิน
                  <span className="ml-1">
                    ({selectedItems.length})
                  </span>
                </button>

              </div>
            </div>
          </div>
        )}
    </div>
  );
}