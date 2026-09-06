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
| 02 | Security & Permission Matrix (bootstrap: role/ownership check ทุก endpoint หลัก) | 🔴 Critical | ⬜ NOT STARTED | ทำเร็วๆ เพื่อกัน phase อื่นเทสบน endpoint ที่มีช่องโหว่พื้นฐาน (เรียนรู้จากรอบก่อนว่าวิธีนี้ได้ผลดี) |
| 03 | Customer Account & Profile (profile, addresses CRUD, change password) | 🟠 High | ⬜ NOT STARTED | ต้องมีบัญชีก่อนเข้าฟีเจอร์อื่น |
| 04 | Shop Discovery & Browsing (public shop list/detail/service order page) | 🟠 High | ⬜ NOT STARTED | ไม่ต้อง login — ทำคู่กับ 03 ได้ |
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
Current Phase: 02 — Security & Permission Matrix (bootstrap)
Phase Status: NOT STARTED
Test Cases Completed (Phase 01): 14/14 — ALL PASS ✅
Last Completed Test: A01-13 (customer → /admin route, retest หลังแก้บั๊กแล้ว PASS)
Current Page/Feature: -
NEXT ACTION: เริ่ม Phase 02 (Security & Permission Matrix) — ยิงทุก endpoint สำคัญด้วย token ผิด role/ไม่มี token/ownership ผิดคน
  บัญชีทดสอบที่มีอยู่แล้วพร้อมใช้: qa2.customer1@example.com, qa2.customer2@example.com (รหัส NewQaTest#2026 — ถูกเปลี่ยนระหว่าง
  ทดสอบ reset password), qa2.shop1@example.com (shop_owner, สถานะ pending, รหัส QaTest#2026, shopId=74dc56d2-0e37-499f-b473-eb2af11dbf81)
  ยังไม่มีบัญชี admin ทดสอบ — ต้องขอ credential admin จริงจากผู้ใช้ หรือดูว่ามี seed admin account อยู่แล้วหรือไม่ (เช็ค apps/api/src/seed.ts)
Important Notes:
- ✅ DB resume แล้ว (2026-09-06) — dev server ปกติดี ไม่มี blocker แล้ว
- ✅ **Phase 01 พบบั๊ก 3 จุดและแก้ไขครบแล้วตามคำขอผู้ใช้** (ดูรายละเอียด fix + verification เต็มใน QA_BUG_REPORT.md):
  - BUG-01-01 (register ไม่ redirect) → FIXED: เปลี่ยน router.push→router.replace ใน register/page.tsx
  - BUG-01-02 (ไม่มี route guard /admin,/shop) → FIXED: เพิ่ม apps/web/lib/hooks/useRequireRole.ts ใช้ใน AdminLayout/ShopLayout
  - BUG-01-03 (/shops/me ยิงซ้ำ 8 ครั้ง) → FIXED: เพิ่ม in-flight GET dedup ใน apps/web/lib/api/client.ts
  **โค้ดที่แก้ยังไม่ได้ commit** — รอตัดสินใจว่าจะ commit ตอนไหน (แนะนำ commit แยกจาก docs branch เดิม หรือถามผู้ใช้ก่อน push)
- **สำคัญ:** tool read_page/find ใช้ไม่ได้เลยตอน Browser pane เป็น "hidden" (คืน viewport 0x0 ตลอด) — ใช้ screenshot+coordinate
  click หรือ javascript_tool fetch() แทนสำหรับฟอร์มซับซ้อน (เช่น shop-register ที่มี 2 file upload — ไม่มี tool เลือกไฟล์จาก OS)
- บัญชีทดสอบที่สร้างไว้แล้ว (ใช้ต่อได้ในเฟสถัดไป):
  - qa2.customer1@example.com / QaTest#2026 (customer)
  - qa2.customer2@example.com / NewQaTest#2026 (customer, รหัสผ่านถูกเปลี่ยนระหว่างทดสอบ A01-10)
  - qa2.shop1@example.com / QaTest#2026 (shop_owner, shop "QA Test Print Shop", status pending)
- dev server: `bun --cwd apps/api dev` (port 4000), `bun --cwd apps/web dev` (ขึ้น port 54488 เพราะ 3000 ถูกใช้อยู่ก่อน)
  ใช้ preview_start ("api"/"web") — serverId ปัจจุบัน: api=7bb56027-e035-496a-b4fd-5607061a811a, web=7b2326da-fbc4-47ff-9571-56bbb9d1e686
```

---

## 4) กติกาการทำงานต่อ (สำหรับ Claude session ถัดไป)

1. อ่านไฟล์นี้ทั้งหมดก่อน โดยเฉพาะหัวข้อ 3) สถานะปัจจุบัน
2. อ่าน `QA_BUG_REPORT.md` เพื่อดูบั๊กที่เจอแล้วในรอบนี้ + บั๊กเก่าที่ต้องระวัง (จากรอบ 2026-08-25)
3. อ่าน `QA_TEST_CASES.md` เพื่อดู test case ล่าสุดที่ทำค้างไว้ใน phase ปัจจุบัน
4. ทำต่อจาก NEXT ACTION ห้ามข้าม phase ที่ยังไม่รัน ห้ามเริ่ม phase ที่ทำเสร็จแล้วซ้ำ (ยกเว้น Phase 19 Regression)
5. จบทุก phase ต้องอัปเดตไฟล์นี้ (checklist, สถานะปัจจุบัน) + สรุปผลเป็นภาษาไทยให้ผู้ใช้ตามฟอร์แมตที่กำหนด
6. เมื่อครบทุก phase ให้สร้าง `QA_FINAL_REPORT.md`
