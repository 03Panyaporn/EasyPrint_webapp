---
name: api-endpoint
description: "ใช้ skill นี้ทุกครั้งที่ต้องสร้างหรือแก้ API endpoint ใหม่ใน apps/api เพื่อให้ทุก endpoint มีรูปแบบเดียวกัน (validate, error handling, response shape)"
---

# วิธีสร้าง API Endpoint ใหม่ในโปรเจกต์ EasyPrint

ทำตามลำดับนี้ทุกครั้ง:

1. **เพิ่ม Zod schema ก่อน** — ที่ `packages/shared/src/schemas/<ชื่อ>.ts` ห้ามเขียน validation logic ตรงใน `apps/api` โดยตรง เพราะ frontend ต้องใช้ schema เดียวกัน

2. **Import schema เข้ามาใช้ใน `apps/api/src/index.ts`** (หรือแยกไฟล์ route ถ้าไฟล์เริ่มยาว) แล้ว validate ด้วย `.safeParse()` เสมอ ไม่ใช้ `.parse()` เพราะ `.parse()` จะ throw error แทนที่จะคืนค่าที่ควบคุมได้

3. **รูปแบบ error response มาตรฐาน:**
   ```ts
   if (!parsed.success) {
     set.status = 400;
     return { error: "ข้อความอธิบายภาษาไทย", details: parsed.error.flatten() };
   }
   ```

4. **รูปแบบ success response มาตรฐาน:** คืนค่าเป็น object ที่มี key ตรงกับชื่อ resource เช่น `{ order: {...} }` ไม่คืนค่าดิบๆ ตรงๆ เพื่อให้ frontend เพิ่ม field อื่นในอนาคตได้โดยไม่ breaking change

5. **ถ้า endpoint ต้อง login ก่อน** — เช็ค JWT จาก httpOnly cookie ก่อนเสมอ อย่าเชื่อ user id ที่ client ส่งมาตรงๆ

6. **หลังเขียนเสร็จ** — เพิ่มบรรทัดสรุป endpoint นี้ไว้ที่ `docs/api-spec.md` ด้วย เพื่อให้ทีมอื่นรู้ว่ามี endpoint นี้อยู่
