"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
    ArrowRight,
    Store,
    Truck,
    Upload,
    MapPin
} from "lucide-react";

import { getCarts, type Cart } from "@/lib/api/cart";


export default function CheckoutPage() {

    const searchParams = useSearchParams();
    const shopId = searchParams.get("shopId");

    const [cart, setCart] = useState<Cart | null>(null);
    const [loading, setLoading] = useState(true);

    const [deliveryMethod, setDeliveryMethod]
        = useState<"pickup" | "delivery">("pickup");

    const [slip, setSlip] = useState<File | null>(null);
    useEffect(() => {

        async function loadCart() {

            const { carts } = await getCarts();

            const selected = carts.find(
                c => c.shopId === shopId
            );

            setCart(selected ?? null);
            setLoading(false);
        }

        if (shopId) {
            loadCart();
        }

    }, [shopId]);
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
                {/* วิธีรับสินค้า */}
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
                    <div className="grid md:grid-cols-2 gap-4">
                        <label
                            className={`
                            cursor-pointer
                            border
                            rounded-2xl
                            p-4
                            flex
                            gap-3
                            items-center
                            ${deliveryMethod === "pickup"
                                    ?
                                    "border-orange-500 bg-orange-50"
                                    :
                                    ""
                                }
                        `}
                        >
                            <input
                                type="radio"
                                name="delivery"
                                checked={
                                    deliveryMethod === "pickup"
                                }
                                onChange={() =>
                                    setDeliveryMethod("pickup")
                                }
                            />
                            <Store className="text-orange-500" />
                            <span>
                                รับที่ร้าน
                            </span>
                        </label>
                        <label
                            className={`
                            cursor-pointer
                            border
                            rounded-2xl
                            p-4
                            flex
                            gap-3
                            items-center
                            ${deliveryMethod === "delivery"
                                    ?
                                    "border-orange-500 bg-orange-50"
                                    :
                                    ""
                                }
                        `}
                        >

                            <input
                                type="radio"
                                name="delivery"
                                checked={
                                    deliveryMethod === "delivery"
                                }
                                onChange={() =>
                                    setDeliveryMethod("delivery")
                                }
                            />
                            <Truck className="text-orange-500" />
                            <span>
                                ร้านจัดส่ง
                            </span>
                        </label>
                    </div>
                </section>
                {/* ที่อยู่ */}
                {deliveryMethod === "pickup"
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
                                EasyPrint สาขาพะเยา
                            </p>
                            <p className="text-gray-600">
                                123/45 ถนนพหลโยธิน
                                ต.เวียง อ.เมือง
                                จ.พะเยา 56000
                            </p>
                            <p className="text-gray-600">
                                https://www.google.com/maps
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
                        <div className="
                        flex
                        justify-between 
                    ">
                            <h2 className="font-bold text-lg">
                                ที่อยู่จัดส่ง
                            </h2>
                            <Link
                                href="/profile"
                                className="
                                text-orange-500
                                flex
                                items-center
                            "
                            >
                                เปลี่ยน
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                        <p className="font-semibold mt-3">
                            นาย นาย นาม
                        </p>
                        <p className="text-gray-600">
                            15/15 ต.เวียง
                            อ.เมือง
                            จ.พะเยา 56000
                        </p>
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
                {/* Buttons */}
                <div className="grid md:grid-cols-2 gap-4">
                    <button
                        className="
                        py-3
                        rounded-xl
                        border
                        font-bold
                        hover:bg-gray-100
                    "
                    >
                        ยกเลิก
                    </button>
                    <button
                        className="
                        py-3
                        rounded-xl
                        bg-orange-500
                        hover:bg-orange-600
                        text-white
                        font-bold
                    "
                    >
                        ยืนยันคำสั่งซื้อ
                    </button>
                </div>
            </div>
        </div>
    );
}