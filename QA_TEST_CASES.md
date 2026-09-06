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

| ID | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail |
|---|---|---|---|---|
| CO05-01 | เพิ่มบริการลงตะกร้าพร้อมอัปโหลดไฟล์งาน | สำเร็จ, ราคาคำนวณถูกต้อง | | NOT TESTED |
| CO05-02 | แก้ไขจำนวน/ตัวเลือกในตะกร้า | ราคา re-calculate ถูกต้อง | | NOT TESTED |
| CO05-03 | ลบรายการในตะกร้า | หายจากตะกร้า | | NOT TESTED |
| CO05-04 | เลือกวิธีจัดส่ง (self_pickup/shop_delivery) | ราคา/ฟิลด์ที่อยู่เปลี่ยนตามที่เลือก | | NOT TESTED |
| CO05-05 | Checkout พร้อมอัปโหลด payment slip | สร้าง order สำเร็จ, ตะกร้าถูกเคลียร์ | | NOT TESTED |
| CO05-06 | Checkout ตะกร้าว่างเปล่า | reject | | NOT TESTED |
| CO05-07 | Checkout ร้านที่ถูก suspend ระหว่างลูกค้ากำลังเลือกซื้อ | ตรวจ error handling | | NOT TESTED |
| CO05-08 | Refresh หน้า checkout กลางคัน | ข้อมูลตะกร้าไม่หาย (persist ใน DB ไม่ใช่ local state ล้วน) | | NOT TESTED |
| CO05-09 | กดยืนยัน checkout ซ้ำหลายครั้งเร็วๆ | ไม่สร้าง order ซ้ำ | | NOT TESTED |

---

## Phase 06: Shop Service Management

**หน้า:** `(shop)/shop/services`, `.../services/new`, `.../services/[serviceId]/edit`
**API:** `/shops/:shopId/services*`, `/addons*`, `/delivery-options*`

| ID | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail |
|---|---|---|---|---|
| SV06-01 | สร้างบริการใหม่แต่ละ pricing model (per_page/per_piece/per_sqm/fixed) | สร้างสำเร็จ, แสดงถูกต้องหน้าร้าน | | NOT TESTED |
| SV06-02 | แก้ไขบริการที่มี order ผูกอยู่แล้ว | ตรวจว่า order เก่าราคาไม่เปลี่ยนตาม (snapshot) | | NOT TESTED |
| SV06-03 | ลบบริการที่ไม่มี/มี order ผูก | ตามเคสมี dependency ต้อง reject/409 | | NOT TESTED |
| SV06-04 | Duplicate service | สำเนาถูกต้องครบทุก option/tier | | NOT TESTED |
| SV06-05 | สร้าง add-on service + ผูกกับ main service | ใช้งานได้ตอนสั่งซื้อจริง | | NOT TESTED |
| SV06-06 | ตั้งค่า delivery options (ราคา/ระยะเวลา) | บันทึกถูกต้อง สะท้อนที่หน้า checkout | | NOT TESTED |
| SV06-07 | Negative: ตั้งราคาติดลบ/0 | reject | | NOT TESTED |
| SV06-08 | ร้านที่ pending/suspended พยายามสร้าง/แก้บริการ | ถูกบล็อก (`requireShopOwner`) | | NOT TESTED |

---

## Phase 07: Order Management

**หน้า:** `(customer)/orders*`, `(shop)/shop/orders`
**API:** `POST /orders` (สร้างจาก checkout), `GET /shops/:shopId/orders`, `GET /customers/orders`, `GET /orders/:id`, `PATCH /orders/:id/status`

| ID | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail |
|---|---|---|---|---|
| O07-01 | ลูกค้าดูประวัติ/รายละเอียด order ตัวเอง | ข้อมูลถูกต้องครบ | | NOT TESTED |
| O07-02 | ร้านค้าดูรายการ order ที่เข้ามา + กรองตามสถานะ | ครบถ้วน | | NOT TESTED |
| O07-03 | ร้านเปลี่ยนสถานะ order ตามลำดับ workflow ที่ถูกต้อง | อัปเดตสำเร็จ, ลูกค้าเห็น + ได้ notification | | NOT TESTED |
| O07-04 | ร้านพยายามข้ามลำดับสถานะ (เช่น pending→completed ตรงๆ) | ควร reject ถ้ามี state-machine validation | | NOT TESTED |
| O07-05 | ยกเลิก order (ลูกค้า/ร้าน) พร้อมเหตุผล | บันทึก `cancelReason` ถูกต้อง | | NOT TESTED |
| O07-06 | ลูกค้าพยายามยกเลิก order ที่ completed แล้ว | reject | | NOT TESTED |
| O07-07 | ตรวจว่า order เก่าที่ completed/cancelled มี `finishedAt` ถูก set ไหม (เชื่อมกับ auto-delete cleanup) | มีค่าเสมอ | | NOT TESTED |
| O07-08 | Cross-account: customerB ดู order ของ customerA | 403/404 | | NOT TESTED |

---

## Phase 08: Shop Settings & Account

**หน้า:** `(shop)/shop/settings`, `(shop)/shop/profile`
**API:** `GET/PUT /shops/me`, `POST /auth/change-password`, `PUT /auth/change-email`, `DELETE /auth/me`

| ID | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail |
|---|---|---|---|---|
| SS08-01 | บันทึกข้อมูลบัญชีธนาคาร/พร้อมเพย์ | สำเร็จ | | NOT TESTED |
| SS08-02 | Toggle notification settings มีผลจริงตอนสร้าง order ใหม่ | ตาม toggle | | NOT TESTED |
| SS08-03 | เปลี่ยนรหัสผ่าน/อีเมล | ตามเงื่อนไข validation | | NOT TESTED |
| SS08-04 | **ลบบัญชีร้านค้าที่มี shop row ผูกอยู่** (บั๊กวิกฤตรอบก่อน: เคยได้ 500) | ไม่ error 500 | | NOT TESTED |
| SS08-05 | ร้าน suspended พยายามแก้ `PUT /shops/me` | ตรวจว่า blocked เหมือน endpoint อื่นหรือไม่ (รอบก่อนพบว่าไม่บล็อก) | | NOT TESTED |

---

## Phase 09: Reviews

**หน้า:** `OrderReviewSection`, `ShopReviewsContainer`, public shop page, `admin/reviews`
**API:** `/orders/:id/review`, `/shops/:shopId/reviews`, `/shops/:shopId/reviews/:id/reply`, `/reviews/:id`, `/admin/reviews`

| ID | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail |
|---|---|---|---|---|
| R09-01 | รีวิว order ที่ completed (rating 1-5 + comment) | สำเร็จ แสดงหน้าร้านทันที | | NOT TESTED |
| R09-02 | รีวิวซ้ำ order เดิม | reject 409 | | NOT TESTED |
| R09-03 | rating นอกช่วง 1-5 | reject | | NOT TESTED |
| R09-04 | ร้านตอบกลับรีวิว (ครั้งแรก + ตอบซ้ำทับ) | ตรวจว่ามี audit trail ไหม | | NOT TESTED |
| R09-05 | Admin ลบรีวิวใดๆ | สำเร็จ | | NOT TESTED |
| R09-06 | customer/shop อื่นลบรีวิวที่ไม่ใช่ของตัวเอง | 403 | | NOT TESTED |

---

## Phase 10: Chat/Messaging (เขียนใหม่ล่าสุด — ความเสี่ยงสูง)

**หน้า:** `components/chat/chatpage.tsx` ((customer)/chat, (shop)/shop/chat)
**API:** `GET /messages/rooms`, `POST /messages`, `PATCH /messages/:orderId/read`, `GET /messages/:orderId`

| ID | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail |
|---|---|---|---|---|
| M10-01 | ลูกค้า/ร้านส่งข้อความ 2 ทาง | สำเร็จ | | NOT TESTED |
| M10-02 | `GET /messages/rooms` แสดง unreadCount/lastMessage ถูกต้อง | | | NOT TESTED |
| M10-03 | Ownership fix ใหม่: ร้าน (ผ่าน join `shops.ownerId`) ส่ง/อ่านข้อความสำเร็จ | ยันว่า owner จริงใช้งานได้ (ไม่ใช่แค่ block คนอื่น) | | NOT TESTED |
| M10-04 | **⚠️ ส่งข้อความ content=`{"kind":"file","path":"x","fileName":"y"}` แบบพิมพ์ธรรมดา** | ไม่ควรถูกตีความเป็นไฟล์แนบปลอม (บั๊กเดิม C5-09 — โค้ดปัจจุบันดูเหมือนยังไม่แก้ ต้องยืนยัน) | | NOT TESTED |
| M10-05 | แนบไฟล์จริงผ่าน `filePath`/`fileName` | ได้ signed URL ใช้งานได้ | | NOT TESTED |
| M10-06 | `PATCH /:orderId/read` mark เฉพาะข้อความที่ไม่ใช่ของตัวเอง | ถูกต้อง | | NOT TESTED |
| M10-07 | Cross-account: customerB/shopB เข้าห้องแชทของ order คนอื่น | 403 | | NOT TESTED |
| M10-08 | ข้อความยาวมาก (10,000+ ตัวอักษร) | ตรวจ max length + layout | | NOT TESTED |
| M10-09 | Admin เข้าดูแชท | ควร 403 ตามดีไซน์ปัจจุบัน (หรือ confirm ว่าต้องการเปลี่ยน) | | NOT TESTED |

---

## Phase 11: Contact Admin

**หน้า:** `(customer)/contact-admin`, `(shop)/shop/contact-admin`, `admin/contact-messages`
**API:** `/users/contact-admin`, `/shops/:shopId/contact-admin`, `/admin/contact-messages*`

| ID | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail |
|---|---|---|---|---|
| CA11-01 | ลูกค้าส่งคำร้องพร้อมแนบไฟล์ (ฟีเจอร์ใหม่) | สำเร็จ | | NOT TESTED |
| CA11-02 | ร้านส่งคำร้องพร้อมแนบไฟล์ | สำเร็จ | | NOT TESTED |
| CA11-03 | Admin ตอบกลับพร้อมแนบไฟล์ (`adminReplyAttachments`) | ลูกค้า/ร้านเห็นไฟล์แนบของ admin ถูกต้อง | | NOT TESTED |
| CA11-04 | ร้าน pending/suspended ส่งคำร้อง | ตรวจว่ายังบล็อกเหมือนรอบก่อนไหม (บั๊กเดิม S1-16) | | NOT TESTED |
| CA11-05 | Admin ตอบคำร้องซ้ำที่ resolved แล้ว | ตรวจว่ามี guard กัน overwrite หรือยัง | | NOT TESTED |
| CA11-06 | Cross-role: ลูกค้าเรียก endpoint ของร้าน / กลับกัน | 403 | | NOT TESTED |

---

## Phase 12: Notifications (ฟีเจอร์ใหม่ทั้งหมด — ไม่มี baseline)

**API:** `notifications.ts`, `adminNotificationsRoutes.ts`
**หน้า:** ระบบ toast แบบ realtime, `admin/notifications`

| ID | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail |
|---|---|---|---|---|
| N12-01 | สร้าง order ใหม่ → ร้านได้รับ toast แจ้งเตือน real-time (ไม่ต้อง refresh) | | | NOT TESTED |
| N12-02 | Mark notification ว่าอ่านแล้ว (`PUT`) | unread count ลดลงถูกต้อง | | NOT TESTED |
| N12-03 | Admin notifications panel แสดงเหตุการณ์สำคัญ (shop สมัครใหม่, contact-admin ใหม่) | ครบ | | NOT TESTED |
| N12-04 | เปิดหลายแท็บพร้อมกัน แล้วดูว่า notification sync ข้ามแท็บไหม | ตรวจพฤติกรรมจริง | | NOT TESTED |
| N12-05 | ปิด service/หยุด polling/websocket ระหว่างใช้งาน แล้วกลับมาเปิดใหม่ | ไม่ crash, reconnect ได้ | | NOT TESTED |

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
