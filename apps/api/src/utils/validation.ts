// UUID v4-ish format check (ยอมรับทุก version ของ UUID ไม่ใช่แค่ v4 เพราะ Postgres uuid ทั่วไปพอ)
// ใช้ validate path param ที่คาดว่าเป็น UUID (เช่น :id, :shopId) ก่อนส่งเข้า query เสมอ —
// ไม่งั้น Postgres จะ reject ค่าที่ไม่ใช่ UUID ด้วย error ดิบ (invalid input syntax for type uuid)
// ที่ไม่ถูกจับ กลายเป็น raw 500 แทนที่จะเป็น 400/404 ที่ควรจะเป็น (ยืนยันบั๊กจริงจาก QA:
// BUG-02-02 ใน addresses.ts และ BUG-04-02 ใน shops.ts — เป็น pattern เดียวกัน แก้รวมศูนย์ไว้ที่นี่)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(id: string): boolean {
  return UUID_RE.test(id);
}
