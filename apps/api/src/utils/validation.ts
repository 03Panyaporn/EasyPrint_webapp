// UUID v4-ish format check (ยอมรับทุก version ของ UUID ไม่ใช่แค่ v4 เพราะ Postgres uuid ทั่วไปพอ)
// ใช้ validate path param ที่คาดว่าเป็น UUID (เช่น :id, :shopId) ก่อนส่งเข้า query เสมอ —
// ไม่งั้น Postgres จะ reject ค่าที่ไม่ใช่ UUID ด้วย error ดิบ (invalid input syntax for type uuid)
// ที่ไม่ถูกจับ กลายเป็น raw 500 แทนที่จะเป็น 400/404 ที่ควรจะเป็น (ยืนยันบั๊กจริงจาก QA:
// BUG-02-02 ใน addresses.ts และ BUG-04-02 ใน shops.ts — เป็น pattern เดียวกัน แก้รวมศูนย์ไว้ที่นี่)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(id: string): boolean {
  return UUID_RE.test(id);
}

// Postgres error codes ที่ route handler มักต้องดักจับแล้วแปลงเป็น response ที่สุภาพ (400/409) แทน raw 500
const POSTGRES_UNIQUE_VIOLATION = "23505";
const POSTGRES_FOREIGN_KEY_VIOLATION = "23503";

// ⚠️ drizzle-orm 0.45+ ห่อ error ของ Postgres จริงไว้ใน DrizzleQueryError โดยเก็บ error ต้นฉบับไว้ที่ `.cause`
// (ไม่ใช่ `.code` ตรงๆ ที่ตัว DrizzleQueryError เอง) — ถ้าเช็คแค่ `err.code` เฉยๆ จะไม่มีวัน match เลย
// เพราะ DrizzleQueryError.code เป็น undefined เสมอ ทำให้ catch block คิดว่าไม่ใช่ FK/unique violation แล้ว
// throw ต่อ กลายเป็น raw 500 (ยืนยันบั๊กจริงจาก QA Phase 06 — BUG-06-01 ใน services.ts ที่เช็คแค่ err.code
// ตรงๆ ต่างจาก admin.ts ที่เช็ค err.cause?.code ไว้ถูกต้องอยู่แล้ว) — ฟังก์ชันด้านล่างเช็คทั้งสองชั้นกันพลาดซ้ำ
function pgErrorCode(err: unknown): string | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const e = err as { code?: string; cause?: { code?: string } };
  return e.code ?? e.cause?.code;
}

export function isUniqueViolation(err: unknown): boolean {
  return pgErrorCode(err) === POSTGRES_UNIQUE_VIOLATION;
}

export function isForeignKeyViolation(err: unknown): boolean {
  return pgErrorCode(err) === POSTGRES_FOREIGN_KEY_VIOLATION;
}
