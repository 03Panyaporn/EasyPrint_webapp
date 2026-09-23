"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Clock,
  CreditCard,
  Wrench,
  PartyPopper,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { getMyShopProfile, type MyShopProfile } from "@/lib/api/shops";
import { getMainServices } from "@/lib/api/services";
import type { MainService } from "@/components/shop/services/types";
import { ApiError } from "@/lib/api/client";
import { LoadingSection } from "@/components/ui/Spinner";

// หน้านี้เป็น checklist "ร้านพร้อมขายจริงหรือยัง" — Phase 4 ของแผน Option B (Template/Presets)
// อ่านข้อมูลจาก endpoint ที่มีอยู่แล้วทั้งหมด (GET /shops/me, GET /shops/:id/services) ไม่มี endpoint ใหม่
// ไม่มีคอลัมน์ DB ใหม่ (ไม่มี is_published) — "พร้อมเปิดร้าน" ในหน้านี้เป็นแค่สถานะที่ derive จากข้อมูลที่มีอยู่แล้ว
// ล้วนๆ ไม่ใช่ปุ่มที่เขียนอะไรลง DB เพิ่ม ⚠️ หน้านี้ไม่ได้ผูก redirect-gate ใดๆ กับ (shop)/layout — เข้าหน้าอื่นได้ตามปกติ
// เสมอไม่ว่า checklist จะครบหรือไม่ (ตั้งใจเว้นไว้ กันร้านที่ใช้งานจริงอยู่แล้วโดนบล็อกกลางทาง ดูคอมเมนต์เต็มตอนเสนองาน)

interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
  href: string;
  ctaLabel: string;
}

export default function ShopOnboardingPage() {
  const [shop, setShop] = useState<MyShopProfile | null>(null);
  const [services, setServices] = useState<MainService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { shop: myShop } = await getMyShopProfile();
        setShop(myShop);
        const { services: rows } = await getMainServices(myShop.id);
        setServices(rows);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "โหลดข้อมูลร้านค้าไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSection label="กำลังตรวจสอบความพร้อมของร้าน..." />
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="bg-white rounded-2xl border border-red-100 p-8 text-center">
        <p className="text-sm text-red-500 font-semibold">{error || "ไม่พบข้อมูลร้านค้า"}</p>
      </div>
    );
  }

  // ร้านที่ถูกปฏิเสธ — ไม่มี checklist ให้ทำต่อ มีแค่เหตุผล + ทางติดต่อแอดมิน
  if (shop.approvalStatus === "rejected") {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-2xl border border-red-100 p-8 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertTriangle className="text-red-500" size={26} />
          </div>
          <h1 className="text-lg font-bold text-gray-900">ใบสมัครร้านค้าไม่ผ่านการอนุมัติ</h1>
          {shop.rejectedReason && (
            <p className="text-sm text-gray-500">เหตุผล: {shop.rejectedReason}</p>
          )}
          <Link
            href="/shop/contact-admin"
            className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            ติดต่อแอดมิน <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  const activeServiceCount = services.filter((s) => s.isActive).length;
  const hasOpeningHours = Array.isArray(shop.openingHours) && shop.openingHours.length > 0;
  const hasPaymentMethod = Boolean(shop.bankAccountNumber || shop.promptpayNumber);

  const items: ChecklistItem[] = [
    {
      key: "openingHours",
      label: "ตั้งเวลาทำการของร้าน",
      done: hasOpeningHours,
      href: "/shop/profile",
      ctaLabel: "ไปตั้งเวลาทำการ",
    },
    {
      key: "payment",
      label: "ตั้งช่องทางรับเงิน (บัญชีธนาคาร หรือ พร้อมเพย์)",
      done: hasPaymentMethod,
      href: "/shop/settings",
      ctaLabel: "ไปตั้งช่องทางรับเงิน",
    },
    {
      key: "service",
      label: "มีบริการเปิดขายอย่างน้อย 1 รายการ",
      done: activeServiceCount > 0,
      href: "/shop/services/new",
      ctaLabel: "เพิ่มบริการ",
    },
  ];

  const allDone = items.every((i) => i.done);
  const isPending = shop.approvalStatus !== "approved";

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {isPending && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <Clock className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <p className="text-xs text-amber-700">
            ร้านยังรอแอดมินตรวจสอบและอนุมัติอยู่ — ระหว่างนี้เตรียมข้อมูลด้านล่างให้ครบไว้ก่อนได้เลย
            พอได้รับอนุมัติแล้วร้านจะขายได้ทันที ไม่ต้องมาตั้งค่าใหม่
          </p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${allDone ? "bg-emerald-50 text-emerald-500" : "bg-orange-50 text-orange-500"}`}>
            {allDone ? <PartyPopper size={22} /> : <Wrench size={22} />}
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {allDone ? "ร้านพร้อมขายแล้ว!" : "เตรียมร้านให้พร้อมขาย"}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {allDone
                ? "ครบทุกขั้นตอนแล้ว ลูกค้าพร้อมสั่งซื้อได้ทันทีที่ร้านได้รับอนุมัติ"
                : `เหลืออีก ${items.filter((i) => !i.done).length} ขั้นตอน`}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.key}
              className={`flex items-center gap-3 p-4 rounded-xl border ${
                item.done ? "border-emerald-100 bg-emerald-50/40" : "border-gray-200 bg-white"
              }`}
            >
              {item.done ? (
                <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
              ) : (
                <Circle className="text-gray-300 shrink-0" size={20} />
              )}
              <span className={`flex-1 text-sm ${item.done ? "text-emerald-700 line-through" : "text-gray-700 font-medium"}`}>
                {item.label}
              </span>
              {!item.done && (
                <Link
                  href={item.href}
                  className="shrink-0 flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 whitespace-nowrap"
                >
                  {item.ctaLabel} <ArrowRight size={13} />
                </Link>
              )}
            </div>
          ))}
        </div>

        {allDone && (
          <Link
            href="/shop/dashboard"
            className="mt-6 flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-md shadow-emerald-200 transition"
          >
            ไปที่หน้าหลักร้านค้า <ArrowRight size={15} />
          </Link>
        )}
      </div>

      {hasPaymentMethod === false && (
        <div className="flex items-start gap-2 px-1 text-xs text-gray-400">
          <CreditCard size={13} className="shrink-0 mt-0.5" />
          <span>ช่องทางรับเงินสำคัญที่สุด — ไม่ตั้งไว้ ลูกค้าจะสั่งซื้อได้แต่ไม่รู้จะโอนเงินไปที่ไหน</span>
        </div>
      )}
    </div>
  );
}
