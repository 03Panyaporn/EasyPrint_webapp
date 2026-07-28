"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  ImageIcon,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  FileSearch,
  MapPin,
  Phone,
  Mail,
  Clock,
  Link2,
  Share2,
  Calendar,
  Loader2,
} from "lucide-react";
import { type MockShop } from "@/lib/mock/adminShops";
import { getAdminShop, approveShop, rejectShop } from "@/lib/api/admin";
import { toMockShop } from "@/lib/adminShopAdapter";
import { ApiError } from "@/lib/api/client";
import ShopStatusBadge from "@/components/admin/shops/ShopStatusBadge";
import DocumentViewer from "@/components/admin/shops/DocumentViewer";
import ApproveModal from "@/components/admin/shops/ApproveModal";
import RejectModal from "@/components/admin/shops/RejectModal";
import NotificationToast, { type ToastType } from "@/components/admin/shops/NotificationToast";

type ModalType = "documents" | "approve" | "reject" | null;

export default function ShopDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  const [shop, setShop] = useState<MockShop | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [modalType, setModalType] = useState<ModalType>(null);
  const [toast, setToast] = useState<{ type: ToastType; shopName: string } | null>(null);

  const fetchShop = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { shop: row } = await getAdminShop(params.id);
      setShop(toMockShop(row));
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "โหลดข้อมูลร้านค้าไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchShop();
  }, [fetchShop]);

  const handleApprove = useCallback(async () => {
    if (!shop) return;
    try {
      await approveShop(shop.id);
      setToast({ type: "approve", shopName: shop.name });
      setModalType(null);
      await fetchShop();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : "อนุมัติร้านค้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  }, [shop, fetchShop]);

  const handleReject = useCallback(
    async (reason: string) => {
      if (!shop) return;
      try {
        await rejectShop(shop.id, { reason });
        setToast({ type: "reject", shopName: shop.name });
        setModalType(null);
        await fetchShop();
      } catch (err) {
        window.alert(err instanceof ApiError ? err.message : "ปฏิเสธร้านค้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      }
    },
    [shop, fetchShop]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-gray-400">
        <Loader2 size={24} className="animate-spin" />
        <p className="text-sm">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (loadError || !shop) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <p className="text-gray-500 text-lg font-semibold">{loadError || "ไม่พบร้านค้า"}</p>
        <Link
          href="/admin/shops"
          className="flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium text-sm"
        >
          <ArrowLeft size={16} />
          กลับไปยังรายการ
        </Link>
      </div>
    );
  }

  const status = shop.status;
  const initials = shop.name.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Back + Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link
          href="/admin/shops"
          className="flex items-center gap-1.5 hover:text-orange-600 transition-colors font-medium"
        >
          <ArrowLeft size={15} />
          ตรวจสอบร้านค้า
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">{shop.name}</span>
      </div>

      {/* Hero card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-orange-500 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-orange-200 shrink-0">
            {initials}
          </div>

          {/* Name + status */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{shop.name}</h1>
              <ShopStatusBadge status={status} />
            </div>
            <p className="text-gray-500 text-sm">{shop.serviceTypes.join(", ") || "-"}</p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() => setModalType("documents")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FileSearch size={15} />
              ตรวจสอบเอกสาร
            </button>
            <button
              onClick={() => setModalType("approve")}
              disabled={status === "อนุมัติแล้ว"}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 transition-colors shadow-sm shadow-green-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCircle size={15} />
              อนุมัติร้านค้า
            </button>
            <button
              onClick={() => setModalType("reject")}
              disabled={status === "ไม่อนุมัติ"}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors shadow-sm shadow-red-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <XCircle size={15} />
              ไม่อนุมัติร้านค้า
            </button>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: owner info */}
        <div className="lg:col-span-2 space-y-4">
          <InfoCard title="ข้อมูลเจ้าของร้าน">
            <InfoGrid>
              <InfoItem label="ชื่อร้านค้า" value={shop.name} />
              <InfoItem label="ชื่อเจ้าของ" value={`${shop.ownerFirstname} ${shop.ownerLastname}`} />
              <InfoItem
                label="บริการของร้าน"
                value={shop.serviceTypes.length > 0 ? shop.serviceTypes.join(", ") : "-"}
                full
              />
              <InfoItem
                label="วิธีรับสินค้า"
                value={shop.deliveryMethods.length > 0 ? shop.deliveryMethods.join(", ") : "-"}
                full
              />
              <InfoItem
                label="อีเมล"
                value={shop.email}
                icon={<Mail size={13} className="text-gray-400" />}
              />
              <InfoItem
                label="เบอร์โทรศัพท์"
                value={shop.phone}
                icon={<Phone size={13} className="text-gray-400" />}
              />
              <InfoItem
                label="ที่อยู่"
                value={shop.address}
                icon={<MapPin size={13} className="text-gray-400" />}
                full
              />
              <InfoItem
                label="วันที่สมัคร"
                value={shop.submitDate}
                icon={<Calendar size={13} className="text-gray-400" />}
              />
            </InfoGrid>
          </InfoCard>

          <InfoCard title="ข้อมูลเพิ่มเติม">
            <InfoGrid>
              <InfoItem
                label="เวลาทำการ"
                value={`${shop.openDays} | ${shop.openTime} – ${shop.closeTime} น.`}
                icon={<Clock size={13} className="text-gray-400" />}
                full
              />

              {shop.googleMapLink && (
                <InfoItem
                  label="Google Maps"
                  value={shop.googleMapLink}
                  icon={<MapPin size={13} className="text-gray-400" />}
                  isLink
                />
              )}
              {shop.socialUrl && (
                <InfoItem
                  label="Social"
                  value={shop.socialUrl}
                  icon={<Share2 size={13} className="text-gray-400" />}
                />
              )}
            </InfoGrid>
          </InfoCard>
        </div>

        {/* Right: rejection info (if rejected) */}
        <div className="space-y-4">
          {status === "ไม่อนุมัติ" && shop.rejectedReason && (
            <InfoCard title="เหตุผลที่ไม่อนุมัติ" accent="red">
              <p className="text-sm text-red-700">{shop.rejectedReason}</p>
            </InfoCard>
          )}
          <InfoCard title="สรุปเอกสาร">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">จำนวนเอกสาร</span>
                <span className="font-bold text-gray-900">{shop.documents.length} ไฟล์</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">PDF</span>
                <span className="font-semibold text-gray-700">
                  {shop.documents.filter((d) => d.type === "pdf").length} ไฟล์
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">รูปภาพ</span>
                <span className="font-semibold text-gray-700">
                  {shop.documents.filter((d) => d.type === "image").length} ไฟล์
                </span>
              </div>
            </div>
          </InfoCard>
        </div>
      </div>

      {/* Documents table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">เอกสารสมัคร</h2>
          <button
            onClick={() => setModalType("documents")}
            className="text-xs text-orange-500 font-semibold hover:underline"
          >
            ดูทั้งหมด
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">ชื่อไฟล์/เอกสารที่ตรวจสอบ</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">ประเภทเอกสาร</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">ขนาดไฟล์</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">รูปภาพนำเสนอ</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">สถานะเอกสาร</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {shop.documents.map((doc) => {
                const isPdf = doc.type === "pdf";
                return (
                  <tr key={doc.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isPdf ? "bg-red-100 text-red-500" : "bg-blue-100 text-blue-500"
                          }`}
                        >
                          {isPdf ? <FileText size={15} /> : <ImageIcon size={15} />}
                        </div>
                        <span className="font-medium text-gray-800 truncate max-w-[180px]">
                          {doc.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600">
                      {isPdf ? "PDF" : "รูปภาพ"}
                    </td>
                    <td className="px-4 py-3.5 text-gray-600">{doc.size}</td>
                    <td className="px-4 py-3.5 text-gray-600">—</td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        ครบถ้วน
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => window.open(doc.url, "_blank", "noopener,noreferrer")}
                          className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                          title="ดู"
                        >
                          <Eye size={14} />
                        </button>
                        <a
                          href={doc.url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                          title="ดาวน์โหลด"
                        >
                          <Download size={14} />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom action row */}
      <div className="flex justify-end gap-3 pb-4">
        <Link
          href="/admin/shops"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={15} />
          กลับไปยังรายการ
        </Link>
      </div>

      {/* Modals */}
      {modalType === "documents" && (
        <DocumentViewer shop={shop} onClose={() => setModalType(null)} />
      )}
      {modalType === "approve" && (
        <ApproveModal
          shopName={shop.name}
          onConfirm={handleApprove}
          onClose={() => setModalType(null)}
        />
      )}
      {modalType === "reject" && (
        <RejectModal
          shopName={shop.name}
          onConfirm={handleReject}
          onClose={() => setModalType(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <NotificationToast
          type={toast.type}
          shopName={toast.shopName}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

// ─── Helper sub-components ──────────────────────────────

function InfoCard({
  title,
  children,
  accent,
}: {
  title: string;
  children: React.ReactNode;
  accent?: "red";
}) {
  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm p-5 ${
        accent === "red" ? "border-red-200 bg-red-50" : "border-gray-100"
      }`}
    >
      <h3
        className={`text-sm font-bold mb-3 ${
          accent === "red" ? "text-red-700" : "text-gray-800"
        }`}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">{children}</div>;
}

function InfoItem({
  label,
  value,
  icon,
  full,
  isLink,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  full?: boolean;
  isLink?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <p className="text-xs font-semibold text-gray-500 mb-0.5">{label}</p>
      <div className="flex items-center gap-1.5">
        {icon}
        {isLink ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-orange-500 hover:underline truncate"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm text-gray-800 break-words">{value}</p>
        )}
      </div>
    </div>
  );
}
