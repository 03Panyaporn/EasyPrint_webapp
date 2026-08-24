"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Star, Loader2, AlertCircle, MessageSquare, Trash2, Search } from "lucide-react";
import { getAdminReviews, deleteReview } from "@/lib/api/reviews";
import { ApiError } from "@/lib/api/client";
import type { AdminReviewResponse } from "@easyprint/shared";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<AdminReviewResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { reviews } = await getAdminReviews();
      setReviews(reviews);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "โหลดรีวิวไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (ratingFilter !== "all" && r.rating.toString() !== ratingFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchShop = r.shopName.toLowerCase().includes(q);
        const matchCustomer = r.customerName.toLowerCase().includes(q);
        const matchComment = (r.comment ?? "").toLowerCase().includes(q);
        if (!matchShop && !matchCustomer && !matchComment) return false;
      }
      return true;
    });
  }, [reviews, search, ratingFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    try {
      await deleteReview(deleteTarget.id);
      setReviews((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ลบรีวิวไม่สำเร็จ");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
        <Loader2 size={32} className="animate-spin text-orange-500" />
        <p className="text-sm">กำลังโหลดรีวิวทั้งหมด...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
          <MessageSquare size={21} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-800 md:text-2xl">รีวิวทั้งหมดในระบบ</h1>
          <p className="mt-0.5 text-xs text-slate-400 md:text-sm">ตรวจสอบและลบรีวิวที่ไม่เหมาะสมได้จากทุกร้านค้า</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 text-red-600 border border-red-200 text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อร้าน, ลูกค้า, หรือข้อความรีวิว..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white transition"
          />
        </div>
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-orange-500 cursor-pointer"
        >
          <option value="all">ทุกคะแนน</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>{n} ดาว</option>
          ))}
        </select>
      </div>

      <p className="text-xs text-slate-400 px-1">แสดง {filtered.length} รายการ จากทั้งหมด {reviews.length} รีวิว</p>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-10 text-center text-slate-400 text-sm">
          ไม่พบรีวิวตรงตามเงื่อนไข
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0">
                    {review.customerName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {review.customerName} <span className="font-normal text-slate-400">→ {review.shopName}</span>
                    </p>
                    <p className="text-[11px] text-slate-400">{formatDate(review.createdAt)} · ออเดอร์ {review.orderCode}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteTarget(review)}
                  className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                >
                  <Trash2 size={13} />
                  ลบ
                </button>
              </div>

              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "fill-orange-400 text-orange-400" : "fill-slate-100 text-slate-100"}`} />
                ))}
              </div>

              {review.comment && <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>}

              {review.shopReply && (
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <p className="text-xs font-bold text-orange-600 mb-1">คำตอบกลับของร้าน</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{review.shopReply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: ยืนยันการลบรีวิว */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-red-100">
              <Trash2 size={28} className="text-red-600" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-800">ยืนยันการลบรีวิว</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                ลบรีวิวของ <span className="font-semibold text-slate-800">{deleteTarget.customerName}</span> ที่มีต่อร้าน{" "}
                <span className="font-semibold text-slate-800">{deleteTarget.shopName}</span> ใช่หรือไม่? การลบนี้ย้อนกลับไม่ได้
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md shadow-red-600/20 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
