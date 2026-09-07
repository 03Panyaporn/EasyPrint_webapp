# QA_TEST_CASES.md — Test Cases และผลการทดสอบ (แผนใหม่ทั้งหมด เริ่ม 2026-09-06)

> ทุก Phase ในไฟล์นี้ยังไม่มีผลทดสอบ (NOT TESTED) — จะกรอกผลจริงทีละแถวขณะทดสอบตามลำดับใน `QA_TESTING_PROGRESS.md`
> อ้างอิงบั๊กที่เคยพบในรอบก่อน (2026-08-25) ดูได้ที่ [docs/qa/test-plan.md](docs/qa/test-plan.md) — ใช้เป็น "จุดที่ควรเพ่งเล็งเป็นพิเศษ" เท่านั้น ไม่ใช่ผลที่เชื่อได้ทันที

สถานะที่ใช้ได้: `PASS` / `FAIL` / `BLOCKED` / `NOT TESTED`

---

## Phase 01: Authentication & Session

**หน้า:** `(auth)/login`, `(auth)/register`, `(auth)/register/shop-register`, `(auth)/forgot-password`, `(auth)/reset-password`
**API:** `POST /auth/login`, `/auth/register`, `/auth/register-shop`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`, `GET /auth/me`

| ID | ประเภท | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail |
|---|---|---|---|---|---|
| A01-01 | Positive | สมัครบัญชีลูกค้าใหม่ด้วยข้อมูลถูกต้องครบ (`qa2.customer1@example.com`) | สมัครสำเร็จ, login อัตโนมัติ/redirect ไป dashboard ลูกค้า | เจอบั๊ก **BUG-01-01** (ไม่ redirect) → แก้แล้ว (`router.push`→`router.replace`) → retest ด้วยบัญชีใหม่ `qa2.customer2@example.com` ผ่าน UI จริง: redirect ไปหน้า "ติดตามคำสั่งซื้อ" ทันที | **PASS** ✅ (หลังแก้ไข) |
| A01-02 | Positive | สมัครร้านค้าใหม่ (shop-register) ครบทุก field ผ่าน API โดยตรง (`qa2.shop1@example.com`, upload id-card+shop-photo synthetic ก่อน) | สมัครสำเร็จ, สถานะ `pending` รอ admin อนุมัติ | `200`, shop ถูกสร้างจริง `approvalStatus:"pending"` ครบทุก field ถูกต้อง (หมายเหตุ: ทดสอบผ่าน API เพราะฟอร์ม UI ซับซ้อนมาก มี 2 file upload ที่เครื่องมือทดสอบไม่รองรับการเลือกไฟล์จริงจาก OS) | **PASS** |
| A01-03 | Negative | สมัครด้วยอีเมลที่มีอยู่แล้ว (ผ่าน UI จริง) | reject 409 + error message ชัดเจน | UI แสดง "อีเมลนี้ถูกใช้งานแล้ว" ทันที | **PASS** |
| A01-04 | Negative | สมัครด้วยรหัสผ่านสั้นกว่าเกณฑ์ (ผ่าน API ตรง ข้าม client validation) | reject 400 | `400`, field error `"รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"` ถูกต้อง | **PASS** |
| A01-05 | Boundary | ตัวเลือก enum ผิด (`serviceTypes`/`deliveryMethods` เป็นค่าภาษาอังกฤษแทน Thai enum) | reject 400 | `400` พร้อม error ระบุ enum ที่ถูกต้องชัดเจน (พบระหว่างทดสอบ A01-02) | **PASS** |
| A01-06 | Positive | Login ด้วย credential ที่เพิ่งสมัคร (customer) | redirect ไปหน้าหลักลูกค้า | Login สำเร็จ, redirect ไปหน้า marketplace ของลูกค้าถูกต้อง | **PASS** |
| A01-07 | Negative | Login ด้วยรหัสผ่านผิด | reject 401 พร้อม error message ทั่วไป (ไม่บอกว่าอีเมลมีอยู่ไหม — ดี้ด้าน security) | `401 {"error":"อีเมลหรือรหัสผ่านไม่ถูกต้อง"}` | **PASS** |
| A01-08 | Negative | Login ด้วยบัญชีร้านค้าที่ยัง `pending` แล้วเข้า dashboard | Login ควรผ่าน (ตามดีไซน์ปัจจุบัน) แต่ UI ควรแจ้งสถานะ pending ชัดเจน | Login ผ่าน (`200`) แต่ dashboard ไม่มีข้อความแจ้ง "รอ Admin อนุมัติ" เลย มีแค่แจ้งเตือนเรื่องยังไม่ตั้งเวลาเปิด-ปิดร้าน (ไม่เกี่ยวกับ pending) — บันทึกเป็นข้อสังเกต UX gap ไม่ถึงขั้นเปิดเป็นบั๊กแยก (เชื่อมกับ S1-16 เดิม) | **PASS (login) / ⚠️ UX gap** |
| A01-09 | Positive | Logout แล้วพยายามเข้าหน้า protected (`/shop`) ซ้ำ (ทั้ง client-nav และ hard refresh) | redirect กลับ login | เจอบั๊ก **BUG-01-02** (ไม่ redirect) → แก้แล้ว (เพิ่ม `useRequireRole` guard) → retest: logout แล้วเปิด `/shop` (hard refresh) → redirect ไป `/login` ทันที | **PASS** ✅ (หลังแก้ไข) |
| A01-10 | Positive | Forgot password → reset → login ด้วยรหัสใหม่ | ครบ flow | ปลดบล็อกได้: dev fallback พิมพ์ reset link ลง API server console (`RESEND_API_KEY` ไม่ได้ตั้งค่า) → คว้า token จาก log → เปิด `/reset-password?token=...` → ตั้งรหัสผ่านใหม่สำเร็จ ("ตั้งรหัสผ่านใหม่สำเร็จ") → login ด้วยรหัสใหม่ (`qa2.customer2@example.com`/`NewQaTest#2026`) → `200 OK` สำเร็จ | **PASS** |
| A01-11 | Negative | Reset password ด้วย token ใช้ซ้ำ (used token) | reject | ยิง `POST /auth/reset-password` ซ้ำด้วย token เดิมที่เพิ่งใช้ไปใน A01-10 → `400 {"error":"ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว"}` ถูกต้อง | **PASS** |
| A01-12 | Edge | Refresh หน้า login ที่ login ค้างไว้แล้ว (มี cookie ถูกต้อง) | redirect ไป dashboard อัตโนมัติ (หรืออย่างน้อยไม่ error) | Login อยู่แล้วเปิด `/login` ซ้ำ → ยังแสดงฟอร์ม login ปกติ ไม่ auto-redirect แต่ก็ไม่ error/ไม่พัง — เป็นทางเลือกการออกแบบที่ยอมรับได้ ไม่ถือเป็นบั๊ก | **PASS** (ไม่มี auto-redirect แต่ไม่ error — ระบุเป็นข้อสังเกต UX เล็กน้อย ไม่ใช่บั๊ก) |
| A01-13 | Security | Customer เข้าหน้า `/admin` ตรงๆ ผ่าน URL | redirect/บล็อกฝั่ง frontend + API 403 | เจอบั๊ก **BUG-01-02** (ไม่มี route guard) → แก้แล้ว → retest: login เป็น customer เปิด `/admin` → redirect ไป `/Dashboard` (หน้าแรกของ customer) ทันที ไม่เห็น admin shell เลย | **PASS** ✅ (หลังแก้ไข) |
| A01-14 | Repeated | กด submit login/register ซ้ำหลายครั้งเร็วๆ (double click) | ไม่สร้าง duplicate request/บัญชีซ้ำ | ตรวจจากโค้ด: มี guard `if (!isFormValid \|\| isSubmitting) return;` ใน `register/page.tsx` ป้องกันซ้อนอยู่แล้ว (ไม่ได้ทดสอบ double-click จริงเพราะ code review เพียงพอสำหรับเคสนี้) | **PASS (โดยอนุมานจากโค้ด)** |

---

## Phase 02: Security & Permission Matrix (Bootstrap)

**เป้าหมาย:** ยิงทุก endpoint สำคัญด้วย token ผิด role / ไม่มี token / ownership ผิดคน ก่อนเริ่มเทสฟีเจอร์อื่น

**สถานะ: ✅ เสร็จสมบูรณ์ (2026-09-06)** — บัญชีที่ใช้: `qa2.customer1@example.com`/`qa2.customer2@example.com` (customer), `qa2.shop1@example.com` (shop_owner, pending), `test-admin@easyprint.test` (admin — reset รหัสผ่านผ่าน dev forgot-password fallback เป็น `QaAdmin#2026`; มี admin จริงอีกบัญชี `shop01.john@gmail.com` แต่ไม่แตะเพราะเป็นบัญชีทีมจริง) ใช้ shops/orders/messages/reviews ที่มีอยู่แล้วในระบบจากรอบทดสอบก่อนหน้าสำหรับเช็ค cross-account โดยไม่ต้องสร้างข้อมูลใหม่

| ID | Endpoint กลุ่ม | สถานการณ์ | ผลที่คาดหวัง | ผลจริง | Pass/Fail |
|---|---|---|---|---|---|
| SEC02-01 | `/admin/*` ทั้งหมด | ยิงด้วย token customer/shop/ไม่มี token | 403/401 ทุกตัว | no-token→`401`, customer→`403`, shop→`403`, admin เอง→`200` ครบทุก endpoint (`/admin/settings`, `/admin/shops`, `/admin/shops/:id/suspend`) | **PASS** |
| SEC02-02 | `PUT /shops/me`, `/shops/:id/services*` | ยิงด้วย token customer/admin | 403 | `POST services`→`403` ถูกต้อง; `PUT /shops/me`→`401` (ควรเป็น `403` — บั๊กเดิม SEC9-01b จากรอบก่อนยังไม่ถูกแก้ ยืนยันซ้ำว่ายังอยู่) | **PASS (บล็อกได้จริง) / บั๊ก status code เดิมยังไม่แก้** |
| SEC02-03 | `/orders/:id`, `/shops/:shopId/orders` | ownership ข้ามบัญชี (customer ที่ไม่เกี่ยวข้องยิงเข้า order/ร้านคนอื่น) | 403 | ทั้ง `GET /orders/:id` และ `GET /shops/:shopId/orders` คืน `403` ถูกต้อง | **PASS** |
| SEC02-04 | `/messages/*` | ownership ข้ามบัญชี (GET/POST/PATCH read เข้า order คนอื่น) | 403 ทุกกรณี | ทั้ง 3 endpoint คืน `403` ถูกต้อง รวมพยายามส่งข้อความปลอมเข้า order คนอื่นก็ถูกบล็อก | **PASS** |
| SEC02-05 | `/reviews/:id` delete/reply | ข้ามบัญชี/role ผิด | 403 | `DELETE /reviews/:id` ของคนอื่น→`403`, `PATCH /shops/:otherShopId/reviews/:id/reply`→`403` | **PASS** |
| SEC02-06 | `/shops/:shopId/contact-admin`, `/users/contact-admin` | ข้ามบัญชี/role ผิด | 403 | customer ยิง `POST/GET /shops/:shopId/contact-admin` (endpoint ของร้าน)→`403` ทั้งคู่ | **PASS** |
| SEC02-07 | `/addresses/*` | customerA แก้/ลบ/ตั้ง default address ของ customerB | 403/404 ทุกตัว | เจอบั๊ก **BUG-02-01** (`PATCH .../default`/`DELETE` คืน `200` ปลอมข้ามบัญชี) + **BUG-02-02** (garbage id → `500`) → **แก้ทั้งคู่แล้ว** → retest: `DELETE`/`PATCH .../default` ข้ามบัญชี → `404` ทั้งคู่ (จากเดิม `200`); garbage id (`/addresses/not-a-uuid`) → `400` ทั้ง 3 endpoint (จากเดิม `500`); regression check: self-operation ปกติ (สร้าง/ตั้ง default/ลบ address ของตัวเอง) ยังทำงานถูกต้องครบ ไม่กระทบ | **PASS** ✅ (หลังแก้ไข) |
| SEC02-08 | `/uploads` ทุก type × role (no-auth/customer/shop/admin) | ตรงตาม policy ปัจจุบันในโค้ด (shop-photo/id-card เปิดสาธารณะโดยตั้งใจ, order-file อนุญาต customer+shop, payment-slip เฉพาะ customer, contact-admin-attachment อนุญาต shop/customer/admin, system-logo เฉพาะ admin) | ตรงตาม policy ทุก combination ที่ทดสอบ (12 เคส) | **PASS** |
| SEC02-09 | `/internal/cleanup/*` | ไม่มี/ผิด secret header | 401 | ไม่มี header→`401`, secret ผิด→`401` | **PASS** |
| SEC02-10 | Signed URL (id-card) | ตรวจ TTL จริงจาก token + tamper token | TTL=600s (10 นาที), tamper→ถูกปฏิเสธ | `exp-iat=600s` ตรงสเปกเป๊ะ, valid token→`200` (โหลดรูปได้จริง), tampered token→`400` ถูก Supabase ปฏิเสธทันที | **PASS** |

**สรุป Phase 02:** **10/10 PASS ✅** (หลังแก้ไข BUG-02-01/02-02 แล้ว) — นับ SEC02-02 เป็น PASS เพราะบล็อกได้จริง แค่ status code ผิดความหมาย (บั๊กเดิมจากรอบก่อน ยังไม่ถูกแก้ตามคำขอผู้ใช้รอบนี้) **ยืนยันว่า authorization/ownership check ของระบบแน่นหนามาก ไม่พบช่องโหว่ data breach ใดๆ ในรอบนี้**

---

## Phase 03: Customer Account & Profile

**หน้า:** `(customer)/profile`, `(customer)/change-password`
**API:** `GET/PUT /auth/me`, `POST /auth/change-password`, `PUT /auth/change-email`, `/addresses/*`, `DELETE /auth/me`

**สถานะ: ✅ เสร็จสมบูรณ์ (2026-09-06)** — ใช้ `qa2.customer1@example.com`, `qa2.customer2@example.com` และบัญชีทิ้งขว้าง `qa2.deleteme@example.com` (สมัคร→ลบทันทีเพื่อทดสอบ C03-06)

| ID | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail |
|---|---|---|---|---|
| C03-01 | แก้ชื่อ/นามสกุล/เบอร์ผ่าน `PUT /auth/me` (endpoint ใหม่) ทั้งผ่าน API ตรงและผ่าน UI จริง (`/profile` → กดแก้ไข → บันทึก) | บันทึกสำเร็จ | API: `200` ข้อมูลอัปเดตถูกต้อง; UI: กด edit → แก้เบอร์โทร → บันทึก → หน้าอัปเดตค่าใหม่ทันทีไม่ต้อง reload | **PASS** |
| C03-02 | เปลี่ยนรหัสผ่าน: ผิด current password / รหัสใหม่ซ้ำเดิม / ถูกต้อง แล้ว login ด้วยรหัสใหม่ | ตามเงื่อนไข | ผิด current→`400 "รหัสผ่านปัจจุบันไม่ถูกต้อง"`; ซ้ำเดิม→`400 "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน"`; ถูกต้อง→`200`; login ด้วยรหัสใหม่→`200` สำเร็จ | **PASS** |
| C03-03 | เปลี่ยนอีเมลเป็นอีเมลที่มีอยู่แล้ว (ของ customer1) | reject 409 | `409 {"error":"อีเมลนี้ถูกใช้งานแล้ว"}` | **PASS** |
| C03-04 | เพิ่ม/แก้ที่อยู่จัดส่ง (แก้ label ที่มีอยู่) + boundary (receiverName ว่างเปล่า) | สำเร็จ / reject 400 | แก้ label สำเร็จ `200`; ส่ง `receiverName:""` → `400` field error ชัดเจน (CRUD ส่วนที่เหลือ — ลบ/ตั้ง default ข้ามบัญชี — ทดสอบครบแล้วใน Phase 02 SEC02-07) | **PASS** |
| C03-05 | ลบที่อยู่ที่กำลังถูกใช้เป็น default ที่อยู่เดียว (ที่อยู่เดียวในระบบ) | ไม่ error, `GET /addresses` คืนค่าว่างเปล่าถูกต้อง | ลบสำเร็จ `200`, `GET /addresses` คืน `[]` ไม่มี error/side-effect ผิดปกติ | **PASS** |
| C03-06 | ลบบัญชีลูกค้าที่ไม่มี order ผูก (ทดสอบด้วยบัญชีทิ้งขว้างที่เพิ่งสมัคร) + กรอกรหัสผ่านผิดก่อน | รหัสผิด→reject 400; ถูกต้อง→ลบสำเร็จไม่ error 500 | รหัสผิด→`400 "รหัสผ่านปัจจุบันไม่ถูกต้อง"`; ถูกต้อง→`200 {"ok":true}`; login ซ้ำหลังลบ→`401` ยืนยันบัญชีหายจริง (**หมายเหตุ:** เคส "ลูกค้าที่มี order ผูกอยู่" ยังไม่ได้ทดสอบ เพราะยังไม่มี order จริงผูกกับบัญชีทดสอบใดๆ — ต้องรอ Phase 05 สร้าง order ก่อนแล้วค่อยกลับมาทดสอบเคสนี้) | **PASS (เคสไม่มี order)** / ⏳ เคส "มี order ผูก" รอ Phase 05 |

---

## Phase 04: Shop Discovery & Browsing (Public)

**หน้า:** `shops/[shopId]`, `shops/[shopId]/order/[serviceId]`
**API:** `GET /shops` (list), `GET /shops/:shopId`, `GET /shops/:shopId/services`, `GET /shops/:shopId/reviews`

**สถานะ: ✅ เสร็จสมบูรณ์ (2026-09-06)** — ทดสอบทั้ง API ตรงและผ่าน UI จริงในเบราว์เซอร์ (guest, ไม่ login)

| ID | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail |
|---|---|---|---|---|
| D04-01 | ดูรายชื่อร้านค้าสาธารณะ (ไม่ login) | เห็นเฉพาะร้าน `approved` | `GET /shops` (ไม่มี cookie) คืนเฉพาะ 5 ร้านที่ approved จริง (Test Shop, SE Printer, ร้าน EasyPrint, Johan Printer, TONFAH PRINTER) — กรอง pending (QA Test Print Shop, Plaifon Printer) และ rejected (ร้านถ่ายเอกสารปลายฝนจ้า) ออกถูกต้อง ยืนยันซ้ำผ่าน UI marketplace หน้าแรกด้วย | **PASS** |
| D04-02 | ค้นหาร้านค้าด้วยชื่อ (ทั้งกด Enter และกดปุ่ม "ค้นหา") | กรองถูกต้อง | ค้นหา "Test"→เหลือ "Test Shop", "Johan"→เหลือ "Johan Printer" ถูกต้อง (ทดสอบซ้ำ 3 ครั้งสำเร็จทั้งหมด); **หมายเหตุ:** เจอ 1 ครั้งที่หน้าค้าง "กำลังโหลดร้านค้า..." ตลอดไปหลังค้นหา "Johan" แต่ reproduce ซ้ำไม่ได้อีกเลยหลังทดสอบซ้ำหลายรอบ — บันทึกเป็นข้อสังเกต (ไม่ยืนยันเป็นบั๊ก) ไม่ใช่ confirmed bug | **PASS** (มีข้อสังเกต flaky 1 ครั้ง ไม่ reproduce ซ้ำ) |
| D04-03 | เปิดหน้าร้านที่ `pending`/`rejected` โดยตรงผ่าน URL/API | ไม่ควรเข้าถึงได้ (404) | เจอบั๊ก **BUG-04-01 (Critical)** (guest ถูก redirect ไป login แม้ร้าน approved ปกติ) → **แก้แล้ว** → retest: guest เปิดร้าน approved (Johan Printer) → เห็นหน้าร้านเต็มรูปแบบทันที ไม่ redirect; เปิดร้าน pending → แสดง "ไม่พบร้านค้านี้" + ปุ่ม "กลับหน้าแรก" สวยงาม | **PASS** ✅ (หลังแก้ไข) |
| D04-04 | เปิดหน้าบริการ (service order page) ดูตัวเลือก/ราคาแบบ real-time หลายชนิด pricing model | คำนวณราคาถูกต้อง | ทดสอบ per_page service (Johan Printer, "ปริ้นเอกสาร A4/A3") จริงในเบราว์เซอร์: อัปโหลดไฟล์ PDF 1 หน้า → เลือก "สี" (+5) → รวม `฿5` ถูกต้อง; เพิ่มเลือก "A3" (+2) → รวม `฿7` ถูกต้อง (5+2) — คำนวณแม่นยำทุก combo; **ข้อสังเกตเล็กน้อย:** label "ราคาพื้นฐาน" แสดง฿1 (ราคาต่ำสุดของบริการ) ตายตัวไม่อัปเดตตามตัวเลือกที่เลือก แต่ยอดรวมจริงที่ใช้คิดเงิน (เพิ่มลงตะกร้า) ถูกต้องเสมอ — เป็นแค่ label สับสนเล็กน้อย ไม่กระทบเงินจริง | **PASS** (มี UX label เล็กน้อยที่ควรปรับ) |
| D04-05 | เปิดหน้าร้าน/บริการที่ไม่มีอยู่จริง (valid UUID แต่ไม่มีในระบบ / id รูปแบบผิด) | 404 สวยงาม ไม่ crash | valid-แต่ไม่มีจริง → `404` ถูกต้องอยู่แล้ว; เจอบั๊ก **BUG-04-02** (id รูปแบบผิด → `500`) → แก้แล้ว (ย้ายไป shared utility `apps/api/src/utils/validation.ts`) → retest: `/shops/not-a-uuid` → `404` ถูกต้อง (จากเดิม `500`) | **PASS** ✅ (หลังแก้ไข) |

**พบเพิ่มเติม (ไม่ใช่บั๊ก แต่เป็นข้อสังเกตเชิงนโยบายที่ควรแจ้งทีม):** `GET /shops/:id` (public, ไม่ต้อง login) คืนข้อมูลบัญชีธนาคาร/PromptPay ของร้าน (`bankAccountName`, `bankAccountNumber`, `bankName`, `promptpayNumber`) ให้ใครก็ได้ดูโดยไม่ต้อง login หรือมีความสัมพันธ์กับร้านเลย — อาจตั้งใจให้ลูกค้าเห็นก่อนโอนเงิน แต่ก็เป็นความเสี่ยงที่คนนอกสามารถดึงเลขบัญชีจริงของร้านไปใช้แอบอ้าง/หลอกลวงได้ ควรให้ทีมตัดสินใจเชิงนโยบายว่ายอมรับความเสี่ยงนี้หรือไม่

---

## Phase 05: Cart & Checkout

**หน้า:** `(customer)/cart`, `(customer)/cart/check-out`
**API:** `GET /carts`, `GET/POST/PATCH/DELETE /shops/:shopId/cart*`, `/cart/items/:id`

### ส่วนที่ 0: Pricing Engine Audit (ตามคำขอผู้ใช้ — ตรวจสอบก่อนเริ่มทดสอบ Cart/Checkout ปกติ)

**สถานะ: ✅ เสร็จสมบูรณ์ (2026-09-06)** — อ่านโค้ด `packages/shared/src/pricing/engine.ts` ทั้งหมด + ตรวจข้อมูลราคาจริงในระบบ (colorTiers/quantityTiers/options ของทุกบริการที่มีอยู่)

**ภาพรวม:** engine ออกแบบมาดีมาก — แยก "หน้าจริง" (สำหรับคิดค่าหมึก/สี, ใช้ `rawPageCount` เสมอ) ออกจาก "แผ่นที่คิดเงิน" (สำหรับคิดค่ากระดาษ/ตัวเลือก scope=per_page, ใช้ `billedPages`) ถูกต้องตามหลักธุรกิจร้านถ่ายเอกสารจริง (ค่าหมึกตามจำนวนหน้าพิมพ์จริง ไม่ว่าจะพิมพ์กี่ด้าน, ค่ากระดาษตามจำนวนแผ่นที่ใช้จริง), มี quantity tier ลดหลั่นตามจำนวนสำหรับ per_piece (ตรงกับพฤติกรรมร้านนามบัตรจริงที่ยิ่งสั่งเยอะยิ่งถูกต่อชิ้น), มี minArea/rounding สำหรับ per_sqm (ตรงกับร้านป้ายไวนิลที่มักมีขั้นต่ำต่อออเดอร์)

**พบ 2 ประเด็นสำคัญ — ทั้งคู่แก้ไขแล้วตามที่ผู้ใช้ตัดสินใจ:**

| ID | ประเด็น | การตัดสินใจ | สถานะ |
|---|---|---|---|
| PE05-01 | **`page_counting_mode` เป็นค่าคงที่ระดับบริการ ไม่ผูกกับตัวเลือก "หน้าเดียว/หน้าหลัง" ที่ลูกค้าเลือกจริงในออเดอร์นั้น** — ลูกค้าเลือก "หน้าหลัง (2 ด้าน)" แล้ว จำนวนแผ่นกระดาษที่คิดเงินไม่ลดลงครึ่งหนึ่งอัตโนมัติ (บวกแค่ surcharge ที่ร้านตั้งไว้เอง) | ผู้ใช้ตัดสินว่าเป็นบั๊ก ต้องแก้ให้ auto-link → **BUG-05-01** | ✅ FIXED |
| PE05-02 | ข้อมูลจริงในระบบพบบริการ (ร้าน TONFAH PRINTER) ตั้งราคา "ถ่ายเอกสารขาวดำ" และ "โปสเตอร์" ไว้ที่ ฿0.00 (schema อนุญาตเพราะ validate แค่ห้ามติดลบ ไม่ได้บังคับ > 0) | ผู้ใช้ตัดสินให้แก้ข้อมูลตัวอย่างเป็นราคาสมเหตุสมผล ไม่แก้ schema validation | ✅ FIXED (data-only) |

รายละเอียดเต็มดูที่ `QA_BUG_REPORT.md` (BUG-05-01, BUG-05-02)

---

**สถานะ: ✅ เสร็จสมบูรณ์ (2026-09-06)** — ทดสอบผ่าน UI จริง (upload, quantity stepper, delivery dropdown, checkbox, checkout form) ผสมกับ API ตรงสำหรับ edge case ที่ต้อง concurrency

| ID | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail |
|---|---|---|---|---|
| CO05-01 | เพิ่มบริการลงตะกร้าพร้อมอัปโหลดไฟล์งาน (ผ่าน UI จริง: อัปโหลด PDF 3 หน้า → กด "เพิ่มลงตะกร้า") | สำเร็จ, ราคาคำนวณถูกต้อง | เพิ่มสำเร็จ, `unitBreakdown.pageCount=3`, `lineTotal=฿3` (1×3) ถูกต้อง | **PASS** |
| CO05-02 | แก้ไขจำนวนในตะกร้า (ผ่านปุ่ม +/- ใน UI) | ราคา re-calculate ถูกต้อง | กด "+" เพิ่มจำนวนเป็น 2 → ราคาอัปเดตเป็น `฿6` (2×3) ถูกต้องทันที (สังเกต: คลิกรัวติดกันถูก debounce ไม่ให้ยิงซ้อน — เป็นการออกแบบที่ดี ไม่ใช่บั๊ก) | **PASS** |
| CO05-03 | ลบรายการในตะกร้า | หายจากตะกร้า | เพิ่มรายการที่ 2 แล้วยิง `DELETE /cart/items/:id` → กลับเหลือ 1 รายการ, subtotal คำนวณใหม่ถูกต้อง | **PASS** |
| CO05-04 | เลือกวิธีจัดส่ง (self_pickup/shop_delivery) ผ่าน UI dropdown จริง | ราคา/ฟิลด์ที่อยู่เปลี่ยนตามที่เลือก | เลือก "รับเองที่ร้าน" ตอนไม่มีที่อยู่ → UI แจ้งเตือนให้เพิ่มที่อยู่ก่อนถูกต้อง; เพิ่มที่อยู่แล้วเลือก "จัดส่งในเมือง (฿30)" → deliveryFee/total อัปเดตถูกต้อง (฿30/฿36) หลังรอ re-render (ไม่ใช่บั๊ก แค่ debounce การ refetch) | **PASS** |
| CO05-05 | Checkout พร้อมอัปโหลด payment slip เต็ม flow ผ่าน UI จริง (ที่อยู่ → เลือกจัดส่ง → อัปโหลดสลิป → ติ๊กยอมรับเงื่อนไข → ยืนยันคำสั่งซื้อ) | สร้าง order สำเร็จ, ตะกร้าถูกเคลียร์ | `POST checkout`→`200`, สร้าง order #0001 (฿36) สำเร็จ, redirect ไปหน้า `/orders` แสดงผลถูกต้อง, `GET cart` หลังจากนั้นคืน `null` ยืนยันตะกร้าถูกเคลียร์จริง | **PASS** |
| CO05-06 | Checkout ตะกร้าว่างเปล่า (ไม่มีตะกร้าของร้านนี้เลย) | reject | `404 "ไม่มีตะกร้าของร้านนี้ กรุณาเพิ่มสินค้าก่อน"` | **PASS** |
| CO05-07 | Checkout ร้านที่ถูก suspend ระหว่างลูกค้ากำลังเลือกซื้อ (มีของในตะกร้าอยู่แล้ว) | ตรวจ error handling ที่เหมาะสม | Admin suspend ร้านระหว่างที่ลูกค้ามีตะกร้าค้างอยู่ → ลูกค้ายิง checkout → `400 "ร้านนี้ยังไม่เปิดให้บริการ (ยังไม่ผ่านการอนุมัติ หรือถูกระงับการใช้งาน)"` ถูกต้อง ไม่ใช่ 500 | **PASS** |
| CO05-08 | Refresh หน้า checkout กลางคัน | ข้อมูลตะกร้าไม่หาย (persist ใน DB ไม่ใช่ local state ล้วน) | ยืนยันโดยอ้อมจากทุก test case ข้างต้น — ตะกร้า/ตัวเลือกจัดส่ง/รายการทั้งหมดดึงจาก `GET /shops/:shopId/cart` ทุกครั้งที่โหลดหน้าใหม่ ไม่มี local-only state ที่หายได้ (นำทางออกแล้วกลับมาหลายรอบระหว่างทดสอบ ข้อมูลตรงกันทุกครั้ง) | **PASS** (ยืนยันจากสถาปัตยกรรม + การสังเกตซ้ำหลายรอบ) |
| CO05-09 | กดยืนยัน checkout ซ้ำหลายครั้งเร็วๆ (จำลองด้วยยิง 5 requests พร้อมกัน) | ไม่สร้าง order ซ้ำ | **เจอบั๊กร้ายแรงก่อนแก้**: ยิง 3 requests พร้อมกัน → ได้ order แยกกัน 3 ใบ (#0002,#0003,#0004) จากตะกร้าเดียวกัน → **BUG-05-03 (Critical)** → แก้แล้วด้วย DB transaction + row lock (`SELECT...FOR UPDATE`) → retest ด้วย 5 requests พร้อมกัน → สำเร็จแค่ 1 ใบ (#0005), อีก 4 ได้ `404` ถูกต้อง (ตะกร้าถูกลบไปแล้วโดย request แรก) | **PASS** ✅ (หลังแก้ไข) |

---

## Phase 06: Shop Service Management

**หน้า:** `(shop)/shop/services`, `.../services/new`, `.../services/[serviceId]/edit`
**API:** `/shops/:shopId/services*`, `/addons*`, `/delivery-options*`

**สถานะ: ✅ เสร็จสมบูรณ์ (2026-09-06)** — ทดสอบผ่าน API ตรง (สร้าง/แก้/ลบ/duplicate บริการ, ผูก add-on, ตั้งค่า delivery option) ผสมกับผลที่ยืนยันแล้วจาก Phase 05 (delivery option ที่สะท้อนถึง checkout จริง)

| ID | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail |
|---|---|---|---|---|
| SV06-01 | สร้างบริการใหม่แต่ละ pricing model (per_page/per_piece/per_sqm/fixed) | สร้างสำเร็จ, แสดงถูกต้องหน้าร้าน | สร้างบริการ `per_page`("QA Duplex Test Service"), `per_piece`("QA Fixed Price Service") สำเร็จผ่าน UI/API ทั้งคู่ แสดงผลถูกต้อง; ยืนยัน backend/schema รองรับ `pricingModel="fixed"` เต็มรูปแบบ (เห็นข้อมูลจริงที่ใช้ในระบบ, ผ่าน validation) **แต่พบว่า wizard UI ฝั่งเจ้าของร้าน (`Step2Pricing.tsx`) ไม่มีตัวเลือกให้สร้างบริการแบบ `fixed` เลย** (`PricingMode` type มีแค่ per_page/per_piece/per_sqm/quantity_tier) — เป็น UI gap ไม่ใช่ bug เชิง logic เพราะสร้างผ่าน API ตรงได้ปกติ ไม่ได้ block งานหลัก ไม่ได้ลงเป็นบั๊กแยก | **PASS** (พบ UI gap เล็กน้อย ไม่ block) |
| SV06-02 | แก้ไขบริการที่มี order ผูกอยู่แล้ว | ตรวจว่า order เก่าราคาไม่เปลี่ยนตาม (snapshot) | แก้ `basePrice` ของบริการที่มี order เก่าผูกอยู่ (order #0001-#0005 จาก Phase 05) → `GET /customers/orders` ยืนยันราคาใน order เก่ายังคงเดิมทุกใบ (ใช้ snapshot ที่บันทึกไว้ตอน checkout ไม่ได้ join ราคาปัจจุบันสด) | **PASS** |
| SV06-03 | ลบบริการที่ไม่มี/มี order ผูก | ตามเคสมี dependency ต้อง reject/409 | ลบบริการที่ไม่มี dependency → สำเร็จ (`200`) ปกติ; ลบบริการที่มี **cart item** ผูกอยู่ (ยังไม่ถึงขั้นเป็น order) → **เจอบั๊กก่อนแก้**: ได้ raw `500` แทนข้อความสุภาพ → **BUG-06-01** → แก้แล้ว (root cause: FK-violation detection ไม่ unwrap `err.cause.code` ตาม drizzle-orm 0.45+) → retest → ได้ `400 "ไม่สามารถลบได้ เนื่องจากมีลูกค้าเพิ่มบริการนี้ไว้ในตะกร้าอยู่ กรุณาปิดใช้งานแทนการลบ"` ถูกต้อง | **PASS** ✅ (หลังแก้ไข) |
| SV06-04 | Duplicate service | สำเนาถูกต้องครบทุก option/tier | ยิง `POST /shops/:shopId/services/:id/duplicate` กับบริการที่มี options/colorTiers/isDuplex ครบ → สำเนาใหม่มี options/values/colorTiers/`isDuplex` ตรงกับต้นฉบับทุกจุด (ชื่อบริการเติม suffix อัตโนมัติกันชนกัน) | **PASS** |
| SV06-05 | สร้าง add-on service + ผูกกับ main service | ใช้งานได้ตอนสั่งซื้อจริง | สร้าง add-on "QA เคลือบพลาสติก" (฿5) สำเร็จ (`POST /shops/:shopId/addons` → 200) → ผูกกับ main service ผ่าน `PATCH /shops/:shopId/services/:id` body `{addOns:[...]}` เดี่ยวๆ (ไม่ส่งฟิลด์อื่น) → **เจอบั๊กก่อนแก้**: ได้ raw `500` (`"No values to set"` จาก drizzle-orm) → **BUG-06-02** → แก้แล้ว (ข้าม `.update()` ถ้า payload ว่างเปล่า, select แถวเดิมแทน) → retest → ได้ `200` ผูกสำเร็จ → ทดสอบใช้งานจริงตอนสั่งซื้อ: ลูกค้าเพิ่มบริการนี้ลงตะกร้าพร้อมเลือก add-on → `lineTotal=฿6` ถูกต้อง (`basePrice฿1 + addOn฿5`) ยืนยันคำนวณราคาถูกต้องครบวงจรจริง | **PASS** ✅ (หลังแก้ไข) |
| SV06-06 | ตั้งค่า delivery options (ราคา/ระยะเวลา) | บันทึกถูกต้อง สะท้อนที่หน้า checkout | `PATCH /shops/:shopId/delivery-options/:id` แก้ `baseFee` 30→35 → บันทึกถูกต้อง (`GET` ยืนยันค่าใหม่) แล้วเปลี่ยนกลับเป็น 30; ยืนยันการสะท้อนถึง checkout จริงแล้วตั้งแต่ Phase 05 (CO05-04: เลือก "จัดส่งในเมือง฿30" → `deliveryFee/total` อัปเดตถูกต้อง, CO05-07: ทดสอบกับร้าน suspended) | **PASS** |
| SV06-07 | Negative: ตั้งราคาติดลบ/0 | reject | `basePrice: -5` → `400` (zod `.nonnegative()` reject ถูกต้อง); `basePrice: 0` → schema **ยอมรับ** (`200`) ตามเจตนาการออกแบบเดิม (เผื่อโปรโมชั่นฟรีจริง) — ตรงกับที่พบใน BUG-05-02 (data-quality ไม่ใช่ logic bug) ไม่ใช่ negative test ที่ fail จริง | **PASS** (ตามพฤติกรรมที่ออกแบบไว้) |
| SV06-08 | ร้านที่ pending/suspended พยายามสร้าง/แก้บริการ | ถูกบล็อก (`requireShopOwner`) | Admin suspend ร้านทดสอบจริง (`PATCH /admin/shops/:id/suspend`) → login กลับเป็นเจ้าของร้านเดิม ยิง `POST` (สร้างบริการใหม่), `PATCH` (แก้ราคา), `DELETE` (ลบบริการ) เข้า `/shops/:shopId/services*` → ได้ `403 {"error":"ร้านค้ายังไม่ได้รับการอนุมัติจากแอดมิน ยังตั้งบริการและราคาไม่ได้"}` ถูกต้องครบทั้ง 3 endpoint (ยืนยันจากโค้ด `requireShopOwner()` ที่เช็ค `shop.approvalStatus !== "approved"` จริง) — แก้ร้านกลับเป็น `approved` (`PATCH /admin/shops/:id/approve`) หลังทดสอบเสร็จ ยืนยันแล้ว | **PASS** |

รายละเอียดเต็มดูที่ `QA_BUG_REPORT.md` (BUG-06-01, BUG-06-02)

---

## Phase 07: Order Management

**หน้า:** `(customer)/orders*`, `(shop)/shop/orders`
**API:** `POST /orders` (สร้างจาก checkout), `GET /shops/:shopId/orders`, `GET /customers/orders`, `GET /orders/:id`, `PATCH /orders/:id/status`

**สถานะ: ✅ เสร็จสมบูรณ์ (2026-09-06)** — ทดสอบผ่าน API ตรงบน order จริง #0001-#0005 จาก Phase 05 (ครบทุก state-machine path ทั้ง shop_delivery และ self_pickup) — **ไม่พบบั๊กใหม่เลย**

| ID | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail |
|---|---|---|---|---|
| O07-01 | ลูกค้าดูประวัติ/รายละเอียด order ตัวเอง | ข้อมูลถูกต้องครบ | `GET /customers/orders` (customer2) → คืนครบ 5 order (#0001-#0005) พร้อมสถานะถูกต้อง; `GET /orders/:id` (#0005) → รายละเอียดครบถ้วนตรงกับที่ checkout ไว้ | **PASS** |
| O07-02 | ร้านค้าดูรายการ order ที่เข้ามา + กรองตามสถานะ | ครบถ้วน | `GET /shops/:shopId/orders` (ไม่กรอง) → ครบ 5 ใบ; `?status=pending_review` → กรองเหลือเฉพาะ #0002 ถูกต้อง; `?status=cancelled` → กรองเหลือ #0004,#0005 ถูกต้อง | **PASS** |
| O07-03 | ร้านเปลี่ยนสถานะ order ตามลำดับ workflow ที่ถูกต้อง | อัปเดตสำเร็จ, ลูกค้าเห็น + ได้ notification | ทดสอบ 2 เส้นทาง: (1) order `shop_delivery` (#0001): `pending_review→accepted→in_progress→shipping→completed` ทุกขั้นสำเร็จ `200` ตามลำดับ; (2) order `self_pickup` (#0003): `pending_review→accepted→in_progress→completed` (ข้าม `shipping` อัตโนมัติถูกต้องตาม `deliveryMethod`); ทดสอบ idempotent-retry (ยิงซ้ำสถานะเดิม `accepted→accepted`) → คืน `200` เดิมไม่ error (กันบั๊กจากกดปุ่มเบิ้ล) | **PASS** |
| O07-04 | ร้านพยายามข้ามลำดับสถานะ (เช่น pending→completed ตรงๆ) | ควร reject ถ้ามี state-machine validation | ยิง `pending_review→completed` ตรงๆ (#0002) → `400 "เปลี่ยนสถานะข้ามขั้นไม่ได้ ต้องเปลี่ยนเป็น \"รับงานแล้ว\" ก่อน"`; ทดสอบเพิ่ม: order `self_pickup` ที่ `in_progress` พยายามไป `shipping` (ไม่ใช่ path ของตัวเอง) → `400 "...ต้องเปลี่ยนเป็น \"เสร็จสิ้น\" ก่อน"` ถูกต้อง; พยายามเปลี่ยนสถานะ order ที่ `completed` แล้ว → `400 "ออเดอร์นี้จบสถานะแล้ว..."` | **PASS** |
| O07-05 | ยกเลิก order (ลูกค้า/ร้าน) พร้อมเหตุผล | บันทึก `cancelReason` ถูกต้อง | ลูกค้ายกเลิกเอง (#0005, ยัง `pending_review`) ส่ง `cancelReason:"other"` มาทาง client → server **override เป็น `customer_request` เสมอ** ถูกต้อง (กันลูกค้าใส่เหตุผลเท็จ); ร้านยกเลิก (#0004) ด้วย `cancelReason:"invalid_payment_slip"` + `cancelNote` → บันทึกตรงตามที่ส่งถูกต้องทั้งคู่ | **PASS** |
| O07-06 | ลูกค้าพยายามยกเลิก order ที่ completed แล้ว | reject | ลูกค้ายิงยกเลิก order #0003 (สถานะ `completed` จาก O07-03) → `400 "ยกเลิกออเดอร์เองได้เฉพาะตอนที่ร้านยังไม่ยืนยันรับงานเท่านั้น"` ถูกต้อง (business rule ของลูกค้าเข้มกว่าร้าน: ยกเลิกเองได้แค่ตอน `pending_review` เท่านั้น ไม่ใช่แค่ "ไม่ completed") | **PASS** |
| O07-07 | ตรวจว่า order เก่าที่ completed/cancelled มี `finishedAt` ถูก set ไหม (เชื่อมกับ auto-delete cleanup) | มีค่าเสมอ | ตรวจโค้ด `apps/api/src/routes/orders.ts:522-532` ยืนยัน `finishedAt: nextStatus === "completed" \|\| nextStatus === "cancelled" ? new Date() : null` ถูก set ที่จุดเดียวกับที่เปลี่ยนสถานะเสมอ (เขียนพร้อม status ในทรานแซคชันเดียว ไม่มี gap); cron cleanup (`internalCleanup.ts`) กรองด้วย `isNotNull(finishedAt)` ถูกต้องตรงกัน — **หมายเหตุ:** ไม่ได้ query DB ตรงยืนยันค่าจริง (Bash tool บล็อกการรันสคริปต์เชื่อมต่อ production DB ตรงๆ ด้วยเหตุผลด้านความปลอดภัย) ใช้การตรวจโค้ดแทนเพราะ logic ตรงไปตรงมา ไม่มี branch เงื่อนไขซับซ้อนที่จะพลาดได้ | **PASS** (ยืนยันด้วย code review แทน DB query ตรง) |
| O07-08 | Cross-account: customerB ดู order ของ customerA | 403/404 | customer1 (ไม่มี order เป็นของตัวเอง) ยิง `GET /orders/:id` ของ order customer2 → `403 "คุณไม่มีสิทธิ์ดูออเดอร์นี้"`; ยิง `PATCH .../status` (ยกเลิก) → `403 "ต้องเป็นบัญชีร้านค้าเท่านั้น"` (ตกไปเช็คสิทธิ์แบบร้านค้าเพราะไม่ใช่เจ้าของ ถูกบล็อกอีกชั้น) — ไม่มีข้อมูล order รั่วออกมาทั้งคู่ | **PASS** |

---

## Phase 08: Shop Settings & Account

**หน้า:** `(shop)/shop/settings`, `(shop)/shop/profile`
**API:** `GET/PUT /shops/me`, `POST /auth/change-password`, `PUT /auth/change-email`, `DELETE /auth/me`

**สถานะ: ✅ เสร็จสมบูรณ์ (2026-09-06)** — ทดสอบผ่าน API ตรง พบบั๊ก 3 จุด (1 Critical, 2 Medium) — **แก้ไขและ verify แล้วทั้งหมด**

| ID | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail |
|---|---|---|---|---|
| SS08-01 | บันทึกข้อมูลบัญชีธนาคาร/พร้อมเพย์ | สำเร็จ | `PUT /shops/me` ด้วย `bankAccountName`/`bankName`/`bankAccountNumber`/`promptpayNumber` → `200`; `GET /shops/me` ยืนยันค่าถูกบันทึกครบถูกต้องทุกฟิลด์ | **PASS** |
| SS08-02 | Toggle notification settings มีผลจริงตอนสร้าง order ใหม่ | ตาม toggle | ตั้ง `notificationSettings.newOrder=false` → ลูกค้า checkout ออเดอร์ใหม่ (#0006) → นับ `GET /notifications` ของร้าน **ไม่เพิ่มขึ้นเลย** (13→13) ยืนยันว่าไม่ส่ง notification จริง; ตั้งกลับ `newOrder=true` → checkout ออเดอร์ใหม่อีกใบ (#0007) → นับเพิ่มขึ้นจริง (13→14) พร้อม title "ออเดอร์ใหม่ #0007" ตรงกับ order ที่เพิ่งสร้าง | **PASS** |
| SS08-03 | เปลี่ยนรหัสผ่าน/อีเมล | ตามเงื่อนไข validation | **เปลี่ยนรหัสผ่าน:** current password ผิด → `400`; new==current → `400 "ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน"`; เปลี่ยนถูกต้อง → `200` + login ด้วยรหัสเก่า `401`/รหัสใหม่ `200` ยืนยันเปลี่ยนจริง → เปลี่ยนกลับสำเร็จ (ทดสอบแบบ revert ไม่ทิ้งผลกระทบถาวร) — **เปลี่ยนอีเมล:** current password ผิด → `400`; อีเมลซ้ำกับบัญชีอื่น → `409`; เปลี่ยนถูกต้อง → `200` + login ด้วยอีเมลเก่า `401`/ใหม่ `200` → เปลี่ยนกลับสำเร็จ | **PASS** |
| SS08-04 | **ลบบัญชีร้านค้าที่มี shop row ผูกอยู่** (บั๊กวิกฤตรอบก่อน: เคยได้ 500) | ไม่ error 500 | **ยืนยันบั๊กจริงก่อนแก้:** สมัครร้านใหม่แล้วลบบัญชีทันที → raw `500` (FK `shops_owner_id_users_id_fk`); **ทดสอบเพิ่ม** (กว้างกว่าที่คาดไว้เดิม): ลูกค้าที่มี order 1 ใบก็ได้ raw `500` เช่นกัน (FK `orders_customer_id_users_id_fk`) — คือเกือบทุกบัญชีที่ใช้งานจริงลบไม่ได้เลย → **BUG-08-01 (Critical)** → แก้แล้ว (เช็ค dependency ก่อนลบ คืน `400` พร้อมข้อความอธิบาย แทนที่จะปล่อยชน FK ตรงๆ) → retest: ทั้ง 2 เคสได้ `400` ที่สุภาพถูกต้อง (จากเดิม `500`); ทดสอบ regression บัญชีสะอาด (มีแค่ตะกร้าที่ยังไม่ checkout ค้างอยู่) → ลบสำเร็จ `200`, login ซ้ำ → `401` ยืนยันลบจริง | **PASS** ✅ (หลังแก้ไข) |
| SS08-05 | ร้าน suspended พยายามแก้ `PUT /shops/me` | ตรวจว่า blocked เหมือน endpoint อื่นหรือไม่ (รอบก่อนพบว่าไม่บล็อก) | **ยืนยันบั๊กจริงก่อนแก้:** admin suspend ร้าน → เจ้าของร้านยิง `PUT /shops/me` แก้ชื่อร้าน → สำเร็จ `200` ตามปกติ ไม่ถูกบล็อกเลย (ต่างจาก `services.ts` ที่บล็อกร้าน suspended ไว้แล้ว) → **BUG-08-02** → แก้แล้ว (เพิ่มเช็ค `approvalStatus`) → retest: suspend แล้วยิงซ้ำ → `403` ถูกต้อง; approve กลับ → ยิงซ้ำ → `200` สำเร็จตามปกติ (regression ผ่าน ไม่กระทบร้านปกติ) — **พบเพิ่มระหว่างแก้จุดเดียวกัน:** role ผิดคืน `401` แทน `403` (ยืนยันซ้ำจาก SEC02-02 รอบ Phase 02) → **BUG-08-03** → แก้พร้อมกัน → retest: customer ยิง `PUT /shops/me` → `403` ถูกต้อง (จากเดิม `401`) | **PASS** ✅ (หลังแก้ไข) |

รายละเอียดเต็มดูที่ `QA_BUG_REPORT.md` (BUG-08-01, BUG-08-02, BUG-08-03)

---

## Phase 09: Reviews

**หน้า:** `OrderReviewSection`, `ShopReviewsContainer`, public shop page, `admin/reviews`
**API:** `/orders/:id/review`, `/shops/:shopId/reviews`, `/shops/:shopId/reviews/:id/reply`, `/reviews/:id`, `/admin/reviews`

**สถานะ: ✅ เสร็จสมบูรณ์ (2026-09-06)** — ทดสอบผ่าน API ตรงบน order completed จริง (#0001, #0003) จาก Phase 07 — **ไม่พบบั๊กใหม่เลย**

| ID | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail |
|---|---|---|---|---|
| R09-01 | รีวิว order ที่ completed (rating 1-5 + comment) | สำเร็จ แสดงหน้าร้านทันที | `POST /orders/:id/review` (order #0001, completed) rating 5 + comment → `200`; `GET /shops/:shopId/reviews` (public ไม่ต้อง login) เห็นรีวิวทันที พร้อม `summary.avgRating=5`; ชื่อลูกค้าถูก mask เหลือแค่ชื่อ+อักษรย่อนามสกุล ("QA C.") กันข้อมูลรั่ว | **PASS** |
| R09-02 | รีวิวซ้ำ order เดิม | reject 409 | รีวิว order #0001 ซ้ำอีกครั้ง → `409 "ออเดอร์นี้ถูกรีวิวไปแล้ว รีวิวได้ครั้งเดียวต่อออเดอร์"` | **PASS** |
| R09-03 | rating นอกช่วง 1-5 | reject | `rating:0` → `400`; `rating:6` → `400` (ทั้งคู่ reject ที่ Zod ก่อนถึง DB); ทดสอบเพิ่ม: รีวิว order ที่ยังไม่ completed (`pending_review`) → `400 "รีวิวได้เฉพาะออเดอร์ที่เสร็จสิ้นแล้วเท่านั้น"` | **PASS** |
| R09-04 | ร้านตอบกลับรีวิว (ครั้งแรก + ตอบซ้ำทับ) | ตรวจว่ามี audit trail ไหม | ตอบครั้งแรก → `200` บันทึก `shopReply`+`shopRepliedAt`; ตอบซ้ำทับ → `200` ค่าใหม่แทนที่ค่าเดิมทั้งหมด — **ยืนยันว่าไม่มี audit trail จริง** (ตรงกับที่บันทึกไว้ในหัวข้อ "จุดที่ควรเพ่งเล็งพิเศษ" ของ `QA_BUG_REPORT.md` อยู่แล้ว) เป็น design gap ที่ทราบอยู่แล้ว ไม่ใช่บั๊กใหม่ ไม่ได้แก้ในรอบนี้ (การเพิ่ม audit trail เป็น feature ใหม่ ไม่ใช่การแก้บั๊ก) | **PASS** (พบ design gap ที่ทราบอยู่แล้ว ไม่ใช่บั๊กใหม่) |
| R09-05 | Admin ลบรีวิวใดๆ | สำเร็จ | รีวิวปรากฏใน `GET /admin/reviews` (moderation list) ถูกต้อง → `DELETE /reviews/:id` โดย admin → `200`; ยืนยัน `GET /shops/:shopId/reviews` หลังลบ ไม่เห็นรีวิวนี้อีกแล้ว | **PASS** |
| R09-06 | customer/shop อื่นลบรีวิวที่ไม่ใช่ของตัวเอง | 403 | เจ้าของร้าน**คนละร้าน**พยายามตอบกลับรีวิวที่ไม่ใช่ของร้านตัวเอง → `403 "คุณไม่มีสิทธิ์จัดการร้านนี้"`; ลูกค้า**คนละคน**พยายามลบรีวิวที่ไม่ใช่ของตัวเอง → `403 "ไม่มีสิทธิ์ลบรีวิวนี้"` — ทดสอบเปรียบเทียบ: เจ้าของรีวิวตัวเองลบเอง → `200` สำเร็จปกติ (ยืนยันว่า block เฉพาะกรณีไม่ใช่เจ้าของจริงๆ) | **PASS** |

---

## Phase 10: Chat/Messaging (เขียนใหม่ล่าสุด — ความเสี่ยงสูง)

**หน้า:** `components/chat/chatpage.tsx` ((customer)/chat, (shop)/shop/chat)
**API:** `GET /messages/rooms`, `POST /messages`, `PATCH /messages/:orderId/read`, `GET /messages/:orderId`

**สถานะ: ✅ เสร็จสมบูรณ์ (2026-09-06)** — ทดสอบผ่าน API ตรงบน order #0001 (customer2 ↔ shop1) พบบั๊ก 1 จุด (Medium) — **แก้ไขและ verify แล้ว**

| ID | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail |
|---|---|---|---|---|
| M10-01 | ลูกค้า/ร้านส่งข้อความ 2 ทาง | สำเร็จ | customer2 ส่งข้อความ → `200`; shop1 ตอบกลับ → `200` ทั้งคู่บันทึก `content` ถูกต้องตรงตามที่พิมพ์ | **PASS** |
| M10-02 | `GET /messages/rooms` แสดง unreadCount/lastMessage ถูกต้อง | | ทั้งสองฝั่งเห็น `lastMessageContent`/`lastMessageAt` ตรงกับข้อความล่าสุดจริง; `unreadCount` คำนวณแยกอิสระต่อฝั่ง (นับเฉพาะข้อความที่อีกฝั่งส่งมาและตัวเองยังไม่อ่าน) ถูกต้องทั้งคู่ | **PASS** |
| M10-03 | Ownership fix ใหม่: ร้าน (ผ่าน join `shops.ownerId`) ส่ง/อ่านข้อความสำเร็จ | ยันว่า owner จริงใช้งานได้ (ไม่ใช่แค่ block คนอื่น) | shop1 (เจ้าของร้านจริงผ่าน `shops.ownerId`) ส่งข้อความสำเร็จ `200` ยืนยันว่า fix เดิม (join ownerId แทนเทียบ `shopId` ตรงๆ) ยังทำงานถูกต้อง | **PASS** |
| M10-04 | **⚠️ ส่งข้อความ content=`{"kind":"file","path":"x","fileName":"y"}` แบบพิมพ์ธรรมดา** | ไม่ควรถูกตีความเป็นไฟล์แนบปลอม (บั๊กเดิม C5-09 — โค้ดปัจจุบันดูเหมือนยังไม่แก้ ต้องยืนยัน) | **ยืนยันบั๊กจริงก่อนแก้:** ส่งข้อความธรรมดาหน้าตาเหมือน JSON ไฟล์แนบ → `isFile:true` พร้อม `fileName` ตรงตามที่พิมพ์ (เช่น "ใบเสร็จปลอม.png") ทั้งที่ไม่เคยอัปโหลดไฟล์จริง → **BUG-10-01** → แก้แล้ว (เพิ่มคอลัมน์ `is_file_attachment` แยกจาก `content` โดยสิ้นเชิง — ลองแก้ด้วย NUL-byte sentinel ใน content ก่อนแต่ Postgres ปฏิเสธ NUL byte insert ไม่ได้เลย จึงเปลี่ยนมาใช้คอลัมน์แทน) → retest → `isFile:false` ถูกต้อง | **PASS** ✅ (หลังแก้ไข) |
| M10-05 | แนบไฟล์จริงผ่าน `filePath`/`fileName` | ได้ signed URL ใช้งานได้ | ส่งไฟล์แนบจริง (PDF ที่เคยอัปโหลดจริงใน Phase 05) ผ่าน `filePath` → `isFile:true`, `isFileAttachment:true` ใน DB, `fileUrl` เป็น signed URL ที่ใช้งานได้จริง (ทดสอบ regression พร้อมกับแก้ BUG-10-01 — ยืนยันไม่กระทบ flow ไฟล์แนบจริง); `GET /messages/rooms` แสดง `lastMessageContent: "📎 ชื่อไฟล์.pdf"` ถูกต้อง | **PASS** |
| M10-06 | `PATCH /:orderId/read` mark เฉพาะข้อความที่ไม่ใช่ของตัวเอง | ถูกต้อง | customer2 เรียก mark-read → ข้อความที่ตัวเองส่ง (5 ข้อความ) ยังคง `isRead:false` เหมือนเดิม (ถูกต้อง เพราะ `isRead` วัดจากมุมมองผู้รับ), ข้อความของ shop1 ที่ยังไม่อ่าน (0 เหลือ) ถูก mark เป็น `true` ครบ | **PASS** |
| M10-07 | Cross-account: customerB/shopB เข้าห้องแชทของ order คนอื่น | 403 | customer1 (ไม่เกี่ยวข้อง) ยิง `GET`/`POST`/`PATCH .../read` เข้าห้องแชทของ order #0001 → `403` ทั้ง 3 endpoint; shop_owner คนละร้าน (`qa2.ss08throwaway`) ยิง `GET` เข้าห้องเดียวกัน → `403` เช่นกัน ไม่มีข้อมูลรั่ว | **PASS** |
| M10-08 | ข้อความยาวมาก (10,000+ ตัวอักษร) | ตรวจ max length + layout | ส่งข้อความ 10,004 ตัวอักษร → `200` สำเร็จ บันทึกครบไม่ถูกตัด (ไม่มีการจำกัดความยาวทั้งที่ schema `t.String()`/DB `text` column — เป็น minor finding ไม่ใช่บั๊ก ไม่ได้แก้เพราะไม่กระทบ correctness แค่ไม่มี guard กันสแปมข้อความยาวเกินจำเป็น) | **PASS** (พบ minor finding: ไม่มี max length limit) |
| M10-09 | Admin เข้าดูแชท | ควร 403 ตามดีไซน์ปัจจุบัน (หรือ confirm ว่าต้องการเปลี่ยน) | Admin ยิง `GET /messages/rooms` → `403 "ไม่มีสิทธิ์เข้าถึงแชทนี้"`; ยิง `GET /messages/:orderId` → `403 "ไม่มีสิทธิ์ดูข้อความในออเดอร์นี้"` ทั้งคู่ตรงตามดีไซน์ปัจจุบันที่ตั้งใจไว้ (แชทเป็นเรื่องระหว่างลูกค้า-ร้านเท่านั้น แอดมินไม่เข้าไปดูเนื้อหาส่วนตัว) | **PASS** |

รายละเอียดเต็มดูที่ `QA_BUG_REPORT.md` (BUG-10-01)

---

## Phase 11: Contact Admin

**หน้า:** `(customer)/contact-admin`, `(shop)/shop/contact-admin`, `admin/contact-messages`
**API:** `/users/contact-admin`, `/shops/:shopId/contact-admin`, `/admin/contact-messages*`

**สถานะ: ✅ เสร็จสมบูรณ์ (2026-09-07)** — ทดสอบผ่าน API ตรง (upload ไฟล์รูปจริง + ส่ง/ตอบคำร้อง) พบบั๊ก 1 จุด (Medium) — **แก้ไขและ verify แล้ว**

| ID | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail |
|---|---|---|---|---|
| CA11-01 | ลูกค้าส่งคำร้องพร้อมแนบไฟล์ (ฟีเจอร์ใหม่) | สำเร็จ | อัปโหลดรูป PNG จริงผ่าน `POST /uploads` (type `contact-admin-attachment`) → ส่งคำร้อง `POST /users/contact-admin` พร้อม `attachments` → `200`, ได้ signed URL ของไฟล์แนบกลับมาใช้งานได้จริง | **PASS** |
| CA11-02 | ร้านส่งคำร้องพร้อมแนบไฟล์ | สำเร็จ | เช่นเดียวกับ CA11-01 แต่ฝั่งร้าน (`POST /shops/:shopId/contact-admin`) → `200` สำเร็จ พร้อม signed URL ไฟล์แนบถูกต้อง | **PASS** |
| CA11-03 | Admin ตอบกลับพร้อมแนบไฟล์ (`adminReplyAttachments`) | ลูกค้า/ร้านเห็นไฟล์แนบของ admin ถูกต้อง | Admin ตอบกลับคำร้องของร้าน (CA11-02) พร้อมไฟล์แนบ → `status` เปลี่ยนเป็น `resolved`, `adminReply`/`adminReplyAttachments` บันทึกถูกต้อง; ยืนยันฝั่งร้านเห็นผ่าน `GET /shops/:shopId/contact-admin` ตรงกันทุกฟิลด์ | **PASS** |
| CA11-04 | ร้าน pending/suspended ส่งคำร้อง | ตรวจว่ายังบล็อกเหมือนรอบก่อนไหม (บั๊กเดิม S1-16) | **ยืนยันบั๊กจริงก่อนแก้:** suspend ร้านแล้วส่งคำร้อง → บล็อกถูกต้อง (`403`) แต่ข้อความ error ผิดบริบท ("ยังตั้งบริการและราคาไม่ได้" ทั้งที่กำลังส่งคำร้อง ไม่เกี่ยวกับบริการเลย) → **BUG-11-01** (พบว่าเป็นปัญหาเชิงระบบกระทบ `requireShopOwner()` ทั้ง 7 endpoint ที่เรียกใช้ร่วมกัน ไม่ใช่แค่ contact-admin) → แก้แล้ว (เปลี่ยนเป็นข้อความกลางที่ใช้ได้ทุก context) → retest → ข้อความถูกบริบทแล้ว, approve กลับมาใช้งานได้ปกติไม่มี regression | **PASS** ✅ (หลังแก้ไข) |
| CA11-05 | Admin ตอบคำร้องซ้ำที่ resolved แล้ว | ตรวจว่ามี guard กัน overwrite หรือยัง | ตอบซ้ำทับคำร้องเดิม → สำเร็จ `200` แต่ **ไม่มี guard ใดๆ** — `adminReply`/`adminReplyAttachments` เดิมถูกแทนที่ทั้งหมด (ไฟล์แนบเดิมหายไปเมื่อตอบซ้ำโดยไม่แนบไฟล์ใหม่) ยืนยันตรงกับที่บันทึกไว้แล้วในหัวข้อ "จุดที่ควรเพ่งเล็งพิเศษ" (design gap เดียวกับ R09-04 ของรีวิว) ไม่ใช่บั๊กใหม่ ไม่ได้แก้เพราะเป็นการเพิ่ม feature (audit trail) ไม่ใช่แก้บั๊ก | **PASS** (ยืนยัน design gap ที่ทราบอยู่แล้ว) |
| CA11-06 | Cross-role: ลูกค้าเรียก endpoint ของร้าน / กลับกัน | 403 | ลูกค้าเรียก `POST`/`GET /shops/:shopId/contact-admin` → `403` ทั้งคู่; ร้านเรียก `POST`/`GET /users/contact-admin` → `403` ทั้งคู่ — บล็อกถูกต้องครบทุกทิศทาง ไม่มีข้อมูลรั่ว | **PASS** |

รายละเอียดเต็มดูที่ `QA_BUG_REPORT.md` (BUG-11-01)

---

## Phase 12: Notifications (ฟีเจอร์ใหม่ทั้งหมด — ไม่มี baseline)

**API:** `notifications.ts`, `adminNotificationsRoutes.ts`
**หน้า:** ระบบ toast แบบ realtime, `admin/notifications`

**สถานะ: ✅ เสร็จสมบูรณ์ (2026-09-07)** — ทดสอบผ่าน API ตรง + สังเกตพฤติกรรมจริงในเบราว์เซอร์ (multi-tab, server interrupt) **พบ finding สำคัญ 1 จุด (High) — ลูกค้าไม่มี UI แจ้งเตือนเลยทั้งระบบ (BUG-12-01) → แก้ไขและ verify แล้วตามคำขอผู้ใช้**

| ID | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail |
|---|---|---|---|---|
| N12-01 | สร้าง order ใหม่ → ร้านได้รับ toast แจ้งเตือน real-time (ไม่ต้อง refresh) | | สร้าง order ใหม่ผ่าน checkout จริง (customer) → notification row ถูกสร้างทันที → เปิดหน้า `/shop` ใหม่ (ไม่ต้องกด refresh อะไรเพิ่ม) เห็นออเดอร์ใหม่ปรากฏในวิดเจ็ต "การแจ้งเตือน" ทันที; ยืนยันด้วย network log ว่า `GET /notifications` ถูกยิงอัตโนมัติซ้ำๆ ทุก ~15 วิ ตลอด session (300+ ครั้งสะสม) ไม่ต้องมีการกดปุ่มใดๆ — **หมายเหตุ:** ระบบเป็น **polling ทุก 15 วินาที ไม่ใช่ WebSocket/push จริง** (ตรวจโค้ด `GlobalNotificationListener.tsx` ยืนยัน) การจับภาพ toast popup ชั่วคราว (แสดง 5 วิ) ด้วยเครื่องมือระยะไกลไม่สำเร็จเพราะ round-trip latency ของ tool เกินเวลาที่ toast แสดงผล แต่ pipeline ข้อมูล+ตรรกะการแสดงผลถูกต้องยืนยันแล้วทั้งจาก log และ code review | **PASS** (เป็น polling ~15s ไม่ใช่ push จริง — ตรงตามที่ออกแบบไว้) |
| N12-02 | Mark notification ว่าอ่านแล้ว (`PUT`) | unread count ลดลงถูกต้อง | Mark 1 รายการอ่าน → unread count ลดลงถูกต้อง (33→32); ทดสอบเพิ่ม cross-account: customer พยายาม mark notification ของร้านอื่นเป็นอ่านแล้ว → `404` ถูกต้อง (query กรองด้วย `userId` เจ้าของจริงอยู่แล้ว) | **PASS** |
| N12-03 | Admin notifications panel แสดงเหตุการณ์สำคัญ (shop สมัครใหม่, contact-admin ใหม่) | ครบ | `GET /admin/notifications` แสดงครบทั้ง 3 ประเภทที่ระบบออกแบบไว้ (`shop_registered`, `order_cancelled`, `contact_admin_message`) พร้อม `unreadCount` ถูกต้อง; ทดสอบ mark-single-read + mark-all-read → `unreadCount` ลดลงถูกต้องจนเหลือ 0 | **PASS** |
| N12-04 | เปิดหลายแท็บพร้อมกัน แล้วดูว่า notification sync ข้ามแท็บไหม | ตรวจพฤติกรรมจริง | เปิด 2 แท็บพร้อมกัน (session เดียวกัน) ที่หน้า `/shop` → ทั้งคู่โหลด/ทำงานได้ปกติไม่มี error/conflict; ตรวจโค้ดยืนยันว่า**ไม่มีกลไก sync ข้ามแท็บเลย** (ไม่มี `BroadcastChannel`/`storage` event) แต่ละแท็บ poll อิสระของตัวเองทุก 15 วิ — ถ้าอ่านแล้วในแท็บ A จะเห็นผลใน B ก็ต่อเมื่อ B poll รอบถัดไปเอง (eventual, ไม่ใช่ instant) — เป็นพฤติกรรมตามสถาปัตยกรรม polling ที่ออกแบบไว้ ไม่ถือเป็นบั๊ก | **PASS** (ยืนยันพฤติกรรมจริง: eventual sync ผ่าน polling อิสระต่อแท็บ ไม่ใช่ instant) |
| N12-05 | ปิด service/หยุด polling/websocket ระหว่างใช้งาน แล้วกลับมาเปิดใหม่ | ไม่ crash, reconnect ได้ | หยุด API server ขณะเปิดหน้า `/shop` ค้างไว้ (~20 วิ ให้ poll cycle fail อย่างน้อย 1 ครั้ง) → console log แสดง error ที่ถูก catch ไว้เรียบร้อย ("Error polling notifications: Failed to fetch") หน้าเว็บยังทำงานปกติไม่ crash/ไม่ขาว; restart server กลับมา → รอ poll cycle ถัดไป (~15-20 วิ) → `GET /notifications` กลับมาสำเร็จ `200` เองอัตโนมัติ **ไม่ต้อง refresh หน้าเว็บเลย** | **PASS** |

**พบ finding สำคัญนอกเหนือจาก test case ที่วางแผนไว้:** ลูกค้าไม่มี UI แจ้งเตือนใดๆ เลยทั้งระบบ (ไม่มี bell icon, toast, หรือ dropdown ในฝั่ง `(customer)` แม้แต่จุดเดียว) ทั้งที่ backend สร้าง notification สำหรับลูกค้าไว้ถูกต้องครบถ้วน (admin ตอบกลับคำร้อง, ร้านยกเลิก/ปฏิเสธออเดอร์ ฯลฯ) → **BUG-12-01 (High)** → ผู้ใช้ขอให้แก้เพิ่มเติม → สร้าง `CustomerNotificationDropdown.tsx` + `CustomerNotificationListener.tsx` (คู่ขนานกับฝั่งร้านค้า, reuse backend endpoint เดิมทั้งหมดไม่ต้องแก้ backend) → wire เข้า `(customer)/layout.tsx` (เพิ่ม `ToastProvider`) และ `CustomerHeader.tsx` → ทดสอบ end-to-end ผ่านเบราว์เซอร์จริงครบ: bell แสดงถูกต้องทั้ง desktop/mobile, badge count ตรง, mark-all-read ยืนยันผ่าน API, และทดสอบวงจรเต็ม (shop ส่งแชทใหม่ → ลูกค้าเห็น badge เพิ่มขึ้นอัตโนมัติ) สำเร็จ ไม่มี compile/console error

รายละเอียดเต็มดูที่ `QA_BUG_REPORT.md` (BUG-12-01)

---

## Phase 13: Admin — Shop Management

**หน้า:** `admin/shops`, `admin/shops/[id]`, `admin/manage`, `admin/page` (dashboard)
**API:** `GET/PATCH/DELETE /admin/shops*`, `/approve`, `/reject`, `/suspend`, `GET /admin/dashboard`

| ID | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail |
|---|---|---|---|---|
| AS13-01 | Approve/Reject ร้านที่สมัครใหม่ | สถานะเปลี่ยนถูกต้อง + notification ไปหาเจ้าของร้าน | | NOT TESTED |
| AS13-02 | Suspend พร้อมเหตุผล / ไม่กรอกเหตุผล | ตามเงื่อนไข | | NOT TESTED |
| AS13-03 | Reinstate ร้านที่ suspended | กลับ approved, ข้อความแจ้งเตือนควรต่างจาก approve ครั้งแรก (บั๊กเดิม A3-07) | | NOT TESTED |
| AS13-04 | แก้ไขข้อมูลร้าน (ชื่อ/ที่อยู่/ประเภทบริการ) | สำเร็จ | | NOT TESTED |
| AS13-05 | ลบร้านที่ไม่มี/มี order-service ผูก | 200 / 409 (ไม่ใช่ 500) | | NOT TESTED |
| AS13-06 | Dashboard แสดงสถิติจริง (จำนวนร้าน/order/รายได้) | ตรงกับข้อมูลจริงใน DB | | NOT TESTED |

---

## Phase 14: Admin — System Settings & Users

**หน้า:** `admin/settings`, `admin/users` (ดูเหมือน stub)
**API:** `GET/PATCH /admin/settings`

| ID | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail |
|---|---|---|---|---|
| AU14-01 | แก้ system info/logo/ติดต่อ | บันทึกถูกต้อง | | NOT TESTED |
| AU14-02 | `minPasswordLength` มีผลจริงกับ change-password/register | dynamic ทันที | | NOT TESTED |
| AU14-03 | `requireSpecialChar`/`enable2fa`/`autoLogoutMinutes` — ยืนยันว่ายังเป็น stub หรือถูก implement แล้ว | ตามที่ UI disclose | | NOT TESTED |
| AU14-04 | เปิดหน้า `/admin/users` | ยืนยันว่าเป็น static placeholder จริง ไม่มี logic ซ่อน | | NOT TESTED |

---

## Phase 15: File Upload & Storage

**API:** `/uploads` ทุก type, `/admin/storage/*`, `/internal/cleanup/expired-order-files`, `cron.ts`

| ID | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail |
|---|---|---|---|---|
| ST15-01 | อัปโหลดแต่ละ type (`shop-photo`,`id-card`,`service-image`,`delivery-logo`,`order-file`,`payment-slip`,`contact-admin-attachment`,`system-logo`) — ตรวจสิทธิ์ตาม role ปัจจุบัน | ตรงตาม policy ในโค้ดล่าสุด | | NOT TESTED |
| ST15-02 | อัปโหลดไฟล์ผิดประเภท/เกินขนาด | reject 400 | | NOT TESTED |
| ST15-03 | ยิง `POST /uploads` แบบ body ว่าง | ตรวจว่ายัง 500 เหมือนบั๊กเดิม (SEC9-05c) ไหม | | NOT TESTED |
| ST15-04 | Admin storage dashboard overview + ลบไฟล์เดี่ยว/bulk | ทำงานถูกต้อง | | NOT TESTED |
| ST15-05 | ไฟล์แนบแชท (chat file) ปรากฏใน admin storage dashboard ไหม | ตรวจว่ายังเป็นบั๊ก ST7-09 (มองไม่เห็น) หรือถูกแก้แล้ว | | NOT TESTED |
| ST15-06 | ตรวจ `cron.ts` มี job เรียก cleanup endpoint หรือยัง | ยืนยันจากโค้ด | | NOT TESTED |
| ST15-07 | เรียก cleanup endpoint ตรงๆ ด้วย secret ถูก/ผิด | ตามเงื่อนไข | | NOT TESTED |
| ST15-08 | Order เก่าที่ completed มี `finishedAt` เป็น NULL ไหม (สุ่มตรวจ DB) | ควรมีค่าเสมอ | | NOT TESTED |

---

## Phase 16: Reports/Analytics

**หน้า:** `(shop)/shop/reports`
**API:** `GET /shops/:shopId/reports`, `/reports/orders`

| ID | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail |
|---|---|---|---|---|
| RP16-01 | ดูรายงานรายได้ตามช่วงเวลา | ตัวเลขตรงกับ order จริง | | NOT TESTED |
| RP16-02 | เปรียบเทียบช่วงเวลา (% change) | คำนวณถูกต้อง | | NOT TESTED |
| RP16-03 | กรองตามสถานะ order | ถูกต้อง | | NOT TESTED |
| RP16-04 | ร้านไม่มี order เลย เปิดหน้ารายงาน | แสดง empty state ไม่ crash | | NOT TESTED |

---

## Phase 17: End-to-End Integration

| ID | Flow | ผลที่คาดหวัง | ผลจริง | Pass/Fail |
|---|---|---|---|---|
| E17-01 | สมัครร้าน → admin approve → สร้างบริการ → ลูกค้าสั่งซื้อ → ร้านอัปเดตสถานะจนถึง completed → ลูกค้ารีวิว | ครบทุก layer, notification ถูกต้องทุกจุด | | NOT TESTED |
| E17-02 | ลูกค้า/ร้าน Contact Admin → admin ตอบ → เห็นผลอีกฝั่ง | ครบ | | NOT TESTED |
| E17-03 | ร้านถูก suspend → หายจาก public listing → contact-admin/services ถูกบล็อก → reinstate → กลับมาใช้งานได้ปกติ | ครบ ไม่มี inconsistency (บั๊กเดิม E2E-05: `PUT /shops/me` ไม่ถูกบล็อก) | | NOT TESTED |
| E17-04 | Order lifecycle เต็ม → cancel กลางทาง → คืนสถานะ/แจ้งเตือนถูกต้อง | | | NOT TESTED |
| E17-05 | Upload → Storage → Order completed → cleanup cron (เรียกตรง) → ไฟล์ถูกลบจริง | | | NOT TESTED |

---

## Phase 18: UI/Responsive & Cross-cutting Edge Cases

| ID | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail |
|---|---|---|---|---|
| UI18-01 | เปิดหน้าหลักทุกกลุ่ม role บนขนาดจอมือถือ (375px) | Layout ไม่พัง, ไม่ scroll แนวนอน | | NOT TESTED |
| UI18-02 | Dark mode (ถ้ามี) | สีถูกต้องอ่านง่าย | | NOT TESTED |
| UI18-03 | กด Back/Forward browser ระหว่าง flow หลายขั้นตอน (checkout, contact-admin) | ไม่ค้าง/data ไม่เพี้ยน | | NOT TESTED |
| UI18-04 | Refresh กลางฟอร์มที่กรอกยาวๆ | ตรวจว่ามี draft-save ไหม (ยอมรับ data หายได้ถ้าไม่มี) | | NOT TESTED |
| UI18-05 | Loading state ทุกหน้าหลักตอนโหลดข้อมูลช้า (throttle network) | มี spinner/skeleton ไม่ใช่หน้าขาวเปล่า | | NOT TESTED |

---

## Phase 19: Regression (รันหลังบั๊กถูกแก้)

_(รอทุก phase ข้างบนเสร็จและมีบั๊กถูกแก้ก่อน — จะ list เฉพาะ retest cases ของบั๊กที่ fix แล้วตอนนั้น)_
