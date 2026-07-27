import { z } from "zod";

// สคีมานี้ใช้ทั้งฝั่ง apps/web (ตอน validate ฟอร์ม) และ apps/api (ตอน validate ก่อนบันทึก DB)

export const rejectShopSchema = z.object({
  reason: z.string().min(1, "กรุณาระบุเหตุผลที่ไม่อนุมัติ"),
});

export type RejectShopInput = z.infer<typeof rejectShopSchema>;
