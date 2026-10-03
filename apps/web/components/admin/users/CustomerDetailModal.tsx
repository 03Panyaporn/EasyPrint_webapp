"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, AlertCircle, CirclePause, CheckCircle2, Trash2, Mail, Phone, MapPin, ShoppingBag, Star, Heart } from "lucide-react";
import type { AdminCustomerDetail } from "@easyprint/shared";
import { getAdminCustomer } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { LoadingSection } from "@/components/ui/Spinner";
import { statusConfig } from "@/components/shop/orders/statusConfig";
import type { OrderStatus } from "@/components/shop/orders/types";
import CustomerStatusBadge from "./CustomerStatusBadge";
import { formatThaiDate, formatBaht, customerFullName } from "./format";

interface CustomerDetailModalProps {
  customerId: string;
  onClose: () => void;
  onSuspend: (customer: AdminCustomerDetail) => void;
  onReinstate: (customer: AdminCustomerDetail) => void;
  onDelete: (customer: AdminCustomerDetail) => void;
}

// รายละเอียดบัญชีลูกค้า — ดึงข้อมูลสดจาก GET /admin/customers/:id ทุกครั้งที่เปิด (สรุปออเดอร์/ที่อยู่ไม่ได้อยู่ในรายการหลัก)
export default function CustomerDetailModal({ customerId, onClose, onSuspend, onReinstate, onDelete }: CustomerDetailModalProps) {
  const [customer, setCustomer] = useState<AdminCustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { customer } = await getAdminCustomer(customerId);
      setCustomer(customer);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "โหลดข้อมูลบัญชีลูกค้าไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    load();
  }, [load]);

  return createPortal(
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fadeIn"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="รายละเอียดบัญชีลูกค้า"
        className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-xl shadow-2xl border border-slate-100 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-lg shrink-0">
              {customer?.firstname[0] ?? "?"}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-slate-800 truncate">
                {customer ? customerFullName(customer) : "รายละเอียดบัญชีลูกค้า"}
              </h3>
              {customer && (
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <CustomerStatusBadge status={customer.status} size="sm" />
                  <span className="text-xs text-slate-400">สมัครเมื่อ {formatThaiDate(customer.createdAt)}</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="ปิด"
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <LoadingSection label="กำลังโหลดข้อมูลบัญชี..." />
        ) : error || !customer ? (
          <div className="text-center py-10 space-y-3">
            <AlertCircle size={36} className="mx-auto text-rose-400" />
            <p className="text-sm text-slate-600">{error || "ไม่พบข้อมูลบัญชีลูกค้า"}</p>
            <button
              onClick={load}
              className="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-sm text-slate-700">
            {/* Suspended reason */}
            {customer.status === "suspended" && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
                <h4 className="font-bold text-rose-700 text-xs uppercase tracking-wider">
                  ถูกระงับการใช้งานเมื่อ {formatThaiDate(customer.suspendedAt)}
                </h4>
                <p className="text-xs text-rose-600 leading-relaxed font-medium">
                  เหตุผล: {customer.suspendedReason || "-"}
                </p>
              </div>
            )}

            {/* Account info */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-orange-600">ข้อมูลบัญชี</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="min-w-0">
                  <span className="text-xs text-slate-400 block">อีเมล (ใช้เข้าสู่ระบบ)</span>
                  <p className="font-semibold flex items-center gap-1.5 break-all">
                    <Mail size={13} className="text-slate-400 shrink-0" /> {customer.email}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">เบอร์โทรศัพท์</span>
                  <p className="font-semibold flex items-center gap-1.5">
                    <Phone size={13} className="text-slate-400 shrink-0" /> {customer.phone || "-"}
                  </p>
                </div>
                {customer.address && (
                  <div className="sm:col-span-2">
                    <span className="text-xs text-slate-400 block">ที่อยู่ในโปรไฟล์</span>
                    <p className="text-xs leading-relaxed">{customer.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-orange-600">สรุปการใช้งาน</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "คำสั่งซื้อทั้งหมด", value: customer.orderStats.total, className: "text-slate-800" },
                  { label: "กำลังดำเนินการ", value: customer.orderStats.active, className: "text-blue-700" },
                  { label: "เสร็จสิ้น", value: customer.orderStats.completed, className: "text-emerald-600" },
                  { label: "ยกเลิก", value: customer.orderStats.cancelled, className: "text-rose-600" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-white border border-slate-100 px-3 py-2">
                    <span className="text-[11px] text-slate-400 block">{s.label}</span>
                    <p className={`text-lg font-bold ${s.className}`}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <ShoppingBag size={13} /> ยอดใช้จ่าย (งานที่เสร็จสิ้น){" "}
                  <b className="text-slate-700">{formatBaht(customer.orderStats.totalSpent)}</b>
                </span>
                <span className="flex items-center gap-1">
                  <Star size={13} /> รีวิว <b className="text-slate-700">{customer.reviewCount}</b>
                </span>
                <span className="flex items-center gap-1">
                  <Heart size={13} /> ร้านโปรด <b className="text-slate-700">{customer.favoriteShopCount}</b>
                </span>
              </div>
            </div>

            {/* Recent orders */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-orange-600">คำสั่งซื้อล่าสุด</h4>
              {customer.recentOrders.length === 0 ? (
                <p className="text-xs text-slate-400">ยังไม่มีประวัติคำสั่งซื้อ</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {customer.recentOrders.map((o) => {
                    const meta = statusConfig[o.status as OrderStatus];
                    return (
                      <li key={o.id} className="py-2 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{o.ref}</p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {o.shopName ?? "ร้านค้าถูกลบแล้ว"} · {formatThaiDate(o.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-semibold text-slate-700">{formatBaht(o.totalPrice)}</span>
                          {meta && (
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
                            >
                              {meta.label}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Saved addresses */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-orange-600">ที่อยู่จัดส่งที่บันทึกไว้</h4>
              {customer.addresses.length === 0 ? (
                <p className="text-xs text-slate-400">ยังไม่ได้บันทึกที่อยู่</p>
              ) : (
                <ul className="space-y-2">
                  {customer.addresses.map((a) => (
                    <li key={a.id} className="text-xs flex gap-2">
                      <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800">
                          {a.label} · {a.receiverName} ({a.phone})
                          {a.isDefault && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-600 border border-orange-200 text-[10px]">
                              ค่าเริ่มต้น
                            </span>
                          )}
                        </p>
                        <p className="text-slate-500 leading-relaxed">{a.fullAddress}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {!customer.canDelete && (
              <p className="text-[11px] text-slate-500 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                บัญชีนี้มีประวัติคำสั่งซื้อผูกอยู่ จึงลบไม่ได้ (ต้องเก็บไว้เป็นประวัติของร้านค้า) — หากต้องการหยุดการใช้งาน ให้ใช้การระงับบัญชีแทน
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-slate-100">
          {customer && !loading && !error && (
            <>
              {customer.status === "active" ? (
                <button
                  onClick={() => onSuspend(customer)}
                  className="px-4 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold hover:bg-amber-100 transition flex items-center gap-1.5"
                >
                  <CirclePause size={14} /> ระงับบัญชี
                </button>
              ) : (
                <button
                  onClick={() => onReinstate(customer)}
                  className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} /> เปิดใช้งานอีกครั้ง
                </button>
              )}
              <button
                onClick={() => onDelete(customer)}
                disabled={!customer.canDelete}
                title={customer.canDelete ? undefined : "ลบไม่ได้ เนื่องจากมีประวัติคำสั่งซื้อ"}
                className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} /> ลบบัญชี
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
