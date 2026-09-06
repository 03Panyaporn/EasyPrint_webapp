# QA_TESTING_PROGRESS.md — สถานะการทดสอบ EasyPrint

> **นี่คือ Single Source of Truth ของการทดสอบทั้งหมด** — Claude session ใหม่ทุกตัวต้องอ่านไฟล์นี้ก่อนเริ่มงาน
> อัปเดตล่าสุด: 2026-09-06
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
| 05 | Cart & Checkout (add/edit cart, delivery options, payment slip, checkout) | 🔴 Critical | ⬜ NOT STARTED | ธุรกิจหลักของระบบ ต้องมี service จาก shop ก่อน (dependency: 06) |
| 06 | Shop Service Management (CRUD services/add-ons/delivery options/duplicate) | 🔴 Critical | ⬜ NOT STARTED | ต้องมีร้าน approved ก่อน (dependency: 01) — ทำก่อน 05 |
| 07 | Order Management (customer history/detail/cancel + shop order list/status workflow) | 🔴 Critical | ⬜ NOT STARTED | ต้องมี order จาก 05 ก่อน |
| 08 | Shop Settings & Account (payment/notification settings, change password/email, delete account) | 🟠 High | ⬜ NOT STARTED | |
| 09 | Reviews (customer add/view, shop reply, admin moderate/delete) | 🟠 High | ⬜ NOT STARTED | ต้องมี order สถานะ completed จาก 07 |
| 10 | Chat/Messaging (rooms, send/read, file attach — **เขียนใหม่ทั้งไฟล์เมื่อไม่นานมานี้**) | 🔴 Critical | ⬜ NOT STARTED | ต้องมี order จาก 05; ไฟล์ถูกเขียนใหม่ล่าสุด ความเสี่ยงสูง |
| 11 | Contact Admin (customer & shop → admin, attachments — **มีฝั่งลูกค้าใหม่**) | 🟠 High | ⬜ NOT STARTED | |
| 12 | Notifications (in-app list, realtime toast, admin notifications — **ฟีเจอร์ใหม่ทั้งหมด**) | 🟠 High | ⬜ NOT STARTED | ไม่มี baseline เลย ต้องเทสละเอียด |
| 13 | Admin: Shop Management (approve/reject/suspend/reinstate/edit/delete + admin dashboard) | 🔴 Critical | ⬜ NOT STARTED | กระทบทุกฟีเจอร์อื่นเมื่อ suspend |
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
Current Phase: 04 — Shop Discovery & Browsing (Public)
Phase Status: NOT STARTED
Test Cases Completed (Phase 03): 6/6 — ALL PASS ✅ (ไม่พบบั๊กใหม่)
Last Completed Test: C03-06 (ลบบัญชีลูกค้าไม่มี order ผูก — PASS; เคสมี order ผูก รอ Phase 05)
Current Page/Feature: -
NEXT ACTION: เริ่ม Phase 04 (Shop Discovery & Browsing) — ดูรายชื่อร้านสาธารณะ, หน้าร้าน, หน้าบริการ (ไม่ต้อง login)
  บัญชีทดสอบที่มีอยู่แล้วพร้อมใช้ (หลัง Phase 03):
  - qa2.customer1@example.com / QaTest#2026 (customer, **ไม่มี address แล้ว** — ถูกลบทดสอบ C03-05, ต้องสร้างใหม่ถ้า Phase 05 ต้องใช้)
  - qa2.customer2@example.com / **FreshPass#2026** (customer, รหัสผ่านเปลี่ยนระหว่างทดสอบ C03-02 — เดิมคือ NewQaTest#2026, ตอนนี้เปลี่ยนเป็น FreshPass#2026 แล้ว, firstname/lastname อัปเดตเป็น "QA Customer2Updated", เบอร์ 0899999999)
  - qa2.shop1@example.com / QaTest#2026 (shop_owner, สถานะ pending, shopId=74dc56d2-0e37-499f-b473-eb2af11dbf81)
  - test-admin@easyprint.test / QaAdmin#2026 (admin)
  - qa2.deleteme@example.com — **ถูกลบแล้ว ใช้ไม่ได้อีก** (ใช้ทดสอบ C03-06 เสร็จแล้ว)
  ⚠️ มี admin จริงของทีมอีกบัญชี `shop01.john@gmail.com` — **ห้ามแตะ/reset รหัสผ่านบัญชีนี้เด็ดขาด**
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
