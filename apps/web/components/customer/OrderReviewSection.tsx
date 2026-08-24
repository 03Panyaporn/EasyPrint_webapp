"use client";

import { useEffect, useState } from "react";
import { Star, Loader2, MessageSquare, Trash2, Send } from "lucide-react";
import { createReview, getOrderReview, deleteReview } from "@/lib/api/reviews";
import { ApiError } from "@/lib/api/client";
import type { ReviewResponse } from "@easyprint/shared";

interface OrderReviewSectionProps {
  orderId: string;
}

// แสดงเฉพาะออเดอร์ที่ completed แล้ว (เช็คจาก parent ก่อนเรนเดอร์ component นี้) — โหลดรีวิวเดิมถ้ามี ไม่มีก็ให้เขียนใหม่ได้
export default function OrderReviewSection({ orderId }: OrderReviewSectionProps) {
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrderReview(orderId)
      .then((res) => setReview(res.review))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("กรุณาให้คะแนนอย่างน้อย 1 ดาว");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const { review: created } = await createReview(orderId, { rating, comment: comment.trim() || undefined });
      setReview(created);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ส่งรีวิวไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!review) return;
    setDeleting(true);
    setError("");
    try {
      await deleteReview(review.id);
      setReview(null);
      setRating(0);
      setComment("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ลบรีวิวไม่สำเร็จ");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-md md:p-6 flex items-center justify-center gap-2 text-slate-400 text-sm">
        <Loader2 size={16} className="animate-spin" />
        กำลังโหลดรีวิว...
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-md md:p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
          <MessageSquare size={20} />
        </div>
        <div>
          <h2 className="text-base text-slate-800">{review ? "รีวิวของคุณ" : "ให้คะแนนร้านนี้"}</h2>
          <p className="text-xs text-slate-400">{review ? "ขอบคุณที่แบ่งปันประสบการณ์" : "งานเสร็จแล้ว บอกเล่าประสบการณ์ของคุณหน่อย"}</p>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">{error}</div>
      )}

      {review ? (
        <div className="space-y-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} className={`w-5 h-5 ${n <= review.rating ? "fill-orange-400 text-orange-400" : "fill-slate-100 text-slate-100"}`} />
            ))}
          </div>
          {review.comment && <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>}

          {review.shopReply && (
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <p className="text-xs font-bold text-orange-600 mb-1">การตอบกลับจากร้าน</p>
              <p className="text-sm text-slate-600 leading-relaxed">{review.shopReply}</p>
            </div>
          )}

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 disabled:opacity-50"
          >
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            ลบรีวิวนี้
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-0.5"
              >
                <Star
                  className={`w-7 h-7 transition ${
                    n <= (hoverRating || rating) ? "fill-orange-400 text-orange-400" : "fill-slate-100 text-slate-100"
                  }`}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="เล่าประสบการณ์การใช้บริการร้านนี้ (ไม่บังคับ)"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-orange-500 focus:bg-white transition resize-none"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition disabled:opacity-50"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            ส่งรีวิว
          </button>
        </div>
      )}
    </div>
  );
}
