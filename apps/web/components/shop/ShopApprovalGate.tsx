"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, AlertTriangle, PhoneCall, LogOut } from "lucide-react";
import type { MyShopProfile } from "@/lib/api/shops";

// แสดงแทนแดชบอร์ดทั้งหมด (ไม่มี Sidebar/Topbar) เมื่อร้านยังไม่ได้รับการอนุมัติ — เดิมร้าน pending เห็นเมนู/ฟีเจอร์ทุกอย่างได้ตามปกติ
// เจอ error 403 เอาตอนกดบันทึกเท่านั้น (backend บล็อกแก้ข้อมูลร้าน/บริการของสถานะที่ไม่ใช่ approved อยู่แล้ว) เปลี่ยนเป็นกันตั้งแต่ชั้น UI แทน
export default function ShopApprovalGate({ shop }: { shop: MyShopProfile }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      router.replace("/");
      router.refresh();
    }
  };

  const isPending = shop.approvalStatus === "pending";
  const isSuspended = shop.approvalStatus === "suspended";

  const icon = isPending ? (
    <Clock className="text-amber-500" size={26} />
  ) : (
    <AlertTriangle className="text-red-500" size={26} />
  );

  const title = isPending
    ? "ร้านค้าของคุณอยู่ระหว่างการตรวจสอบ"
    : isSuspended
      ? "ร้านค้าถูกระงับการใช้งาน"
      : "ใบสมัครร้านค้าไม่ผ่านการอนุมัติ";

  const message = isPending
    ? "ทีมงาน EasyPrint กำลังตรวจสอบข้อมูลร้านค้าของคุณ และจะแจ้งผลทางอีเมลภายใน 3 วันทำการ เมื่อได้รับอนุมัติแล้วสามารถกลับเข้ามาใช้งานได้ทันที"
    : shop.rejectedReason
      ? `เหตุผล: ${shop.rejectedReason}`
      : null;

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
        <div
          className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center ${
            isPending ? "bg-amber-50" : "bg-red-50"
          }`}
        >
          {icon}
        </div>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        {message && <p className="text-sm text-gray-500 leading-relaxed">{message}</p>}
        <p className="text-xs text-gray-400">
          ระหว่างนี้ยังไม่สามารถใช้งานฟีเจอร์ต่างๆ ของร้านค้าได้ — หากมีข้อสงสัยติดต่อแอดมินได้ที่ปุ่มด้านล่าง
        </p>

        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/shop/contact-admin"
            className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition"
          >
            <PhoneCall size={15} /> ติดต่อแอดมิน
          </Link>
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition"
          >
            <LogOut size={15} /> ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  );
}
