# QA_BUG_REPORT.md — บั๊กที่พบ (รอบทดสอบใหม่ทั้งหมด เริ่ม 2026-09-06)

> อัปเดตล่าสุด: 2026-09-06
> ไฟล์นี้จะถูกเติมบั๊กใหม่ทันทีที่เจอระหว่างทดสอบ Phase 01-19 ตาม `QA_TESTING_PROGRESS.md`
> ใช้ฟอร์แมต: Bug ID `BUG-[PHASE]-[NUMBER]` เช่น `BUG-10-01` (Phase 10, บั๊กที่ 1)

---

## 📌 จุดที่ควรเพ่งเล็งเป็นพิเศษ (จากประวัติรอบก่อน 2026-08-25 — ยังไม่ยืนยันซ้ำในรอบนี้)

รายละเอียดเต็มอยู่ที่ [docs/qa/test-plan.md](docs/qa/test-plan.md) — สรุปย่อเป็น "จุดต้องสงสัย" ที่จะตรวจซ้ำตาม test case ที่เกี่ยวข้องใน `QA_TEST_CASES.md`:

| จุดต้องสงสัย | Phase ในรอบนี้ | Test case ที่จะยืนยัน |
|---|---|---|
| `DELETE /auth/me` (shop owner มีร้านผูกอยู่) อาจได้ 500 | Phase 08 | SS08-04 |
| ข้อความแชทรูปแบบ JSON ถูกตีความเป็นไฟล์แนบปลอม (โค้ดปัจจุบันยังมี logic เดิม) | Phase 10 | M10-04 |
| ไม่มี cron เรียก auto-delete cleanup endpoint | Phase 15 | ST15-06 |
| `PUT /shops/me` คืน 401 แทน 403 เมื่อ role ผิด | Phase 02 | SEC02-02 |
| Unauthenticated upload (`shop-photo`/`id-card`) — เป็นการตัดสินใจเชิงนโยบายที่ยอมรับแล้ว | Phase 15 | ST15-01 |
| ร้าน pending/suspended contact-admin ไม่ได้ + error message ผิดบริบท | Phase 11 | CA11-04 |
| ไฟล์แนบแชทมองไม่เห็นใน admin storage dashboard | Phase 15 | ST15-05 |
| Order เก่า `finishedAt` เป็น NULL | Phase 15 | ST15-08 |
| Reply overwrite ไม่มี audit trail (review + contact-admin) | Phase 09, 11 | R09-04, CA11-05 |
| ร้าน suspended ยังแก้ `PUT /shops/me` ได้ (ไม่ถูกบล็อกเหมือน endpoint อื่น) | Phase 17 | E17-03 |

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
- **Status: OPEN**

### BUG-02-02: ส่ง `:id` ที่ไม่ใช่ UUID เข้า `/addresses/:id` ทำให้ได้ raw `500` แทน `400`
- **Phase:** 02 — Security & Permission Matrix (พบระหว่างทดสอบ SEC02-07)
- **Page/Endpoint:** `apps/api/src/routes/addresses.ts` — `PUT /:id` (น่าจะกระทบ `DELETE`/`PATCH .../default` ด้วยเช่นกันเพราะ pattern เดียวกัน)
- **Severity:** 🟡 Medium (raw error รั่วเล็กน้อย + DX ไม่ดี ไม่ใช่ security breach)
- **Steps to Reproduce:** ยิง `PUT /addresses/not-a-uuid` ด้วย body ที่ valid
- **Expected Result:** `400` พร้อมข้อความ "รูปแบบ id ไม่ถูกต้อง" หรือ `404`
- **Actual Result:** `500 {"error":"เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง"}` — Postgres reject ค่าที่ไม่ใช่ UUID ก่อนถึง WHERE clause แล้วโยน error ที่ไม่ถูกจับ
- **Possible Cause:** ไม่มีการ validate รูปแบบ UUID ของ `params.id` ก่อนส่งเข้า query — เป็น pattern เดียวกับที่เคยพบใน `POST /uploads` body ว่าง (SEC9-05c รอบก่อน) คือ error ที่ควรเป็น `400` หลุดไปเป็น `500` แทน
- **Status: OPEN**

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
