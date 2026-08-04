"use client";

import { useEffect, useState } from "react";
import { Trash2, PencilLine, MapPin } from "lucide-react";
import { getMe } from "@/lib/api/auth";
import type { PublicUser } from "@/lib/api/auth";


import {
    getAddresses,
    createAddress as createAddressApi,
    updateAddress as updateAddressApi,
    deleteAddress as deleteAddressApi,
    setDefaultAddress as setDefaultAddressApi,
} from "@/lib/api/addresses";
export interface Address {
    id: string;
    receiverName: string;
    phone: string;
    address: string;
    subdistrict: string;
    district: string;
    province: string;
    postalCode: string;
    label: string;
    isDefault: boolean;
}

export default function ProfilePage() {

    const emptyAddress: Address = {
        id: "",
        receiverName: "",
        phone: "",
        address: "",
        subdistrict: "",
        district: "",
        province: "",
        postalCode: "",
        label: "บ้าน",
        isDefault: false,
    };

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [formAddress, setFormAddress] = useState<Address>(emptyAddress);
    const [openModal, setOpenModal] = useState(false);
    const [profile, setProfile] = useState<PublicUser | null>(null);
    async function loadAddresses() {
        const { addresses } = await getAddresses();

        const sortedAddresses = [...addresses].sort(
            (a, b) => Number(b.isDefault) - Number(a.isDefault)
        );

        setAddresses(sortedAddresses);
    }

    async function createAddress() {

        const payload = {
            receiverName: formAddress.receiverName,
            phone: formAddress.phone,
            address: formAddress.address,
            subdistrict: formAddress.subdistrict || "",
            district: formAddress.district || "",
            province: formAddress.province || "",
            postalCode: formAddress.postalCode || "",
            label: formAddress.label,
            isDefault: formAddress.isDefault,
        };

        console.log("CREATE ADDRESS PAYLOAD:", payload);

        await createAddressApi(payload);

        await loadAddresses();
        setOpenModal(false);
    }

    async function updateAddress(data: Address) {

        const payload = {
            receiverName: data.receiverName,
            phone: data.phone,
            address: data.address,
            subdistrict: data.subdistrict || "",
            district: data.district || "",
            province: data.province || "",
            postalCode: data.postalCode || "",
            label: data.label,
        };

        console.log("UPDATE ADDRESS PAYLOAD:", payload);

        await updateAddressApi(data.id, payload);

        await loadAddresses();
        setOpenModal(false);
    }

    async function deleteAddress(id: string) {
        await deleteAddressApi(id);
        await loadAddresses();
    }

    async function setDefaultAddress(id: string) {
        await setDefaultAddressApi(id);
        await loadAddresses();
    }

    useEffect(() => {
        loadProfile();
        loadAddresses();
    }, []);

    async function loadProfile() {
        const { user } = await getMe();
        setProfile(user);
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Profile */}
                <div className="bg-white rounded-2xl shadow p-6">
                    <h1 className="text-xl font-semibold text-orange-500 mb-4">
                        ข้อมูลส่วนตัว
                    </h1>

                    {profile && (
                        <div className="space-y-2">
                            <p>
                                <span className="font-medium">ชื่อ :</span>{" "}
                                {profile.firstname} {profile.lastname}
                            </p>

                            <p>
                                <span className="font-medium">Email :</span>{" "}
                                {profile.email}
                            </p>

                            <p>
                                <span className="font-medium">เบอร์โทร :</span>{" "}
                                {profile.phone}
                            </p>
                        </div>
                    )}
                </div>

                {/* Address */}
                <div className="bg-white rounded-2xl shadow p-6">

                    <div className="flex justify-between items-center mb-5">
                        <h2 className="text-xl font-semibold text-orange-500">
                            ที่อยู่จัดส่ง
                        </h2>

                        <button
                            onClick={() => {
                                setFormAddress(emptyAddress);
                                setOpenModal(true);
                            }}
                            className="px-5 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600"
                        >
                            + เพิ่มที่อยู่
                        </button>
                    </div>

                    {addresses.length === 0 ? (
                        <div className="text-center text-gray-400 py-10">
                            ยังไม่มีที่อยู่
                        </div>
                    ) : (
                        <div className="space-y-4">

                            {addresses.map((item) => (
                                <div
                                    key={item.id}
                                    className={`
        rounded-2xl p-5 flex justify-between
        border
        ${item.isDefault
                                            ? "border-orange-400 bg-orange-50"
                                            : "bg-white"
                                        }
    `}
                                >

                                    <div className="space-y-2">

                                        <div className="flex items-center gap-2">

                                            <span className="font-semibold text-lg">
                                                {item.label}
                                            </span>


                                            {item.isDefault && (
                                                <span
                                                    className="
                flex items-center gap-1
                px-3 py-1
                rounded-full
                text-xs
                bg-green-100
                text-green-600
                "
                                                >
                                                    <MapPin size={14} />
                                                    ที่อยู่หลัก
                                                </span>
                                            )}

                                        </div>


                                        <p className="font-medium">
                                            {item.receiverName}
                                        </p>


                                        <p>
                                            {item.phone}
                                        </p>


                                        <p className="text-gray-600">
                                            {item.address}
                                        </p>


                                        <p className="text-gray-600">
                                            {item.subdistrict} {item.district}
                                        </p>


                                        <p className="text-gray-600">
                                            {item.province} {item.postalCode}
                                        </p>


                                    </div>



                                    <div className="flex flex-col gap-3">


                                        {!item.isDefault && (
                                            <button
                                                onClick={() => setDefaultAddress(item.id)}
                                                className="
            px-3 py-2
            rounded-xl
            bg-orange-100
            text-orange-600
            text-sm
            font-medium
            "
                                            >
                                                ตั้งเป็นหลัก
                                            </button>
                                        )}



                                        {item.isDefault && (
                                            <div
                                                className="
            px-3 py-2
            rounded-xl
            bg-green-100
            text-green-600
            text-sm
            "
                                            >
                                                ใช้งานอยู่
                                            </div>
                                        )}



                                        <button
                                            onClick={() => {
                                                setFormAddress(item);
                                                setOpenModal(true);
                                            }}
                                            className="
        w-10 h-10
        rounded-xl
        bg-blue-100
        text-blue-600
        flex items-center justify-center
        "
                                        >
                                            <PencilLine size={18} />
                                        </button>



                                        <button
                                            onClick={() => deleteAddress(item.id)}
                                            className="
        w-10 h-10
        rounded-xl
        bg-red-100
        text-red-600
        flex items-center justify-center
        "
                                        >
                                            <Trash2 size={18} />
                                        </button>


                                    </div>

                                </div>
                            ))}

                        </div>
                    )}

                </div>

                {/* Modal */}
                {openModal && (
                    <div
                        className="fixed inset-0 bg-black/40 flex items-center justify-center"
                        onClick={() => setOpenModal(false)}
                    >

                        <div
                            className="bg-white rounded-2xl p-6 w-full max-w-lg"
                            onClick={(e) => e.stopPropagation()}
                        >

                            <h2 className="text-xl font-semibold mb-5">
                                {formAddress.id ? "แก้ไขที่อยู่" : "เพิ่มที่อยู่"}
                            </h2>

                            <div className="space-y-3">

                                <input
                                    className="w-full border rounded-xl p-3"
                                    placeholder="ชื่อผู้รับ"
                                    value={formAddress.receiverName}
                                    onChange={(e) =>
                                        setFormAddress({
                                            ...formAddress,
                                            receiverName: e.target.value,
                                        })
                                    }
                                />

                                <input
                                    className="w-full border rounded-xl p-3"
                                    placeholder="เบอร์โทร"
                                    value={formAddress.phone}
                                    onChange={(e) =>
                                        setFormAddress({
                                            ...formAddress,
                                            phone: e.target.value,
                                        })
                                    }
                                />

                                <input
                                    className="w-full border rounded-xl p-3"
                                    placeholder="ที่อยู่"
                                    value={formAddress.address}
                                    onChange={(e) =>
                                        setFormAddress({
                                            ...formAddress,
                                            address: e.target.value,
                                        })
                                    }
                                />

                                <div className="grid grid-cols-2 gap-3">

                                    <input
                                        className="border rounded-xl p-3"
                                        placeholder="ตำบล"
                                        value={formAddress.subdistrict}
                                        onChange={(e) =>
                                            setFormAddress({
                                                ...formAddress,
                                                subdistrict: e.target.value,
                                            })
                                        }
                                    />

                                    <input
                                        className="border rounded-xl p-3"
                                        placeholder="อำเภอ"
                                        value={formAddress.district}
                                        onChange={(e) =>
                                            setFormAddress({
                                                ...formAddress,
                                                district: e.target.value,
                                            })
                                        }
                                    />

                                    <input
                                        className="border rounded-xl p-3"
                                        placeholder="จังหวัด"
                                        value={formAddress.province}
                                        onChange={(e) =>
                                            setFormAddress({
                                                ...formAddress,
                                                province: e.target.value,
                                            })
                                        }
                                    />

                                    <input
                                        className="border rounded-xl p-3"
                                        placeholder="รหัสไปรษณีย์"
                                        value={formAddress.postalCode}
                                        onChange={(e) =>
                                            setFormAddress({
                                                ...formAddress,
                                                postalCode: e.target.value,
                                            })
                                        }
                                    />

                                </div>

                                <input
                                    className="w-full border rounded-xl p-3"
                                    placeholder="ป้ายกำกับ เช่น บ้าน / ที่ทำงาน"
                                    value={formAddress.label}
                                    onChange={(e) =>
                                        setFormAddress({
                                            ...formAddress,
                                            label: e.target.value,
                                        })
                                    }
                                />

                            </div>

                            <div className="flex justify-end gap-3 mt-6">

                                <button
                                    onClick={() => setOpenModal(false)}
                                    className="px-5 py-2 rounded-xl bg-gray-100"
                                >
                                    ยกเลิก
                                </button>

                                <button
                                    onClick={() => {
                                        if (formAddress.id) {
                                            updateAddress(formAddress);
                                        } else {
                                            createAddress();
                                        }
                                    }}
                                    className="px-5 py-2 rounded-xl bg-orange-500 text-white"
                                >
                                    บันทึก
                                </button>

                            </div>

                        </div>

                    </div>
                )}

            </div>
        </div>
    );

}
