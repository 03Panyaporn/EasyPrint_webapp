"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Store,
    Truck,
    Upload,
    MapPin
} from "lucide-react";

import { getShopCart, checkoutCart, type Cart } from "@/lib/api/cart";
import { getShop, type PublicShopDetail } from "@/lib/api/shops";
import { getMe } from "@/lib/api/auth";
import { uploadFile } from "@/lib/api/uploads";
import { ApiError } from "@/lib/api/client";


export default function CheckoutPage() {

    const router = useRouter();
    const searchParams = useSearchParams();
    const shopId = searchParams.get("shopId");

    const [cart, setCart] = useState<Cart | null>(null);
    const [shop, setShop] = useState<PublicShopDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [slip, setSlip] = useState<File | null>(null);
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    useEffect(() => {
        if (!shopId) return;

        async function loadCheckout() {
            try {
                const [{ cart: myCart }, { shop: myShop }] = await Promise.all([
                    getShopCart(shopId as string),
                    getShop(shopId as string),
                ]);
                setCart(myCart);
                setShop(myShop);

                // เติมที่อยู่จัดส่งจากโปรไฟล์ลูกค้าให้อัตโนมัติ (แก้ไขได้) ถ้ามีอยู่แล้ว
                try {
                    const { user } = await getMe();
                    if (user.address) setDeliveryAddress(user.address);
                } catch {
                    // ไม่ login ก็ไม่เป็นไร — getShopCart ด้านบนจะ throw 401 ก่อนถึงตรงนี้อยู่แล้ว
                }
            } catch (err) {
                setLoadError(err instanceof ApiError ? err.message : "โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
            } finally {
                setLoading(false);
            }
        }

        loadCheckout();
    }, [shopId]);

    if (loading) {
        return (
            <div className="p-10 text-center">
                กำลังโหลด...
            </div>
        );
    }
    if (loadError) {
        return (
            <div className="p-10 text-center text-red-500 font-medium">
                {loadError}
            </div>
        );
    }
    if (!cart || cart.items.length === 0) {
        return (
            <div className="p-10 text-center">
                ไม่พบข้อมูลตะกร้า
            </div>
        );
    }

    const isDelivery = !!cart.deliveryOption;

    const handleConfirm = async () => {
        if (!shopId) return;
        if (!slip) {
            setSubmitError("กรุณาแนบสลิปการโอนเงินก่อนยืนยันคำสั่งซื้อ");
            return;
        }
        if (isDelivery && !deliveryAddress.trim()) {
            setSubmitError("กรุณากรอกที่อยู่จัดส่ง");
            return;
        }

        setSubmitError("");
        setSubmitting(true);
        try {
            const { path } = await uploadFile(slip, "payment-slip");
            await checkoutCart(shopId, {
                slipUrl: path,
                deliveryAddress: isDelivery ? deliveryAddress.trim() : undefined,
            });
            router.push("/Dashboard?orderConfirmed=1");
        } catch (err) {
            setSubmitError(err instanceof ApiError ? err.message : "สั่งซื้อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className=" bg-gradient-to-br from-orange-50">
            <div className="
            w-full lg:max-w-4xl mx-auto p-6 space-y-6
        ">
                <h1 className="
                text-3xl
                font-bold
                text-center
                text-orange-500
            ">
                    ชำระเงิน
                </h1>
                {/* รายการสินค้า */}
                <section className="
                bg-white
                rounded-3xl
                border
                shadow-sm
                p-6
            ">
                    <h2 className="
                    font-bold
                    text-xl
                    text-orange-500
                    mb-4
                ">
                        สรุปรายการสั่งซื้อ
                    </h2>
                    {
                        cart.items.map(item => (
                            <div
                                key={item.id}
                                className="
                                flex
                                justify-between
                                py-3
                                border-b
                            "
                            >
                                <div>
                                    <p className="font-medium">
                                        {item.mainServiceName}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        จำนวน {item.quantity}
                                    </p>
                                </div>
                                <p className="font-semibold">
                                    ฿{item.lineTotal.toLocaleString()}
                                </p>
                            </div>
                        ))
                    }
                    <div className="
                    flex
                    justify-between
                    mt-5
                    text-xl
                    font-bold
                ">
                        <span>
                            ยอดชำระ
                        </span>
                        <span className="
                        text-orange-600
                    ">
                            ฿{cart.total.toLocaleString()}
                        </span>
                    </div>
                </section>
                {/* วิธีรับสินค้า — ยึดตามที่เลือกไว้แล้วในตะกร้า (หน้า /cart) ไม่ให้เลือกใหม่ซ้ำที่นี่ */}
                <section className="
                bg-white
                rounded-3xl
                border
                shadow-sm
                p-6
            ">
                    <h2 className="font-bold text-lg mb-4">
                        วิธีรับสินค้า
                    </h2>
                    <div className="
                        border
                        rounded-2xl
                        p-4
                        flex
                        gap-3
                        items-center
                        border-orange-500
                        bg-orange-50
                    ">
                        {isDelivery ? <Truck className="text-orange-500" /> : <Store className="text-orange-500" />}
                        <span>
                            {isDelivery
                                ? `${cart.deliveryOption!.name} — ฿${cart.deliveryOption!.baseFee.toLocaleString()}`
                                : "รับที่ร้าน"}
                        </span>
                    </div>
                </section>
                {/* ที่อยู่ */}
                {!isDelivery
                    ?
                    <section className="
                    bg-green-50
                    rounded-5xl
                    p-6
                    border
                    border-green-200
                    rounded-3xl
                    p-6
                ">
                        <h2 className="
                        font-bold
                        text-lg
                        flex
                        gap-2
                        items-center

                    ">
                            <MapPin className="text-green-600 rounded-2xl border" />
                            ที่อยู่ร้านสำหรับรับสินค้า
                        </h2>
                        <div className="mt-3">
                            <p className="font-semibold">
                                {shop?.name}
                            </p>
                            <p className="text-gray-600">
                                {shop?.address || "ไม่ระบุที่อยู่"}
                            </p>
                            <p className="mt-2 text-sm text-gray-500">
                                กรุณานำเลขคำสั่งซื้อมาแสดงที่ร้าน
                            </p>
                        </div>
                    </section>
                    :
                    <section className="
                    bg-red-50
                    rounded-3xl
                    p-6
                    border
                ">
                        <h2 className="font-bold text-lg mb-3">
                            ที่อยู่จัดส่ง
                        </h2>
                        <textarea
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            rows={3}
                            placeholder="กรอกที่อยู่สำหรับจัดส่ง"
                            className="
                            w-full
                            p-3
                            rounded-xl
                            border
                            border-gray-200
                            text-sm
                            focus:outline-none
                            focus:ring-2
                            focus:ring-orange-500/25
                            bg-white
                        "
                        />
                    </section>
                }
                {/* QR */}
                <section className="
                bg-orange-50
                rounded-3xl
                border
                p-6
                text-center
            ">
                    <h2 className="
                    font-bold
                    text-orange-600
                    text-lg
                ">
                        QR พร้อมเพย์ร้านค้า
                    </h2>
                    <img
                        src="/images/promptpay-demo.png"
                        alt="PromptPay"
                        className="
                        mx-auto
                        mt-5
                        w-64
                        h-64
                        rounded-xl
                        border
                        bg-white
                        p-2
                    "
                    />
                    <p className="mt-4">
                        ยอดชำระ
                    </p>


                    <p className="
                    text-3xl
                    font-bold
                    text-orange-600
                ">
                        ฿{cart.total.toLocaleString()}
                    </p>


                </section>
                {/* Slip */}
                <section className="
                border-2
                border-dashed
                rounded-3xl
                p-8
                text-center
            ">
                    <Upload
                        className="
                        mx-auto
                        text-orange-500
                    "
                    />
                    <p className="mt-2 font-medium">
                        อัปโหลดสลิปการโอนเงิน
                    </p>
                    <input
                        type="file"
                        accept="image/*"
                        className="mt-4"
                        onChange={(e) =>
                            setSlip(
                                e.target.files?.[0] ?? null
                            )
                        }
                    />
                    {
                        slip &&
                        <p className="text-sm mt-2 text-green-600">
                            {slip.name}
                        </p>
                    }
                </section>

                {submitError && (
                    <p className="text-sm text-red-500 font-semibold text-center">{submitError}</p>
                )}

                {/* Buttons */}
                <div className="grid md:grid-cols-2 gap-4">
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={() => router.push("/cart")}
                        className="
                        py-3
                        rounded-xl
                        border
                        font-bold
                        hover:bg-gray-100
                        disabled:opacity-50
                    "
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={handleConfirm}
                        className="
                        py-3
                        rounded-xl
                        bg-orange-500
                        hover:bg-orange-600
                        text-white
                        font-bold
                        disabled:opacity-60
                    "
                    >
                        {submitting ? "กำลังยืนยัน..." : "ยืนยันคำสั่งซื้อ"}
                    </button>
                </div>
            </div>
        </div>
    );
}
