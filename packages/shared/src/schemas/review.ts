import { z } from "zod";

// POST /orders/:orderId/review — ลูกค้ารีวิวออเดอร์ที่ completed แล้วเท่านั้น (1 ออเดอร์รีวิวได้ 1 ครั้ง — unique reviews.order_id)
export const createReviewSchema = z.object({
  rating: z.number().int().min(1, "ให้คะแนนอย่างน้อย 1 ดาว").max(5, "ให้คะแนนได้สูงสุด 5 ดาว"),
  comment: z.string().trim().max(1000, "ข้อความยาวเกินไป").optional(),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

// PATCH /shops/:shopId/reviews/:id/reply — ร้านตอบกลับรีวิวของร้านตัวเอง
export const replyReviewSchema = z.object({
  reply: z.string().trim().min(1, "กรุณากรอกข้อความตอบกลับ").max(1000, "ข้อความยาวเกินไป"),
});
export type ReplyReviewInput = z.infer<typeof replyReviewSchema>;

export interface ReviewResponse {
  id: string;
  shopId: string;
  orderId: string;
  orderCode: string;
  rating: number;
  comment: string | null;
  shopReply: string | null;
  shopRepliedAt: string | null;
  createdAt: string;
  customerId: string; // ใช้ฝั่ง frontend เช็คว่าเป็นเจ้าของรีวิวเอง (โชว์ปุ่มลบ) ไม่ใช่ข้อมูลอ่อนไหว
  customerName: string; // ชื่อจริง + นามสกุลอักษรย่อ เช่น "สมชาย จ." เพื่อความเป็นส่วนตัว
}

// GET /admin/reviews — เหมือน ReviewResponse แต่เพิ่มชื่อร้าน เพราะเป็น list ข้ามร้านทั้งระบบ (ใช้หน้า moderation ของแอดมิน)
export interface AdminReviewResponse extends ReviewResponse {
  shopName: string;
}

export interface ShopReviewsResponse {
  reviews: ReviewResponse[];
  summary: {
    avgRating: number | null;
    reviewCount: number;
    distribution: Record<1 | 2 | 3 | 4 | 5, number>; // จำนวนรีวิวแยกตามดาว ใช้วาดกราฟแท่งสัดส่วน
  };
}
