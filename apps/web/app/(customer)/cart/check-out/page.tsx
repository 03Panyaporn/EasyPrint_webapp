"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    ArrowRight,
    Store,
    Truck,
    Upload,
    MapPin
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
    const [shop, setShop] = useState<PublicShopDetail | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const searchParams = useSearchParams();
    const itemsParam = searchParams.get("items");
    const [agreeTerms, setAgreeTerms] = useState(false);
    const router = useRouter();
    const selectedIds =
        itemsParam?.split(",").filter(Boolean) ?? [];
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [openAddressModal, setOpenAddressModal] = useState(false);
    const [cart, setCart] = useState<Cart | null>(null);
    const [loading, setLoading] = useState(true);
    const [slip, setSlip] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    useEffect(() => {
        async function loadProfile() {
            const { user } = await getMe();
            setProfile(user);
        }

        loadProfile();
        async function loadCart() {
            const { carts } = await getCarts();

            const selectedCart = carts.find((cart) =>
                cart.items.some((item) => selectedIds.includes(item.id))
            );

            if (!selectedCart) {
                setCart(null);
                setLoading(false);
                return;
            }

            const { shop } = await getShop(selectedCart.shopId);
            setShop(shop);

            setCart({
                ...selectedCart,
                items: selectedCart.items.filter((item) =>
                    selectedIds.includes(item.id)
                ),
            });

            setLoading(false);
        }
        async function loadAddress() {

            const result = await getAddresses();

            const sorted = [...result.addresses].sort(
                (a, b) => Number(b.isDefault) - Number(a.isDefault)
            );


            setAddresses(sorted);


            const defaultAddress =
                sorted.find(x => x.isDefault);


            if (defaultAddress) {
                setSelectedAddress(defaultAddress);
            }

        }


        loadProfile();
        loadAddress();

        loadCart();
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
    const subtotal = cart.items.reduce(
        (sum, item) => sum + item.lineTotal,
        0
    );

    const total = subtotal + cart.deliveryFee;
    return (
        <div className="
            w-full lg:max-w-4xl mx-auto p-6 space-y-6 
        ">
            <h1 className="
                text-3xl
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
                                <p>
                                    {item.mainServiceName}
                                </p>
                                <p className="text-sm text-gray-500">
                                    จำนวน {item.quantity}
                                </p>
                            </div>
                            <p>
                                ฿{item.lineTotal.toLocaleString()}
                            </p>
                        </div>
                    ))
                }
                {/* วิธีรับสินค้า */}
                <section className="bg-white  p-6">

                    <h2 className="text-md mb-4">
                        วิธีรับสินค้า
                    </h2>

                    {
                        cart.deliveryOption ? (

                            <div className="flex items-center justify-between rounded-xl bg-orange-50 border border-orange-200 p-4">

                                <div className="flex items-center gap-3">
                                    <Truck className="text-orange-500" />

                                    <div>
                                        <p>ร้านจัดส่ง</p>

                                        <p className="text-sm text-gray-500">
                                            {cart.deliveryOption.name}
                                        </p>
                                    </div>
                                </div>

                                <p className="text-lg text-orange-600">
                                    ฿{cart.deliveryOption.baseFee.toLocaleString()}
                                </p>

                            </div>


                        ) : (

                            <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 p-4">

                                <Store className="text-green-600" />

                                <div>

                                    <p>
                                        รับที่ร้าน
                                    </p>

                                    <p className="text-sm text-gray-500">
                                        ลูกค้าจะมารับสินค้าที่ร้าน
                                    </p>

                                </div>

                            </div>

                        )
                    }

                </section>
                <div className="
                    flex
                    justify-between
                    mt-5
                    text-xl
                ">
                    <span>
                        ยอดชำระ
                    </span>
                    <span className="
                        text-orange-600
                    ">
                        ฿{total.toLocaleString()}
                    </span>
                </div>
            </section>

            {/* ที่อยู่ */}
            {!cart.deliveryOption
                ?
                <section className="
                    bg-green-50
                    rounded-5xl
                    p-6
                    border
                    border-green-300
                    rounded-3xl
                    p-6
                ">
                    <h2 className="
                        text-lg
                        flex
                        gap-2
                        items-center
                        
                    ">
                        <MapPin className="text-lg text-green-600 rounded-2xl border" />
                        ที่อยู่ร้านสำหรับรับสินค้า
                    </h2>
                    <div className="mt-3">
                        <p className="font-medium">
                            {shop?.name}
                        </p>

                        <p className="text-gray-600 whitespace-pre-line">
                            {shop?.address}
                        </p>

                        {shop?.googleMapLink && (
                            <a
                                href={shop.googleMapLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline break-all"
                            >
                                เปิด Google Maps
                            </a>
                        )}

                        {shop?.phone && (
                            <p className="text-gray-500 mt-2">
                                โทร {shop.phone}
                            </p>
                        )}
                        <p className="mt-2 text-sm text-gray-500">
                            กรุณานำเลขคำสั่งซื้อมาแสดงที่ร้าน
                        </p>
                    </div>
                </section>
                :
                <section className="
                    bg-orange-50
                    rounded-3xl
                    p-6
                    border
                    border-orange-300
                ">
                    <div className="
                        flex
                        justify-between 
                    ">
                        <h2 className=" text-lg">
                            ที่อยู่จัดส่ง
                        </h2>
                        <button
                            onClick={() => setOpenAddressModal(true)}
                            className="
text-orange-500
flex
items-center
"
                        >
                            เปลี่ยน
                            <ArrowRight size={16} />
                        </button>
                    </div>
                    {selectedAddress ? (

                        <div className="mt-3">

                            <p className="font-medium">
                                {selectedAddress.receiverName}
                            </p>


                            <p>
                                {selectedAddress.phone}
                            </p>


                            <p className="text-gray-600">
                                {selectedAddress.address}
                            </p>


                            <p className="text-gray-600">
                                {selectedAddress.subdistrict}
                                {" "}
                                {selectedAddress.district}
                            </p>


                            <p className="text-gray-600">
                                {selectedAddress.province}
                                {" "}
                                {selectedAddress.postalCode}
                            </p>

                        </div>

                    )
                        :
                        (
                            <p className="text-gray-500">
                                ยังไม่ได้เพิ่มที่อยู่
                            </p>
                        )}
                </section>
            }
            {openAddressModal && (

                <div
                    className="
fixed inset-0
bg-black/40
flex
items-center
justify-center
z-50
"
                    onClick={() => setOpenAddressModal(false)}
                >


                    <div
                        className="
bg-white
rounded-3xl
p-6
w-full
max-w-lg
"
                        onClick={(e) => e.stopPropagation()}
                    >


                        <h2 className="
text-xl
font-semibold
mb-5
text-orange-500
">
                            เลือกที่อยู่จัดส่ง
                        </h2>



                        <div className="space-y-3">


                            {addresses.map(item => (


                                <button
                                    key={item.id}
                                    onClick={() => {

                                        setSelectedAddress(item);
                                        setOpenAddressModal(false);

                                    }}

                                    className={`
w-full
text-left
border
rounded-2xl
p-4

${selectedAddress?.id === item.id
                                            ? "border-orange-500 bg-orange-50"
                                            : ""
                                        }

`}
                                >


                                    <div className="flex justify-between">


                                        <p className="font-semibold">

                                            {item.receiverName}

                                        </p>


                                        {
                                            item.isDefault &&
                                            <span
                                                className="
text-xs
bg-green-100
text-green-600
px-2
py-1
rounded-full
"
                                            >
                                                ที่อยู่หลัก
                                            </span>
                                        }


                                    </div>


                                    <p>
                                        {item.phone}
                                    </p>


                                    <p className="text-gray-600">
                                        {item.address}
                                    </p>


                                    <p className="text-gray-600">

                                        {item.province}

                                    </p>


                                </button>


                            ))}



                        </div>



                        <button
                            onClick={() => router.push("/profile")}
                            className="
mt-5
w-full
py-3
rounded-xl
bg-orange-500
text-white
"
                        >
                            + เพิ่มที่อยู่ใหม่
                        </button>


                    </div>

                </div>

            )}
            {/* QR */}
            <section className="
                bg-orange-50
                rounded-3xl
                border
                p-6
                text-center
            ">
                <h2 className="
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
                    text-2xl md:text-3xl
                    text-orange-600
                ">
                    ฿{total.toLocaleString()}
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
                <p className="mt-2">
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
            {/* Terms */}
            <section className="text-center mt-10
    p-5
">

                <label className="flex items-start gap-3 cursor-pointer">

                    <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) =>
                            setAgreeTerms(e.target.checked)
                        }
                        className="
                mt-1
                w-5
                h-5
                accent-orange-500
            "
                    />

                    <span className="text-sm text-gray-700">
                        ฉันยอมรับ
                        <span className="text-orange-500 mx-1">
                            เงื่อนไขการสั่งซื้อ
                        </span>
                        และยืนยันว่าข้อมูลการสั่งซื้อถูกต้อง
                    </span>

                </label>

            </section>
            {/* Buttons */}
            <div className="flex gap-4">
                <button onClick={() => router.push("/cart")}
                    className="
                    flex-1
                        py-3
                        rounded-xl
                        border
                        hover:bg-gray-100
                        shadow-md
                    "
                >
                    ยกเลิก
                </button>
                <button
                    disabled={!agreeTerms || submitting}
                    onClick={async () => {

                        if (!agreeTerms) {
                            alert("กรุณายอมรับเงื่อนไขก่อนสั่งซื้อ");
                            return;
                        }

                        if (!slip) {
                            alert("กรุณาอัปโหลดสลิป");
                            return;
                        }

                        if (!cart) return;

                        try {

                            setSubmitting(true);

                            // 1. อัปโหลดสลิป
                            const upload = await uploadFile(
                                slip,
                                "payment-slip"
                            );

                            // 2. Checkout
                            const result = await checkoutCart(
                                cart.shopId,
                                {
                                    slipUrl: upload.path,

                                    deliveryAddress: selectedAddress
                                        ? JSON.stringify(selectedAddress)
                                        : undefined,
                                }
                            );

                            console.log(result);

                            alert("สั่งซื้อสำเร็จ");

                            router.push("/orders");

                        } catch (err) {

                            console.error(err);

                            alert("สั่งซื้อไม่สำเร็จ");

                        } finally {

                            setSubmitting(false);

                        }

                    }}
                    className={`flex-1 py-3 rounded-xl text-white shadow-md
${agreeTerms
                            ? "bg-orange-500 hover:bg-orange-600"
                            : "bg-gray-300 cursor-not-allowed"
                        }
    `}
                >
                    ยืนยันคำสั่งซื้อ
                </button>
            </div>
        </div>
    );
}