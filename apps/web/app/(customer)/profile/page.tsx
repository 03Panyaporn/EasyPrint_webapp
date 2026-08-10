"use client";

import { useEffect, useState } from "react";
import {
    Trash2,
    PencilLine,
    MapPin,
    User,
    Mail,
    Phone,
    Plus,
    X,
    Check,
    Building2,
    Home,
    Briefcase,
    Tag,
    ShieldCheck
} from "lucide-react";
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

const PRESET_LABELS = ["บ้าน", "ที่ทำงาน", "คอนโด", "อื่นๆ"];

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
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function loadAddresses() {
        try {
            const { addresses } = await getAddresses();
            const sortedAddresses = [...addresses].sort(
                (a, b) => Number(b.isDefault) - Number(a.isDefault)
            );
            setAddresses(sortedAddresses);
        } catch (error) {
            console.error("LOAD ADDRESSES ERROR:", error);
        }
    }

    async function loadProfile() {
        try {
            const { user } = await getMe();
            setProfile(user);
        } catch (error) {
            console.error("LOAD PROFILE ERROR:", error);
        }
    }

    useEffect(() => {
        loadProfile();
        loadAddresses();
    }, []);

    async function createAddress() {
        setIsSubmitting(true);
        try {
            const payload = {
                receiverName: formAddress.receiverName,
                phone: formAddress.phone,
                address: formAddress.address,
                subdistrict: formAddress.subdistrict || "",
                district: formAddress.district || "",
                province: formAddress.province || "",
                postalCode: formAddress.postalCode || "",
                label: formAddress.label || "บ้าน",
                isDefault: formAddress.isDefault,
            };

            await createAddressApi(payload);
            await loadAddresses();
            setOpenModal(false);
        } catch (error) {
            console.error("CREATE ADDRESS ERROR:", error);
            alert("เพิ่มที่อยู่ไม่สำเร็จ กรุณากรอกข้อมูลให้ครบถ้วน");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function updateAddress(data: Address) {
        setIsSubmitting(true);
        try {
            const payload = {
                receiverName: data.receiverName,
                phone: data.phone,
                address: data.address,
                subdistrict: data.subdistrict || "",
                district: data.district || "",
                province: data.province || "",
                postalCode: data.postalCode || "",
                label: data.label || "บ้าน",
            };

            await updateAddressApi(data.id, payload);
            await loadAddresses();
            setOpenModal(false);
        } catch (error) {
            console.error("UPDATE ADDRESS ERROR:", error);
            alert("แก้ไขที่อยู่ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function deleteAddress(id: string) {
        const confirmed = window.confirm("คุณต้องการลบที่อยู่นี้ใช่หรือไม่?\n\nเมื่อลบแล้วจะไม่สามารถกู้คืนได้");
        if (!confirmed) return;

        try {
            await deleteAddressApi(id);
            await loadAddresses();
        } catch (error) {
            console.error("DELETE ADDRESS ERROR:", error);
            alert("ลบที่อยู่ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        }
    }

    async function setDefaultAddress(id: string) {
        try {
            await setDefaultAddressApi(id);
            await loadAddresses();
        } catch (error) {
            console.error("SET DEFAULT ADDRESS ERROR:", error);
            alert("ตั้งค่าที่อยู่หลักไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        }
    }

    const getLabelIcon = (label: string) => {
        switch (label) {
            case "บ้าน":
                return <Home size={14} className="text-orange-500" />;
            case "ที่ทำงาน":
                return <Briefcase size={14} className="text-blue-500" />;
            case "คอนโด":
                return <Building2 size={14} className="text-emerald-500" />;
            default:
                return <Tag size={14} className="text-purple-500" />;
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-6 md:py-8">
            <div className="mx-auto max-w-4xl space-y-6">

                {/* Header matching Orders page style */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
                            <User size={21} />
                        </div>
                        <div>
                            <h1 className="text-xl  text-slate-800 md:text-2xl">
                                บัญชีผู้ใช้งาน
                            </h1>
                            <p className="mt-0.5 text-xs text-slate-400 md:text-sm">
                                จัดการข้อมูลส่วนตัวและสถานที่จัดส่งของคุณ
                            </p>
                        </div>
                    </div>
                </div>

                {/* Profile Card Section */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-lg shadow-slate-200/70 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 mb-5">
                        <div className="flex items-center gap-3.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600  shadow-sm">
                                <User size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg text-slate-800 tracking-tight">
                                    ข้อมูลส่วนตัว
                                </h2>
                                <p className="text-xs text-slate-400">ข้อมูลบัญชีสำหรับการใช้งานระบบ</p>
                            </div>
                        </div>
                    </div>

                    {profile ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="rounded-2xl bg-slate-50/90 p-4 border border-slate-200/80 shadow-sm transition hover:border-orange-300 hover:bg-white hover:shadow-md space-y-1">
                                <span className="text-xs text-slate-400 block">ชื่อ-นามสกุล</span>
                                <p className="text-sm text-slate-800">
                                    {profile.firstname} {profile.lastname}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50/90 p-4 border border-slate-200/80 shadow-sm transition hover:border-orange-300 hover:bg-white hover:shadow-md space-y-1">
                                <span className="text-xs text-slate-400 block">อีเมล</span>
                                <p className="text-sm text-slate-800 truncate" title={profile.email}>
                                    {profile.email}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50/90 p-4 border border-slate-200/80 shadow-sm transition hover:border-orange-300 hover:bg-white hover:shadow-md space-y-1">
                                <span className="text-xs text-slate-400 block">เบอร์โทรศัพท์</span>
                                <p className="text-sm text-slate-800">
                                    {profile.phone || "-"}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-pulse grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="h-16 bg-slate-100 rounded-2xl"></div>
                            <div className="h-16 bg-slate-100 rounded-2xl"></div>
                            <div className="h-16 bg-slate-100 rounded-2xl"></div>
                        </div>
                    )}
                </div>

                {/* Delivery Address Section */}
                <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-lg shadow-slate-200/70 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 mb-5">
                        <div className="flex items-center gap-3.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 shadow-sm">
                                <MapPin size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg text-slate-800 tracking-tight flex items-center gap-2">
                                    ที่อยู่จัดส่ง
                                    <span className="text-xs  text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                                        {addresses.length} รายการ
                                    </span>
                                </h2>
                                <p className="text-xs text-slate-400">สถานที่รับสินค้างานพิมพ์</p>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setFormAddress(emptyAddress);
                                setOpenModal(true);
                            }}
                            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-2xl bg-orange-500 text-white text-xs hover:bg-orange-600 active:scale-95 transition shadow-md shadow-orange-500/25 cursor-pointer"
                        >
                            <Plus size={16} />
                            <span>เพิ่มที่อยู่ใหม่</span>
                        </button>
                    </div>

                    {addresses.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                            <MapPin size={28} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-slate-700 text-sm ">ยังไม่มีที่อยู่จัดส่ง</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                                เพิ่มที่อยู่จัดส่งสินค้าของคุณเพื่อความสะดวกในการสั่งซื้อครั้งถัดไป
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3.5">
                            {addresses.map((item) => (
                                <div
                                    key={item.id}
                                    className={`rounded-2xl p-5 border transition-all duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${item.isDefault
                                        ? "border-orange-300/90 bg-gradient-to-r from-orange-50/70 to-white shadow-md shadow-orange-500/5 ring-1 ring-orange-200/50"
                                        : "border-slate-200/80 bg-white hover:border-slate-300 shadow-sm hover:shadow-md"
                                        }`}
                                >
                                    <div className="space-y-1.5 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 border border-slate-200/80 px-3 py-1 rounded-xl shadow-xs">
                                                {getLabelIcon(item.label)}
                                                {item.label || "ที่อยู่"}
                                            </span>

                                            {item.isDefault && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs  bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    ที่อยู่หลัก
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm text-slate-900 pt-0.5">
                                            {item.receiverName} <span className="text-slate-400 text-xs ml-1">({item.phone})</span>
                                        </p>
                                        <p className="text-xs text-slate-500 leading-relaxed ">
                                            {item.address} {item.subdistrict && `ต.${item.subdistrict}`} {item.district && `อ.${item.district}`} จ.{item.province} {item.postalCode}
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 self-end sm:self-center pt-2 sm:pt-0">
                                        {!item.isDefault ? (
                                            <button
                                                onClick={() => setDefaultAddress(item.id)}
                                                className="px-3.5 py-1.5 rounded-xl text-xs text-orange-600 bg-orange-50 border border-orange-200/80 hover:bg-orange-100 transition shadow-xs"
                                            >
                                                ตั้งเป็นหลัก
                                            </button>
                                        ) : (
                                            <span className="text-xs text-emerald-700 px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center gap-1 shadow-xs">
                                                <Check size={14} /> ใช้จัดส่งอยู่
                                            </span>
                                        )}

                                        <button
                                            onClick={() => {
                                                setFormAddress(item);
                                                setOpenModal(true);
                                            }}
                                            className="w-9 h-9 rounded-xl text-slate-500 hover:text-orange-600 bg-slate-50 border border-slate-200/80 hover:bg-orange-50 hover:border-orange-200 flex items-center justify-center transition shadow-xs"
                                            title="แก้ไข"
                                        >
                                            <PencilLine size={16} />
                                        </button>

                                        <button
                                            onClick={() => deleteAddress(item.id)}
                                            className="w-9 h-9 rounded-xl text-slate-500 hover:text-rose-600 bg-rose-50/60 border border-rose-100 hover:bg-rose-100 flex items-center justify-center transition shadow-xs"
                                            title="ลบ"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Modal Form */}
                {openModal && (
                    <div
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
                        onClick={() => setOpenModal(false)}
                    >
                        <div
                            className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl border border-slate-100 space-y-5"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                <div>
                                    <h3 className="text-base text-slate-800">
                                        {formAddress.id ? "แก้ไขที่อยู่จัดส่ง" : "เพิ่มที่อยู่จัดส่งใหม่"}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">กรอกข้อมูลสถานที่จัดส่งสินค้า</p>
                                </div>
                                <button
                                    onClick={() => setOpenModal(false)}
                                    className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                                {/* Preset Label Chips */}
                                <div className="space-y-1.5">
                                    <label className="text-xs  text-slate-600">ป้ายกำกับที่อยู่</label>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {PRESET_LABELS.map((label) => (
                                            <button
                                                key={label}
                                                type="button"
                                                onClick={() => setFormAddress({ ...formAddress, label })}
                                                className={`px-3 py-1 rounded-xl text-xs transition ${formAddress.label === label
                                                    ? "bg-orange-500 text-white shadow-sm"
                                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs  text-slate-600">ชื่อผู้รับ *</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition text-slate-800"
                                            placeholder="ระบุชื่อผู้รับสินค้า"
                                            value={formAddress.receiverName}
                                            onChange={(e) => setFormAddress({ ...formAddress, receiverName: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs  text-slate-600">เบอร์โทรศัพท์ *</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition text-slate-800"
                                            placeholder="0812345678"
                                            value={formAddress.phone}
                                            onChange={(e) => setFormAddress({ ...formAddress, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs  text-slate-600">ที่อยู่ (บ้านเลขที่, ซอย, ถนน) *</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition text-slate-800"
                                        placeholder="เช่น 123/4 หมู่ 5 ถนนสุขุมวิท"
                                        value={formAddress.address}
                                        onChange={(e) => setFormAddress({ ...formAddress, address: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-600">ตำบล / แขวง</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition text-slate-800"
                                            placeholder="ตำบล"
                                            value={formAddress.subdistrict}
                                            onChange={(e) => setFormAddress({ ...formAddress, subdistrict: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs  text-slate-600">อำเภอ / เขต</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition text-slate-800"
                                            placeholder="อำเภอ"
                                            value={formAddress.district}
                                            onChange={(e) => setFormAddress({ ...formAddress, district: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-600">จังหวัด *</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition text-slate-800"
                                            placeholder="จังหวัด"
                                            value={formAddress.province}
                                            onChange={(e) => setFormAddress({ ...formAddress, province: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs  text-slate-600">รหัสไปรษณีย์</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition text-slate-800"
                                            placeholder="รหัสไปรษณีย์"
                                            value={formAddress.postalCode}
                                            onChange={(e) => setFormAddress({ ...formAddress, postalCode: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setOpenModal(false)}
                                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600  hover:bg-slate-200 active:scale-95 transition text-xs cursor-pointer"
                                >
                                    ยกเลิก
                                </button>

                                <button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={() => {
                                        if (formAddress.id) {
                                            updateAddress(formAddress);
                                        } else {
                                            createAddress();
                                        }
                                    }}
                                    className="px-5 py-2.5 rounded-xl bg-orange-500 text-white  hover:bg-orange-600 active:scale-95 shadow-sm transition text-xs disabled:opacity-50 cursor-pointer"
                                >
                                    {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}