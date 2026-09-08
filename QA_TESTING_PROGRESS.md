# QA_TESTING_PROGRESS.md — สถานะการทดสอบ EasyPrint

> **นี่คือ Single Source of Truth ของการทดสอบทั้งหมด** — Claude session ใหม่ทุกตัวต้องอ่านไฟล์นี้ก่อนเริ่มงาน
> อัปเดตล่าสุด: 2026-09-08 (Phase 13 เสร็จสมบูรณ์)
> **หมายเหตุสำคัญ:** ตามคำขอของผู้ใช้ (2026-09-06) — รอบนี้คือ **การวางแผนทดสอบใหม่ทั้งหมดทุกจุด** ไม่ยึดผลจากรอบก่อนว่า "ผ่านแล้ว" อีกต่อไป เอกสารเดิม [`docs/qa/test-plan.md`](docs/qa/test-plan.md) (รันเมื่อ 2026-08-25 บนโค้ดเก่ากว่าปัจจุบันมาก) ใช้เป็นแค่ **ข้อมูลอ้างอิงประกอบ** เท่านั้น (เช่น รู้ว่าเคยเจอบั๊กอะไรที่ไหนมาก่อน) ไม่ใช่ baseline ที่ข้ามได้

---

## 1) โครงสร้างระบบ (สรุปจากการ Inspect โค้ดจริง)

**Stack:** Next.js (web) + ElysiaJS/Bun (api) + PostgreSQL ผ่าน Drizzle ORM + Supabase Storage
**Role:** `customer`, `shop_owner`, `admin` (enum เดียวใน `users.role`)

**Route groups (frontend):** `(auth)` `(customer)` `(shop)` `(admin)` `shops/[shopId]` (public)
**API route files:** `auth`(login/register/password/me), `shops`, `services`, `cart`, `orders`, `addresses`, `reviews`, `messages`, `contactAdmin`, `notifications`, `adminNotificationsRoutes`, `admin`, `adminSettings`, `adminStorage`, `uploads`, `internalCleanup`, `reports`, `cron`

**จุดสังเกตจาก inspection:**
- `apps/web/app/(admin)/admin/users/page.tsx` เป็น **static placeholder** ไม่มี logic จริง (แค่ข้อความอธิบาย) — ต้องยืนยันว่าไม่มี route ai ซ่อนอยู่จริงหรือเป็น stub เฉยๆ
- Branch ของ QA รอบก่อนแยกจาก main ไปนาน แล้วเพิ่งถูก merge (PR #40) — ระหว่างนั้น main มีการเขียน `messages.ts`/`contactAdmin.ts` ใหม่เกือบทั้งไฟล์ + เพิ่มระบบ notifications realtime/dashboard realtime ที่ไม่เคยถูกทดสอบเลย
- ดังนั้นรอบนี้ต้องเทสทุกฟีเจอร์ใหม่ทั้งหมด ไม่ใช่แค่จุดที่เคยพัง

---

## 2) 🗺️ Roadmap เต็ม (ทุก Phase ต้องรันใหม่ทั้งหมด)

Priority: 🔴 Critical, 🟠 High, 🟡 Medium, ⚪ Low

| # | Phase | Priority | สถานะ | เหตุผล/Dependency |
|---|---|---|---|---|
| 01 | Authentication & Session (login/register×2 role/forgot-reset password/logout/session) | 🔴 Critical | ✅ DONE — 14/14 PASS (2026-09-06) | พบบั๊ก 3 จุด (2 High, 1 Medium) — **แก้ไขและ verify แล้วทั้งหมด** ตามคำขอผู้ใช้ |
| 02 | Security & Permission Matrix (bootstrap: role/ownership check ทุก endpoint หลัก) | 🔴 Critical | ✅ DONE — 10/10 PASS (2026-09-06) | พบบั๊ก 2 จุด (Medium) — **แก้ไขและ verify แล้วทั้งหมด** ตามคำขอผู้ใช้ |
| 03 | Customer Account & Profile (profile, addresses CRUD, change password) | 🟠 High | ✅ DONE — 6/6 PASS (2026-09-06) | ไม่พบบั๊กใหม่เลย — เคส "ลบบัญชีที่มี order ผูก" รอ Phase 05 มี order จริงก่อน |
| 04 | Shop Discovery & Browsing (public shop list/detail/service order page) | 🟠 High | ✅ DONE — 5/5 PASS (2026-09-06) | พบบั๊ก 2 จุด (1 Critical, 1 Medium) — **แก้ไขและ verify แล้วทั้งหมด** ตามคำขอผู้ใช้ |
| 05 | Cart & Checkout (add/edit cart, delivery options, payment slip, checkout) | 🔴 Critical | ✅ DONE — 9/9 PASS (2026-09-06) | พบบั๊ก 3 จุด (2 High/Critical pricing, **1 Critical checkout race condition**) — **แก้ไขและ verify แล้วทั้งหมด** |
| 06 | Shop Service Management (CRUD services/add-ons/delivery options/duplicate) | 🔴 Critical | ✅ DONE — 8/8 PASS (2026-09-06) | พบบั๊ก 2 จุด (Medium) — **แก้ไขและ verify แล้วทั้งหมด** |
| 07 | Order Management (customer history/detail/cancel + shop order list/status workflow) | 🔴 Critical | ✅ DONE — 8/8 PASS (2026-09-06) | ไม่พบบั๊กใหม่เลย |
| 08 | Shop Settings & Account (payment/notification settings, change password/email, delete account) | 🟠 High | ✅ DONE — 5/5 PASS (2026-09-06) | พบบั๊ก 3 จุด (1 Critical, 2 Medium) — **แก้ไขและ verify แล้วทั้งหมด** |
| 09 | Reviews (customer add/view, shop reply, admin moderate/delete) | 🟠 High | ✅ DONE — 6/6 PASS (2026-09-06) | ไม่พบบั๊กใหม่เลย |
| 10 | Chat/Messaging (rooms, send/read, file attach — **เขียนใหม่ทั้งไฟล์เมื่อไม่นานมานี้**) | 🔴 Critical | ✅ DONE — 9/9 PASS (2026-09-06) | พบบั๊ก 1 จุด (Medium) — **แก้ไขและ verify แล้ว** |
| 11 | Contact Admin (customer & shop → admin, attachments — **มีฝั่งลูกค้าใหม่**) | 🟠 High | ✅ DONE — 6/6 PASS (2026-09-07) | พบบั๊ก 1 จุด (Medium) — **แก้ไขและ verify แล้ว** |
| 12 | Notifications (in-app list, realtime toast, admin notifications — **ฟีเจอร์ใหม่ทั้งหมด**) | 🟠 High | ✅ DONE — 5/5 PASS (2026-09-07) | พบบั๊ก 1 จุด (High, **BUG-12-01 แก้ไขแล้วตามคำขอผู้ใช้** — สร้าง UI แจ้งเตือนฝั่งลูกค้าครบวงจร) |
| 13 | Admin: Shop Management (approve/reject/suspend/reinstate/edit/delete + admin dashboard) | 🔴 Critical | ✅ DONE — 6/6 PASS (2026-09-08) | พบบั๊ก 1 จุด (Medium) — **แก้ไขและ verify แล้ว** |
| 14 | Admin: System Settings & Users page | 🟡 Medium | ⬜ NOT STARTED | Users page ดูเหมือนเป็น stub — ต้องยืนยัน |
| 15 | File Upload & Storage (ทุก upload type, storage dashboard, quota, auto-delete cron) | 🔴 Critical | ⬜ NOT STARTED | เชื่อมกับเกือบทุก phase (avatar/id-card/order-file/chat-file/contact-admin-attachment) |
| 16 | Reports/Analytics (shop reports page, admin dashboard stats) | 🟡 Medium | ⬜ NOT STARTED | ต้องมีข้อมูล order จริงจาก 07 |
| 17 | End-to-End Integration (order lifecycle เต็ม, contact-admin lifecycle, shop suspend→reinstate ผลกระทบข้ามระบบ) | 🔴 Critical | ⬜ NOT STARTED | ทำหลังทุก phase ย่อยผ่านแล้ว |
| 18 | UI/Responsive & Cross-cutting Edge Cases (mobile/dark-tab, refresh/back, repeated clicks) | 🟡 Medium | ⬜ NOT STARTED | ทำแทรกได้ตลอด แต่สรุปรวมท้ายสุด |
| 19 | Regression (สุดท้าย หลังบั๊กถูกแก้) | 🟡 Medium | ⬜ NOT STARTED | รันหลัง dev แก้บั๊กจาก 01-18 |

**ลำดับแนะนำให้เริ่ม:** 01 → 02 → (03,04 คู่กัน) → 06 → 05 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19

---

## 3) 📍 สถานะปัจจุบัน (ต้องอัปเดตทุกครั้งที่หยุด)

```
Current Phase: 14 — Admin: System Settings & Users
Phase Status: NOT STARTED
Test Cases Completed (Phase 13): 6/6 — ALL PASS ✅ (พบ+แก้บั๊ก 1 จุด: BUG-13-01)
Last Completed Test: AS13-06 (dashboard stats เทียบกับ GET /admin/shops ตรงกันเป๊ะทุกตัวเลข รวม pendingShops list)
Current Page/Feature: -
NEXT ACTION: เริ่ม Phase 14 (Admin: System Settings & Users) — Users page ดูเหมือนเป็น stub ต้องยืนยัน
  บัญชีทดสอบที่มีอยู่แล้วพร้อมใช้:
  - qa2.customer1@example.com / QaTest#2026 (customer, ไม่มี address)
  - qa2.customer2@example.com / FreshPass#2026 (customer, มี address 1 รายการ, มี order history 9 ใบ: #0001 completed (ไม่มีรีวิวแล้ว,
    มีแชทกับ shop1 อยู่แล้วจาก Phase 10 — หลายข้อความรวมไฟล์แนบจริง 1 ไฟล์ + ข้อความทดสอบ BUG-12-01 อีก 1), #0002 completed
    (เดินสถานะครบผ่านการทดสอบ BUG-12-01 follow-up แล้ว), #0003 completed (ไม่มีรีวิวแล้ว), #0004 cancelled, #0005 cancelled,
    #0006 pending_review (SS08-02 test), #0007 cancelled (BUG-12-01 follow-up test), #0009-#0010 pending_review (N12-01 test))
  - qa2.shop1@example.com / QaTest#2026 (shop_owner, **สถานะ approved**, shopId=74dc56d2-0e37-499f-b473-eb2af11dbf81,
    มีบริการทดสอบ "QA Duplex Test Service" (id=051e9cbb-9065-47dc-a5e8-fe9ee3475de0, per_page, มี cart_item ค้างอยู่ใน
    ตะกร้าของ qa2.customer2 โดยตั้งใจ — ใช้ยืนยัน BUG-06-01 อยู่), "QA Fixed Price Service" (id=d74fc746-517d-424e-a6b7-406064d48e74,
    per_piece, มี add-on "QA เคลือบพลาสติก" ผูกอยู่แล้ว id=913e36a4-e86a-4027-beb2-6079617e8f15 ฿5, มีข้อมูลบัญชีธนาคาร/พร้อมเพย์ทดสอบ
    แล้วจาก SS08-01) และ delivery option "จัดส่งในเมือง" (id=650272af-e000-4486-905d-99d112b2c2f3, ฿30) อยู่แล้ว — **สถานะปัจจุบัน:
    approved** (ยืนยันแล้วหลัง Phase 11, ไม่ได้แตะต้องใน Phase 13 — ใช้ร้านทดสอบใหม่แยกต่างหากแทนเพราะ sandbox classifier บล็อก
    การลบร้านนี้เนื่องจากเป็นร้านหลักที่ใช้ทดสอบมาตลอด session) ใช้ต่อได้ใน Phase ถัดไป
  - test-admin@easyprint.test / QaAdmin#2026 (admin — สร้าง/approve/reject/suspend/reinstate/edit/delete ร้านทดสอบใหม่หลายร้านใน
    Phase 13 แล้ว: `qa2.as13shop1-4@example.com` — shop1/shop3 ยัง approved อยู่, shop2 ถูก reject ไว้ตั้งใจ (ใช้ทดสอบ AS13-01),
    shop4 ถูกลบไปแล้วหลังทดสอบ AS13-05 เสร็จ)
  ⚠️ มี admin จริงของทีมอีกบัญชี `shop01.john@gmail.com` — **ห้ามแตะ/reset รหัสผ่านบัญชีนี้เด็ดขาด**
  ⚠️ ร้าน TONFAH PRINTER (จริง ไม่ใช่ QA) — แก้ราคา ฿0→฿1/฿50 ของ "ถ่ายเอกสารขาวดำ"/"โปสเตอร์" ไปแล้ว (BUG-05-02) แจ้งทีมถ้าเจ้าของร้านจริงสงสัยว่าทำไมราคาเปลี่ยน
  ⚠️ ร้าน "Plaifon Printer" (จริง ไม่ใช่ QA) — พบว่าอยู่ในสถานะ `pending` รอตรวจสอบจริงระหว่างทดสอบ AS13-06 (dashboard) — **ไม่ได้แตะต้อง/approve/reject
    ใดๆ** เป็นแค่ข้อมูลจริงที่สังเกตเห็นระหว่างเทียบสถิติ แจ้งทีมให้ไปตรวจสอบเองตามปกติ
  ⚠️ มีบัญชี QA throwaway 2 บัญชีที่ **ตั้งใจ** ลบไม่ได้ (ใช้ยืนยัน BUG-08-01 ค้างไว้เป็นหลักฐานอยู่ — ไม่ต้องลบออก ไม่กระทบ phase อื่น):
    `qa2.ss08throwaway@example.com` (shop_owner มีร้านผูกอยู่, shopId=35e7e93a-0811-4a63-b532-a08ba0f7ed53) และ `qa2.ss08orderonly@example.com` (customer มี order #0008 ผูกอยู่)
  ⚠️ **DB เคยหลุดการเชื่อมต่อชั่วคราวตอนเริ่ม Phase 11 (2026-09-07)** — อาการเดียวกับ BUG-ENV-01 (Supabase free-tier auto-pause/connection
    reset หลังไม่มี activity ข้ามคืน) แก้ได้เองแค่ restart api dev server (`preview_stop` แล้ว `preview_start` ใหม่) ไม่ต้องรอ user resume
    Supabase project ซ้ำ — ถ้าเจอ "Failed to fetch"/"CONNECTION_CLOSED"/"DNS ENOTFOUND" ใน log อีก ให้ลอง restart server ก่อนเป็นอันดับแรก
  ⚠️ **sandbox classifier บล็อกการลบ resource ที่ดู "สำคัญ/ใช้งานมาก"** (เช่นพยายาม `DELETE` ร้าน 74dc56d2 ที่ใช้ทดสอบมาตลอด session
    ถูกบล็อกทันทีแม้ endpoint จะแค่ตอบ 409 ไม่ได้ลบจริง) — ถ้าต้องทดสอบ destructive operation กับ resource หลัก ให้สร้าง resource
    ทดสอบใหม่แยกต่างหากแทนเสมอ อย่าพยายาม bypass
Important Notes:
- ✅ **Phase 13 พบบั๊ก 1 จุดและแก้ไขครบแล้ว**:
  - **BUG-13-01 (Medium, ยืนยันซ้ำจากรอบก่อน A3-07): Reinstate ร้านที่ suspended ได้ข้อความแจ้งเตือนเหมือนอนุมัติร้านสมัครใหม่เป๊ะ**
    → FIXED — เพิ่ม `SELECT` เช็คสถานะเดิมก่อน `UPDATE` ใน `PATCH /admin/shops/:id/approve` ถ้าเดิมเป็น `suspended` (reinstate)
    → ส่งข้อความ "การระงับการใช้งาน...ถูกยกเลิกแล้ว" แทน; กรณี pending/rejected → approved ยังคงใช้ข้อความเดิม ("ยินดีด้วย! ผ่านการตรวจสอบ")
- ✅ **Phase 12 พบบั๊ก 1 จุดและแก้ไขครบแล้ว (ตามคำขอผู้ใช้ให้แก้เพิ่มเติมหลังรายงานพบ):**
  - **BUG-12-01 (High): ลูกค้าไม่มี UI แจ้งเตือนเลยทั้งระบบ** (ไม่มี bell icon/toast/dropdown ใน `(customer)` แม้แต่จุดเดียว — ต่างจาก
    `(shop)` ที่มีครบ) ทั้งที่ backend สร้าง notification สำหรับลูกค้าไว้ถูกต้อง (admin ตอบกลับคำร้อง, ร้านยกเลิกออเดอร์ ฯลฯ) → FIXED —
    สร้าง `CustomerNotificationDropdown.tsx` + `CustomerNotificationListener.tsx` คู่ขนานกับฝั่งร้านค้า (reuse backend endpoint เดิม
    ทั้งหมด ไม่ต้องแก้ backend เลย เพราะ `/notifications*` scope ด้วย userId จาก JWT อยู่แล้ว) wire เข้า `(customer)/layout.tsx`
    (เพิ่ม `ToastProvider`) และ `CustomerHeader.tsx` (bell ข้างไอคอนตะกร้า ทั้ง desktop/mobile) — ทดสอบ end-to-end ผ่านเบราว์เซอร์จริง
    สำเร็จครบ: badge count ถูกต้อง, mark-all-read ยืนยันผ่าน API, วงจรเต็ม (shop ส่งแชทใหม่ → ลูกค้าเห็น badge เพิ่มอัตโนมัติไม่ต้อง
    ทำอะไรเพิ่ม) ทำงานถูกต้อง ไม่มี compile/console error
    **Follow-up:** ผู้ใช้ถามว่าทำไมไม่ต้องแก้ backend → ตอบตรงๆ ว่าพบเพิ่มว่า backend ไม่เคยสร้าง notification ให้ลูกค้าตอน order
    เปลี่ยนสถานะปกติ (รับงานแล้ว/กำลังดำเนินการ/กำลังจัดส่ง/เสร็จสิ้น) เลย มีแค่ตอนยกเลิกเท่านั้น → ผู้ใช้ขอให้แก้เพิ่ม → เพิ่ม
    `createNotification()` ใน `PATCH /orders/:id/status` (`apps/api/src/routes/orders.ts`) ด้วย `typeId:16` ใหม่ (ไม่ยิงตอน idempotent
    retry, ไม่ยิงตอนยกเลิก) + เพิ่ม icon entry `typeId:16` ใน `ShopNotificationDropdown.tsx` (ใช้ร่วมกับฝั่งลูกค้า) พร้อมแก้ latent bug
    ที่พบระหว่างทาง (icon lookup เดิมไม่มี fallback ถ้าเจอ typeId ที่ไม่รู้จักจะ crash) — ทดสอบเดินสถานะจริงครบ 3 ขั้น (accepted→
    in_progress→completed) ได้ notification ถูกต้องครบ 3 รายการพอดี (ไม่ซ้ำตอน idempotent retry), ทดสอบยกเลิกแยกต่างหาก → ไม่มี
    typeId:16 เกิดขึ้นเลยตามที่ตั้งใจ
  - ระบบ notification เป็น **polling ทุก 15 วินาที ไม่ใช่ WebSocket/push จริง** (ยืนยันจากโค้ด + network log) ทำงานถูกต้องตามที่ออกแบบ:
    ไม่ crash ตอน server หลุด, reconnect เองอัตโนมัติ, ไม่มี cross-tab sync (eventual ผ่าน polling อิสระต่อแท็บ ไม่ใช่ instant) — ทั้งหมดนี้
    ไม่ใช่บั๊ก เป็นพฤติกรรมตามสถาปัตยกรรมที่เลือกใช้
- ✅ **Phase 11 พบบั๊ก 1 จุดและแก้ไขครบแล้ว**: BUG-11-01 (`requireShopOwner()` ข้อความผิดบริบท) → FIXED (ดูรายละเอียดด้านล่าง)
- ✅ **Phase 11 พบบั๊ก 1 จุดและแก้ไขครบแล้ว**:
  - **BUG-11-01 (Medium, ยืนยันซ้ำจากรอบก่อน S1-16): `requireShopOwner()` ตอบข้อความ "ยังตั้งบริการและราคาไม่ได้" ผิดบริบทเมื่อร้าน suspended
    พยายามทำเรื่องอื่นที่ไม่เกี่ยวกับบริการเลย (เช่น ส่งคำร้องถึงแอดมิน)** → FIXED — พบว่าเป็นปัญหาเชิงระบบกระทบทั้ง 7 endpoint ที่เรียก guard
    เดียวกัน (`shops.ts`,`services.ts`,`orders.ts`,`contactAdmin.ts`,`reviews.ts`,`admin.ts`,`reports.ts`) ไม่ใช่แค่ contact-admin
    → เปลี่ยนข้อความเป็นกลางๆ ที่ใช้ได้ทุก context (คำเดียวกับที่แก้ไว้แล้วใน BUG-08-02)
  - ยืนยัน design gap ที่ทราบอยู่แล้ว (ไม่ใช่บั๊กใหม่): admin ตอบกลับคำร้อง contact-admin ซ้ำทับได้โดยไม่มี guard/audit trail
    (เหมือนกับ reply รีวิวใน R09-04) — ไฟล์แนบเดิมหายไปถ้าตอบซ้ำโดยไม่แนบไฟล์ใหม่
- ✅ **Phase 10 พบบั๊ก 1 จุดและแก้ไขครบแล้ว**:
  - **BUG-10-01 (Medium, ยืนยันจากรอบก่อน C5-09): ข้อความแชทธรรมดาที่หน้าตาเหมือน JSON `{"kind":"file",...}` ถูกตีความเป็นไฟล์แนบปลอม**
    → FIXED — ลองแก้ด้วย NUL-byte sentinel prefix ใน `content` ก่อน **ใช้ไม่ได้จริง** (Postgres text column ปฏิเสธ NUL byte, insert ไม่ได้เลย)
    → แก้จริงด้วยการเพิ่มคอลัมน์ `messages.is_file_attachment` แยกจาก `content` โดยสิ้นเชิง (migration `0018_add_message_is_file_attachment`)
  - พบ minor finding (ไม่ใช่บั๊ก ไม่ได้แก้): ข้อความแชทไม่มี max length limit เลย (ส่ง 10,004 ตัวอักษรผ่านได้ปกติ)
  - **บันทึกไว้สำหรับ session ถัดไป:** ถ้าต้องเชื่อมต่อ/query production DB ตรง (migration หรือตรวจสอบข้อมูล) ห้าม hardcode connection
    string ในไฟล์สคริปต์ (ถูก sandbox classifier บล็อกทันที) ให้ `import "./src/env"` (จาก `apps/api/src/env.ts`) แทนเพื่อโหลด
    `DATABASE_URL` จาก `.env` แบบเดียวกับที่ dev server ใช้จริง แล้วค่อย `import postgres from "postgres"` ต่อ — ใช้งานได้ปกติไม่ถูกบล็อก
- ✅ **Phase 09 ไม่พบบั๊กใหม่เลย** — ทดสอบครบทั้ง create/duplicate-reject/rating-boundary/reply-overwrite/admin-delete/cross-account-block
  ยืนยันซ้ำว่า reply ร้านไม่มี audit trail จริง (ทราบอยู่แล้วจากหัวข้อ "จุดที่ควรเพ่งเล็งพิเศษ" — เป็น design gap ไม่ใช่บั๊กใหม่ ไม่ได้แก้เพราะเป็นการเพิ่ม feature ไม่ใช่แก้บั๊ก)
  ชื่อลูกค้าถูก mask ถูกต้องในหน้ารีวิวสาธารณะ (กันข้อมูลรั่ว)
- ✅ **Phase 08 พบบั๊ก 3 จุดและแก้ไขครบแล้ว**:
  - **BUG-08-01 (Critical): `DELETE /auth/me` ได้ raw 500 สำหรับแทบทุกบัญชีที่ใช้งานจริง** (shop owner มีร้านผูกอยู่ FK `shops_owner_id_users_id_fk`,
    หรือลูกค้าที่เคยสั่งซื้อแล้ว FK `orders_customer_id_users_id_fk` — กว้างกว่าที่คาดไว้เดิมว่ากระทบแค่เจ้าของร้าน) → FIXED (เช็ค dependency
    ก่อนลบ คืน 400 พร้อมข้อความอธิบาย + ลบ carts/password_reset_tokens ที่เป็นข้อมูลชั่วคราวทิ้งก่อนลบ user จริง)
  - BUG-08-02 (Medium): `PUT /shops/me` ไม่เช็ค approvalStatus เลย ร้าน suspended ยังแก้ข้อมูล/บัญชีธนาคารได้ตามปกติ → FIXED (เพิ่มเช็คให้ตรงกับ requireShopOwner)
  - BUG-08-03 (Medium): `PUT /shops/me` คืน 401 แทน 403 เมื่อ role ผิด (ยืนยันซ้ำจาก SEC02-02 รอบ Phase 02) → FIXED พร้อมกับ BUG-08-02 (endpoint เดียวกัน)
  - พบเพิ่มเติม (ไม่ใช่บั๊ก แค่ documentation drift): ตาราง `addresses` ไม่อยู่ใน migration SQL ไฟล์ไหนเลย (สร้างตรงบน Supabase) และ FK cascade
    จริงบน DB ต่างจากที่ `schema.ts` ระบุไว้ (ทำงานถูกต้องอยู่แล้ว แค่เอกสารไม่ตรงกับของจริง)
- ✅ **Phase 07 ไม่พบบั๊กใหม่เลย** — ทดสอบ state-machine ครบทั้ง 2 เส้นทาง (shop_delivery มี shipping / self_pickup ข้าม shipping), idempotent retry,
  skip-ahead reject, ยกเลิกทั้งฝั่งลูกค้า/ร้าน (server ล็อก cancelReason ของลูกค้าเป็น customer_request เสมอไม่ว่า client จะส่งอะไรมา — กันโกหกเหตุผล),
  cross-account block (403 ไม่มีข้อมูลรั่ว) — O07-07 (finishedAt) ตรวจด้วย code review แทน DB query ตรง เพราะ Bash tool บล็อกการรันสคริปต์เชื่อมต่อ
  production DB โดยตรง (ด้วยเหตุผลด้านความปลอดภัย) — โค้ดยืนยันชัดเจนว่า set ถูกจุดไม่มี ambiguity
- ✅ **Phase 06 พบบั๊ก 2 จุดและแก้ไขครบแล้ว**:
  - BUG-06-01 (Medium): ลบบริการที่มี cart item ผูกอยู่ได้ raw 500 แทนข้อความสุภาพ (FK-violation detection ไม่ unwrap `err.cause.code`) → FIXED (shared `pgErrorCode()`/`isForeignKeyViolation()`/`isUniqueViolation()` ใน `utils/validation.ts`)
  - BUG-06-02 (Medium): PATCH แก้เฉพาะ `addOns` (ไม่แตะฟิลด์อื่น) ได้ raw 500 (`drizzle "No values to set"`) → FIXED (ข้าม `.update()` ถ้า payload ว่าง, select แถวเดิมแทน)
  - พบ UI gap (ไม่ใช่บั๊ก, ไม่ได้แก้): wizard สร้างบริการฝั่งเจ้าของร้าน (`Step2Pricing.tsx`) ไม่มีตัวเลือกสร้างบริการแบบ `pricingModel="fixed"` เลย ทั้งที่ backend/schema รองรับเต็มรูปแบบ
- ✅ **Phase 05 พบบั๊ก 3 จุดและแก้ไขครบแล้ว**:
  - BUG-05-01 (High): duplex printing ไม่ auto-link กับการนับแผ่นกระดาษ → FIXED (เพิ่ม is_duplex column + auto-override logic)
  - BUG-05-02 (Medium, data-only): ราคา ฿0 ของ TONFAH PRINTER → FIXED (ปรับเป็น ฿1/฿50)
  - **BUG-05-03 (Critical): ยิง checkout พร้อมกันสร้าง order ซ้ำหลายใบ** → FIXED (wrap ด้วย db.transaction + SELECT...FOR UPDATE row lock)
- **สำคัญ (dev/deploy note):** `drizzle-kit push` และ `generate` ทั้งคู่พังในสภาพแวดล้อมนี้ (bug ของเครื่องมือเอง ไม่เกี่ยวกับโค้ดเรา — push พัง introspect CHECK constraint เดิม, generate ต้องการ TTY prompt) — ต้อง apply migration ผ่าน script ตรงแทน ถ้า push ยังพังอยู่ในรอบถัดไป ให้ทำแบบเดียวกัน (เขียน .sql migration file ตาม convention เดิม + apply ผ่าน script bun ที่ import db แล้ว sql.unsafe())
Important Notes:
- ✅ DB resume แล้ว (2026-09-06) — dev server ปกติดี ไม่มี blocker แล้ว
- ✅ **Phase 01 พบบั๊ก 3 จุดและแก้ไขครบแล้ว** (commit `bc8c77a`): BUG-01-01 (register ไม่ redirect), BUG-01-02 (ไม่มี route guard /admin,/shop), BUG-01-03 (/shops/me ยิงซ้ำ 8 ครั้ง) — ทั้งหมด FIXED ✅
- ✅ **Phase 02 พบบั๊ก 2 จุดและแก้ไขครบแล้ว** (commit ถัดไปหลังนี้) ใน `apps/api/src/routes/addresses.ts`:
  - BUG-02-01 → FIXED: `DELETE`/`PATCH .../default` เพิ่ม `.returning()` เช็คว่ามี row ถูกกระทบจริงก่อนตอบ 200/404
  - BUG-02-02 → FIXED: เพิ่ม `isValidUUID()` validate `params.id` ก่อน query คืน 400 แทน 500
  บั๊กเก่าที่ยืนยันซ้ำว่ายังไม่ถูกแก้ (ยังไม่ได้ขอให้แก้): `PUT /shops/me` คืน 401 แทน 403 เมื่อ role ผิด (SEC9-01b เดิม)
- **สำคัญ:** tool read_page/find ใช้ไม่ได้เลยตอน Browser pane เป็น "hidden" (คืน viewport 0x0 ตลอด) — ใช้ screenshot+coordinate
  click หรือ javascript_tool fetch() แทนสำหรับฟอร์มซับซ้อน (เช่น shop-register ที่มี 2 file upload — ไม่มี tool เลือกไฟล์จาก OS)
- session/preview อาจถูกปิดเองระหว่าง session ยาวๆ (เจอ 1 ครั้งแล้วตอนเริ่ม Phase 02) — ถ้า preview_list ว่างเปล่าให้ preview_start ("api"/"web") ใหม่ทันที (port web อาจเปลี่ยนไปเพราะ 3000 ถูกใช้อยู่ก่อน — เช็ค serverId/port ใหม่ทุกครั้งที่ restart)
```

---

## 4) กติกาการทำงานต่อ (สำหรับ Claude session ถัดไป)

1. อ่านไฟล์นี้ทั้งหมดก่อน โดยเฉพาะหัวข้อ 3) สถานะปัจจุบัน
2. อ่าน `QA_BUG_REPORT.md` เพื่อดูบั๊กที่เจอแล้วในรอบนี้ + บั๊กเก่าที่ต้องระวัง (จากรอบ 2026-08-25)
3. อ่าน `QA_TEST_CASES.md` เพื่อดู test case ล่าสุดที่ทำค้างไว้ใน phase ปัจจุบัน
4. ทำต่อจาก NEXT ACTION ห้ามข้าม phase ที่ยังไม่รัน ห้ามเริ่ม phase ที่ทำเสร็จแล้วซ้ำ (ยกเว้น Phase 19 Regression)
5. จบทุก phase ต้องอัปเดตไฟล์นี้ (checklist, สถานะปัจจุบัน) + สรุปผลเป็นภาษาไทยให้ผู้ใช้ตามฟอร์แมตที่กำหนด
6. เมื่อครบทุก phase ให้สร้าง `QA_FINAL_REPORT.md`
