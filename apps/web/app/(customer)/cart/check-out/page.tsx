"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    ArrowRight,
    Store,
    Truck,
    Upload,
    MapPin,
    ReceiptText,
} from "lucide-react";

import { getCarts, type Cart } from "@/lib/api/cart";
import { checkoutCart } from "@/lib/api/cart";
import { uploadFile } from "@/lib/api/uploads";
import { getMe } from "@/lib/api/auth";
import { getShop, type PublicShopDetail } from "@/lib/api/shops";
import {
    getAddresses,
    createAddress as createAddressApi,
    type Address
} from "@/lib/api/addresses";

export default function CheckoutPage() {
    return (
        <Suspense
            fallback={
                <div className="p-10 text-center">
                    กำลังโหลด...
                </div>
            }
        >
            <CheckoutContent />
        </Suspense>
    );
}

function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const itemsParam = searchParams.get("items");

    const selectedIds =
        itemsParam?.split(",").filter(Boolean) ?? [];

    const [shop, setShop] =
        useState<PublicShopDetail | null>(null);

    const [profile, setProfile] =
        useState<any>(null);

    const [addresses, setAddresses] =
        useState<Address[]>([]);

    const [selectedAddress, setSelectedAddress] =
        useState<Address | null>(null);

    const [openAddressModal, setOpenAddressModal] =
        useState(false);

    const [cart, setCart] =
        useState<Cart | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [slip, setSlip] =
        useState<File | null>(null);

    const [agreeTerms, setAgreeTerms] =
        useState(false);

    const [submitting, setSubmitting] =
        useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);

                // =========================
                // PROFILE
                // =========================
                const { user } = await getMe();
                setProfile(user);

                // =========================
                // CART
                // =========================
                const { carts } = await getCarts();

                const selectedCart = carts.find((cart) =>
                    cart.items.some((item) =>
                        selectedIds.includes(item.id)
                    )
                );

                if (!selectedCart) {
                    setCart(null);
                    return;
                }

                // =========================
                // SHOP
                // =========================
                const { shop } =
                    await getShop(selectedCart.shopId);

                setShop(shop);

                // เอาเฉพาะสินค้าที่เลือก
                setCart({
                    ...selectedCart,
                    items: selectedCart.items.filter((item) =>
                        selectedIds.includes(item.id)
                    ),
                });

                // =========================
                // ADDRESS
                // =========================
                const addressResult =
                    await getAddresses();

                const sortedAddresses =
                    [...addressResult.addresses].sort(
                        (a, b) =>
                            Number(b.isDefault) -
                            Number(a.isDefault)
                    );

                setAddresses(sortedAddresses);

                const defaultAddress =
                    sortedAddresses.find(
                        (address) => address.isDefault
                    );

                if (defaultAddress) {
                    setSelectedAddress(defaultAddress);
                }

            } catch (error) {
                console.error(
                    "โหลด Checkout ไม่สำเร็จ:",
                    error
                );
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [itemsParam]);
    if (loading) {
        return (
            <div className="p-10 text-center">
                กำลังโหลด...
            </div>
        );
    }

    if (!cart) {
        return (
            <div className="p-10 text-center">
                ไม่พบข้อมูลตะกร้า
            </div>
        );
    }

    const isPickup =
        !cart.deliveryOption ||
        (cart.deliveryOption?.name?.includes("รับที่ร้าน") ?? false) ||
        (cart.deliveryOption?.name?.includes("รับเอง") ?? false) ||
        (cart.deliveryOption?.name?.includes("รับหน้าร้าน") ?? false) ||
        (cart.deliveryOption?.name?.includes("ไปรับที่") ?? false) ||
        (cart.deliveryOption?.name?.includes("มารับ") ?? false) ||
        (cart.deliveryOption?.name?.toLowerCase()?.includes("pickup") ?? false) ||
        (cart.deliveryOption?.name?.toLowerCase()?.includes("pick up") ?? false);
    const subtotal = cart.items.reduce(
        (sum, item) => sum + item.lineTotal,
        0
    );

    const total = subtotal + cart.deliveryFee;
    return (
        <div className="w-full lg:max-w-4xl mx-auto px-4 sm:px-6 pb-10 space-y-5">
            <div className="flex items-center gap-3 py-6">
                <div className="w-11 h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-200">
                    <ReceiptText size={20} />
                </div>

                <div>
                    <h1 className="text-xl sm:text-2xl text-slate-800">
                        ชำระเงิน
                    </h1>

                    <p className="text-xs text-slate-400 mt-0.5">
                        ตรวจสอบข้อมูลและยืนยันคำสั่งซื้อ
                    </p>
                </div>
            </div>
            <section className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">

                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
                        <Store size={16} />
                    </div>

                    <div>
                        <h2 className="text-sm text-slate-800">
                            สรุปรายการสั่งซื้อ
                        </h2>

                        <p className="text-[10px] text-slate-400">
                            {shop?.name}
                        </p>
                    </div>
                </div>


                <div className="px-4">

                    {cart.items.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-start justify-between gap-3 py-4 border-b border-slate-100">

                            <div className="min-w-0">

                                <p className="text-sm text-slate-800 truncate">
                                    {item.mainServiceName}
                                </p>

                                {item.fileUrl && (
                                    <p className="text-xs text-slate-400 truncate mt-1">
                                        {item.fileUrl.split("/").pop()}
                                    </p>
                                )}

                                <p className="text-xs text-slate-400 mt-1">จำนวน {item.quantity}</p>

                                {item.colorTierLabel && (
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        สี: {item.colorTierLabel}
                                    </p>
                                )}

                            </div>

                            <p className="text-sm text-orange-600 whitespace-nowrap">
                                ฿{item.lineTotal.toLocaleString()}
                            </p>

                        </div>
                    ))}


                    {/* ================= DELIVERY ================= */}
                    <div className="py-3">

                        <div className="flex items-center justify-between mb-2">

                            <div className="flex items-center gap-2">
                                <Truck
                                    size={15}
                                    className="text-orange-500"
                                />

                                <p className="text-xs text-slate-700">
                                    วิธีรับสินค้า
                                </p>
                            </div>

                            {cart.deliveryOption && (
                                <span className="text-[9px] text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
                                    เลือกแล้ว
                                </span>
                            )}

                        </div>

                        {cart.deliveryOption ? (

                            <div className="flex items-center justify-between gap-2 rounded-xl border border-orange-200 bg-orange-50/60 px-3 py-2.5">

                                <div className="flex items-center gap-2 min-w-0">

                                    <div className="w-7 h-7 shrink-0 rounded-lg bg-orange-500 text-white flex items-center justify-center">
                                        <Truck size={13} />
                                    </div>

                                    <p className="text-xs text-slate-800 truncate">
                                        {cart.deliveryOption.name}
                                    </p>

                                </div>

                                <p className="text-xs text-orange-600 whitespace-nowrap">
                                    ฿{cart.deliveryOption.baseFee.toLocaleString()}
                                </p>

                            </div>

                        ) : (

                            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
                                <p className="text-xs text-red-500">
                                    กรุณาเลือกวิธีจัดส่งก่อนชำระเงิน
                                </p>
                            </div>

                        )}

                    </div>


                    {/* ================= TOTAL ================= */}
                    <div className="border-t border-slate-100 py-4 space-y-2">

                        <div className="flex justify-between text-sm text-slate-500">
                            <span>ยอดรวมสินค้า</span>
                            <span>
                                ฿{subtotal.toLocaleString()}
                            </span>
                        </div>

                        <div className="flex justify-between text-sm text-slate-500">
                            <span>ค่าจัดส่ง</span>
                            <span>
                                ฿{cart.deliveryFee.toLocaleString()}
                            </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <span className="text-base  text-slate-800">ยอดชำระทั้งหมด</span>

                            <span className="text-xl text-orange-600">
                                ฿{total.toLocaleString()}
                            </span>
                        </div>

                    </div>

                </div>
            </section>


            {/* ================= ADDRESS ================= */}
            {isPickup ? (

                <section className="rounded-2xl border border-green-200 bg-green-50/60 p-4">



                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                            <MapPin size={17} />
                        </div>

                        <h2 className="text-sm text-slate-800">
                            ที่อยู่ร้านสำหรับรับสินค้า
                        </h2>
                    </div>


                    {/* ชื่อร้าน */}
                    <p className="text-sm text-slate-700 mt-2">
                        {shop?.name ?? "ไม่พบชื่อร้าน"}
                    </p>

                    {/* ที่อยู่ร้าน */}
                    {shop?.address ? (
                        <p className="text-sm text-slate-500 mt-1 whitespace-pre-line leading-6">
                            {shop.address}
                        </p>
                    ) : (
                        <p className="text-sm text-red-500 mt-1">
                            ร้านยังไม่ได้ระบุที่อยู่
                        </p>
                    )}

                    {/* เบอร์โทรร้าน */}
                    {shop?.phone && (
                        <p className="text-xs text-slate-500 mt-2">
                            โทร {shop.phone}
                        </p>
                    )}

                    {/* Google Maps */}
                    {shop?.googleMapLink && (
                        <a
                            href={shop.googleMapLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center mt-2 text-xs text-blue-600 hover:text-blue-700 hover:underline"
                        >
                            เปิด Google Maps →
                        </a>
                    )}

                    {/* ข้อความแจ้งเตือน */}
                    <div className="mt-3 rounded-lg bg-green-50 border border-green-100 px-3 py-2">
                        <p className="text-[11px] text-green-700">
                            กรุณานำเลขคำสั่งซื้อมาแสดงที่ร้านเพื่อรับสินค้า
                        </p>
                    </div>
                </section>

            ) : (

                <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">

                        <div className="flex items-center gap-2">

                            <MapPin size={17} className="text-orange-500" />

                            <h2 className="text-sm  text-slate-800">ที่อยู่จัดส่ง</h2>

                        </div>

                        <button onClick={() => setOpenAddressModal(true)} className="text-xs  text-orange-500 hover:text-orange-600">เปลี่ยน</button>

                    </div>


                    <div className="p-4">

                        {selectedAddress ? (

                            <div className="text-sm space-y-1">

                                <div className="flex items-center gap-2">

                                    <p className="text-slate-800">{selectedAddress.receiverName}</p>

                                    {selectedAddress.isDefault && (
                                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-50 text-green-600">
                                            ที่อยู่หลัก
                                        </span>
                                    )}

                                </div>

                                <p className="text-slate-500">
                                    {selectedAddress.phone}
                                </p>

                                <p className="text-slate-600">
                                    {selectedAddress.address}
                                </p>

                                <p className="text-slate-500">
                                    {selectedAddress.subdistrict}{" "}
                                    {selectedAddress.district}
                                </p>

                                <p className="text-slate-500">
                                    {selectedAddress.province}{" "}
                                    {selectedAddress.postalCode}
                                </p>

                            </div>

                        ) : (

                            <button onClick={() => setOpenAddressModal(true)} className="w-full rounded-xl border border-dashed border-orange-300 bg-orange-50/50 py-5 text-sm text-orange-500">
                                + เลือกที่อยู่จัดส่ง
                            </button>

                        )}

                    </div>

                </section>

            )}


            {/* ================= ADDRESS MODAL ================= */}
            {openAddressModal && (

                <div
                    className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
                    onClick={() =>
                        setOpenAddressModal(false)
                    }
                >

                    <div className="w-full max-w-md max-h-[80vh] overflow-y-auto bg-white rounded-2xl shadow-xl p-5" onClick={(e) => e.stopPropagation()}>

                        <div className="flex items-center justify-between mb-4">

                            <h2 className="text-base text-slate-800">เลือกที่อยู่จัดส่ง</h2>

                            <button onClick={() => setOpenAddressModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>

                        </div>


                        <div className="space-y-2">

                            {addresses.map((item) => (

                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setSelectedAddress(item);
                                        setOpenAddressModal(false);
                                    }}
                                    className={`w-full text-left rounded-xl border p-3 transition ${selectedAddress?.id === item.id ? "border-orange-400 bg-orange-50" : "border-slate-200 bg-white hover:border-orange-200"}`}
                                >

                                    <div className="flex items-center justify-between gap-2">

                                        <p className="text-sm text-slate-800">{item.receiverName}</p>

                                        {item.isDefault && (
                                            <span className="text-[9px] bg-green-50 text-green-600 px-2 py-1 rounded-full">
                                                ที่อยู่หลัก
                                            </span>
                                        )}

                                    </div>

                                    <p className="text-xs text-slate-500 mt-1">{item.phone}</p>

                                    <p className="text-xs text-slate-600 mt-1">{item.address}</p>

                                    <p className="text-xs text-slate-500 mt-0.5">{item.province}</p>

                                </button>

                            ))}

                        </div>


                        <button
                            onClick={() =>
                                router.push("/profile")
                            }
                            className="mt-4 w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm transition"
                        >
                            + เพิ่มที่อยู่ใหม่
                        </button>

                    </div>

                </div>

            )}


            {/* ================= PAYMENT QR ================= */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">

                <div className="flex items-center justify-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
                        ฿
                    </div>

                    <h2 className="text-sm text-slate-800">ช่องทางการชำระเงิน</h2>
                </div>

                {shop?.promptpayQrUrl ? (
                  <>
                    <p className="text-xs text-slate-400 mt-1">สแกน QR เพื่อชำระเงินผ่าน PromptPay</p>
                    <div className="mx-auto mt-4 w-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                        <img src={shop.promptpayQrUrl} alt="PromptPay QR" className="w-52 h-52 object-contain" />
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-400 mt-2">ร้านค้ายังไม่ได้ตั้งค่า QR Code</p>
                )}

                <div className="mt-6 border-t border-slate-100 pt-6 text-left max-w-sm mx-auto space-y-3">
                  {(shop?.bankAccountName || shop?.bankName || shop?.bankAccountNumber) && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h3 className="text-xs font-semibold text-slate-800 mb-2">บัญชีธนาคาร</h3>
                        {shop?.bankAccountName && <p className="text-sm text-slate-600">ชื่อบัญชี: {shop.bankAccountName}</p>}
                        {shop?.bankName && <p className="text-sm text-slate-600">ธนาคาร: {shop.bankName}</p>}
                        {shop?.bankAccountNumber && <p className="text-sm text-slate-600">เลขที่บัญชี: {shop.bankAccountNumber}</p>}
                    </div>
                  )}

                  {shop?.promptpayNumber && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h3 className="text-xs font-semibold text-slate-800 mb-2">พร้อมเพย์</h3>
                        <p className="text-sm text-slate-600">หมายเลข: {shop.promptpayNumber}</p>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-400 mt-6">ยอดที่ต้องชำระ</p>

                <p className="text-2xl text-orange-600 mt-1">฿{total.toLocaleString()}</p>

            </section>


            {/* ================= SLIP ================= */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">

                <div className="flex items-center gap-2 mb-3">
                    <Upload size={17} className="text-orange-500" />

                    <h2 className="text-sm text-slate-800">สลิปการโอนเงิน</h2>

                </div>


                <label className="block cursor-pointer rounded-xl border-2 border-dashed border-orange-200 bg-orange-50/40 hover:bg-orange-50 p-5 text-center transition">

                    <Upload
                        size={24}
                        className="mx-auto text-orange-500"
                    />

                    <p className="text-sm text-slate-700 mt-2">เลือกไฟล์สลิป</p>

                    <p className="text-[10px] text-slate-400 mt-1">รองรับไฟล์รูปภาพ</p>

                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                            setSlip(
                                e.target.files?.[0] ?? null
                            )
                        }
                    />

                </label>


                {slip && (
                    <div className="mt-3 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700 truncate">
                        ✓ {slip.name}
                    </div>
                )}

            </section>


            {/* ================= TERMS ================= */}
            <section className="bg-white rounded-2xl border border-slate-100 p-4">

                <label className="flex items-start gap-3 cursor-pointer">

                    <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) =>
                            setAgreeTerms(
                                e.target.checked
                            )
                        }
                        className="mt-0.5 w-4 h-4 accent-orange-500 shrink-0"
                    />

                    <span className="text-xs leading-5 text-slate-600">
                        ฉันยอมรับ
                        <span className="text-orange-500 mx-1">เงื่อนไขการสั่งซื้อ</span>
                        และยืนยันว่าข้อมูลการสั่งซื้อถูกต้อง
                    </span>

                </label>

            </section>


            {/* ================= BUTTONS ================= */}
            <div className="flex gap-3 pt-1">

                <button
                    onClick={() =>
                        router.push("/cart")
                    }
                    className="flex-1 h-11 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50 transition"
                >
                    ยกเลิก
                </button>


                <button
                    disabled={
                        !agreeTerms ||
                        submitting ||
                        !slip ||
                        (cart.deliveryOption && !isPickup
                            ? !selectedAddress
                            : false)
                    }
                    onClick={async () => {

                        if (!agreeTerms) {
                            alert(
                                "กรุณายอมรับเงื่อนไขก่อนสั่งซื้อ"
                            );
                            return;
                        }

                        if (!slip) {
                            alert(
                                "กรุณาอัปโหลดสลิป"
                            );
                            return;
                        }

                        if (
                            cart.deliveryOption &&
                            !isPickup &&
                            !selectedAddress
                        ) {
                            alert(
                                "กรุณาเลือกที่อยู่จัดส่ง"
                            );
                            return;
                        }

                        try {

                            setSubmitting(true);

                            // 1. Upload slip
                            const upload =
                                await uploadFile(
                                    slip,
                                    "payment-slip"
                                );

                            // 2. Checkout
                            await checkoutCart(
                                cart.shopId,
                                {
                                    slipUrl: upload.path,

                                    deliveryAddress:
                                        selectedAddress && !isPickup
                                            ? JSON.stringify(
                                                selectedAddress
                                            )
                                            : undefined,
                                }
                            );

                            alert(
                                "สั่งซื้อสำเร็จ"
                            );

                            router.push(
                                "/orders"
                            );

                        } catch (err) {

                            console.error(err);

                            alert(
                                "สั่งซื้อไม่สำเร็จ"
                            );

                        } finally {

                            setSubmitting(false);

                        }

                    }}
                    className={`flex-1 h-11 rounded-xl text-sm text-white transition
          ${agreeTerms &&
                            slip &&
                            !submitting &&
                            (
                                !cart.deliveryOption ||
                                isPickup ||
                                !!selectedAddress
                            )
                            ? `bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-200`
                            : `bg-slate-200 text-slate-400 cursor-not-allowed`
                        }
        `}
                >
                    {submitting
                        ? "กำลังสั่งซื้อ..."
                        : "ยืนยันคำสั่งซื้อ"}
                </button>

            </div>

        </div>
    );
}