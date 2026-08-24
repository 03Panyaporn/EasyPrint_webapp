"use client";

import { useCallback, useEffect, useState } from "react";
import { Star, Loader2, AlertCircle, MessageSquare, Send } from "lucide-react";
import { getMyShopProfile } from "@/lib/api/shops";
import { getShopReviews, replyToReview } from "@/lib/api/reviews";
import { ApiError } from "@/lib/api/client";
import type { ReviewResponse, ShopReviewsResponse } from "@easyprint/shared";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

export default function ShopReviewsContainer() {
  const [shopId, setShopId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [summary, setSummary] = useState<ShopReviewsResponse["summary"]>({
    avgRating: null,
    reviewCount: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { shop } = await getMyShopProfile();
      setShopId(shop.id);
      const res = await getShopReviews(shop.id);
      setReviews(res.reviews);
      setSummary(res.summary);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "โหลดรีวิวไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleReply = async (review: ReviewResponse) => {
    if (!shopId) return;
    const draft = (replyDrafts[review.id] ?? "").trim();
    if (!draft) return;
    setReplyingId(review.id);
    setError("");
    try {
      const { review: updated } = await replyToReview(shopId, review.id, { reply: draft });
      setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setReplyDrafts((prev) => ({ ...prev, [review.id]: "" }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ตอบกลับไม่สำเร็จ");
    } finally {
      setReplyingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <Loader2 size={28} className="animate-spin text-orange-500" />
        <p className="text-sm">กำลังโหลดรีวิว...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
          <MessageSquare size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-800 md:text-2xl">รีวิวร้านค้า</h1>
          <p className="mt-0.5 text-xs text-slate-400 md:text-sm">ดูรีวิวจากลูกค้าและตอบกลับได้</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 text-red-600 border border-red-200 text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm flex items-center gap-6">
        <div className="flex flex-col items-center text-center">
          <div className="text-3xl font-black text-slate-900">{(summary.avgRating ?? 0).toFixed(1)}</div>
          <div className="flex items-center gap-0.5 mt-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  summary.avgRating != null && i < Math.round(summary.avgRating) ? "text-orange-400 fill-orange-400" : "text-slate-200 fill-slate-200"
                }`}
              />
            ))}
          </div>
          <div className="text-xs text-slate-400 mt-1">{summary.reviewCount} รีวิว</div>
        </div>
        <div className="flex-1 space-y-1">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const c = summary.distribution[star] ?? 0;
            const pct = summary.reviewCount > 0 ? (c / summary.reviewCount) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-3 font-bold text-slate-600 text-right">{star}</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-6 text-slate-400">{c}</span>
              </div>
            );
          })}
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-10 text-center text-slate-400 text-sm">
          ยังไม่มีรีวิวสำหรับร้านนี้
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0">
                    {review.customerName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{review.customerName}</p>
                    <p className="text-[11px] text-slate-400">{formatDate(review.createdAt)} · ออเดอร์ {review.orderCode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "fill-orange-400 text-orange-400" : "fill-slate-100 text-slate-100"}`} />
                  ))}
                </div>
              </div>

              {review.comment && <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>}

              {review.shopReply ? (
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <p className="text-xs font-bold text-orange-600 mb-1">คำตอบกลับของร้าน</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{review.shopReply}</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={replyDrafts[review.id] ?? ""}
                    onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [review.id]: e.target.value }))}
                    placeholder="พิมพ์คำตอบกลับถึงลูกค้า..."
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-orange-500 focus:bg-white transition"
                  />
                  <button
                    onClick={() => handleReply(review)}
                    disabled={replyingId === review.id || !(replyDrafts[review.id] ?? "").trim()}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 px-3 py-2 text-xs font-bold text-white transition"
                  >
                    {replyingId === review.id ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    ตอบกลับ
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
