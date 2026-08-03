"use client";

import { useEffect, useState } from "react";
import { Trash2, PencilLine, Pin } from "lucide-react";

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


const mockAddresses: Address[] = [
    {
        id: "1",
        receiverName: "นายสมชาย",
        phone: "0812345678",
        address: "99/1",
        subdistrict: "เวียง",
        district: "เมือง",
        province: "พะเยา",
        postalCode: "56000",
        label: "บ้าน",
        isDefault: true,
    },
    {
        id: "2",
        receiverName: "นายสมชาย",
        phone: "0812345678",
        address: "15/5 หอพัก A",
        subdistrict: "แม่กา",
        district: "เมือง",
        province: "พะเยา",
        postalCode: "56000",
        label: "หอพัก",
        isDefault: false,
    },
];


export default function ProfilePage() {
    const [profile, setProfile] = useState({
        firstname: "สมชาย",
        lastname: "ใจดี",
        email: "somchai@email.com",
        phone: "0812345678"
    });
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


    const [formAddress, setFormAddress] =
        useState<Address>(emptyAddress);

    const [editProfile, setEditProfile] = useState(false);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);

    const [openModal, setOpenModal] = useState(false);

    const [editingAddress, setEditingAddress] =
        useState<Address | null>(null);


    useEffect(() => {
        loadAddresses();
    }, []);


    function loadAddresses() {
        setAddresses(mockAddresses);
        setLoading(false);
    }


    function createAddress() {

        const newAddress: Address = {
            id: Date.now().toString(),
            receiverName: "ผู้ใช้ใหม่",
            phone: "0800000000",
            address: "123",
            subdistrict: "เวียง",
            district: "เมือง",
            province: "พะเยา",
            postalCode: "56000",
            label: "ใหม่",
            isDefault: false,
        };


        setAddresses((prev) => [
            ...prev,
            newAddress
        ]);

        setOpenModal(false);
    }



    function updateAddress(data: Address) {

        setAddresses((prev) =>
            prev.map((item) =>
                item.id === data.id
                    ? data
                    : item
            )
        );

        setOpenModal(false);
    }



    function deleteAddress(id: string) {

        setAddresses((prev) =>
            prev.filter(
                item => item.id !== id
            )
        );
    }



    function setDefaultAddress(id: string) {

        setAddresses((prev) =>
            prev.map(item => ({
                ...item,
                isDefault: item.id === id
            }))
        );
    }



    const defaultAddress = addresses.find(
        a => a.isDefault
    );


    if (loading) {
        return <div>Loading...</div>;
    }
    const sortedAddresses = [...addresses].sort(
        (a, b) =>
            Number(b.isDefault) - Number(a.isDefault)
    );

    return (
        <div className="min-h-screen bg-gray-50 p-6">

            <div className="max-w-4xl mx-auto">
                <h2 className="text-xl mb-6 text-orange-500">
                    ข้อมูลส่วนตัว
                </h2>

                {/* ข้อมูลส่วนตัว */}
                <div className="
            bg-white
            rounded-2xl
            p-6
            shadow
            mb-6
        ">

                    <div className="flex justify-between">

                        <p>
                            ชื่อ :
                            {profile.firstname} {profile.lastname}
                        </p>
                        <button
                            onClick={() => setEditProfile(true)}
                            className="text-emerald-600"
                        >
                            แก้ไข
                        </button>

                    </div>


                    <div className="mt-3 space-y-2">
                        <p>
                            Email :
                            {profile.email}
                        </p>

                        <p>
                            เบอร์โทร :
                            {profile.phone}
                        </p>

                    </div>

                </div>




                {/* ที่อยู่จัดส่ง */}
                <div>

                    <div className="flex justify-between items-center mb-6">

                        <h1 className="text-xl  text-orange-500">
                            ที่อยู่จัดส่ง
                        </h1>


                        <button
                            onClick={() => {
                                setEditingAddress(null);
                                setFormAddress(emptyAddress);
                                setOpenModal(true);
                            }}
                            className="px-5 py-2 rounded-xl bg-emerald-500 text-white shadow-md hover:shadow-lg"
                        >
                            + เพิ่มที่อยู่
                        </button>

                    </div>



                    <div className=" space-y-4">


                        {sortedAddresses.map((item) => (

                            <div
                                key={item.id}
                                className=" bg-white rounded-2xl p-5 shadow   mb-6"
                            >

                                <div className="flex justify-between">


                                    <div>

                                        <div className="flex gap-2">

                                            <h2>
                                                {item.label}
                                            </h2>


                                            {item.isDefault &&
                                                <span className=" text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full ">
                                                    ค่าเริ่มต้น
                                                </span>
                                            }

                                        </div>


                                        <p>
                                            {item.receiverName}
                                        </p>


                                        <p className="text-gray-600">
                                            {item.address}
                                            {" "}
                                            {item.subdistrict}
                                            {" "}
                                            {item.district}
                                            {" "}
                                            {item.province}
                                            {" "}
                                            {item.postalCode}
                                        </p>


                                        <p>
                                            โทร {item.phone}
                                        </p>


                                    </div>



                                    <div className="flex flex-col gap-3">

                                        {/* ตั้งค่าเป็นค่าเริ่มต้น */}
                                        {!item.isDefault && (
                                            <button
                                                onClick={() =>
                                                    setDefaultAddress(item.id)
                                                }
                                                className=" w-10 h-10 flex items-center justify-center rounded-xl bg-orange-100 text-orange-500 shadow-sm hover:bg-orange-300 hover:shadow-md transition"
                                                title="ตั้งเป็นที่อยู่หลัก"
                                            >
                                                <Pin size={20} />
                                            </button>
                                        )}



                                        {/* แก้ไข */}
                                        <button
                                            onClick={() => {
                                                setEditingAddress(item);
                                                setFormAddress(item);
                                                setOpenModal(true);
                                            }}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600  shadow-sm  hover:bg-blue-100 hover:shadow-md transition"
                                            title="แก้ไขที่อยู่"
                                        >
                                            <PencilLine size={20} />
                                        </button>



                                        {/* ลบ */}
                                        <button
                                            onClick={() =>
                                                deleteAddress(item.id)
                                            }
                                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 shadow-sm hover:bg-red-100 hover:text-red-600 hover:shadow-mdtransition"
                                            title="ลบที่อยู่"
                                        >
                                            <Trash2 size={20} />
                                        </button>

                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {openModal && (

                <div
                    className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                    onClick={() => setOpenModal(false)}
                >


                    <div
                        className="bg-white rounded-2xl p-6 w-[90%] max-w-lg shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >


                        <h2 className="text-xl mb-5">
                            {
                                editingAddress
                                    ?
                                    "แก้ไขที่อยู่"
                                    :
                                    "เพิ่มที่อยู่"
                            }
                        </h2>
                        <div className="space-y-4">


                            {/* ชื่อผู้รับ */}
                            <div className="space-y-1.5">

                                <label className="text-xs text-slate-600 ">
                                    ชื่อผู้รับ
                                    <span className="text-orange-500"> *</span>
                                </label>


                                <input
                                    placeholder="เช่น สมชาย ใจดี"
                                    value={formAddress.receiverName}
                                    onChange={(e) =>
                                        setFormAddress({
                                            ...formAddress,
                                            receiverName: e.target.value
                                        })
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                />

                            </div>



                            {/* เบอร์โทร */}
                            <div className="space-y-1.5">

                                <label className="text-xstext-slate-600">
                                    เบอร์โทรศัพท์
                                    <span className="text-orange-500"> *</span>
                                </label>


                                <input
                                    type="tel"
                                    placeholder="08xxxxxxxx"
                                    value={formAddress.phone}
                                    onChange={(e) =>
                                        setFormAddress({
                                            ...formAddress,
                                            phone: e.target.value
                                        })
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                />

                            </div>




                            {/* ที่อยู่ */}
                            <div className="space-y-1.5">

                                <label className="text-xs text-slate-600">
                                    ที่อยู่
                                    <span className="text-orange-500"> *</span>
                                </label>


                                <input
                                    placeholder="บ้านเลขที่ / หมู่บ้าน / อาคาร"
                                    value={formAddress.address}
                                    onChange={(e) =>
                                        setFormAddress({
                                            ...formAddress,
                                            address: e.target.value
                                        })
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                />

                            </div>




                            {/* ตำบล อำเภอ */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">


                                <div className="space-y-1.5">

                                    <label className="text-xs text-slate-600">
                                        ตำบล / แขวง
                                    </label>


                                    <input
                                        placeholder="ตำบล"
                                        value={formAddress.subdistrict}
                                        onChange={(e) =>
                                            setFormAddress({
                                                ...formAddress,
                                                subdistrict: e.target.value
                                            })
                                        }
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                    />

                                </div>




                                <div className="space-y-1.5">

                                    <label className=" text-xs text-slate-600">
                                        อำเภอ / เขต
                                    </label>


                                    <input
                                        placeholder="อำเภอ"
                                        value={formAddress.district}
                                        onChange={(e) =>
                                            setFormAddress({
                                                ...formAddress,
                                                district: e.target.value
                                            })
                                        }
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                    />

                                </div>


                            </div>
                            {/* จังหวัด รหัสไปรษณีย์ */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">


                                <div className="space-y-1.5">

                                    <label className="text-xs text-slate-600">
                                        จังหวัด
                                    </label>


                                    <input
                                        placeholder="จังหวัด"
                                        value={formAddress.province}
                                        onChange={(e) =>
                                            setFormAddress({
                                                ...formAddress,
                                                province: e.target.value
                                            })
                                        }
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2focus:ring-orange-100"
                                    />

                                </div>




                                <div className="space-y-1.5">

                                    <label className="text-xs text-slate-600">
                                        รหัสไปรษณีย์
                                    </label>


                                    <input
                                        placeholder="เช่น 56000"
                                        value={formAddress.postalCode}
                                        onChange={(e) =>
                                            setFormAddress({
                                                ...formAddress,
                                                postalCode: e.target.value
                                            })
                                        }
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 "
                                    />

                                </div>


                            </div>


                        </div>



                        <div className="flex justify-end gap-3 mt-6">


                            <button
                                onClick={() => {
                                    setOpenModal(false)
                                }}
                                className="px-5 py-2 rounded-xl bg-gray-100 "
                            >
                                ยกเลิก
                            </button>



                            <button
                                onClick={() => {

                                    if (editingAddress) {
                                        updateAddress(formAddress);
                                    }
                                    else {
                                        createAddress();
                                    }

                                    setOpenModal(false);

                                }}
                                className="px-5 py-2 rounded-xl bg-orange-500 text-white "
                            >
                                บันทึก
                            </button>


                        </div>


                    </div>

                </div>

            )}
        </div>

    );
}