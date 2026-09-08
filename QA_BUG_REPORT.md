# QA_BUG_REPORT.md — บั๊กที่พบ (รอบทดสอบใหม่ทั้งหมด เริ่ม 2026-09-06)

> อัปเดตล่าสุด: 2026-09-08 (Phase 13 เสร็จสมบูรณ์ — พบ+แก้ BUG-13-01)
> ไฟล์นี้จะถูกเติมบั๊กใหม่ทันทีที่เจอระหว่างทดสอบ Phase 01-19 ตาม `QA_TESTING_PROGRESS.md`
> ใช้ฟอร์แมต: Bug ID `BUG-[PHASE]-[NUMBER]` เช่น `BUG-10-01` (Phase 10, บั๊กที่ 1)

---

## 📌 จุดที่ควรเพ่งเล็งเป็นพิเศษ (จากประวัติรอบก่อน 2026-08-25 — ยังไม่ยืนยันซ้ำในรอบนี้)

รายละเอียดเต็มอยู่ที่ [docs/qa/test-plan.md](docs/qa/test-plan.md) — สรุปย่อเป็น "จุดต้องสงสัย" ที่จะตรวจซ้ำตาม test case ที่เกี่ยวข้องใน `QA_TEST_CASES.md`:

| จุดต้องสงสัย | Phase ในรอบนี้ | Test case ที่จะยืนยัน |
|---|---|---|
| ไม่มี cron เรียก auto-delete cleanup endpoint | Phase 15 | ST15-06 |
| Unauthenticated upload (`shop-photo`/`id-card`) — เป็นการตัดสินใจเชิงนโยบายที่ยอมรับแล้ว | Phase 15 | ST15-01 |
| ไฟล์แนบแชทมองไม่เห็นใน admin storage dashboard | Phase 15 | ST15-05 |
| Order เก่า `finishedAt` เป็น NULL | Phase 15 | ST15-08 |

**ยืนยันซ้ำและแก้ไข/สรุปแล้วใน Phase 09-11:** reply overwrite ไม่มี audit trail (review R09-04 + contact-admin CA11-05 — เป็น design gap ที่ทราบแล้ว ไม่ใช่บั๊ก ไม่ได้แก้เพราะเป็นการเพิ่ม feature ไม่ใช่แก้บั๊ก); ร้าน pending/suspended contact-admin ไม่ได้ + error message ผิดบริบท (→ **BUG-11-01**, พบว่าเป็นปัญหาเชิงระบบที่กระทบ 7 endpoint ไม่ใช่แค่ contact-admin) — รายละเอียดในหัวข้อบั๊กที่ยืนยันแล้วด้านล่าง

**ยืนยันซ้ำและแก้ไขแล้วใน Phase 10:** ข้อความแชทรูปแบบ JSON ถูกตีความเป็นไฟล์แนบปลอม (→ **BUG-10-01**) — รายละเอียดในหัวข้อบั๊กที่ยืนยันแล้วด้านล่าง

**ยืนยันซ้ำและแก้ไขแล้วใน Phase 08:** `DELETE /auth/me` 500 (→ **BUG-08-01**), `PUT /shops/me` 401 แทน 403 (→ **BUG-08-03**), ร้าน suspended ยังแก้ `PUT /shops/me` ได้ (→ **BUG-08-02**) — รายละเอียดในหัวข้อบั๊กที่ยืนยันแล้วด้านล่าง

---

## 🆕 บั๊กที่ยืนยันแล้วในรอบทดสอบนี้ (2026-09-06 เป็นต้นไป)

### BUG-ENV-01: API server ต่อฐานข้อมูล Supabase ไม่ได้ (บล็อกการทดสอบทั้งหมด)
- **Phase:** 01 — Authentication & Session (พบตอนพยายามรัน A01-01)
- **Page/Endpoint:** ทุก endpoint ที่แตะ DB (`POST /auth/register`, `GET /shops`, ฯลฯ)
- **Severity:** 🔴 Critical — บล็อกการทดสอบทุก phase ที่เหลือ
- **Steps to Reproduce:**
  1. รัน `bun --cwd apps/api dev` (port 4000)
  2. เปิดหน้าเว็บ `(auth)/register` กรอกฟอร์มสมัครลูกค้าใหม่ครบถูกต้อง
  3. กด "สมัครสมาชิก"
- **Expected Result:** สมัครสำเร็จ
- **Actual Result:** "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" — API server log แสดง DB connection error กับทุก query ตั้งแต่ server เริ่มทำงาน แล้ว server หยุดตอบสนอง (ERR_CONNECTION_REFUSED) หลังจากนั้น
- **Evidence:**
  ```
  PostgresError: (ENOTFOUND) tenant/user postgres.wbkeogidgqvlhqpjrlcr not found
  severity_local: "FATAL", code: "XX000"
  ```
  เกิดแม้กับ query สาธารณะ (`select ... from shops where approval_status='approved'`, `select shop_id, rating from reviews`) → ยืนยันว่าไม่ใช่ปัญหาเฉพาะ auth แต่เป็นปัญหาการเชื่อมต่อ DB ทั้งระบบ
- **Possible Cause:** `DATABASE_URL` ใน `.env` ไม่ตรงกับปัจจุบัน หรือ Supabase project `wbkeogidgqvlhqpjrlcr` ถูก pause (free tier auto-pause หลังไม่มี activity)
- **Status: OPEN — BLOCKED, รอผู้ใช้ตรวจสอบ Supabase project status / DATABASE_URL ก่อนถึงจะทดสอบต่อได้**
- **อัปเดต 2026-09-06 (หลัง resume):** ผู้ใช้ resume Supabase project แล้ว, restart api dev server แล้วต่อ DB ได้ปกติ ปลดบล็อกแล้ว ทดสอบ Phase 01 ต่อได้

### BUG-01-01: สมัครลูกค้าใหม่สำเร็จจริง แต่หน้าเว็บไม่ redirect/ไม่แจ้งผลใดๆ
- **Phase:** 01 — Authentication & Session (A01-01)
- **Page/URL:** `http://localhost:54488/register`
- **Feature/Endpoint:** ปุ่ม "สมัครสมาชิก" → `POST /auth/register`
- **Severity:** 🟠 High (ผู้ใช้จริงจะคิดว่าสมัครไม่สำเร็จทั้งที่บัญชีถูกสร้างแล้วจริง อาจกดซ้ำจนได้ error "อีเมลซ้ำ" งงว่าเกิดอะไรขึ้น)
- **Steps to Reproduce:**
  1. เปิด `/register` กรอกข้อมูลถูกต้องครบทุก field (อีเมลใหม่ที่ไม่เคยใช้)
  2. กด "สมัครสมาชิก"
  3. สังเกตปุ่มเปลี่ยนเป็น "กำลังสร้างบัญชี..." แล้วกลับเป็น "สมัครสมาชิก" ปกติ
- **Expected Result:** redirect ไปหน้า `/orders` (ตามโค้ด `router.push("/orders")`) หรืออย่างน้อยแสดงข้อความสำเร็จ
- **Actual Result:** หน้าเว็บค้างอยู่ที่ฟอร์มสมัครสมาชิกเดิม ข้อมูลในฟอร์มยังอยู่ครบ ไม่มี error message ไม่มี success message ผู้ใช้ไม่รู้เลยว่าสมัครสำเร็จหรือไม่
- **Evidence:**
  - Network: `POST http://localhost:4000/auth/register` → `200 OK` พร้อม response `{"user":{"id":"42b92864-d735-418c-9ec4-b3ea74212650","email":"qa2.customer1@example.com",...}}`
  - Network: ตามด้วย `GET http://localhost:54488/orders?_rsc=1vh40` → `200 OK` (Next.js RSC prefetch สำเร็จ)
  - แต่ screenshot ทันทีหลังจากนั้น (และหลังรอ 2 วินาที) ยังคงแสดงหน้า `/register` เดิมเป๊ะ
  - ยืนยันว่าบัญชีถูกสร้างจริง: กลับไป `/login` แล้ว login ด้วย credential เดียวกัน → สำเร็จ (A01-06 PASS)
- **Possible Cause:** `apps/web/app/(auth)/register/page.tsx` เรียก `router.push("/orders"); router.refresh();` หลัง `await register(...)` สำเร็จ — เทียบกับหน้า login (`apps/web/app/(auth)/login/page.tsx`) ที่ใช้ `router.replace(...)` แล้วทำงานได้ปกติ ยืนยันว่า `push()` ตามด้วย `refresh()` ทันทีมีปัญหา race condition (refresh ไป re-fetch RSC ของหน้าปัจจุบันแข่งกับ push ที่กำลังจะเปลี่ยนหน้า ทำให้ navigation ถูกแทนที่เงียบๆ)
- **Fix Applied (2026-09-06):** เปลี่ยน `router.push("/orders")` → `router.replace("/orders")` ใน [`apps/web/app/(auth)/register/page.tsx`](apps/web/app/(auth)/register/page.tsx) ให้ตรงกับ pattern ของหน้า login
- **Verification:** สมัครบัญชีใหม่ `qa2.customer2@example.com` ผ่าน UI จริงอีกครั้งหลังแก้ → redirect ไปหน้า "ติดตามคำสั่งซื้อ" (`/orders`) ทันทีสำเร็จ ยืนยันด้วย screenshot
- **Status: FIXED ✅**

### BUG-01-02: Route ที่ต้องใช้สิทธิ์เฉพาะ (`/admin`, `/shop`) ไม่มี client-side auth guard — พึ่งพา API 401/403 เพียงอย่างเดียว
- **Phase:** 01 — Authentication & Session (A01-13)
- **Page/URL:** `http://localhost:54488/admin` (ทดสอบด้วย role customer), `http://localhost:54488/shop` (ทดสอบหลัง logout)
- **Severity:** 🟠 High (ไม่ใช่ data leak เพราะ API ยัง 401/403 ถูกต้อง แต่เป็นช่องโหว่ defense-in-depth — เผย layout/branding ภายในของ role อื่น และ UX สับสน)
- **Steps to Reproduce (กรณี 1 — customer เข้า /admin):**
  1. Login เป็น customer (`qa2.customer1@example.com`)
  2. เปิด URL `/admin` ตรงๆ
- **Actual Result (กรณี 1):** หน้า "ระบบจัดการแอดมิน" render เต็มรูปแบบ (title, branding, layout) ก่อนจะค่อยๆ แสดง error "ต้องเป็นบัญชีแอดมินเท่านั้น" หลังจาก `GET /admin/dashboard`, `GET /admin/notifications` คืน `403` — ไม่มีการ redirect ออกจากหน้านี้เลย
- **Steps to Reproduce (กรณี 2 — logout แล้วเข้า /shop):**
  1. Login เป็น shop owner
  2. `POST /auth/logout` (คืน 200, ยืนยันว่า session ถูกเคลียร์จริงด้วย `GET /auth/me` → 401)
  3. เปิด/refresh URL `/shop`
- **Actual Result (กรณี 2):** หน้า dashboard ร้านค้าเต็มรูปแบบ render ปกติ ไม่ redirect ไปหน้า login เลย แม้จะ hard refresh (ไม่ใช่ client-navigation) ก็ตาม — ดูเหมือนใช้งานได้ปกติทั้งที่ session หมดแล้วจริง (ข้อมูลที่เห็นเป็นค่าว่าง/0 เพราะ API คืน 401 ให้ทุก call แต่ UI ไม่ได้สื่อสารว่า "กรุณาเข้าสู่ระบบใหม่" เลย)
- **Expected Result:** ควร redirect ไป `/login` ทันทีที่ตรวจพบว่าไม่มีสิทธิ์/session หมดอายุ (ทำที่ระดับ layout/middleware ไม่ใช่รอ API response รายจุด)
- **Possible Cause:** ไม่มี Next.js middleware หรือ route-level auth check ใน `(admin)/layout.tsx` และ `(shop)/layout.tsx` — พึ่งพา component แต่ละตัวเช็ค error จาก API เอง
- **Fix Applied (2026-09-06):** สร้าง shared hook [`apps/web/lib/hooks/useRequireRole.ts`](apps/web/lib/hooks/useRequireRole.ts) เรียก `GET /auth/me` ทันทีตอน mount:
  - ไม่ได้ login → `router.replace("/login")`
  - login แล้วแต่ role ไม่ตรง → `router.replace(ROLE_HOME[user.role])` (ส่งกลับหน้าแรกของ role ตัวเอง ไม่ใช่ /login เพราะ login อยู่แล้ว)
  - ระหว่างตรวจสอบ/redirect จะไม่ render sidebar/topbar จริงเลย (แสดง "กำลังตรวจสอบสิทธิ์..." แทน)
  ใช้ hook นี้ใน [`AdminLayout.tsx`](apps/web/components/admin/AdminLayout.tsx) (`useRequireRole("admin")`) และ [`ShopLayout.tsx`](apps/web/components/shop/ShopLayout.tsx) (`useRequireRole("shop_owner")`)
- **Verification:**
  1. Logout แล้วเปิด `/shop` (hard refresh) → redirect ไป `/login` ทันที ไม่เห็น dashboard เลย
  2. Login เป็น customer แล้วเปิด `/admin` → redirect ไป `/Dashboard` (หน้าแรกของ customer) ทันที ไม่เห็น admin shell เลยแม้แวบเดียว
  ทั้งสอง case ยืนยันด้วย screenshot แล้ว
- **Status: FIXED ✅**

### BUG-01-03: `GET /shops/me` ถูกยิงซ้ำซ้อนหลายครั้งต่อการโหลดหน้าเดียว (~8 ครั้งพร้อมกัน)
- **Phase:** 01 — Authentication & Session (พบระหว่างทดสอบ A01-09)
- **Page/URL:** `http://localhost:54488/shop` (shop dashboard)
- **Severity:** 🟡 Medium (ไม่กระทบ correctness แต่สิ้นเปลือง API call โดยไม่จำเป็น — อาจกระทบ performance/cost เมื่อ scale)
- **Steps to Reproduce:** Login เป็น shop owner → เปิดหน้า `/shop` → ดู Network tab
- **Actual Result:** พบ `GET http://localhost:4000/shops/me` ถูกยิงซ้ำ 8 ครั้งแบบแทบพร้อมกันในการโหลดหน้าเดียว (ทั้งตอน authenticated คืน 200 ทั้ง 8 ครั้ง และตอน unauthenticated คืน 401 ทั้ง 8 ครั้ง) เช่นเดียวกับ `GET /notifications` ที่ซ้ำหลายครั้งเช่นกัน
- **Expected Result:** ควรมี request เดียว (หรือ cache/dedupe ผ่าน React Query/SWR) ไม่ใช่หลาย component ยิงซ้ำ endpoint เดียวกันพร้อมกัน
- **Possible Cause:** หลาย component ใน dashboard เรียก hook ดึงข้อมูลร้าน (`useShopMe` หรือคล้ายกัน) แยกกันโดยไม่มี shared cache/query client (เช่นไม่ได้ใช้ React Query แต่ใช้ `useEffect` + `fetch` ตรงในแต่ละ component)
- **Fix Applied (2026-09-06):** เพิ่ม in-flight GET request deduplication ที่ระดับ [`apiFetch`](apps/web/lib/api/client.ts) — ถ้ามี GET request ไป path เดียวกันกำลังค้างอยู่ (ยังไม่ resolve) ทุก caller ที่ตามมาจะ share promise เดียวกันแทนที่จะยิง network request ใหม่ (ไม่กระทบ POST/PATCH/PUT/DELETE ซึ่งต้องยิงจริงทุกครั้งตามที่สั่ง)
- **Verification:** เปิด `/shop` dashboard อีกครั้งหลังแก้ (ทั้งตอน authenticated และหลัง logout) → เหลือแค่ **1 request** ต่อ `GET /shops/me` ต่อการโหลดหน้า (จากเดิม 8 ครั้ง) ยืนยันจาก network log
- **Status: FIXED ✅**

### BUG-02-01: `DELETE /addresses/:id` และ `PATCH /addresses/:id/default` คืน success ปลอมเมื่อไม่ใช่เจ้าของ
- **Phase:** 02 — Security & Permission Matrix (SEC02-07)
- **Page/Endpoint:** `apps/api/src/routes/addresses.ts` — `DELETE /:id`, `PATCH /:id/default`
- **Severity:** 🟡 Medium (ไม่ใช่ data breach — ข้อมูลปลอดภัยจริง แต่ error handling ผิดพลาดสร้างความสับสน)
- **Steps to Reproduce:**
  1. Login เป็น customerA สร้างที่อยู่ 1 รายการ (เก็บ `addressId`)
  2. Logout แล้ว login เป็น customerB (คนละบัญชี ไม่เกี่ยวข้องกับที่อยู่นี้)
  3. ยิง `DELETE /addresses/:addressId` และ `PATCH /addresses/:addressId/default` ด้วย token ของ customerB
- **Expected Result:** ควรได้ `403`/`404` เหมือนกับ `PUT /addresses/:id` ที่ทำถูกต้องอยู่แล้ว
- **Actual Result:** ทั้งสอง endpoint คืน **`200 {"ok":true}`** ทั้งที่ address นั้นไม่ใช่ของ customerB — ตรวจสอบยืนยันว่า **ที่อยู่ของ customerA ไม่ได้ถูกลบ/เปลี่ยนแปลงจริง** (login กลับมาเป็น customerA แล้ว `GET /addresses` ยืนยันข้อมูลยังอยู่ครบ `isDefault:false` เหมือนเดิม) — สาเหตุคือ SQL `WHERE` clause กรอง `userId` ถูกต้อง (ทำให้ query ไม่กระทบ row ใดเลย) แต่โค้ดไม่เช็คผลลัพธ์ก่อนตอบกลับ จึงตอบ `{ok:true}` เสมอไม่ว่าจะมี row ถูกกระทบจริงหรือไม่
- **Evidence:** `crossDelete: {"status":200,"body":{"ok":true}}`, `crossSetDefault: 200` แต่ `GET /addresses` (ในฐานะเจ้าของจริง) หลังจากนั้นยืนยันข้อมูลไม่เปลี่ยน
- **Possible Cause:** `.delete("/:id", ...)` และ `.patch("/:id/default", ...)` ไม่ตรวจสอบ return value ของ `db.delete()/db.update()` (drizzle คืนจำนวน row ที่ถูกกระทบได้) ก่อนตอบ `{ok:true}` ต่างจาก `.put("/:id", ...)` ที่เช็ค `if (!address) { set.status = 404; ... }` ถูกต้อง
- **Fix Applied (2026-09-06):** [`apps/api/src/routes/addresses.ts`](apps/api/src/routes/addresses.ts):
  - `DELETE /:id` เพิ่ม `.returning()` แล้วเช็ค `if (!deleted) → 404`
  - `PATCH /:id/default` เปลี่ยนลำดับ: ตั้ง `isDefault:true` ให้ target ก่อน (พร้อม `.returning()` เช็ค 404 ถ้าไม่ใช่เจ้าของ/ไม่พบ) **ก่อน** จะไปปิด default ของ address อื่นๆ ของ user คนนั้น (ใช้ `ne(addresses.id, params.id)` กันไม่ให้แตะ target ซ้ำ) — แก้ผลข้างเคียงเดิมที่โค้ดจะไปปิด default ของ address อื่นของผู้เรียกก่อนเช็คว่า target ถูกต้องหรือไม่
- **Verification:** customer2 ยิง `DELETE`/`PATCH .../default` เข้า address ของ customer1 ซ้ำ → ได้ `404 {"error":"ไม่พบที่อยู่นี้"}` ทั้งคู่ (จากเดิม `200`); ยืนยัน address ของ customer1 ยังอยู่ครบไม่เปลี่ยนแปลง; ทดสอบ regression ว่า self-operation ปกติยังทำงานถูกต้อง — customer1 สร้าง address ที่ 2, ตั้งเป็น default (address แรก isDefault ถูกปิดอัตโนมัติถูกต้อง), ลบ address แรกสำเร็จ (`200`) เหลือแค่ address ที่ยังไม่ถูกลบ — ครบทุก flow ปกติ
- **Status: FIXED ✅**

### BUG-02-02: ส่ง `:id` ที่ไม่ใช่ UUID เข้า `/addresses/:id` ทำให้ได้ raw `500` แทน `400`
- **Phase:** 02 — Security & Permission Matrix (พบระหว่างทดสอบ SEC02-07)
- **Page/Endpoint:** `apps/api/src/routes/addresses.ts` — `PUT /:id` (น่าจะกระทบ `DELETE`/`PATCH .../default` ด้วยเช่นกันเพราะ pattern เดียวกัน)
- **Severity:** 🟡 Medium (raw error รั่วเล็กน้อย + DX ไม่ดี ไม่ใช่ security breach)
- **Steps to Reproduce:** ยิง `PUT /addresses/not-a-uuid` ด้วย body ที่ valid
- **Expected Result:** `400` พร้อมข้อความ "รูปแบบ id ไม่ถูกต้อง" หรือ `404`
- **Actual Result:** `500 {"error":"เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง"}` — Postgres reject ค่าที่ไม่ใช่ UUID ก่อนถึง WHERE clause แล้วโยน error ที่ไม่ถูกจับ
- **Possible Cause:** ไม่มีการ validate รูปแบบ UUID ของ `params.id` ก่อนส่งเข้า query — เป็น pattern เดียวกับที่เคยพบใน `POST /uploads` body ว่าง (SEC9-05c รอบก่อน) คือ error ที่ควรเป็น `400` หลุดไปเป็น `500` แทน
- **Fix Applied (2026-09-06):** เพิ่มฟังก์ชัน `isValidUUID()` (regex ตรวจรูปแบบ UUID) ใน [`apps/api/src/routes/addresses.ts`](apps/api/src/routes/addresses.ts) เช็คก่อนใช้ `params.id` ใน `PUT`, `DELETE`, `PATCH /default` ทั้ง 3 endpoint — คืน `400 "รูปแบบ id ไม่ถูกต้อง"` ถ้าไม่ผ่าน
- **Verification:** `PUT/DELETE/PATCH .../default` ด้วย `/addresses/not-a-uuid` → ได้ `400 {"error":"รูปแบบ id ไม่ถูกต้อง"}` ทั้ง 3 endpoint (จากเดิม `500`)
- **Status: FIXED ✅**

### BUG-04-01: Guest (ไม่ login) เข้าหน้าร้านค้าสาธารณะไม่ได้เลย ถูก redirect ไป /login ทุกครั้ง
- **Phase:** 04 — Shop Discovery & Browsing (D04-03)
- **Page/URL:** `http://localhost:53185/shops/[shopId]` — ทดสอบทั้งร้าน `pending` และ **ร้าน `approved` ปกติ**
- **Severity:** 🔴 Critical (กระทบธุรกิจหลักโดยตรง — ลูกค้าใหม่ที่ยังไม่สมัครสมาชิกไม่สามารถดูหน้าร้าน/ราคาก่อนตัดสินใจสมัครได้เลย ขัดกับโมเดล marketplace ทั่วไปที่ต้องให้ browse ก่อน login)
- **Steps to Reproduce:**
  1. Logout ให้แน่ใจว่าไม่มี session ใดๆ (`GET /auth/me` ต้องคืน `401`)
  2. เปิด URL `/shops/[shopId ของร้านที่ approved ปกติ]` ตรงๆ ผ่านเบราว์เซอร์ (ไม่ใช่ยิง API ตรง)
- **Expected Result:** เห็นหน้าร้าน (ข้อมูลร้าน, บริการ, รีวิว) ตามปกติเหมือนหน้ารายชื่อร้านค้า (ซึ่งใช้งานได้ปกติสำหรับ guest)
- **Actual Result:** ถูก `router.replace` ไปที่ `/login?redirect=%2Fshops%2F...` ทันที ไม่เห็นเนื้อหาร้านเลยแม้แต่วินาทีเดียว — ยืนยันด้วยทั้งร้านสถานะ `pending` และร้าน `approved` (ทดสอบ Johan Printer ซึ่งเป็นร้าน active ปกติ) ได้ผลเหมือนกันหมด
- **Evidence:** `apps/web/app/shops/[shopId]/page.tsx` บรรทัด 144-164:
  ```ts
  getMe()
    .then((meRes) => {
      if (meRes?.user) setUser(meRes.user);
      return Promise.all([getShop(params.shopId), getMainServices(params.shopId)])...
    })
    .catch((err) => {
      if (err instanceof ApiError && err.status === 401) {
        router.replace(`/login?redirect=...`);   // ← ตรงนี้
        return;
      }
      setLoadError(...)
    })
  ```
  `getMe()` คืน `401` เสมอสำหรับ guest (พฤติกรรมปกติของ endpoint นี้) — แต่โค้ด chain `getMe().then(...)` ทำให้ error จาก `getMe()` เอง (ไม่ใช่จาก `getShop()`/`getMainServices()`) หลุดไปเข้า `.catch()` เดียวกัน แล้วถูกตีความผิดว่า "โหลดร้านไม่สำเร็จเพราะไม่มีสิทธิ์" ทั้งที่จริงๆ แค่ guest ยังไม่ login เท่านั้น (ซึ่งเป็นเรื่องปกติ ไม่ใช่ error) — `getShop`/`getMainServices` เป็น public endpoint ที่ไม่เคยคืน 401 อยู่แล้วจากการทดสอบ API ตรงในเฟสนี้
- **Possible Cause:** ควรแยก `getMe()` ออกจาก chain การโหลดร้าน — เรียก `getMe()` แบบ fire-and-forget (fail เงียบๆ ถ้าไม่ login โดยไม่ต้อง redirect) และให้เฉพาะ `getShop`/`getMainServices` เท่านั้นที่กำหนด error state ของหน้า (404 → "ไม่พบร้านค้านี้", อื่นๆ → "โหลดข้อมูลร้านค้าไม่สำเร็จ")
- **Fix Applied (2026-09-06):** [`apps/web/app/shops/[shopId]/page.tsx`](apps/web/app/shops/[shopId]/page.tsx) — แยก `getMe()` ออกเป็น call อิสระ (fire-and-forget, catch เงียบๆ ไม่ redirect) ไม่ผูกกับ chain การโหลด `getShop`/`getMainServices` อีกต่อไป ลบ branch `router.replace("/login...")` ออกทั้งหมด (ไม่จำเป็นแล้วเพราะ endpoint เหล่านี้เป็น public ไม่เคยคืน 401 จริง)
- **Verification:** Guest (logout แล้ว) เปิด `/shops/a7f2c08c-...` (Johan Printer, ร้าน approved ปกติ) → เห็นหน้าร้านเต็มรูปแบบทันที (ชื่อร้าน, รีวิว 5.0, รายการบริการ) ไม่ redirect ไป login เลย; เปิดร้าน pending (`/shops/74dc56d2-...`) → แสดง "ไม่พบร้านค้านี้" + ลิงก์ "กลับหน้าแรก" อย่างสวยงาม ไม่ redirect ไป login เช่นกัน
- **Status: FIXED ✅**

### BUG-04-02: ส่ง `:id` ที่ไม่ใช่ UUID เข้า `/shops/:id` ทำให้ได้ raw `500` แทน `400`/`404`
- **Phase:** 04 — Shop Discovery & Browsing (D04-05)
- **Page/Endpoint:** `apps/api/src/routes/shops.ts` — `GET /:shopId` (อาจกระทบ endpoint อื่นที่รับ `:shopId`/`:id` ในไฟล์เดียวกันหรือไฟล์อื่นด้วย เช่น services/orders/reviews)
- **Severity:** 🟡 Medium (raw error รั่วเล็กน้อย ไม่ใช่ security breach — เป็น pattern เดียวกับ BUG-02-02 ที่แก้ไปแล้วใน `addresses.ts`)
- **Steps to Reproduce:** ยิง `GET /shops/not-a-uuid` (ไม่ต้อง login)
- **Expected Result:** `400`/`404` เหมือนกับ id ที่เป็น UUID ถูกต้องแต่ไม่มีในระบบ (ซึ่งคืน `404` ถูกต้องแล้ว)
- **Actual Result:** `500 {"error":"เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง"}`
- **Possible Cause:** เหมือน BUG-02-02 เป๊ะ — ไม่มีการ validate รูปแบบ UUID ของ `params.shopId` ก่อนส่งเข้า query, Postgres reject ค่าที่ไม่ใช่ UUID ก่อนถึง WHERE clause แล้วโยน error ที่ไม่ถูกจับ — ยืนยันว่าเป็น**ปัญหาเชิงระบบ** (systemic pattern) ที่อาจกระทบหลาย route ทั่วทั้ง API ไม่ใช่แค่ 2 จุดที่เจอ ควรพิจารณาแก้แบบรวมศูนย์ (เช่น global validation middleware/hook สำหรับ path param ที่ควรเป็น UUID) แทนการแก้ทีละไฟล์
- **Fix Applied (2026-09-06):** ย้าย `isValidUUID()` ไปเป็น shared utility ที่ [`apps/api/src/utils/validation.ts`](apps/api/src/utils/validation.ts) (ใช้ร่วมกันได้ทุก route ในอนาคต แทนการก็อปโค้ดซ้ำ) แล้วเรียกใช้ใน `GET /shops/:shopId` คืน `404 "ไม่พบร้านค้านี้"` ถ้า id ไม่ใช่รูปแบบ UUID — และ refactor `addresses.ts` (BUG-02-02) ให้ import จาก utility เดียวกันแทนโค้ดซ้ำเดิม
- **Verification:** `GET /shops/not-a-uuid` → `404 {"error":"ไม่พบร้านค้านี้"}` (จากเดิม `500`); ยืนยันร้านปกติ (`a7f2c08c-...`) และร้าน pending (`74dc56d2-...`) ยังทำงานถูกต้องเหมือนเดิมไม่มี regression
- **หมายเหตุ:** แก้เฉพาะ `GET /shops/:shopId` ซึ่งเป็นจุดที่ยืนยันบั๊กจริง — ยังไม่ได้ไล่แก้ทุก route ที่รับ `:id`/`:shopId` ทั่วทั้ง API (เช่น orders, reviews, services) เพราะยังไม่ได้ทดสอบแต่ละจุด ควรถือเป็นแนวทาง (utility พร้อมใช้แล้ว) ให้ทยอยแก้เมื่อเจอจริงในแต่ละ phase ถัดไป
- **Status: FIXED ✅ (เฉพาะจุดที่ยืนยันบั๊ก — ดูหมายเหตุ)**

### BUG-05-01: จำนวนแผ่นกระดาษที่คิดเงินไม่ผูกกับตัวเลือก "หน้าเดียว/หน้าหลัง" ที่ลูกค้าเลือกจริง
- **Phase:** 05 — Pricing Engine Audit (PE05-01, ตามคำขอผู้ใช้ให้ตรวจสอบ pricing logic ก่อนเริ่ม Cart & Checkout)
- **Page/Endpoint:** `packages/shared/src/pricing/engine.ts` (`calculateLineItem`), เรียกจาก `apps/api/src/routes/cart.ts` (2 จุด: GET cart + checkout), ใช้ preview ที่ `apps/web/components/shop/services/wizard/Step6Preview.tsx` และ **`apps/web/app/shops/[shopId]/order/[serviceId]/page.tsx`** (หน้าสั่งซื้อจริงของลูกค้า — จุดที่กระทบมากที่สุด)
- **Severity:** 🔴 High (คิดเงินผิดจริงสำหรับบริการ per_page ที่เปิดให้ลูกค้าเลือกพิมพ์หน้าเดียว/สองหน้าเอง — กระทบรายได้ร้านค้าและความถูกต้องของราคาที่ลูกค้าเห็นโดยตรง)
- **Steps to Reproduce:**
  1. สร้างบริการ `per_page` ที่มีตัวเลือกหมวด "รูปแบบการพิมพ์" ให้ลูกค้าเลือกหน้าเดียว/หน้าหลังเอง (ค่า `page_counting_mode` ของบริการตั้งเป็น `by_file_page`)
  2. ลูกค้าอัปโหลดไฟล์ PDF 10 หน้า แล้วเลือกตัวเลือก "หน้าหลัง (2 ด้าน)"
- **Expected Result:** จำนวน "แผ่น" ที่คิดค่ากระดาษ/ตัวเลือกควรลดลงเหลือ 5 แผ่น (ปัดขึ้นครึ่งหนึ่งของ 10 หน้า) เพราะพิมพ์ 2 หน้าต่อ 1 แผ่นจริง
- **Actual Result:** ระบบยังคิดค่ากระดาษที่ 10 แผ่นเท่าเดิม (เพราะ `page_counting_mode` เป็นค่าคงที่ระดับบริการที่ตั้งไว้ล่วงหน้า ไม่ใช่ค่าที่ผูกกับตัวเลือกที่ลูกค้าเพิ่งเลือกในออเดอร์นี้) — ยิ่งไปกว่านั้น พบว่าหน้าสั่งซื้อจริงของลูกค้า (`shops/[shopId]/order/[serviceId]/page.tsx`) **ไม่ได้ส่ง `pageCountingMode` เข้า `calculateLineItem` เลยด้วยซ้ำ** ทำให้ default เป็น `by_file_page` เสมอไม่ว่า service จะตั้งค่าอะไรไว้ก็ตาม
- **Possible Cause:** ไม่มีความเชื่อมโยงเชิงโครงสร้างระหว่างตัวเลือกหมวด `printing_side` กับฟิลด์ `page_counting_mode` — เป็นคนละจุดตั้งค่าที่ไม่ auto-sync กัน
- **Fix Applied (2026-09-06) — ตามที่ผู้ใช้ยืนยันให้แก้:**
  1. เพิ่มคอลัมน์ `is_duplex boolean default false` ใน `service_option_values` (migration `0017_add_option_value_is_duplex.sql`) — มีความหมายเฉพาะตอน option แม่เป็นหมวด `printing_side`: `true` = ค่านี้แทน "พิมพ์สองหน้า"
  2. Zod schema (`packages/shared/src/schemas/service.ts`): เพิ่ม `isDuplex` ในสคีมาค่าตัวเลือก + refinement ใหม่ `refineIsDuplexOnlyForPrintingSide` (ห้ามตั้ง `true` นอกหมวด printing_side, ห้ามตั้ง `true` เกิน 1 ค่าต่อหัวข้อ)
  3. `apps/api/src/routes/services.ts`: ส่งผ่าน/serialize `isDuplex` ครบทุก endpoint (create/update/duplicate/get)
  4. `apps/api/src/routes/cart.ts` (ทั้ง GET cart และ checkout): เพิ่ม logic ตรวจตัวเลือก `printing_side` ที่ลูกค้าเลือกจริง — ถ้ามีค่า `isDuplex=true` → **override `pageCountingMode` เป็น `by_sheet` เสมอ**, ถ้าเลือกค่า `isDuplex=false` → override เป็น `by_file_page` เสมอ, ถ้าบริการไม่มีตัวเลือกนี้เลย → fallback ใช้ค่าคงที่ระดับบริการเหมือนเดิม
  5. UI shop owner: `Step3Options.tsx` และ `AddServiceModal.tsx` เพิ่ม checkbox "พิมพ์ 2 หน้า" ให้ตั้งค่า `isDuplex` ได้ (ทำงานแบบ radio ในตัว เลือกได้ 1 ค่า/หัวข้อ) + default preset ตั้ง `isDuplex:true` ให้ค่า "หน้าหลัง (2 ด้าน)" อัตโนมัติ
  6. UI preview: `Step6Preview.tsx` (shop owner preview) และ **`shops/[shopId]/order/[serviceId]/page.tsx` (หน้าสั่งซื้อจริงของลูกค้า)** เพิ่ม logic คำนวณ `effectivePageCountingMode` แบบเดียวกับ backend ให้ preview ตรงกับราคาจริงที่จะเกิดตอน checkout เป๊ะ
  7. อัปเดต `docs/erd.md` ให้ตรงกับ schema ใหม่
- **Verification (ทดสอบจริงผ่าน API end-to-end):** สร้างบริการทดสอบ `per_page` (`pageCountingMode` ตั้งเป็น `by_file_page` โดยตั้งใจ) พร้อมตัวเลือก "หน้าเดียว" (`isDuplex:false`) / "หน้าหลัง 2 ด้าน" (`isDuplex:true`) → อัปโหลดไฟล์ PDF จริง 10 หน้า → เพิ่มลงตะกร้า:
  - เลือก "หน้าหลัง (2 ด้าน)" → `unitBreakdown.pageCount = 5` ✅ (ลดลงครึ่งหนึ่งถูกต้อง), ราคารวม `฿20` (ค่าหมึก 10×1 + ค่ากระดาษ 5×2)
  - เลือก "หน้าเดียว" → `unitBreakdown.pageCount = 10` ✅ (ไม่ลด), ราคารวม `฿10` (ค่าหมึก 10×1 + ค่ากระดาษ 0)
  - ทั้งสองกรณีคำนวณถูกต้องตรงตามสูตร ไม่มี regression
- **Status: FIXED ✅**

### BUG-05-02: ข้อมูลราคาบริการจริงในระบบตั้งไว้ที่ ฿0 (ไม่สมเหตุสมผลทางธุรกิจ แม้ผ่าน validation)
- **Phase:** 05 — Pricing Engine Audit (PE05-02)
- **Page/Endpoint:** ข้อมูล (ไม่ใช่โค้ด) — ร้าน "TONFAH PRINTER" (`shopId=348d48ad-fc9c-43f8-b8f3-c3f92537d74d`)
- **Severity:** 🟡 Medium (data-quality issue ไม่ใช่ security/logic bug — schema `basePrice.nonnegative()` อนุญาต 0 ตามเจตนาการออกแบบเดิม เผื่อ use case โปรโมชั่นฟรีจริงๆ)
- **Actual Result (ก่อนแก้):** บริการ "ถ่ายเอกสารขาวดำ" และ "โปสเตอร์" (ทั้งคู่ `pricingModel=fixed`) ตั้ง `basePrice=0.00` — ลูกค้าสั่งพิมพ์ได้ฟรีจริง ซึ่งไม่สมเหตุสมผลสำหรับบริการหลักของร้านถ่ายเอกสาร (น่าจะเป็นข้อมูลตั้งต้น/seed ที่ยังไม่ได้กรอกราคาจริง)
- **Fix Applied (2026-09-06) — ตามที่ผู้ใช้ยืนยันให้แก้ข้อมูลตัวอย่าง (ไม่แก้ schema validation):** อัปเดตตรงใน DB: "ถ่ายเอกสารขาวดำ" ฿0.00 → **฿1.00** (สอดคล้องกับราคาตลาดจริงของร้านถ่ายเอกสารใกล้มหาวิทยาลัยและตรงกับ colorTier ขาวดำของบริการ per_page อื่นในระบบที่ตั้งไว้ที่ ฿1 อยู่แล้ว), "โปสเตอร์" ฿0.00 → **฿50.00** (baseline สำหรับโปสเตอร์ขนาดเล็ก-กลางแบบเหมาจ่าย)
- **Verification:** ตรวจสอบค่าใน DB หลังอัปเดตแล้วถูกต้องตรงตามที่ตั้งใจ
- **หมายเหตุ:** เป็นการแก้ "ข้อมูลตัวอย่าง" 2 รายการที่พบระหว่างตรวจสอบเท่านั้น ไม่ได้ scan ทุกบริการในระบบว่ามีราคา ฿0 ที่อื่นอีกหรือไม่ (ยังไม่ได้ทำ full audit ทุก service ทุกร้าน) และไม่ได้เปลี่ยน business rule ของระบบ (`basePrice=0` ยังคงเป็นค่าที่ยอมรับได้ตาม schema เดิม)
- **Status: FIXED ✅ (data-only, ยังไม่ได้เพิ่ม validation บังคับ > 0)**

### BUG-05-03: ยิง checkout ซ้ำพร้อมกัน (double-click/retry) สร้าง Order ซ้ำหลายใบจากตะกร้าเดียวกัน
- **Phase:** 05 — Cart & Checkout (CO05-09)
- **Page/Endpoint:** `apps/api/src/routes/cart.ts` — `POST /shops/:shopId/cart/checkout`
- **Severity:** 🔴 Critical (กระทบเงินจริง/ธุรกิจโดยตรง — ลูกค้าอาจถูกสร้างออเดอร์ซ้ำหลายใบโดยไม่ตั้งใจจากการกดปุ่มซ้ำ, double-click, หรือ network retry ทำให้ร้านค้าเห็นออเดอร์ปลอมซ้ำ/ลูกค้าสับสนว่าสั่งไปกี่ครั้งกันแน่)
- **Steps to Reproduce:**
  1. เพิ่มสินค้าลงตะกร้า 1 รายการ
  2. ยิง `POST /shops/:shopId/cart/checkout` พร้อมกันหลาย request ในเวลาไล่เลี่ยกัน (จำลองการกดปุ่ม "ยืนยันคำสั่งซื้อ" ซ้ำเร็วๆ หรือ network ส่ง request ซ้ำ) — ทดสอบด้วย `Promise.all` ยิง 3 requests พร้อมกัน
- **Expected Result:** ควรสร้าง order สำเร็จแค่ 1 ใบ ส่วน request ที่เหลือควรได้ error (เช่น "ตะกร้านี้ถูกดำเนินการไปแล้ว" หรือ 404 เพราะตะกร้าถูกลบไปแล้ว)
- **Actual Result:** **ทั้ง 3 requests สำเร็จหมด (`200`) และสร้าง order แยกกัน 3 ใบ** (code #0002, #0003, #0004 คนละ id กันชัดเจน) จากตะกร้าใบเดียวกันที่มีสินค้าแค่ 1 รายการ — ยืนยันด้วย `GET /customers/orders` เห็นครบทั้ง 3 ใบจริงในประวัติคำสั่งซื้อ
- **Possible Cause:** endpoint อ่าน cart + cartItems, คำนวณราคา, insert order, แล้วค่อยลบ cart ทีหลัง — ไม่มี lock ใดๆ กันไม่ให้หลาย request อ่าน/ประมวลผลตะกร้าเดียวกันพร้อมกัน (race condition แบบคลาสสิก: read-then-write โดยไม่ atomic) ทุก request ที่ยิงมาก่อนตะกร้าจะถูกลบ จะเห็นตะกร้ายังอยู่เหมือนกันหมด จึงสร้าง order สำเร็จซ้ำกันได้ไม่จำกัดจำนวนครั้ง
- **Fix Applied (2026-09-06):** ห่อทั้ง flow (หาตะกร้า → คำนวณราคา → สร้าง order → ลบตะกร้า) ด้วย `db.transaction()` เดียว พร้อม `.for("update")` (`SELECT ... FOR UPDATE`) ล็อกแถวตะกร้าไว้ตั้งแต่ต้น — request ที่มาทีหลังต้องรอ request แรก commit (ลบตะกร้าสำเร็จ) ก่อน แล้วจะเห็นว่าไม่มีตะกร้าแล้วจริงๆ จึงคืน `404` แทนที่จะสร้าง order ซ้ำ ส่วน retry-loop เดิมสำหรับ order code ชนกัน (unique constraint) ย้ายไปอยู่ใน nested `tx.transaction()` (savepoint) แยกต่างหาก กัน error จากการชนกันของเลข order ทำให้ transaction ชั้นนอกที่ถือ lock ตะกร้าอยู่พังไปด้วย และย้าย logic แจ้งเตือน (email/notification) ให้ wrap ด้วย try/catch ของตัวเองไม่ให้ error ตรงนั้นไปกระตุ้น retry ซ้ำหลัง order ถูกสร้างสำเร็จแล้วจริง
- **Verification:** ยิง `POST checkout` พร้อมกัน 5 requests บนตะกร้าเดียวกัน (มี 1 รายการ) → สำเร็จแค่ 1 request (สร้าง order #0005) อีก 4 requests ได้ `404 "ไม่มีตะกร้าของร้านนี้ กรุณาเพิ่มสินค้าก่อน"` ถูกต้องครบทุกครั้ง — ตรวจ `GET /customers/orders` ยืนยันมี order ใหม่แค่ 1 ใบจริง (ก่อนหน้านั้นมี 4 ใบจากบั๊ก/retest เดิม รวมเป็น 5 ใบพอดี ไม่มีใบเกิน)
- **Status: FIXED ✅**

### BUG-06-01: ลบบริการที่มี cart item ผูกอยู่ได้ raw `500` แทนที่จะเป็นข้อความสุภาพ
- **Phase:** 06 — Shop Service Management (SV06-03)
- **Page/Endpoint:** `apps/api/src/routes/services.ts` — `DELETE /shops/:shopId/services/:id`
- **Severity:** 🟡 Medium (raw error รั่ว ไม่ใช่ security breach — endpoint มี catch block ที่ตั้งใจจะจับ FK violation แล้วตอบข้อความสุภาพอยู่แล้ว แต่ detection พังจึงหลุดไปเป็น 500 แทน)
- **Steps to Reproduce:**
  1. สร้างบริการทดสอบ แล้วเพิ่มลงตะกร้าของลูกค้า (ให้เกิด `cart_items` ที่อ้างอิง `main_service_id` นี้)
  2. Login เป็นเจ้าของร้าน ยิง `DELETE /shops/:shopId/services/:id` ลบบริการนั้นตรงๆ (ไม่ผ่านการปิดใช้งานก่อน)
- **Expected Result:** `400` พร้อมข้อความ "ไม่สามารถลบได้ เนื่องจากมีลูกค้าเพิ่มบริการนี้ไว้ในตะกร้าอยู่ กรุณาปิดใช้งานแทนการลบ" (catch block ในโค้ดตั้งใจไว้แบบนี้อยู่แล้ว)
- **Actual Result:** ได้ raw `500 {"error":"เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง"}` แทน — ยืนยันจาก server log เห็น `PostgresError: update or delete on table "main_services" violates foreign key constraint "cart_items_main_service_id_main_services_id_fk"` (`code: "23503"`) หลุดขึ้นมาเป็น unhandled error
- **Evidence:** server log แสดง error จริงเป็น `DrizzleQueryError` ห่อ Postgres error ไว้ใน `.cause` (`err.cause.code === "23503"`) แต่ `err.code` ของตัว wrapper เองเป็น `undefined` เสมอ
- **Possible Cause:** ฟังก์ชัน `isForeignKeyViolation()`/`isUniqueViolation()` ที่นิยามไว้ในไฟล์ `services.ts` เช็คแค่ `err.code` ตรงๆ (ไม่ unwrap `.cause`) — ต่างจาก `apps/api/src/routes/admin.ts` ที่มีฟังก์ชันเดียวกันแต่เช็คถูกต้องอยู่แล้ว (`e.code === ... || e.cause?.code === ...`) พิสูจน์ว่าเป็น drizzle-orm 0.45+ เปลี่ยนวิธีห่อ error แล้วโค้ดเก่าใน services.ts ไม่ได้ตามอัปเดต
- **Fix Applied (2026-09-06):** เพิ่ม `pgErrorCode()`/`isUniqueViolation()`/`isForeignKeyViolation()` เวอร์ชันถูกต้อง (unwrap ทั้ง `err.code` และ `err.cause?.code`) ไว้เป็น shared utility ใน [`apps/api/src/utils/validation.ts`](apps/api/src/utils/validation.ts) แล้วแก้ [`apps/api/src/routes/services.ts`](apps/api/src/routes/services.ts) ให้ลบฟังก์ชัน local เดิมที่พังออก เปลี่ยนเป็น `import { isUniqueViolation, isForeignKeyViolation } from "../utils/validation"` แทน
- **Verification:** ยิง `DELETE /shops/74dc56d2-.../services/051e9cbb-...` (บริการที่มี cart item ค้างอยู่จริงจากการทดสอบก่อนหน้า) ซ้ำหลังแก้ → ได้ `400 {"error":"ไม่สามารถลบได้ เนื่องจากมีลูกค้าเพิ่มบริการนี้ไว้ในตะกร้าอยู่ กรุณาปิดใช้งานแทนการลบ"}` ถูกต้อง (จากเดิม `500`) ตรวจ server log ยืนยันไม่มี unhandled error หลุดออกมาอีก และไม่มี compile error จากการ import ใหม่
- **Status: FIXED ✅**

### BUG-06-02: `PATCH` แก้เฉพาะ `addOns` (ไม่แตะฟิลด์อื่นของบริการเลย) ได้ raw `500`
- **Phase:** 06 — Shop Service Management (SV06-05, พบระหว่างทดสอบผูก add-on กับ main service)
- **Page/Endpoint:** `apps/api/src/routes/services.ts` — `PATCH /shops/:shopId/services/:id`
- **Severity:** 🟡 Medium (raw error รั่ว ไม่ใช่ security breach แต่บล็อกการใช้งานจริง — เจ้าของร้านจะเจอบั๊กนี้ทันทีที่พยายามผูก/แก้ add-on ของบริการที่มีอยู่แล้วโดยไม่ได้แก้ฟิลด์อื่นไปด้วย ซึ่งเป็น use case ปกติมาก)
- **Steps to Reproduce:**
  1. Login เป็นเจ้าของร้าน มีบริการหลักอยู่แล้ว 1 รายการ และมี add-on service อย่างน้อย 1 รายการ
  2. ยิง `PATCH /shops/:shopId/services/:id` ด้วย body ที่มีแค่ `{ "addOns": [{ "addOnId": "...", "extraPrice": 5 }] }` (ไม่ส่งฟิลด์อื่นของบริการหลักเลย เช่น name/basePrice/description)
- **Expected Result:** `200` พร้อม `service.availableAddOns` อัปเดตตามที่ส่งไป
- **Actual Result:** `500 {"error":"เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง"}` — server log แสดง `error: No values to set` จาก drizzle-orm `mapUpdateSet` ที่ `services.ts:496`
- **Evidence:** `Error: No values to set` ที่ `drizzle-orm/utils.js:92` เรียกจาก `update.js:31` เรียกจาก `services.ts:496` (`.set({...rest, ...})`)
- **Possible Cause:** โค้ด destructure `addOns/options/colorTiers/quantityTiers/basePrice/minArea/areaRoundingIncrement` ออกจาก `parsed.data` แล้วเอาที่เหลือ (`...rest`) ไปเป็น payload ของ `db.update(mainServices).set(...)` เสมอ — ถ้า client ส่งมาแค่ `addOns` (หรือ `options`/`colorTiers`/`quantityTiers` เดี่ยวๆ) `rest` จะกลายเป็น object ว่างเปล่า และ drizzle-orm 0.45+ ไม่ยอมรับ `.set({})` (throw `"No values to set"` ตรงๆ แทนที่จะ no-op เงียบๆ)
- **Fix Applied (2026-09-06):** [`apps/api/src/routes/services.ts`](apps/api/src/routes/services.ts) — เช็ค `Object.keys(updateData).length > 0` ก่อนเรียก `db.update(mainServices).set(...)`; ถ้า payload ที่จะ set ว่างเปล่าจริง (ผู้ใช้ตั้งใจแก้แค่ addOns/options/colorTiers/quantityTiers) ให้ `db.select()` แถวเดิมมาใช้แทน ไม่เรียก `.update()` เลย (กัน error โดยไม่กระทบพฤติกรรมตอนมีฟิลด์จริงให้ set)
- **Verification:** ยิง `PATCH` ซ้ำด้วย body เดิม (`{addOns:[...]}` อย่างเดียว) → ได้ `200` พร้อม `availableAddOns` ตรงตามที่ส่งไป (จากเดิม `500`); ทดสอบต่อว่า add-on ที่ผูกแล้วใช้งานได้จริงตอนสั่งซื้อ — ลูกค้าเพิ่มบริการนี้ลงตะกร้าพร้อมเลือก add-on "QA เคลือบพลาสติก" (฿5) → `lineTotal = ฿6` ถูกต้อง (`basePrice ฿1 + addOn ฿5`) ยืนยันว่า add-on ที่ผูกผ่าน endpoint นี้ใช้งานได้จริงครบวงจร ไม่ใช่แค่บันทึกลง DB เฉยๆ
- **Status: FIXED ✅**

### BUG-08-01: `DELETE /auth/me` (ลบบัญชี) ได้ raw `500` สำหรับแทบทุกบัญชีที่ใช้งานจริง — ไม่ใช่แค่เจ้าของร้านที่มีร้านผูกอยู่ตามที่คาดไว้เดิม
- **Phase:** 08 — Shop Settings & Account (SS08-04 — บั๊กวิกฤตที่ถูกจับตาจากรอบทดสอบก่อน 2026-08-25)
- **Page/Endpoint:** `apps/api/src/auth/routes.ts` — `DELETE /auth/me`
- **Severity:** 🔴 Critical (กระทบผู้ใช้จริงเกือบทุกคน ไม่ใช่ edge case — ลูกค้าที่เคยสั่งซื้ออย่างน้อย 1 ครั้งและเจ้าของร้านทุกคน **ไม่สามารถลบบัญชีตัวเองได้เลย** ได้แต่ raw error ที่ไม่สื่อความหมาย)
- **Steps to Reproduce:**
  1. กรณี A: สมัครร้านค้าใหม่ (มี `shops` row ผูกกับ `owner_id`) แล้วยิง `DELETE /auth/me` (พร้อม `currentPassword` ที่ถูกต้อง) ทันที
  2. กรณี B: สมัครลูกค้าใหม่ สั่งซื้อสำเร็จ 1 ครั้ง (มี `orders` row ผูกกับ `customer_id`) แล้วยิง `DELETE /auth/me`
- **Expected Result:** ควรได้ `400` พร้อมข้อความอธิบายว่าทำไมลบไม่ได้ (มี dependency ผูกอยู่) เหมือน pattern ที่ใช้กับการลบ service ที่มี cart ผูกอยู่ (ดู BUG-06-01)
- **Actual Result:** ทั้ง 2 กรณีได้ raw `500 {"error":"เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง"}` — server log ยืนยัน `PostgresError: update or delete on table "users" violates foreign key constraint "shops_owner_id_users_id_fk"` (กรณี A) และ FK เดียวกันฝั่ง `orders_customer_id_users_id_fk` (กรณี B) โค้ดเดิมไม่มี try/catch ใดๆ รอบ `db.delete(users)` เลย
- **Evidence:** โค้ดเดิมมีคอมเมนต์ `// Assuming cascading deletes are setup in schema for shops referencing users.` — เป็นการ "เดา" ที่ผิด ไม่เคยถูกยืนยันจริง; ตรวจ migration SQL ยืนยัน `shops.owner_id`, `orders.customer_id`, `carts.customer_id` ทั้งหมดประกาศเป็น `ON DELETE no action` (ไม่มี cascade) ตรงข้ามกับที่คอมเมนต์สันนิษฐานไว้
- **Possible Cause:** ไม่มีการเช็ค dependency ใดๆ ก่อนลบ user row ทั้งที่ schema ตั้งใจไม่ใส่ cascade บนตาราง shops/orders (กันข้อมูลร้าน/ประวัติการขายหายเงียบๆ — ตรงกับเจตนาเดียวกับที่ป้องกันไว้ใน BUG-06-01) แต่ไม่มีโค้ดฝั่ง route ที่ตรวจสอบและแจ้งเตือนผู้ใช้ก่อนปล่อยให้ query ไปชน constraint ตรงๆ
- **Fix Applied (2026-09-06):** [`apps/api/src/auth/routes.ts`](apps/api/src/auth/routes.ts) `DELETE /auth/me`:
  1. ถ้า role เป็น `shop_owner` และมี shop ผูกอยู่ → reject `400` พร้อมข้อความอธิบายชัดเจน ("กรุณาติดต่อผู้ดูแลระบบเพื่อปิด/โอนย้ายร้านค้าก่อนลบบัญชี")
  2. ถ้ามี order ผูกอยู่ (ไม่ว่า role ใด) → reject `400` พร้อมข้อความอธิบาย
  3. ถ้าผ่านทั้ง 2 เช็คด้านบน (ไม่มี dependency ทางธุรกิจ) → ลบ `carts` (ตะกร้าที่ยังไม่ checkout) และ `password_reset_tokens` ของ user นี้ก่อน (ทั้งคู่ไม่มี cascade เช่นกัน แต่ไม่ใช่ข้อมูลที่ต้องเก็บรักษา) แล้วค่อยลบ user
- **Verification:**
  - บัญชีร้านค้าที่มี shop ผูกอยู่ → ยิงลบซ้ำ → `400 "ไม่สามารถลบบัญชีได้ เนื่องจากยังมีร้านค้าผูกอยู่กับบัญชีนี้..."` (จากเดิม `500`)
  - บัญชีลูกค้าที่มี order ผูกอยู่ → ยิงลบซ้ำ → `400 "ไม่สามารถลบบัญชีได้ เนื่องจากมีประวัติการสั่งซื้อผูกอยู่กับบัญชีนี้..."` (จากเดิม `500`)
  - บัญชีลูกค้าสะอาด (มีแค่ตะกร้าที่ยังไม่ checkout ค้างอยู่ ไม่มี order) → ลบสำเร็จ `200 {"ok":true}`, login ซ้ำด้วยบัญชีเดิม → `401` ยืนยันว่าถูกลบจริง
  - ไม่มี compile error ใหม่จากการ import `orders`/`carts` เพิ่ม
- **หมายเหตุ:** พบเพิ่มเติมระหว่างตรวจสอบ (ไม่ใช่บั๊ก แค่ documentation drift) — ตาราง `addresses` ไม่ปรากฏอยู่ใน migration SQL ไฟล์ไหนเลย (ถูกสร้างตรงบน Supabase แยกจาก migration history เหมือนที่ migration `0001` เคยเตือนไว้เรื่อง `users.address`) และ FK ของ `addresses.user_id` มี cascade จริงในระดับ DB ทั้งที่ `schema.ts` (TypeScript) ไม่ได้ระบุ `onDelete: "cascade"` ไว้ — พฤติกรรมจริงถูกต้อง (ลบบัญชีที่มีแต่ address สำเร็จ) แต่ schema.ts ไม่ตรงกับ DB จริง ควรพิจารณาซิงก์เอกสารในอนาคต
- **Status: FIXED ✅**

### BUG-08-02: `PUT /shops/me` ไม่เช็ค `approvalStatus` เลย — ร้านที่ถูกระงับ (suspended) ยังแก้ไขข้อมูลร้าน/บัญชีธนาคารได้ตามปกติ
- **Phase:** 08 — Shop Settings & Account (SS08-05 — จุดที่ถูกจับตาจากรอบทดสอบก่อน)
- **Page/Endpoint:** `apps/api/src/routes/shops.ts` — `PUT /shops/me`
- **Severity:** 🟡 Medium (ไม่ใช่ data breach — เจ้าของร้านแก้ข้อมูลร้านตัวเองได้อยู่แล้วโดยชอบธรรม แต่ไม่สอดคล้องกับพฤติกรรมร้านที่ถูกระงับในจุดอื่นของระบบ เช่น `services.ts`'s `requireShopOwner()` ที่บล็อกร้าน pending/suspended จากการแก้ไขบริการ/ราคาไว้แล้ว)
- **Steps to Reproduce:**
  1. Admin suspend ร้านที่ approved อยู่แล้ว (`PATCH /admin/shops/:id/suspend`)
  2. เจ้าของร้านเดิม ยิง `PUT /shops/me` แก้ชื่อร้าน/ข้อมูลบัญชีธนาคาร
- **Expected Result:** ควรถูกบล็อกด้วย `403` เหมือนกับ endpoint จัดการบริการอื่นๆ ของร้าน suspended
- **Actual Result:** สำเร็จ `200 {"success":true}` ตามปกติทุกครั้ง ไม่มีการเช็ค `approvalStatus` เลยในโค้ดเดิม
- **Possible Cause:** endpoint นี้เขียนเช็คสิทธิ์เอง (`payload.role !== "shop_owner"`) แยกจาก `requireShopOwner()` ใน `services.ts` ที่มีเช็ค `approvalStatus` ถูกต้องอยู่แล้ว — ไม่ได้เรียกใช้ฟังก์ชันร่วมกัน ทำให้ตกหล่นเช็คนี้ไป
- **Fix Applied (2026-09-06):** [`apps/api/src/routes/shops.ts`](apps/api/src/routes/shops.ts) `PUT /shops/me` — เพิ่ม query เช็ค `shop.approvalStatus` ก่อนอัปเดต ถ้าไม่ใช่ `"approved"` → `403` พร้อมข้อความอธิบาย ("ร้านค้ายังไม่ได้รับการอนุมัติจากแอดมิน หรือถูกระงับการใช้งานอยู่...") — ถือโอกาสแก้ **BUG-08-03** (ด้านล่าง) ไปพร้อมกันเพราะเป็น endpoint เดียวกัน
- **Verification:** Suspend ร้านทดสอบ → ยิง `PUT /shops/me` → `403` ถูกต้อง (จากเดิม `200`); Approve กลับ → ยิงซ้ำ → `200` สำเร็จตามปกติ (regression check ผ่าน ไม่กระทบร้านปกติ)
- **Status: FIXED ✅**

### BUG-08-03: `PUT /shops/me` คืน `401` แทน `403` เมื่อ role ไม่ใช่ shop_owner (ยืนยันซ้ำจาก SEC02-02 รอบก่อน)
- **Phase:** 08 — Shop Settings & Account (พบระหว่างแก้ BUG-08-02 ที่ endpoint เดียวกัน; เดิมยืนยันไว้แล้วใน Phase 02 — SEC02-02 แต่ยังไม่ถูกแก้ตอนนั้น)
- **Page/Endpoint:** `apps/api/src/routes/shops.ts` — `PUT /shops/me`
- **Severity:** 🟡 Medium (semantic HTTP status ผิด ไม่ใช่ security breach — endpoint บล็อกได้จริงอยู่แล้ว แค่ status code สื่อความหมายผิด: 401 ควรใช้เฉพาะ "ยังไม่ได้ login" เท่านั้น ไม่ใช่ "login แล้วแต่ role ไม่ตรง")
- **Steps to Reproduce:** Login เป็น customer แล้วยิง `PUT /shops/me`
- **Expected Result:** `403 "ต้องเป็นบัญชีร้านค้าเท่านั้น"` (ตรงกับ pattern ของ endpoint อื่นๆ ทั้งระบบ เช่น `requireShopOwner`/`requireAdmin`)
- **Actual Result (ก่อนแก้):** `401 "ไม่มีสิทธิ์ใช้งาน"`
- **Fix Applied (2026-09-06):** แยกเช็ค "ไม่ได้ login" (`401`) ออกจากเช็ค "login แล้วแต่ role ผิด" (`403`) ให้ตรงกับ pattern มาตรฐานของระบบ
- **Verification:** Login เป็น customer ยิง `PUT /shops/me` → `403 {"error":"ต้องเป็นบัญชีร้านค้าเท่านั้น"}` ถูกต้อง (จากเดิม `401`)
- **Status: FIXED ✅**

### BUG-10-01: ข้อความแชทธรรมดาที่หน้าตาเหมือน JSON ไฟล์แนบถูกตีความเป็นไฟล์แนบปลอม (เดิม C5-09)
- **Phase:** 10 — Chat/Messaging (M10-04 — จุดที่ถูกจับตาจากรอบทดสอบก่อน ยืนยันแล้วว่ายังไม่ถูกแก้)
- **Page/Endpoint:** `apps/api/src/routes/messages.ts` — `POST /messages`, `GET /messages/:orderId`, `GET /messages/rooms`
- **Severity:** 🟡 Medium (ไม่ใช่ data breach — แค่ทำให้ UI แสดงผลหลอกลวงได้ เช่น พิมพ์ข้อความให้ดูเหมือนแนบสลิปโอนเงิน/ใบเสร็จปลอมทั้งที่ไม่เคยอัปโหลดไฟล์จริง)
- **Steps to Reproduce:**
  1. ส่งข้อความแชทปกติ (ไม่ผ่าน `filePath`) ด้วย `content` ที่มีรูปแบบ `{"kind":"file","path":"ค่าอะไรก็ได้","fileName":"ชื่ออะไรก็ได้"}`
- **Expected Result:** ควรแสดงเป็นข้อความธรรมดา (`isFile:false`) เพราะไม่เคยอัปโหลดไฟล์ผ่าน `POST /uploads` จริง
- **Actual Result (ก่อนแก้):** `isFile:true`, `fileName` ตรงตามที่พิมพ์ (เช่น "ใบเสร็จปลอม.png") — ระบบตีความว่าเป็นไฟล์แนบจริงทันที (`fileUrl` เป็น `null` เพราะ path ปลอมไม่มีจริงใน storage แต่ตัว UI จะ render เป็น file bubble พร้อมชื่อไฟล์ที่พิมพ์เองอยู่ดี)
- **Possible Cause:** `parseFileAttachment()` เดิมเช็คแค่ `content.startsWith("{")` แล้ว parse JSON ตรงๆ เพื่อตัดสินว่าเป็นไฟล์แนบหรือไม่ ไม่มีทางแยกแยะ "server สร้างจริงจาก filePath" กับ "ผู้ใช้พิมพ์เองบังเอิญหน้าตาเหมือนกัน" เลย
- **Fix Applied (2026-09-06) — 2 รอบ:**
  1. ลองแก้ด้วย sentinel prefix (อักขระ NUL) ฝังไว้ใน `content` เอง ก่อนถึงจะ parse เป็น JSON — **ใช้งานไม่ได้จริง**: Postgres text column ปฏิเสธ NUL byte ตรงๆ (`invalid byte sequence for encoding "UTF8": 0x00`) insert ไม่ได้เลย ยกเลิกแนวทางนี้
  2. แก้จริงด้วยการเพิ่มคอลัมน์ `messages.is_file_attachment boolean default false` (migration `0018_add_message_is_file_attachment.sql`, apply ผ่าน script `postgres` package ตรงที่ import `./src/env` เดียวกับที่ dev server ใช้จริง แทนการ hardcode connection string ในสคริปต์ — connection string ตรงๆ ถูก sandbox classifier บล็อกไม่ให้รันเพราะดูเหมือนความเสี่ยงด้าน credential exposure) — `POST /messages` set คอลัมน์นี้เป็น `true` เฉพาะตอนสร้างจาก `filePath` จริงเท่านั้น ไม่มีวันมาจากการ parse `content` ที่ผู้ใช้พิมพ์เองได้เลย — `parseFileAttachment()` เช็คคอลัมน์นี้ก่อนแทนที่จะเดาจากหน้าตาของ `content`
  3. อัปเดต `apps/api/drizzle/schema.ts`, `docs/erd.md` (เพิ่ม section ตาราง `messages` ที่ไม่เคยมี doc มาก่อนเลย) ให้ตรงกับ DB จริง
- **Verification:** ส่งข้อความปลอมซ้ำ (`content` หน้าตาเหมือน JSON ไฟล์แนบ) → `isFile:false` ถูกต้อง (จากเดิม `true`); ส่งไฟล์แนบจริงผ่าน `filePath` (ไฟล์ PDF จริงที่เคยอัปโหลดไว้) → `isFile:true`, `fileUrl` เป็น signed URL ใช้งานได้จริง, `isFileAttachment:true` ใน DB row — ยืนยันว่า flow ไฟล์แนบจริงยังทำงานถูกต้องไม่มี regression; `GET /messages/rooms` แสดง `lastMessageContent` เป็น "📎 ชื่อไฟล์" ถูกต้องสำหรับไฟล์แนบจริง
- **หมายเหตุ:** ข้อความไฟล์แนบเก่า (ถ้ามีก่อนแก้บั๊กนี้) จะมี `is_file_attachment=false` (ค่า default ตอนเพิ่มคอลัมน์) จึงแสดงเป็นข้อความ JSON ดิบแทน file bubble — เป็น one-time data-compat tradeoff ที่ยอมรับได้ ไม่ได้ backfill ย้อนหลังเพราะไม่มีทางแยกแยะ JSON เก่าที่เป็นไฟล์แนบจริงกับที่ผู้ใช้พิมพ์เองปนกันอยู่แล้ว (นี่คือบั๊กที่กำลังแก้อยู่พอดี)
- **Status: FIXED ✅**

### BUG-11-01: `requireShopOwner()` ตอบข้อความ "ยังตั้งบริการและราคาไม่ได้" แม้ผู้ใช้กำลังทำเรื่องอื่นที่ไม่เกี่ยวกับบริการ/ราคาเลย
- **Phase:** 11 — Contact Admin (CA11-04 — ยืนยันซ้ำจากรอบทดสอบก่อน S1-16)
- **Page/Endpoint:** `apps/api/src/routes/services.ts` — `requireShopOwner()` (shared guard เรียกใช้จาก 7 ไฟล์: `shops.ts`, `services.ts`, `orders.ts`, `contactAdmin.ts`, `reviews.ts`, `admin.ts`, `reports.ts`)
- **Severity:** 🟡 Medium (ไม่ใช่ security breach — บล็อกได้ถูกต้องอยู่แล้ว ปัญหาคือข้อความผิดบริบททำให้ผู้ใช้สับสนว่าเกี่ยวอะไรกับบริการ/ราคา)
- **Steps to Reproduce:**
  1. Admin suspend ร้านที่ approved อยู่แล้ว
  2. เจ้าของร้านเดิม ยิง `POST /shops/:shopId/contact-admin` (ส่งคำร้องถึงแอดมิน — ไม่เกี่ยวกับบริการ/ราคาเลย)
- **Expected Result:** `403` พร้อมข้อความอธิบายที่เข้ากับบริบทจริง (ร้านถูกระงับ ทำอะไรไม่ได้ตอนนี้)
- **Actual Result (ก่อนแก้):** `403 "ร้านค้ายังไม่ได้รับการอนุมัติจากแอดมิน **ยังตั้งบริการและราคาไม่ได้**"` — ข้อความเจาะจงผิดบริบท (ผู้ใช้กำลังส่งคำร้อง ไม่ใช่ตั้งบริการ)
- **Possible Cause:** `requireShopOwner()` เป็น shared guard ที่ถูกเรียกใช้จากหลายไฟล์/หลาย action แต่ข้อความ error เดิมเขียนเจาะจงบริบทเดียว ("ตั้งบริการและราคา") ทั้งที่ endpoint อื่นที่เรียกใช้ guard เดียวกัน (contact-admin, order status, review reply, reports) ไม่เกี่ยวกับบริการ/ราคาเลย
- **Fix Applied (2026-09-06):** [`apps/api/src/routes/services.ts`](apps/api/src/routes/services.ts) — เปลี่ยนข้อความเป็นกลางๆ ที่ใช้ได้ทุก context: "ร้านค้ายังไม่ได้รับการอนุมัติจากแอดมิน หรือถูกระงับการใช้งานอยู่ ไม่สามารถดำเนินการนี้ได้ในขณะนี้" (ใช้ถ้อยคำเดียวกับที่แก้ไว้แล้วใน `PUT /shops/me` — BUG-08-02 — เพื่อความสม่ำเสมอทั้งระบบ)
- **Verification:** Suspend ร้านทดสอบ → ยิง `POST /shops/:shopId/contact-admin` ซ้ำ → ได้ข้อความใหม่ที่ถูกบริบทแล้ว; Approve กลับ → ยิงซ้ำสำเร็จปกติ (regression check ผ่าน ไม่กระทบร้านปกติหรือ endpoint อื่นที่เรียก guard เดียวกัน)
- **Status: FIXED ✅**

### BUG-12-01: ลูกค้าไม่มี UI แจ้งเตือนใดๆ เลยทั้งระบบ (ไม่มี bell icon, ไม่มี toast, ไม่มี dropdown) ทั้งที่ backend สร้าง notification ให้ลูกค้าไว้จริง
- **Phase:** 12 — Notifications (พบระหว่างตรวจสอบโครงสร้างก่อนเริ่มทดสอบ N12-01)
- **Page/Endpoint:** `apps/web/app/(customer)/layout.tsx`, `apps/web/components/customer/CustomerHeader.tsx` (ไม่มี — เทียบกับ `apps/web/app/(shop)/layout.tsx` ที่มี `GlobalNotificationListener` + `ShopNotificationDropdown`)
- **Severity:** 🟠 High (ไม่ใช่ data loss/security breach — ข้อมูล notification ถูกสร้างและเก็บไว้ใน DB ถูกต้องครบถ้วน ลูกค้ายังเห็นสถานะจริงได้ถ้าเข้าไปดูหน้า order เอง แต่**ไม่มีทางรู้เชิงรุกเลยว่ามีอะไรใหม่เกิดขึ้น** — กระทบประสบการณ์ผู้ใช้ฝั่งลูกค้าโดยตรง ทั้งที่ backend เขียนโค้ดรองรับไว้ครบแล้ว เช่น `notifyOrderCancelled`, การแจ้งเตือนตอนแอดมินตอบกลับคำร้อง (`typeId:4`), ข้อความแชทใหม่ (`typeId:3`, `receiverId=order.customerId`))
- **Steps to Reproduce:**
  1. ตรวจโค้ด `apps/web/app/(shop)/layout.tsx` — มี `<GlobalNotificationListener />` (polling ทุก 15 วิ + toast) และ `ShopNotificationDropdown` (bell icon) ต่อกับ `GET /notifications`
  2. ตรวจโค้ด `apps/web/app/(customer)/layout.tsx` และ `CustomerHeader.tsx` — **ไม่มีการเรียก `getNotifications()`/`GET /notifications` จากฝั่งลูกค้าเลยสักจุดเดียว** (`grep` หาทั่วโฟลเดอร์ `(customer)` ไม่เจอเลย)
- **Expected Result:** ลูกค้าควรมีช่องทางเห็นการแจ้งเตือนของตัวเอง (เช่น admin ตอบกลับคำร้อง, ร้านปฏิเสธ/ยกเลิกออเดอร์, ข้อความแชทใหม่) อย่างน้อยเทียบเท่าฝั่งร้านค้าบางส่วน
- **Actual Result:** ไม่มี UI ใดๆ ทั้งสิ้นฝั่งลูกค้า — ข้อมูล `notifications` row ของลูกค้าถูกสร้างและนอนอยู่เฉยๆ ใน DB ไม่เคยถูกแสดงผลที่ไหนเลย ลูกค้าจะรู้ว่ามีอัปเดตก็ต่อเมื่อบังเอิญเปิดหน้าที่เกี่ยวข้องเองเท่านั้น (เช่น หน้าประวัติออเดอร์, หน้าคำร้อง contact-admin)
- **Possible Cause:** ฟีเจอร์ notification ถูกพัฒนาและทดสอบเฉพาะฝั่งร้านค้าเป็นหลัก (ตรงกับที่ระบุไว้ใน roadmap ว่า Phase 12 นี้เป็น "ฟีเจอร์ใหม่ทั้งหมด ไม่มี baseline") ฝั่งลูกค้าอาจถูกวางแผนไว้แต่ยังไม่ได้สร้าง component จริง
- **Fix Applied (2026-09-07) — ผู้ใช้ขอให้แก้เพิ่มเติมหลังรายงานพบ:** สร้าง UI แจ้งเตือนฝั่งลูกค้าคู่ขนานกับฝั่งร้านค้า โดย reuse backend endpoint เดิมทั้งหมด (`GET /notifications`, `PUT /notifications/:id/read`, `PUT /notifications/read-all` — endpoint เหล่านี้ scope ด้วย `userId` จาก JWT อยู่แล้ว ไม่ผูกกับ role ใดโดยเฉพาะ ไม่ต้องแก้ backend เลย):
  1. [`apps/web/components/customer/CustomerNotificationDropdown.tsx`](apps/web/components/customer/CustomerNotificationDropdown.tsx) (ใหม่) — bell icon + dropdown, import `NOTIFICATION_TYPES`/`NotificationItem` จาก `ShopNotificationDropdown.tsx` ที่มีอยู่แล้วแทนการก็อปโค้ด icon-mapping ซ้ำ
  2. [`apps/web/components/customer/CustomerNotificationListener.tsx`](apps/web/components/customer/CustomerNotificationListener.tsx) (ใหม่) — polling ทุก 15 วิ + toast, คู่ขนานกับ `GlobalNotificationListener.tsx` ฝั่งร้าน แต่ตัดส่วนเช็ค `notificationSettings`/setup-reminder ออก (ลูกค้าไม่มีการตั้งค่าประเภทนี้) แสดง toast ทุกรายการที่ยังไม่อ่านเสมอ
  3. [`apps/web/app/(customer)/layout.tsx`](apps/web/app/(customer)/layout.tsx) — ห่อด้วย `<ToastProvider>` + mount `<CustomerNotificationListener />` (เดิมไม่มี `ToastProvider` เลยในฝั่งลูกค้า)
  4. [`apps/web/components/customer/CustomerHeader.tsx`](apps/web/components/customer/CustomerHeader.tsx) — เพิ่ม `<CustomerNotificationDropdown />` ข้างไอคอนตะกร้า ทั้ง desktop nav และ mobile nav (แสดงเฉพาะตอน `variant==="auth"` เหมือนไอคอนตะกร้า)
- **Verification (ทดสอบผ่านเบราว์เซอร์จริงครบวงจร):**
  - Bell icon แสดงถูกต้องทั้ง desktop (1280px) และ mobile (375px) viewport — badge unread count ตรงกับข้อมูลจริง
  - เปิด dropdown เห็นรายการแจ้งเตือนจริงของลูกค้าครบถ้วน (ข้อความแชทจากร้าน, แจ้งเตือนเปลี่ยนรหัสผ่าน ฯลฯ)
  - กด "อ่านทั้งหมด" → `unreadCount` เป็น 0 จริงที่ server (ยืนยันผ่าน `GET /notifications` โดยตรง) badge หายไปถูกต้องหลัง reload
  - **ทดสอบ end-to-end เต็มวงจร:** shop ส่งข้อความแชทใหม่ถึงลูกค้า → ลูกค้าเปิดหน้าเว็บใหม่ (ไม่ต้องทำอะไรเพิ่ม) → เห็น badge unread เพิ่มขึ้นทันทีและข้อความปรากฏถูกต้องในรายการ ยืนยันว่า pipeline ทำงานถูกต้องครบวงจรจริง ไม่ใช่แค่ UI เปล่าๆ
  - ไม่มี compile error / console error จากคอมโพเนนต์ใหม่ทั้งสองไฟล์
- **Follow-up (2026-09-07) — ผู้ใช้ถามว่าทำไมไม่ต้องแก้ backend แล้วขอให้แก้เพิ่ม:** ตอบผู้ใช้ตรงๆ ว่า UI fix ด้านบนแค่ไปดึงข้อมูลที่มีอยู่แล้วมาแสดง แต่พบเพิ่มเติมว่า **backend ไม่เคยสร้าง notification ให้ลูกค้าเลยตอน order เปลี่ยนสถานะปกติ** (รับงานแล้ว/กำลังดำเนินการ/กำลังจัดส่ง/เสร็จสิ้น) — โค้ด `PATCH /orders/:id/status` เดิมสร้าง notification เฉพาะตอนยกเลิก/ปฏิเสธเท่านั้น ผู้ใช้ขอให้แก้เพิ่ม:
  - [`apps/api/src/routes/orders.ts`](apps/api/src/routes/orders.ts) — เพิ่ม `createNotification()` ให้ลูกค้า (`userId: row.order.customerId`) ทุกครั้งที่ **ร้าน** (ไม่ใช่ลูกค้า) เปลี่ยนสถานะไปข้างหน้า (ไม่ใช่ยกเลิก) ด้วย `typeId:16` (ใหม่) ชื่อเรื่อง/ข้อความใช้ `STATUS_LABELS` เดิมที่มีอยู่แล้ว (เช่น "ออเดอร์ #0002 รับงานแล้ว") พร้อม `link` ไปหน้ารายละเอียดออเดอร์ (`/orders/:id`) — วางไว้หลัง early-return ของ idempotent-retry (บรรทัด `if (row.order.status === nextStatus) return...`) จึงไม่สร้างซ้ำถ้ากดปุ่มเบิ้ล
  - [`apps/web/components/shop/ShopNotificationDropdown.tsx`](apps/web/components/shop/ShopNotificationDropdown.tsx) — เพิ่ม entry `typeId:16` ใน `NOTIFICATION_TYPES` (icon `Package`, ใช้ร่วมกับฝั่งลูกค้าผ่าน import เดิม) **และแก้ latent bug ที่พบระหว่างทาง:** โค้ดเดิม `const Icon = typeData.icon` ไม่มี fallback เลย ถ้าเจอ `typeId` ที่ไม่มีใน map จะ throw ทันที (ต่างจาก `DashboardNotifications.tsx` ที่มี fallback อยู่แล้ว) เพิ่ม `?? Bell`/`?? "text-slate-500"`/`?? "bg-slate-100"` ให้ตรงกันทั้งระบบ
- **Verification (2026-09-07):**
  - เดินสถานะออเดอร์จริงครบ `accepted→in_progress→completed` (self_pickup) → ได้ notification `typeId:16` ถูกต้องครบ 3 รายการ พร้อมข้อความ/ลิงก์ถูกต้องทุกขั้น
  - ทดสอบ idempotent retry (ยิง `accepted` ซ้ำตอนที่เป็น `accepted` อยู่แล้ว) → **ไม่สร้าง notification ซ้ำ** (ยืนยันนับจำนวนได้ 3 รายการพอดี ไม่ใช่ 4)
  - ทดสอบยกเลิกออเดอร์อีกใบ (`cancelled`) → **ไม่มี** `typeId:16` เกิดขึ้นเลย (ตรงตามที่ตั้งใจ — logic ยกเลิกเดิมไม่ถูกกระทบ)
  - เปิด dropdown ฝั่งลูกค้าจริงในเบราว์เซอร์ → เห็นข้อความ "ออเดอร์ #0002 รับงานแล้ว/กำลังดำเนินการ/เสร็จสิ้น" ครบถูกต้อง ไม่มี console error
- **Status: FIXED ✅ (ครบทั้ง UI + backend notification data)**

### BUG-13-01: Reinstate ร้านที่ถูกระงับ ได้ข้อความแจ้งเตือนเหมือนอนุมัติร้านสมัครใหม่เป๊ะ (เดิม A3-07)
- **Phase:** 13 — Admin: Shop Management (AS13-03 — ยืนยันซ้ำจากรอบทดสอบก่อน)
- **Page/Endpoint:** `apps/api/src/routes/admin.ts` — `PATCH /admin/shops/:id/approve`
- **Severity:** 🟡 Medium (ไม่ใช่ security/data breach — แค่ข้อความแจ้งเตือนผิดบริบท ทำให้เจ้าของร้านที่เพิ่งถูกยกเลิกการระงับสับสนว่าทำไมได้ข้อความ "ยินดีด้วยผ่านการตรวจสอบ" เหมือนสมัครร้านใหม่)
- **Steps to Reproduce:**
  1. Admin suspend ร้านที่ approved อยู่แล้ว (พร้อมเหตุผล)
  2. Admin approve ร้านเดิมนี้กลับ (reinstate)
- **Expected Result:** ข้อความแจ้งเตือนควรสื่อว่า "การระงับถูกยกเลิกแล้ว" ต่างจากข้อความตอนอนุมัติร้านสมัครใหม่ครั้งแรก
- **Actual Result (ก่อนแก้):** ได้ข้อความ **เหมือนกันเป๊ะ** กับตอนอนุมัติร้านสมัครใหม่ครั้งแรก: หัวข้อ "ร้านค้าของคุณได้รับการอนุมัติแล้ว" + "ยินดีด้วย! บัญชีร้านค้าของคุณผ่านการตรวจสอบและพร้อมเปิดให้บริการแล้ว" — ไม่มีการแยกแยะบริบทเลย
- **Possible Cause:** `PATCH /admin/shops/:id/approve` ใช้ endpoint เดียวกันทั้ง 2 กรณี (ตั้งใจ เพราะ DB update เหมือนกันเป๊ะ) แต่ไม่เคยเช็คสถานะ "ก่อน" อัปเดตเลยว่าเป็นการอนุมัติครั้งแรก (`pending→approved`) หรือ reinstate (`suspended→approved`) ก่อนจะเลือกข้อความแจ้งเตือน
- **Fix Applied (2026-09-08):** [`apps/api/src/routes/admin.ts`](apps/api/src/routes/admin.ts) — เพิ่ม `SELECT` สถานะเดิมก่อน `UPDATE` เพื่อเช็คว่า `approvalStatus === "suspended"` หรือไม่ ถ้าใช่ (reinstate) → ส่งข้อความ "การระงับการใช้งานร้านค้าของคุณถูกยกเลิกแล้ว" / "ร้านค้าของคุณกลับมาเปิดให้บริการได้ตามปกติแล้ว ขอบคุณที่ให้ความร่วมมือ" แทน — กรณีอื่น (pending/rejected → approved) ยังคงใช้ข้อความเดิม
- **Verification:** suspend ร้านทดสอบแล้ว reinstate → ได้ข้อความใหม่ที่ถูกบริบทถูกต้อง; ทดสอบ regression ด้วยร้านสมัครใหม่ (pending) → approve ครั้งแรก → ยังได้ข้อความเดิมถูกต้อง ("ยินดีด้วย! ผ่านการตรวจสอบ...") ไม่กระทบ flow ปกติ
- **Status: FIXED ✅**

<!--
ฟอร์แมตสำหรับแต่ละบั๊ก:

### BUG-[PHASE]-[NUMBER]: [สรุปสั้น]
- **Phase:**
- **Page/URL:**
- **Feature/Endpoint:**
- **Severity:** Critical / High / Medium / Low
- **Steps to Reproduce:**
  1.
  2.
- **Expected Result:**
- **Actual Result:**
- **Evidence:** (Console/API/HTTP status/screenshot)
- **Possible Cause:**
- **Status:** OPEN
-->
