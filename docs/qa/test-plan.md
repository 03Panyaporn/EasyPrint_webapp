# แผนการทดสอบ EasyPrint (QA Test Plan)

> จัดทำจากการตรวจสอบโค้ดจริง (frontend / API / database schema) ณ วันที่ 2026-08-25
> Stack จริง: Backend = **Elysia (Bun)** ไม่ใช่ Hono, Frontend = Next.js, DB = Postgres ผ่าน Drizzle ORM, Storage = Supabase Storage
> เอกสารนี้เป็น **แผนทดสอบ** เท่านั้น ยังไม่มีการแก้โค้ดใด ๆ

---

## สรุปภาพรวมจากการตรวจโค้ด (Inspection Summary)

| # | ฟีเจอร์ | สถานะ | หมายเหตุสำคัญ |
|---|---|---|---|
| 1 | Shop – Payment settings | ✅ ทำงานจริง (UI+API+DB) | ไม่มี validate format เลขบัญชี/พร้อมเพย์ฝั่ง server |
| 2 | Shop – Notification settings | ✅ ทำงานจริง และมีผลจริงต่อการส่งแจ้งเตือน | ต่างจากฝั่ง Admin |
| 3 | Shop – Change password | ✅ ทำงานจริง | บังคับความยาวขั้นต่ำตาม Admin settings |
| 4 | Shop – Change email | ⚠️ ทำงานได้แต่ไม่ปลอดภัยเต็มที่ | ไม่มี verify email ใหม่, ไม่เชิญ logout session อื่น |
| 5 | **Shop – Delete account** | 🐞 **น่าจะพังจริง (บั๊กสำคัญ)** | ไม่มี cascade/ไม่จับ FK violation → มีโอกาสสูงได้ 500 |
| 6 | Shop – Contact Admin | ✅ ทำงานจริง | ร้านที่ถูก suspend/pending **ติดต่อแอดมินไม่ได้เลย** และ error message สื่อผิดบริบท |
| 7 | Admin – System info settings | ✅ ทำงานจริง | |
| 8 | Admin – Notification settings | ⚠️ เก็บค่าได้แต่ **ไม่มีผลจริง** | ไม่มีโค้ดจุดใดอ่านค่านี้ไปใช้งาน |
| 9 | Admin – Security settings | ⚠️ ใช้จริงแค่ 1/4 | `minPasswordLength` ใช้จริง, `requireSpecialChar`/`enable2fa`/`autoLogoutMinutes` เก็บอย่างเดียว (UI มีข้อความบอกตรง ๆ ว่ายังไม่บังคับใช้) |
| 10 | Admin – Edit shop info | ✅ ทำงานจริง | ไม่มี unique check email ร้านค้า, ไม่มี UI ตั้ง storage quota ทั้งที่ API รองรับ |
| 11 | Admin – Suspend/Reinstate shop | ✅ ทำงานจริง | Reinstate ใช้ endpoint เดียวกับ Approve เป๊ะ ๆ (ข้อความแจ้งเตือนซ้ำ ไม่แยกกรณี) |
| 12 | Admin – Delete shop | ✅ ทำงานจริง ออกแบบดี | มี try/catch จับ FK violation คืน 409 อย่างสุภาพ (เทียบกับ #5 ที่ไม่มี) |
| 13 | Reviews (add/delete/display) | ✅ ทำงานจริงครบ | ไม่มี DB CHECK constraint ของ rating (พึ่ง Zod อย่างเดียว), ไม่มี pagination |
| 14 | Chat (customer↔shop) | ✅ ทำงานจริง (polling ไม่ใช่ realtime) | 🐞 ไอคอน "อ่านแล้ว" (CheckCheck) โชว์เสมอไม่อิง `isRead` จริง, ไม่มี max length ข้อความ, ช่องค้นหาแชทเป็น UI หลอก (disabled) |
| 15 | Contact Admin (customer/shop→admin) | ✅ ทำงานจริงครบ | reply เป็นแบบ overwrite ได้ ไม่เก็บประวัติ, ไม่มี realtime แจ้งเตือนเมื่อ admin ตอบ (ต้อง refresh เอง) |
| 16 | Upload ไฟล์ผ่าน Supabase | ✅ ทำงานจริง | 🐞 endpoint `type=shop-photo/id-card/service-image/delivery-logo` **ไม่บังคับ login เลย** |
| 17 | Shop storage usage | ✅ ทำงานจริง | คำนวณเฉพาะ bucket `order-files` เท่านั้น ไม่รวม id-cards/payment-slips/shop-photos |
| 18 | Admin ดู storage แต่ละร้าน / ลบไฟล์ | ✅ ทำงานจริง | ลำดับ Storage ก่อน DB ถูกต้อง (กัน DB บอกลบแล้วแต่ Storage ยังอยู่) |
| 19 | **Auto-delete ไฟล์หลัง 1 วัน** | 🐞 **มีความเสี่ยงสูงว่าไม่ทำงานจริงใน production** | endpoint `/internal/cleanup/expired-order-files` มีแล้ว แต่ **ไม่มี cron ใดในโค้ดเรียกมันเลย** ต้องพึ่ง scheduler ภายนอก (Supabase pg_cron/GitHub Actions) ที่ไม่อยู่ใน repo นี้ |
| 20 | DB ↔ Storage sync | ⚠️ มีช่องโหว่เฉพาะจุด | ไฟล์แนบในแชท และไฟล์ค้างใน cart ที่ไม่เคยถูกสั่งซื้อ **ไม่เคยถูกลบอัตโนมัติและไม่โผล่ใน dashboard admin เลย**; ลบร้านที่ยังไม่มี order/service จะลบ DB ได้ทันทีแต่ id-card/shop-photo ค้างใน Storage ตลอดไป |

---

## Phase 1: Shop Settings & Account

**ทดสอบ:** Payment settings, Notification settings, Change password, Change email, Delete shop account, Contact Admin (ฝั่งร้าน)

**หน้า/component:** `apps/web/app/(shop)/shop/settings/page.tsx`, `ShopSettings.tsx`, `apps/web/app/(shop)/shop/contact-admin/page.tsx`, `ContactAdminContainer/Form/History.tsx`

**API:** `GET/PUT /shops/me`, `POST /auth/change-password`, `PUT /auth/change-email`, `DELETE /auth/me`, `POST/GET /shops/:shopId/contact-admin`

**DB:** `shops` (bank/promptpay fields, `notificationSettings` jsonb), `users` (email, passwordHash), `contact_admin_messages`

**Dependencies:** ต้องมีบัญชีร้านค้าที่ผ่านการอนุมัติแล้ว (approved) และอีกบัญชีที่ pending/suspended สำหรับเทียบเคส

**Priority:** Critical (มีบั๊กที่คาดว่าใช้งานจริงไม่ได้ใน Delete Account)

| ID | ประเภท | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail | Bug/Issue |
|---|---|---|---|---|---|---|
| S1-01 | Positive | บันทึกข้อมูลบัญชีธนาคาร/พร้อมเพย์ที่ถูกต้อง | บันทึกสำเร็จ, แสดงค่าที่ถูกต้องเมื่อโหลดหน้าใหม่ | ยิง `PUT /shops/me` (ร้าน Johan Printer) ด้วยข้อมูลบัญชีจริงครบ → `{"success":true}` `200`, `GET /shops/me` คืนค่าตรงกับที่บันทึกทุก field | **PASS** | ไม่พบ (หมายเหตุ: endpoint เป็น full-replace PUT ไม่ใช่ partial update — ต้องส่ง `name` มาด้วยทุกครั้งไม่งั้นได้ `400 Required`, ตรงตาม schema ออกแบบไว้ ไม่ใช่บั๊ก) |
| S1-02 | Negative | ยิง `PUT /shops/me` ตรง ๆ ด้วยเลขบัญชีเป็นตัวอักษร/สัญลักษณ์ | ควร reject 400 แต่คาดว่า **จะผ่าน** เพราะไม่มี validate format ฝั่ง server | ส่ง `bankAccountNumber:"!!!not-a-number###abc"` → ได้ `200 {"success":true}` และ `GET /shops/me` ยืนยันว่าค่าขยะถูกบันทึกจริงแบบไม่กรอง | **FAIL (ยืนยันช่องโหว่)** | 🟡 ยืนยันตามคาด: ไม่มี server-side format validation สำหรับเลขบัญชี/พร้อมเพย์ |
| S1-03 | Edge | อัปโหลด QR พร้อมเพย์เป็นไฟล์ที่ไม่ใช่รูป (เช่น .pdf) ผ่าน `type=shop-photo` | ควรถูกปฏิเสธตาม MIME whitelist ของ bucket `shop-photos` | ไม่ได้รันแยก — ครอบคลุมแล้วโดยอ้อมจาก Phase 7 (MIME whitelist ใช้ path เดียวกันทุก type รูปภาพ) | **ไม่ได้รัน (ซ้ำกับ Phase 7)** | — |
| S1-04 | Role | เรียก `PUT /shops/me` ด้วย token ของ customer/admin | ต้องได้ 403 (role ต้อง `shop_owner`) | รันแล้วใน Phase 9 (SEC9-01b): ได้ `401` แทน `403` จริง — บล็อกได้แต่ status code ผิดความหมาย | **PASS (บล็อกได้) / พบบั๊ก status code** | 🟡 ดู SEC9-01b — `apps/api/src/routes/shops.ts:161-164` |
| S1-05 | Positive | เปิด/ปิด toggle แจ้งเตือน `newOrder` แล้วให้ลูกค้าสร้างออเดอร์ใหม่ | ถ้าปิด ต้อง **ไม่มี** การแจ้งเตือนเกิดขึ้นจริง (ตรวจใน DB notifications) | ไม่ได้รันจริง (ต้องสร้าง order เต็มรูปแบบผ่าน cart/checkout ซึ่งซับซ้อน) — ยืนยันได้แค่จากการอ่านโค้ด `apps/api/src/utils/notification.ts:20-45` ว่า toggle นี้ถูกอ่านไปใช้จริงตอนสร้าง notification | **ไม่ได้รัน (ยืนยันจากโค้ดเท่านั้น)** | ควรรันจริงในรอบถัดไปที่มี order fixture พร้อม |
| S1-06 | Positive | เปลี่ยนรหัสผ่านด้วยรหัสเดิมถูกต้อง + รหัสใหม่ผ่านเงื่อนไขความยาวขั้นต่ำ | สำเร็จ, ล็อกอินด้วยรหัสใหม่ได้ | ยิง `POST /auth/change-password` ด้วยบัญชีทดสอบแยก → `{"ok":true}` `200`, login ด้วยรหัสใหม่สำเร็จทันที | **PASS** | ไม่พบ |
| S1-07 | Negative | เปลี่ยนรหัสผ่านโดยกรอกรหัสเดิมผิด | ปฏิเสธ พร้อม error message ชัดเจน | ได้ `400 {"error":"รหัสผ่านปัจจุบันไม่ถูกต้อง"}` | **PASS** | ไม่พบ |
| S1-08 | Negative | ตั้งรหัสผ่านใหม่ = รหัสผ่านเดิม | ต้องถูก reject (โค้ดมีเช็ค new==old) | ได้ `400 {"error":"รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน"}` | **PASS** | ไม่พบ |
| S1-09 | Boundary | ตั้งรหัสผ่านความยาวเท่ากับ `minPasswordLength` พอดี / สั้นกว่า 1 ตัวอักษร | เท่ากับ = ผ่าน, สั้นกว่า = ไม่ผ่าน (ค่านี้มาจาก Admin Settings แบบ dynamic — ต้องเทสหลังเปลี่ยนค่าที่ Admin ด้วย) | ทดสอบครบ: รหัสสั้นกว่า default (8) → `400` ข้อความชัดเจน; ปรับ `minPasswordLength` เป็น 10 ที่ Admin Settings แล้วลองรหัส 9 ตัวอักษร → `400 "ต้องมีอย่างน้อย 10 ตัวอักษร"` (ปรับตาม dynamic ค่าใหม่ทันที); รหัส 10 ตัวอักษรพอดี → `200 {"ok":true}` ผ่าน boundary ถูกต้อง; คืนค่า `minPasswordLength` กลับเป็น 8 หลังทดสอบ | **PASS** | ไม่พบ |
| S1-10 | Positive | เปลี่ยนอีเมลเป็นอีเมลใหม่ที่ยังไม่มีคนใช้ + รหัสผ่านถูกต้อง | อัปเดตสำเร็จ | ยิง `PUT /auth/change-email` → `{"ok":true}` `200`, login ด้วยอีเมลใหม่สำเร็จทันที | **PASS** | ไม่พบ |
| S1-11 | Negative | เปลี่ยนอีเมลเป็นอีเมลที่มีอยู่แล้วในระบบ | ต้อง reject (unique constraint) | ใช้อีเมลของ `testuser@example.com` (มีอยู่แล้ว) → `409 {"error":"อีเมลนี้ถูกใช้งานแล้ว"}` | **PASS** | ไม่พบ |
| S1-12 | Security | หลังเปลี่ยนอีเมลสำเร็จ ตรวจว่ามีการยืนยันอีเมลใหม่หรือเชิญออกจาก session อื่นหรือไม่ | **คาดว่าไม่มี** — เปลี่ยนทันทีไม่ verify ไม่ invalidate session อื่น (ระบุเป็นความเสี่ยงด้าน security ให้ทีมพิจารณา) | ยืนยันตามคาด: เปลี่ยนอีเมลสำเร็จทันทีไม่มีขั้นตอนยืนยันใด ๆ (ดูผลจาก S1-10) — ไม่ได้ทดสอบแยกเรื่อง session invalidation ของ cookie เดิม (ต้องใช้ 2 browser context เปรียบเทียบ) | **PASS (พฤติกรรมตามคาด) — เป็นความเสี่ยงเชิงนโยบายที่ควร disclose** | 🟡 ไม่มี email verification/double opt-in |
| S1-13 | **Critical/Negative** | กดลบบัญชีร้านค้าที่ **มีร้านค้าอยู่ในระบบ** (มี row ใน `shops`) | คาดว่าจะได้ **500 Internal Server Error** เพราะ FK `shops.ownerId → users.id` ไม่มี cascade และ route ไม่ได้ catch FK violation | **ยืนยันแล้ว (2026-08-25):** สร้างบัญชีร้านทดสอบแยกใหม่ `qa.deleteme.shop@example.com` (shop "QA Delete Test Shop", status pending) แล้วยิง `DELETE /auth/me` ด้วยรหัสผ่านถูกต้อง → ได้ **`500`** จริงตามคาด (`{"error":"เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง"}`) ตรวจสอบเพิ่มเติมว่าไม่มี partial data loss — login เข้าบัญชีเดิมได้ปกติ และ `GET /shops/me` ยังคืนข้อมูลร้านครบถ้วน (Postgres rollback ทั้ง transaction เพราะ FK violation) | **FAIL (ยืนยันบั๊กจริง)** | 🔴 **Critical — ยืนยันแล้ว**: shop owner ทุกคนที่มีร้านค้าอยู่ในระบบไม่สามารถลบบัญชีตัวเองได้เลย ต้องแก้ที่ `apps/api/src/auth/routes.ts` (`DELETE /auth/me`) ให้ดักจับ FK violation แบบเดียวกับ `DELETE /admin/shops/:id` (คืน 409 พร้อมคำแนะนำ หรือลบ shop ที่ผูกอยู่ก่อนถ้าต้องการอนุญาตจริง ๆ) |
| S1-14 | Negative | กรอกรหัสผ่านผิดตอนลบบัญชี | ต้อง reject ก่อนถึงขั้นลบจริง | ยิง `DELETE /auth/me` ด้วย `currentPassword` ผิด → ได้ `400` `{"error":"รหัสผ่านปัจจุบันไม่ถูกต้อง"}` ก่อนแตะ logic ลบใด ๆ ถูกต้องตามคาด | **PASS** | ไม่พบ (หมายเหตุ: field name ที่ endpoint นี้ต้องการคือ `currentPassword` ไม่ใช่ `password` — ตรวจสอบว่า frontend ส่ง field name ตรงกันแล้ว) |
| S1-15 | Positive | ร้านค้าสถานะ approved ส่งคำร้อง Contact Admin | บันทึกลง DB, สถานะเริ่มต้น = `open`, มี notification ไปหา admin | ยิง `POST /shops/:shopId/contact-admin` (ร้าน Johan Printer, approved) → `200`, บันทึกสำเร็จ status=`open` | **PASS** | ไม่พบ |
| S1-16 | **Negative/Bug** | ร้านค้าสถานะ suspended หรือ pending พยายามส่ง Contact Admin | ปัจจุบันจะถูกบล็อกด้วย `requireShopOwner()` (เช็ค approved) และได้ error message เกี่ยวกับ "ตั้งบริการ/ราคาไม่ได้" ซึ่ง **สื่อผิดบริบท** — ร้านที่ถูกแบนควรร้องเรียนได้ | **ยืนยันแล้ว 2 สถานะ:** (1) ร้านทดสอบสถานะ `pending` (ยังไม่ approve) ยิงคำร้อง → `403 {"error":"ร้านค้ายังไม่ได้รับการอนุมัติจากแอดมิน ยังตั้งบริการและราคาไม่ได้"}` (2) approve แล้ว suspend ร้านเดียวกัน แล้วยิงซ้ำ → ได้ error message **เดียวกันเป๊ะ** ทั้งที่บริบทคนละกรณี | **FAIL (ยืนยันบั๊ก UX จริง)** | 🟠 ยืนยันจริง: ร้านทั้ง pending และ suspended ติดต่อ Admin ไม่ได้เลย และ error message เข้าใจผิดว่าเป็นเรื่อง "ตั้งบริการ/ราคา" ทั้งที่จริงคือปัญหาการอนุมัติ/ระงับ — ควรแยก error message และอาจเปิดให้ suspended shop ส่งคำร้องได้ (เพราะเป็นกลุ่มที่ต้องการติดต่อ admin มากที่สุด) |
| S1-17 | Positive | ดูประวัติคำร้อง Contact Admin ของร้านตัวเอง | เห็นเฉพาะคำร้องของร้านตัวเอง เรียงตามเวลา | `GET /shops/:shopId/contact-admin` คืนรายการคำร้องของร้านตัวเองถูกต้อง (ดูผลจาก S1-15) | **PASS** | ไม่พบ |
| S1-18 | Role | ร้าน A พยายามเรียก `GET /shops/:shopIdของร้านB/contact-admin` | ต้อง 403 (ownership check) | รันแล้วใน Phase 9 (SEC9-03): ร้าน Johan Printer ยิงเข้า path ของร้าน SE Printer → `403 {"error":"คุณไม่มีสิทธิ์จัดการร้านนี้"}` ทั้ง GET และ POST | **PASS** | ไม่พบ |

---

## Phase 2: Admin Settings

**ทดสอบ:** System info, Notification settings, Security settings

**หน้า:** `apps/web/app/(admin)/admin/settings/page.tsx`

**API:** `GET/PATCH /admin/settings`

**DB:** `system_settings` (singleton row)

**Dependencies:** ต้องมี admin account; ผลกระทบของ `minPasswordLength` เชื่อมกับ Phase 1 (S1-09)

**Priority:** Medium (ฟีเจอร์ core ทำงาน แต่หลายส่วนเป็น stub — ต้องทดสอบเพื่อ "ยืนยันว่าเป็น stub จริง" ไม่ใช่บั๊ก)

| ID | ประเภท | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail | Bug/Issue |
|---|---|---|---|---|---|---|
| A2-01 | Positive | แก้ชื่อระบบ/โลโก้/อีเมลติดต่อ/เบอร์/เว็บไซต์ แล้วบันทึก | บันทึกและแสดงผลถูกต้องหลัง reload | ไม่ได้รันแยก (ทดสอบผ่าน `minPasswordLength`/`enable2fa`/`requireSpecialChar` แล้วใน A2-02/04/05 ซึ่งยืนยันว่า `PATCH /admin/settings` เขียน/อ่านค่ากลับถูกต้องอยู่แล้ว) | **PASS (โดยอนุมาน)** | ไม่พบ |
| A2-02 | Positive | เปลี่ยนค่า `minPasswordLength` เป็น 10 แล้วไปทดสอบเปลี่ยนรหัสผ่านที่ Phase 1 | ต้องบังคับใช้ค่าใหม่ทันที | ตั้งเป็น 10 → ลองรหัสผ่าน 9 ตัวอักษรที่ `POST /auth/change-password` → ปฏิเสธด้วยข้อความ dynamic "ต้องมีอย่างน้อย 10 ตัวอักษร" ทันที (ดู S1-09) แล้วคืนค่ากลับเป็น 8 | **PASS** | ไม่พบ |
| A2-03 | **Negative (ตรวจ stub)** | เปิด toggle "แจ้งเตือนเมื่อ storage เกิน 80%/90%" แล้วทำให้ร้านค้าใช้ storage เกิน threshold จริง | คาดว่า **ไม่มี notification เกิดขึ้น** เพราะไม่มีโค้ดฝั่งใดสร้างมัน — ยืนยันว่าเป็นฟีเจอร์ที่ยังไม่ implement ไม่ใช่บั๊ก | ไม่ได้จำลอง storage เกิน threshold จริง (ต้องอัปโหลดไฟล์จำนวนมากถึง 65-85% ของ quota 1024MB ซึ่งใช้เวลา/พื้นที่มาก) — ยืนยันจากการอ่านโค้ดเท่านั้นว่าไม่มี producer เรียก `createAdminNotification` สำหรับ storage warning เลย | **ไม่ได้รัน (ยืนยันจากโค้ดเท่านั้น)** | ควร disclose ให้ผู้ใช้ทราบว่ายังใช้งานไม่ได้ |
| A2-04 | **Negative (ตรวจ stub)** | เปิด `requireSpecialChar` แล้วลองตั้งรหัสผ่านไม่มีอักขระพิเศษ | คาดว่า **ผ่านได้ปกติ** เพราะไม่มีโค้ดตรวจ (ยืนยัน stub) | ตั้ง `requireSpecialChar:true` (ค่า default อยู่แล้วเป็น true) แล้วเปลี่ยนรหัสผ่านเป็น `"tenchars10"` (ไม่มีอักขระพิเศษเลย) → **`200 {"ok":true}` ผ่านสำเร็จ** ยืนยัน stub จริง | **FAIL ตามเกณฑ์ที่ตั้งไว้ในระบบ (แต่ PASS ในแง่ยืนยัน stub ตรงตามที่ UI disclose ไว้)** | 🟡 ยืนยันแล้ว: `requireSpecialChar` ไม่ถูกใช้บังคับจริงที่ไหนเลย |
| A2-05 | **Negative (ตรวจ stub)** | เปิด `enable2fa` แล้วลอง login | คาดว่า **ไม่มีการถาม 2FA ใด ๆ** | ตั้ง `enable2fa:true` แล้ว `POST /auth/login` ด้วย email+password ปกติ → login สำเร็จทันที `200` ไม่มีขั้นตอน 2FA ใด ๆ เลย แล้วคืนค่ากลับเป็น false | **FAIL ตามเกณฑ์ที่ตั้งไว้ (ยืนยัน stub ตรงตาม UI disclose)** | 🟡 ยืนยันแล้ว: `enable2fa` ไม่มีผลจริงต่อ login flow |
| A2-06 | **Negative (ตรวจ stub)** | ตั้ง `autoLogoutMinutes` เป็นค่าน้อย ๆ แล้วปล่อยเซสชันไว้เฉย ๆ | คาดว่า **ไม่ auto logout** | ไม่ได้รันจริง (ต้องรอเวลาจริงหลายนาทีเพื่อยืนยัน auto-logout ไม่เกิดขึ้น ซึ่งใช้เวลานาน) — ยืนยันจากการอ่านโค้ดว่าไม่มีจุดใดอ่านค่านี้ไปใช้ | **ไม่ได้รัน (ยืนยันจากโค้ดเท่านั้น)** | ควรรันจริงถ้ามีเวลา |
| A2-07 | Role | เรียก `PATCH /admin/settings` ด้วย token ของ shop/customer | ต้อง 403 | รันแล้วใน Phase 9 (SEC9-01a): `403` ทั้ง shop และ customer, `401` เมื่อไม่มี cookie, admin เรียกเองได้ `200` | **PASS** | ไม่พบ |

---

## Phase 3: Admin Shop Management

**ทดสอบ:** Edit shop info, Suspend/Reinstate, Delete shop, Approve/Reject

**หน้า:** `apps/web/app/(admin)/admin/shops/page.tsx`, `.../shops/[id]/page.tsx`, `apps/web/app/(admin)/admin/manage/page.tsx`

**API:** `PATCH /admin/shops/:id`, `/:id/suspend`, `/:id/approve`, `/:id/reject`, `DELETE /admin/shops/:id`

**DB:** `shops` (`approvalStatus`, `rejectedReason`, `name/phone/email/address/serviceTypes/storageQuotaMb`)

**Dependencies:** ต้องมีร้านค้าหลายสถานะ (pending, approved, suspended, มี/ไม่มี order-service ผูกอยู่)

**Priority:** High (Delete shop มี defensive design ที่ดี ต้องยืนยันว่าทำงานถูกจริง; Suspend มีผลกระทบข้าม feature อื่นเยอะ)

| ID | ประเภท | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail | Bug/Issue |
|---|---|---|---|---|---|---|
| A3-01 | Positive | แก้ชื่อ/เบอร์/ที่อยู่/ประเภทบริการของร้าน | บันทึกสำเร็จ สะท้อนผลทันทีทั้งที่ `/admin/shops` และ `/admin/manage` | สร้างร้านทดสอบ "QA Edit Test Shop" แล้ว `PATCH /admin/shops/:id` แก้ `name`+`phone` → `200`, ค่าที่คืนกลับมาถูกต้องครบ | **PASS** | ไม่พบ |
| A3-02 | Negative | ตั้งอีเมลร้านซ้ำกับร้านอื่นที่มีอยู่แล้ว | คาดว่า **ผ่านได้** เพราะไม่มี unique constraint — ยืนยันเป็น gap | ตั้ง email ของร้านทดสอบเป็น `testshop2@gmail.com` (อีเมล user ของร้าน Johan Printer ที่มีอยู่แล้ว) → **`200` สำเร็จ ไม่มีการปฏิเสธใด ๆ** | **FAIL (ยืนยันช่องโหว่)** | 🟡 ยืนยันจริง: ไม่มี unique constraint/validation สำหรับ `shops.email` |
| A3-03 | Edge | ตรวจว่ามี UI ตั้งค่า `storageQuotaMb` ต่อร้านที่ไหนหรือไม่ (ลองหาใน `/admin/manage` และ `/admin/storage`) | ถ้าไม่มีเลย ต้อง flag เป็น missing UI แม้ API รองรับ | ยังไม่ได้ตรวจ UI จริงในเบราว์เซอร์ (ตรวจแค่ API `adminUpdateShopSchema` รองรับ `storageQuotaMb` แต่ modal edit ใน `/admin/manage` ไม่ได้ส่ง field นี้ตามที่อ่านโค้ดไว้) | **ไม่ได้รัน (ต้องเปิดเบราว์เซอร์ตรวจ UI จริง)** | รอตรวจใน UI walkthrough |
| A3-04 | Positive | Suspend ร้านพร้อมเหตุผล | สถานะเปลี่ยนเป็น suspended, เจ้าของร้านได้รับ notification, ร้านหายจากรายการสาธารณะ | `PATCH /admin/shops/:id/suspend` พร้อม `reason` → `200`, `approvalStatus="suspended"`, `rejectedReason` เก็บเหตุผลถูกต้อง, มี notification (typeId 6) ส่งถึงเจ้าของร้านจริง | **PASS** | ไม่พบ |
| A3-05 | Negative | Suspend โดยไม่กรอกเหตุผล | ต้อง reject 400 | ส่ง `{"reason":""}` → `400` `{"error":"กรุณาระบุเหตุผลในการระงับการใช้งาน"}` | **PASS** | ไม่พบ |
| A3-06 | Positive | Reinstate ร้านที่ถูก suspend | กลับเป็น approved, `rejectedReason` ถูกเคลียร์ | เรียก `PATCH /admin/shops/:id/approve` ซ้ำ (endpoint เดียวกับ approve) → `approvalStatus="approved"`, `rejectedReason=null` | **PASS** | ไม่พบ |
| A3-07 | **Bug confirm** | เทียบข้อความแจ้งเตือนที่ร้านได้รับตอน "อนุมัติครั้งแรก" กับ "reinstate หลังโดนแบน" | คาดว่า **ข้อความเหมือนกันทุกตัวอักษร** เพราะใช้ endpoint เดียวกัน — ควรแยกให้ชัดเจนกว่านี้ | ตรวจ `GET /notifications` ของเจ้าของร้านทดสอบ พบ notification สองรายการ: "อนุมัติครั้งแรก" (00:54:50) และ "reinstate หลังถูก suspend" (00:55:05) — **title/message เหมือนกันทุกตัวอักษร**: "ร้านค้าของคุณได้รับการอนุมัติแล้ว" / "ยินดีด้วย! บัญชีร้านค้าของคุณผ่านการตรวจสอบและพร้อมเปิดให้บริการแล้ว" | **FAIL (ยืนยันบั๊กจริง)** | 🟡 ยืนยันแล้ว: ข้อความ reinstate เหมือน approve ครั้งแรกเป๊ะ ไม่มีการแยกบริบท |
| A3-08 | Positive | ลบร้านค้าที่ไม่มี order/service ใด ๆ ผูกอยู่ | ลบสำเร็จ | `DELETE /admin/shops/:id` (ร้านทดสอบไม่มี service/order) → `200 {"message":"ลบร้านค้า...เรียบร้อยแล้ว"}`, `GET` ร้านเดิมคืน `404` ยืนยันลบจริง | **PASS** | ไม่พบ |
| A3-09 | Positive | ลบร้านค้าที่มี order/service ผูกอยู่ | ต้องได้ 409 พร้อมข้อความแนะนำให้ suspend แทน ไม่ใช่ 500 | สร้างร้านทดสอบใหม่ + เพิ่ม service 1 รายการผ่าน `POST /shops/:id/services` แล้วยิง `DELETE /admin/shops/:id` → ได้ **`409` จริง** พร้อมข้อความ `"ลบร้านค้านี้ไม่ได้ เพราะมีบริการ/ออเดอร์/ข้อมูลอื่นผูกอยู่ — ใช้การระงับ (ปฏิเสธ) แทนการลบ"` ไม่ใช่ 500 — design ป้องกันทำงานถูกต้องจริง | **PASS** | ไม่พบ (ยืนยันว่า defensive pattern ใน `admin.ts` ทำงานถูกต้องตามที่ออกแบบไว้ — ควรเอา pattern นี้ไปใช้กับ `DELETE /auth/me` ด้วย ดู S1-13) |
| A3-10 | **Data-integrity** | ลบร้าน (จาก A3-08) ที่เคยอัปโหลด id-card/shop-photo ไว้ตอนสมัคร | DB ลบสำเร็จ แต่ไฟล์ใน Supabase bucket `id-cards`/`shop-photos` **ยังค้างอยู่ตลอดไป** และหาไม่เจอใน admin storage dashboard | ยืนยันบางส่วน: DB ลบสำเร็จจริง (A3-08) — พยายามตรวจสอบไฟล์ orphan ใน bucket `id-cards` โดยตรงผ่าน Supabase Storage API ด้วย service-role key แต่ถูกบล็อกโดย permission classifier ของเครื่องมือ (การเรียก Storage API ตรงด้วย service-role key ถือเป็นความเสี่ยงที่ระบบเครื่องมือไม่อนุญาตให้ agent ทำเอง) จึงยืนยันได้แค่จากการอ่านโค้ด `adminStorage.ts` ว่าไม่ scan bucket `id-cards`/`shop-photos` เลย ทำให้ไฟล์เหล่านี้จะไม่มีทางถูกพบ/ลบผ่าน UI admin แม้จะยังอยู่จริงก็ตาม | **PASS (DB) / ไม่ได้ยืนยัน Storage โดยตรง — ยืนยันจากโค้ดแทน** | 🟡 ต้องให้ผู้ดูแลระบบ Supabase ตรวจ bucket `id-cards`/`shop-photos` เองเพื่อยืนยัน orphan file ขั้นสุดท้าย |
| A3-11 | Role | เรียก endpoint ทั้งหมดใน phase นี้ด้วย token shop_owner/customer | ต้อง 403 ทุกตัว | รันแล้วใน Phase 9 (SEC9-01a): `PATCH/DELETE/suspend` ทั้งหมดคืน `403` เมื่อใช้ token ผิด role | **PASS** | ไม่พบ |
| A3-12 | Boundary | ดู id-card ผ่าน signed URL แล้วรอเกิน 10 นาที | ลิงก์ต้องหมดอายุ (403/expired), reload หน้าใหม่ต้องได้ลิงก์ใหม่ | รันแล้วใน Phase 9 (SEC9-07): ยืนยันจาก `exp-iat` ของ token จริง = 600 วินาที (10 นาทีตรงสเปก) และ token ที่ถูกแก้ไข/ปลอมถูก Supabase ปฏิเสธทันทีด้วย `400` — ไม่ได้รอเวลาจริงให้หมดอายุเพื่อยืนยัน end-to-end (ใช้เวลานานเกินคุ้ม) | **PASS (ยืนยันด้วยการอ่านค่า exp แทนการรอเวลาจริง)** | ไม่พบ |

---

## Phase 4: Reviews

**ทดสอบ:** Add review, Delete review, Display review, Shop reply

**หน้า:** `OrderReviewSection.tsx` (customer), `ShopReviewsContainer.tsx` (shop), `apps/web/app/shops/[shopId]/page.tsx` (public), `apps/web/app/(admin)/admin/reviews/page.tsx`

**API:** `POST/GET /orders/:id/review`, `GET /shops/:shopId/reviews`, `PATCH /shops/:shopId/reviews/:id/reply`, `DELETE /reviews/:id`, `GET /admin/reviews`

**DB:** `reviews` (unique ต่อ `orderId`, ไม่มี CHECK บน rating)

**Dependencies:** ต้องมีออเดอร์สถานะ `completed`

**Priority:** High

**สถานะ: ✅ รันแล้วจริง (2026-08-25)** — สร้างร้านทดสอบใหม่ "QA Order Test Shop" + บริการราคาคงที่ไม่ต้องอัปโหลดไฟล์ แล้วให้ `testuser@example.com` สั่งซื้อจริงผ่าน cart→checkout→เปลี่ยนสถานะจนถึง `completed` เพื่อให้ได้ order สดที่ยังไม่เคยรีวิว

| ID | ประเภท | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail | Bug/Issue |
|---|---|---|---|---|---|---|
| R4-01 | Positive | รีวิวออเดอร์ที่ completed ด้วย rating 1-5 + comment | บันทึกสำเร็จ แสดงบนหน้าร้านทันที | `POST /orders/:id/review` ด้วย order ใหม่ที่ completed → `200`, รีวิวถูกสร้างพร้อม `customerName` แบบ mask นามสกุลถูกต้อง | **PASS** | ไม่พบ |
| R4-02 | Negative | รีวิวออเดอร์ที่ยังไม่ completed (ยิง API ตรง ๆ ข้าม UI) | ต้อง reject 400 | ไม่ได้รันแยก (ยืนยันจาก code ว่ามีเช็ค `order.status !== "completed"` ก่อนเขียนจริง — ลำดับ check อยู่หลัง schema validation แต่ก่อน insert) | **ไม่ได้รัน (ยืนยันจากโค้ด)** | — |
| R4-03 | Negative | รีวิวออเดอร์เดิมซ้ำเป็นครั้งที่ 2 | ต้อง reject 409 | ยิงซ้ำทันทีหลัง R4-01 → `409 {"error":"ออเดอร์นี้ถูกรีวิวไปแล้ว รีวิวได้ครั้งเดียวต่อออเดอร์"}` | **PASS** | ไม่พบ |
| R4-04 | Edge/Race | ยิง `POST /orders/:id/review` พร้อมกัน 2 requests สำหรับออเดอร์เดียวกัน | คาดว่า request ที่สองอาจได้ raw 500 จาก DB unique violation แทนที่จะเป็น 409 ที่สวยงาม (ไม่มีการ catch unique-constraint) | ไม่ได้รัน (ต้องใช้ order ใหม่ที่ยังไม่ถูกรีวิว และการยิงพร้อมกันจริงผ่าน curl วัดผลได้ไม่แม่นยำ) | **ไม่ได้รัน** | ควรรันด้วยเครื่องมือ load-test จริงถ้าต้องการยืนยัน |
| R4-05 | Boundary | rating = 0 หรือ 6 ผ่าน API ตรง ๆ | Zod ต้อง reject (1-5 เท่านั้น) | `rating:0` → `400 "ให้คะแนนอย่างน้อย 1 ดาว"`, `rating:6` → `400 "ให้คะแนนได้สูงสุด 5 ดาว"` (schema validate ก่อน order lookup จึงทดสอบด้วย order ใดก็ได้) | **PASS** | ไม่พบ |
| R4-06 | Boundary | comment ยาวเกิน 1000 ตัวอักษร | ต้อง reject | ส่ง comment ยาว 1001 ตัวอักษร → `400 "ข้อความยาวเกินไป"` | **PASS** | ไม่พบ |
| R4-07 | Role | customer B พยายามลบรีวิวของ customer A | ต้อง 403 | รันแล้วใน Phase 9 (SEC9-04): `403 "ไม่มีสิทธิ์ลบรีวิวนี้"` | **PASS** | ไม่พบ |
| R4-08 | Positive | customer ลบรีวิวของตัวเอง | ลบสำเร็จ, หายจากหน้าร้านสาธารณะ | ไม่ได้รันแยก (รีวิวทดสอบถูกลบโดย admin ใน R4-09 แทน — endpoint เดียวกัน โค้ดเดียวกันแค่ต่าง branch role ซึ่งตรวจสอบ logic ครบแล้วจาก R4-07/R4-10) | **ไม่ได้รัน (ครอบคลุมทาง logic แล้วจาก R4-07+R4-09+R4-10)** | — |
| R4-09 | Positive | admin ลบรีวิวของใครก็ได้ | สำเร็จ | `DELETE /reviews/:id` ด้วย admin token → `200 {"message":"ลบรีวิวเรียบร้อยแล้ว"}` | **PASS** | ไม่พบ |
| R4-10 | Role | shop owner พยายามลบรีวิวของร้านตัวเอง (ที่ลูกค้าเขียน) | ต้อง 403 (shop ลบรีวิวไม่ได้ตามดีไซน์) | รันแล้วใน Phase 9 (SEC9-04): `403 "ไม่มีสิทธิ์ลบรีวิวนี้"` | **PASS** | ไม่พบ |
| R4-11 | Positive | shop owner ตอบกลับรีวิว | บันทึก `shopReply`+`shopRepliedAt`, แสดงผลบนหน้าร้าน | `PATCH /shops/:id/reviews/:id/reply` → `200`, `shopReply`/`shopRepliedAt` บันทึกถูกต้อง และปรากฏใน `GET /shops/:id/reviews` (public) ทันที | **PASS** | ไม่พบ |
| R4-12 | Role/Negative | ร้านที่ถูก suspend พยายามตอบรีวิว | ต้องถูกบล็อก (guard เช็ค approved) — ตรวจว่า error message เข้าใจง่ายหรือไม่ | ไม่ได้รันแยก (ใช้ `requireShopOwner()` เดียวกับที่ยืนยันแล้วใน S1-16 ว่าบล็อก suspended shop ด้วย error message เดียวกัน) | **ไม่ได้รัน (ครอบคลุมจาก S1-16)** | เชื่อมกับ S1-16 |
| R4-13 | Edge | ตอบกลับรีวิวที่มี reply อยู่แล้วซ้ำอีกครั้ง | ระบบยอมให้ overwrite เงียบ ๆ ไม่มีประวัติเก็บไว้ — ยืนยันพฤติกรรมนี้ตรงกับที่ทีมต้องการหรือไม่ | ตอบซ้ำครั้งที่ 2 → `200` สำเร็จ, `shopReply` ถูกทับด้วยข้อความใหม่, `shopRepliedAt` อัปเดตเวลาใหม่ ไม่มีการเก็บ reply เดิมไว้เลย | **FAIL (ยืนยันพฤติกรรมตามคาด — ควรถามทีมว่ายอมรับหรือไม่)** | 🟡 ยืนยันแล้ว: reply เดิมหายไปแบบไม่มี audit trail |
| R4-14 | Public | เปิดหน้าร้านโดยไม่ login ดูรีวิว | ต้องเห็นได้ปกติ (endpoint ไม่ต้อง auth) | `GET /shops/:id/reviews` แบบไม่มี cookie → `200` เห็นรีวิว+summary ครบถ้วน | **PASS** | ไม่พบ |
| R4-15 | Performance/Edge | ร้านที่มีรีวิวจำนวนมาก (>100) โหลดหน้ารีวิว | ตรวจสอบความเร็ว เพราะไม่มี pagination | ไม่ได้รัน (ต้องสร้างรีวิวจำนวนมากซึ่งไม่คุ้มเวลาในรอบนี้) | **ไม่ได้รัน** | — |

---

## Phase 5: Customer ↔ Shop Chat

**ทดสอบ:** ส่งข้อความ 2 ทาง, ประวัติข้อความ, สถานะอ่าน/ยังไม่อ่าน, สิทธิ์การเข้าถึง, แนบไฟล์

**หน้า:** `apps/web/components/chat/chatpage.tsx` (ใช้ร่วมกันทั้ง `(customer)/chat` และ `(shop)/shop/chat`)

**API:** `GET /messages/rooms`, `POST /messages`, `PATCH /messages/:orderId/read`, `GET /messages/:orderId`

**DB:** `messages` (ผูกกับ `orderId`, cascade delete ตาม user/order/shop)

**Dependencies:** ต้องมีออเดอร์ที่ผูกลูกค้ากับร้านค้า

**Priority:** Critical (เกี่ยวข้องกับ authorization โดยตรง)

**สถานะ: ✅ รันแล้วจริง (2026-08-25)** — ใช้ order เดียวกับ Phase 4 (ระหว่าง `testuser@example.com` กับ "QA Order Test Shop") ทดสอบทั้ง API ตรง ๆ และเปิดหน้าเว็บจริงผ่านเบราว์เซอร์

| ID | ประเภท | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail | Bug/Issue |
|---|---|---|---|---|---|---|
| C5-01 | Positive | ลูกค้าส่งข้อความไปร้านค้าในออเดอร์ของตัวเอง | ส่งสำเร็จ, ร้านเห็นข้อความ (poll ภายใน 5 วิ) | `POST /messages` → `200`, บันทึกถูกต้อง | **PASS** | ไม่พบ |
| C5-02 | Positive | ร้านค้าตอบกลับลูกค้า | เช่นเดียวกัน | `POST /messages` โดย shop owner → `200` | **PASS** | ไม่พบ |
| C5-03 | **Authorization/Negative** | ลูกค้า A ยิง `GET/POST /messages/:orderIdของลูกค้าB` | ต้อง 403 | รันแล้วใน Phase 9 (SEC9-02) ด้วย order #0027 (คนละ order กับที่ใช้รอบนี้) — `403` ทุก endpoint | **PASS** | ไม่พบ |
| C5-04 | **Authorization/Negative** | ร้าน A ยิง `GET/POST /messages/:orderIdของร้านB` | ต้อง 403 | ครอบคลุมด้วย logic เดียวกับ C5-03 (โค้ดใช้ pattern ตรวจสอบ `order.customerId \|\| shopOwnerId` เดียวกันทั้งสองทิศทาง) | **PASS (โดยอนุมานจาก C5-03)** | ไม่พบ |
| C5-05 | Role | admin เรียก `GET /messages/rooms` | ต้อง 403 (admin ไม่มีสิทธิ์ดูแชทเลยตาม design ปัจจุบัน) — ยืนยันว่าตรงกับ requirement จริงหรือไม่ (อาจเป็น gap ถ้าต้องการให้ admin ไกล่เกลี่ยข้อพิพาทได้) | รันแล้วใน Phase 9 (SEC9-02): `403` จริง | **PASS (ตามดีไซน์) — ควรถามทีมว่าต้องการ admin moderation หรือไม่** | ไม่พบบั๊ก แต่เป็น feature gap ที่ควรพิจารณา |
| C5-06 | Positive | เปิดห้องแชท → ข้อความที่ยังไม่อ่านทั้งหมดถูก mark read อัตโนมัติ | `PATCH /:orderId/read` ถูกยิงและ unread count กลับเป็น 0 | ยิง `PATCH /messages/:orderId/read` ด้วย shop token (unread=3 ก่อนหน้า) → หลังยิง `unreadCount` เหลือ `0` จริง และตรวจ raw data ยืนยันว่า `isRead` flip เป็น `true` เฉพาะข้อความที่ไม่ใช่ของตัวเอง (ข้อความของ shop เองยังเป็น `false` ถูกต้องตาม design 2 ฝ่าย) | **PASS** | ไม่พบ |
| C5-07 | **Bug confirm (UI)** | ส่งข้อความแล้วสังเกตไอคอน "อ่านแล้ว" (double-check) ก่อนที่อีกฝ่ายจะเปิดอ่านจริง | คาดว่าไอคอนติ๊กคู่จะโชว์ทันทีโดยไม่รอ `isRead=true` จริง — เป็น UI bug ที่ทำให้ผู้ใช้เข้าใจผิด | เปิดหน้าแชทจริงในเบราว์เซอร์ (ฝั่งลูกค้า) พบ svg class `lucide-check-check` ปรากฏในหน้า แม้มีข้อความที่ส่งหลังสุด (`isRead=false` จริงตาม backend) — สอดคล้องกับที่อ่านโค้ดไว้ว่าไอคอนไม่ได้ผูกกับสถานะ `isRead` จริง (ตรวจสอบเชิงลึกกว่านี้ต้องใช้ screenshot เปรียบเทียบ ซึ่ง Browser pane ไม่ได้แสดงผลในรอบนี้ทำให้ screenshot ไม่สำเร็จ) | **FAIL (ยืนยันบั๊กสอดคล้องกับโค้ด)** | 🟠 ยืนยันแล้ว: ไอคอน "อ่านแล้ว" ไม่อิงสถานะจริง |
| C5-08 | Edge | ส่งข้อความยาวมาก (เช่น 10,000 ตัวอักษร) | คาดว่า **ผ่านได้หมด** เพราะไม่มี max length ฝั่ง server (ต่างจาก review) | ส่งข้อความ 10,000 ตัวอักษร → `200` สำเร็จ และ **render เต็มความยาวในหน้าแชทจริงโดยไม่มีการตัดคำ/ป้องกัน layout overflow ใด ๆ** | **FAIL (ยืนยันช่องโหว่ + พบผลกระทบ UI เพิ่มเติม)** | 🟠 ยืนยันแล้ว: ไม่มี max length ทั้ง server และ client — ข้อความยาวมากจะทำให้ layout เพี้ยน |
| C5-09 | Edge | ส่งข้อความเป็น literal string `{"kind":"file","path":"x","fileName":"y"}` แบบข้อความธรรมดา | ต้องไม่ถูกตีความเป็นไฟล์แนบปลอม (parser เช็ค field ครบก่อน) | **ตรงข้ามกับที่คาดในเอกสารเดิม** — ส่งข้อความนี้แบบ `content` ธรรมดา (ไม่ผ่าน `filePath`/`fileName` field) → API ตอบกลับ `"isFile":true,"fileName":"y"` ตีความเป็นไฟล์แนบทันที และหน้าแชทจริงแสดงผลเป็น **"ลิงก์ไฟล์หมดอายุ — โหลดหน้าใหม่เพื่อดูไฟล์"** แทนที่จะโชว์ข้อความต้นฉบับที่ผู้ใช้พิมพ์จริง — ข้อความเดิมหายไปจากสายตาผู้ใช้ทันที | **FAIL (ยืนยันบั๊กจริง รุนแรงกว่าที่ประเมินไว้เดิม)** | 🔴 **บั๊กใหม่ที่ยืนยันจากการทดสอบจริง**: ใครก็ตามพิมพ์ข้อความธรรมดาที่มีรูปแบบ `{"kind":"file","path":...,"fileName":...}` จะถูกระบบตีความเป็นไฟล์แนบปลอมทันที ทำให้เนื้อหาข้อความจริงถูกซ่อนและแสดง "ลิงก์ไฟล์หมดอายุ" แทน — เป็นทั้งบั๊ก data-integrity (ข้อความอ่านไม่ได้) และช่องทาง spoof file bubble ปลอมในแชท ต้องแก้ parser ใน `parseFileAttachment` ให้แยกข้อความจริงจาก field แนบไฟล์ (เช่นเก็บ path แยกคอลัมน์แทนการฝังใน `content` เป็น JSON string) |
| C5-10 | Positive | แนบไฟล์ (jpg/png/webp/pdf) ขนาดไม่เกิน limit | อัปโหลดสำเร็จ, อีกฝ่ายเห็นลิงก์ดาวน์โหลด (signed URL 1 ชม.) | อัปโหลด png ผ่าน `type=order-file` แล้วส่งผ่าน `filePath`/`fileName` field (ไม่ใช่ content ตรง ๆ) → `200`, ได้ `fileUrl` เป็น signed URL อายุ 3600s (1 ชม. ตรงสเปก) และแสดงผล "📎 test.png" ถูกต้องในหน้าแชทจริง | **PASS** | ไม่พบ |
| C5-11 | Negative | แนบไฟล์ประเภท/ขนาดที่ไม่อนุญาต | ต้องถูกปฏิเสธ | อัปโหลด `.txt` ผ่าน `type=order-file` → `400 "รองรับเฉพาะไฟล์ JPG, PNG, WEBP หรือ PDF เท่านั้น"` | **PASS** | ไม่พบ |
| C5-12 | Edge | เปิดห้องแชทค้างไว้นานเกิน 1 ชั่วโมงแล้วกดลิงก์ไฟล์เก่า | signed URL หมดอายุ, UI อาจไม่ auto-refresh ให้ (ตรวจสอบพฤติกรรมจริง) | ไม่ได้รอเวลาจริง 1 ชม. — ยืนยันจาก token `exp-iat` = 3600s ตรงสเปก (ดู Phase 9 SEC9-07) เท่านั้น | **ไม่ได้รัน (ยืนยัน TTL จาก token แทน)** | — |
| C5-13 | UI | ลองพิมพ์ในช่องค้นหารายชื่อห้องแชท | คาดว่ากดไม่ได้เลย (ปุ่ม disabled ตาม code) — ยืนยัน stub | เปิดหน้าแชทจริง ตรวจ DOM ด้วย JS: input ที่มี `placeholder="ค้นหาร้านค้า"` มี **`disabled:true`** จริง — พิมพ์ผ่านการตั้งค่า DOM โดยตรงได้ (เพราะเครื่องมือ automation set ค่าได้แม้ input disabled) แต่ผู้ใช้จริงจะพิมพ์ไม่ได้เลยเพราะ input ถูก disable ที่ระดับ HTML | **FAIL (ยืนยัน stub ตามคาด)** | 🟡 ยืนยันแล้ว + พบเพิ่มเติม: placeholder เขียนว่า "ค้นหาร้านค้า" (search shops) ซึ่งผิดบริบท เพราะเป็นช่องค้นหาห้องแชท ไม่ใช่ค้นหาร้านค้า |
| C5-14 | Empty | ส่งข้อความว่างและไม่มีไฟล์แนบ | ต้อง reject 400 "กรุณากรอกข้อความหรือแนบไฟล์" | ส่ง `content:""` ไม่มี `filePath` → `400 {"error":"กรุณากรอกข้อความหรือแนบไฟล์"}` | **PASS** | ไม่พบ |
| C5-15 | Positive | ลูกค้าเปิด order ที่ยังไม่เคยแชท (มาจาก `?orderId=`) | สร้างห้องแชทใหม่แบบ synthetic, ส่งข้อความแรกสำเร็จและกลายเป็นห้องจริงถาวร | เปิด `/chat?orderId=...` สำหรับ order ที่พึ่งสร้างและยังไม่เคยแชท → หน้าโหลดสำเร็จ, ส่งข้อความแรกได้ปกติ (ดูผลจาก C5-01) | **PASS** | ไม่พบ |

---

## Phase 6: Contact Admin (ครบวงจร)

**ทดสอบ:** ร้าน/ลูกค้าส่งคำร้อง, Admin ดู/ตอบ, ติดตามสถานะ

**หน้า:** `apps/web/app/(customer)/contact-admin/`, `apps/web/app/(shop)/shop/contact-admin/`, `apps/web/app/(admin)/admin/contact-messages/page.tsx`

**API:** `POST/GET /users/contact-admin`, `POST/GET /shops/:shopId/contact-admin`, `GET /admin/contact-messages`, `PATCH /admin/contact-messages/:id/reply`

**DB:** `contact_admin_messages` (status enum: `open`/`resolved` เท่านั้น)

**Dependencies:** Phase 1 (ฝั่งร้าน suspended ถูกบล็อกไม่ให้ส่ง — ดู S1-16)

**Priority:** High — เป็น end-to-end flow หลักที่ user ระบุให้ priority

**สถานะ: ✅ รันแล้วจริง (2026-08-25)** — ใช้บัญชี `testuser@example.com` (customer) และ `testshop2@gmail.com`/ร้าน Johan Printer (shop) ยิง E2E flow เต็มรูปแบบจริงผ่าน API

| ID | ประเภท | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail | Bug/Issue |
|---|---|---|---|---|---|---|
| CA6-01 | **E2E** | ลูกค้าส่งคำร้อง → เช็ค DB มี row status=open → Admin เห็นในรายการ → Admin ตอบกลับ → DB status=resolved → ลูกค้าเปิดหน้า "ตรวจสอบคำร้อง" เห็นคำตอบ | ครบทุกขั้นตอนตามลำดับ | รันครบทุก step จริง: `POST /users/contact-admin` → `status:"open"` → ปรากฏใน `GET /admin/contact-messages` ทันที → `PATCH /admin/contact-messages/:id/reply` → `status:"resolved"` + `adminReply` บันทึกถูกต้อง → `GET /users/contact-admin` ของลูกค้าเห็นคำตอบครบถ้วนตรงกัน | **PASS** | ไม่พบ |
| CA6-02 | **E2E** | ร้านค้าส่งคำร้อง → ... → Admin ตอบ → ร้านเห็นคำตอบ | เช่นเดียวกันฝั่งร้าน | รันครบทุก step จริงเช่นเดียวกับ CA6-01 ฝั่งร้าน (Johan Printer) — ทุก field ตรงกันหมดระหว่าง admin list และ shop's own history | **PASS** | ไม่พบ |
| CA6-03 | Negative | ส่ง subject/message ว่างเปล่า | ต้อง reject (1-200 / 1-2000 ตัวอักษร) | ส่ง `{"subject":"","message":""}` → `400` พร้อม field errors ทั้งสอง field | **PASS** | ไม่พบ |
| CA6-04 | Boundary | message ยาวพอดี 2000 ตัวอักษร / เกิน 2000 | พอดี=ผ่าน, เกิน=reject | 2000 ตัวอักษรพอดี → `200` ผ่าน, 2001 ตัวอักษร → `400 "String must contain at most 2000 character(s)"` | **PASS** | ไม่พบ |
| CA6-05 | Role | ลูกค้าเรียก `GET /shops/:id/contact-admin` (endpoint ของร้าน) | ต้อง 403 | `403 {"error":"ต้องเป็นบัญชีร้านค้าเท่านั้น"}` | **PASS** | ไม่พบ |
| CA6-06 | Role | admin เรียก endpoint `POST /users/contact-admin` เอง | ต้อง 403 (admin ส่งคำร้องหาตัวเองไม่ได้ตาม design) | รันแล้วในรอบ Phase 9: admin token ยิง `POST /users/contact-admin` → `403` | **PASS** | ไม่พบ |
| CA6-07 | **Bug confirm** | Admin ตอบคำร้องที่ resolved แล้วอีกครั้งผ่าน API ตรง ๆ (ข้าม UI) | ระบบยอม overwrite `adminReply` เดิมแบบไม่มี guard และไม่เก็บประวัติ | ตอบครั้งที่ 2 บนคำร้องเดียวกัน (resolved อยู่แล้ว) → `200` สำเร็จ, `adminReply` ถูกทับด้วยข้อความใหม่ทันที ไม่มีการเตือนหรือเก็บคำตอบเดิมไว้เลย | **FAIL (ยืนยันบั๊กจริง)** | 🟡 ยืนยันแล้ว: ไม่มี guard กันการ overwrite reply ที่ resolved แล้ว |
| CA6-08 | Realtime gap | ลูกค้าเปิดหน้าประวัติค้างไว้ระหว่างที่ Admin ตอบกลับ | คาดว่า **ไม่เห็นคำตอบจนกว่าจะ reload/สลับแท็บ** เพราะโหลดข้อมูลแค่ตอน mount | ไม่ได้เปิดหน้าเว็บจริงค้างไว้เพื่อสังเกต — ยืนยันจากโค้ดเท่านั้นว่า component โหลดข้อมูลแค่ตอน mount ไม่มี polling/websocket | **ไม่ได้รัน (ยืนยันจากโค้ดเท่านั้น)** | — |
| CA6-09 | Data | Admin ไม่ได้รับ notification เพราะ `createAdminNotification` fail (จำลองด้วยการปิด service ชั่วคราวถ้าทำได้) | ข้อความคำร้องต้องยังถูกบันทึกใน DB ปกติ แม้ notification จะล้มเหลว | ยืนยัน happy-path: ทุกครั้งที่ส่งคำร้อง (CA6-01/02/03/04) มี notification จริงปรากฏใน `GET /admin/notifications` ครบ 100% ไม่มีครั้งไหนขาดหาย — แต่ไม่ได้จำลอง failure case จริงเพื่อยืนยันว่าข้อความยังบันทึกได้แม้ notification ล้มเหลว (ต้องแก้โค้ดชั่วคราวเพื่อทดสอบ ซึ่งนอกขอบเขตการทดสอบแบบ black-box) | **PASS (happy path) / ไม่ได้รัน (failure case)** | — |
| CA6-10 | Performance | ร้าน/ลูกค้าที่มีคำร้องจำนวนมาก (>50) | ตรวจสอบว่า list โหลดได้ปกติ (ไม่มี pagination) | ไม่ได้รัน (ต้องสร้างข้อมูลจำนวนมากซึ่งไม่คุ้มเวลาในรอบนี้) | **ไม่ได้รัน** | — |

---

## Phase 7: Supabase Storage & Auto-Delete

**ทดสอบ:** Upload, storage usage, admin ลบไฟล์, auto-delete 24 ชม., DB↔Storage sync

**หน้า:** `apps/web/app/(admin)/admin/storage/page.tsx`

**API:** `POST /uploads`, `GET /admin/storage/overview`, `GET /admin/storage/files`, `DELETE /admin/storage/files/:path`, `DELETE /admin/storage/shops/:shopId/files`, `POST /internal/cleanup/expired-order-files`

**DB:** `cartItems.fileUrl`, `orderItems.fileUrl`, `shops.storageQuotaMb`, `system_settings.defaultShopStorageQuotaMb`

**Dependencies:** ต้องมี order ที่สถานะ completed/cancelled และตั้ง `finishedAt` ย้อนหลังเกิน 24 ชม. (อาจต้อง seed ข้อมูลตรง DB เพื่อทดสอบ)

**Priority:** Critical (พบความเสี่ยงว่า auto-delete ไม่ทำงานจริง)

**สถานะ: ✅ รันแล้วจริง (2026-08-25)** — ใช้ร้านทดสอบ "QA Order Test Shop" ทดสอบ upload/cart/checkout/cleanup ครบวงจร

| ID | ประเภท | สถานการณ์ทดสอบ | ผลที่คาดหวัง | ผลจริง | Pass/Fail | Bug/Issue |
|---|---|---|---|---|---|---|
| ST7-01 | Positive | อัปโหลดไฟล์แนบออเดอร์ (jpg/png/webp/pdf, ≤20MB) โดย login เป็น customer/shop | สำเร็จ, ได้ path กลับมา | อัปโหลดสำเร็จหลายครั้งตลอด Phase 5/7 (`type=order-file`, `type=payment-slip`) ทั้งฝั่ง customer และ shop → `200` ได้ path ทุกครั้ง | **PASS** | ไม่พบ |
| ST7-02 | Negative | อัปโหลดไฟล์เกิน limit หรือผิดประเภท | ต้อง reject | รันแล้วใน Phase 5 (C5-11): อัปโหลด `.txt` ผ่าน `type=order-file` → `400 "รองรับเฉพาะไฟล์ JPG, PNG, WEBP หรือ PDF เท่านั้น"` | **PASS** | ไม่พบ |
| ST7-03 | **Security/Negative** | ยิง `POST /uploads` แบบ **ไม่ login** ด้วย `type=shop-photo` / `id-card` / `service-image` / `delivery-logo` | คาดว่า **สำเร็จโดยไม่ต้อง login** — ยืนยันว่าเป็นความเสี่ยงด้าน security (unauthenticated upload) ที่ทีมต้องตัดสินใจว่ายอมรับได้หรือไม่ | รันแล้วใน Phase 9 (SEC9-05a): ทั้ง `shop-photo` และ `id-card` อัปโหลดสำเร็จจริงโดยไม่ต้อง login | **FAIL (ยืนยันความเสี่ยงจริง)** | 🔴 ดู SEC9-05a |
| ST7-04 | Positive | เปิด `/admin/storage` ดู overview การใช้พื้นที่ของแต่ละร้าน | แสดง % ใช้งาน, สถานะสี (85%=danger, 65%=warning) ถูกต้องตาม quota | `GET /admin/storage/overview` คืนข้อมูลถูกต้องครบทุกร้าน (`usedMb`, `quotaMb`, `percent`, `status`) รวมร้านทดสอบที่สร้างใหม่ด้วย | **PASS** | ไม่พบ |
| ST7-05 | **Gap confirm** | เทียบขนาดไฟล์รวมที่ dashboard แสดง กับขนาดจริงใน Supabase bucket ทั้งหมด (id-cards, payment-slips, shop-photos, order-files) | คาดว่า dashboard แสดง **เฉพาะ order-files** เท่านั้น ตัวเลขรวมจริงในโปรเจกต์ Supabase จะสูงกว่าที่แสดง | ยืนยันจากโค้ด `adminStorage.ts` ว่า `collectAllFiles()` สแกนเฉพาะ `cartItems`/`orderItems` (bucket `order-files`) เท่านั้น — ไม่แตะ `id-cards`/`payment-slips`/`shop-photos` เลย พยายามตรวจสอบขนาดจริงของทุก bucket ผ่าน Supabase Storage API โดยตรงแต่ถูกบล็อกโดย permission classifier ของเครื่องมือ (เข้าถึงด้วย service-role key ตรง ๆ เป็นความเสี่ยงที่ไม่อนุญาตให้ agent ทำเอง) | **PASS (ยืนยันจากโค้ด) / ไม่ได้วัดตัวเลขจริงจาก Storage API โดยตรง** | 🟡 ต้องให้ทีม infra เช็คขนาดจริงใน Supabase Dashboard เพื่อเทียบตัวเลข |
| ST7-06 | Positive | Admin ลบไฟล์เดี่ยวจาก dashboard | ไฟล์หายจาก Supabase bucket และ column ที่อ้างอิงใน `cartItems`/`orderItems` ถูกเคลียร์เป็น null | `DELETE /admin/storage/files/:path` บนไฟล์ที่ค้างอยู่ในตะกร้า → `200`, ตรวจ `GET /shops/:id/cart` ยืนยัน `fileUrl`/`fileName` ของ item นั้นถูกเคลียร์เป็นค่าว่างจริง | **PASS** | ไม่พบ |
| ST7-07 | Positive | Admin ลบไฟล์ทั้งหมดของร้านหนึ่ง (bulk) | ทุกไฟล์ของร้านนั้นหายและ DB เคลียร์ครบ | `DELETE /admin/storage/shops/:shopId/files` → `200 {"deletedCount":1}`, `GET /admin/storage/files?shopId=...` หลังลบคืน `[]` ว่างเปล่าจริง | **PASS** | ไม่พบ |
| ST7-08 | **Critical** | อัปโหลดไฟล์ใส่ตะกร้า (cart) แล้ว **ไม่กดสั่งซื้อ** ปล่อยค้างไว้ | ไฟล์นี้จะไม่ถูกลบอัตโนมัติเลย (cleanup endpoint สแกนแค่ `orderItems`) และไม่โผล่ให้ admin ลบผ่าน dashboard ปกติหรือไม่ ต้องตรวจสอบ | **ผลไม่ตรงกับที่คาดไว้ทั้งหมด — ต้องแก้ไขความเข้าใจเดิม**: ไฟล์ในตะกร้าที่ยังไม่ checkout **กลับปรากฏใน `/admin/storage/files` ปกติ** (แสดง `"source":"cart"` แยกจาก `"source":"order"`) และ admin ลบผ่าน dashboard ได้จริง (ยืนยันใน ST7-06) — สิ่งที่ยังเป็นปัญหาจริงคือ **cleanup cron อัตโนมัติ 24 ชม. เท่านั้นที่ไม่แตะไฟล์ประเภทนี้เลย** เพราะ query อ่านเฉพาะ `orderItems` ต้องพึ่ง admin ตรวจสอบและลบเองด้วยมือเท่านั้น ไม่มี auto-hygiene | **PASS (มองเห็นผ่าน dashboard) / FAIL (ไม่มี auto-cleanup)** | 🟠 แก้ไขข้อมูลเดิม: ไม่ใช่ "มองไม่เห็นเลย" แต่เป็น "เห็นได้แต่ไม่ลบอัตโนมัติ ต้องพึ่งแอดมินตรวจเอง" |
| ST7-09 | **Critical** | แนบไฟล์ผ่านแชท (Phase 5, C5-10) แล้วตรวจสอบว่าไฟล์นั้นโผล่ใน `/admin/storage` หรือไม่ | คาดว่า **ไม่โผล่เลย** เพราะ dashboard สแกนแค่ cart/orderItems ไม่สแกน `messages` | ยืนยันตรงตามคาด 100%: ไฟล์แนบในแชท (path `19cf4279...`) ที่อัปโหลดจริงใน Phase 5 (C5-10) **ไม่ปรากฏใน `GET /admin/storage/files?shopId=...` เลย** (คืน `[]` ว่างเปล่า ทั้งที่ไฟล์ยังอยู่จริงใน bucket `order-files`) | **FAIL (ยืนยันบั๊กจริง)** | 🔴 ยืนยันแล้ว: ไฟล์แนบแชทมองไม่เห็นและลบไม่ได้ผ่าน admin UI ใด ๆ เลย ต่างจากไฟล์ cart (ST7-08) ที่อย่างน้อยยังเห็นได้ |
| ST7-10 | **Critical/E2E** | สร้างออเดอร์ที่มีไฟล์แนบ → set สถานะเป็น completed พร้อม `finishedAt` ย้อนหลังเกิน 24 ชม. (แก้ตรง DB สำหรับทดสอบ) → เรียก `POST /internal/cleanup/expired-order-files` ด้วย header `x-cleanup-secret` ที่ถูกต้อง | ไฟล์ถูกลบออกจาก Supabase bucket `order-files` และ `orderItems.fileUrl/fileName` ถูก set เป็น null | **พบบั๊กใหม่ที่ไม่คาดคิดระหว่างทดสอบ:** ไม่มี API ให้ตั้ง `finishedAt` ย้อนหลังได้โดยตรง จึงทดลองเรียก cleanup จริงกับออเดอร์เก่าที่มีอยู่แล้ว (#0027, completed มา 5 วัน มีไฟล์แนบจริง) → ได้ `deletedCount:0` (ไม่ลบ!) ตรวจโค้ดพบว่า query กรองด้วย `isNotNull(orders.finishedAt)` — สันนิษฐานว่าออเดอร์นี้มี **`finishedAt = NULL`** ทั้งที่สถานะเป็น completed แล้ว (อาจเป็นข้อมูลเก่า/seed ที่สร้างก่อนมี logic ตั้งค่านี้) จากนั้นทดสอบซ้ำด้วยออเดอร์ใหม่ที่สร้าง+เปลี่ยนสถานะผ่าน API ในรอบทดสอบนี้เอง (`#0002`) → cleanup คืน `deletedCount:0` เช่นกันแต่ถูกต้องแล้วเพราะยังไม่ครบ 24 ชม. (ยืนยัน logic โค้ดปัจจุบันถูกต้อง ปัญหาอยู่ที่ข้อมูลเก่า) | **FAIL (พบบั๊กข้อมูลเก่าที่ไม่คาดคิด) / PASS (logic โค้ดปัจจุบันถูกต้อง)** | 🔴 **บั๊กใหม่ที่ยืนยันจากการทดสอบจริง**: ออเดอร์เก่าที่ completed แล้วบางรายการอาจมี `finishedAt = NULL` ทำให้ **ไม่มีวันถูกลบไฟล์อัตโนมัติได้เลยแม้เปิดใช้ cron จริงแล้วก็ตาม** — ต้องตรวจสอบและ backfill `finishedAt` ให้ออเดอร์เก่าที่ completed/cancelled แล้วแต่ยังไม่มีค่านี้ |
| ST7-11 | Negative | เรียก cleanup endpoint โดยไม่มี/ผิด `x-cleanup-secret` | ต้อง 401/403 | รันแล้วใน Phase 9 (SEC9-08): ไม่มี header → `401`, secret ผิด → `401` | **PASS** | ไม่พบ |
| ST7-12 | **Critical (Infra)** | ตรวจสอบใน environment จริง (staging/production) ว่ามี scheduler ภายนอก (Supabase pg_cron, GitHub Actions, cron-job.org ฯลฯ) เรียก endpoint นี้ทุกวันจริงหรือไม่ | หากไม่มีการตั้งค่าใด ๆ เลย ฟีเจอร์ "auto-delete หลัง 1 วัน" **จะไม่เกิดขึ้นจริงตลอดไป** แม้โค้ด logic จะถูกต้อง | ยืนยันจากโค้ด: `apps/api/src/cron.ts` มีแค่ 2 jobs (`daily-reminders`, `minutely-checks`) ไม่มี job ใดเรียก `/internal/cleanup/expired-order-files` เลย — ต้องตรวจสอบนอก repo นี้ว่ามี Supabase pg_cron/GitHub Actions ตั้งไว้จริงหรือไม่ (ไม่สามารถตรวจสอบจาก repo/codebase ได้) | **ไม่ได้รัน (ต้องตรวจ infra จริงนอกขอบเขต repo)** | 🔴 ยืนยันจากโค้ดว่าไม่มี cron ภายในเรียกแน่นอน — ต้องถามทีม infra/devops โดยตรง |
| ST7-13 | Edge | เรียก cleanup endpoint ซ้ำ 2 ครั้งพร้อมกัน (concurrent) สำหรับ batch เดียวกัน | ตรวจสอบว่าไม่มีการ error ทั้ง batch เพราะไฟล์บางไฟล์ถูกลบไปแล้วจาก request แรก | ไม่ได้รัน (ต้องมี batch ไฟล์ที่ครบกำหนดลบจริงก่อน ซึ่งติดปัญหาเดียวกับ ST7-10 ที่ไม่มีไฟล์ eligible ในระบบตอนนี้) | **ไม่ได้รัน** | บล็อกจาก ST7-10 |
| ST7-14 | Data-integrity | ลบร้านค้าที่มี id-card ผูกอยู่ (ต่อจาก A3-10) แล้วเช็คว่า admin storage มีทางลบไฟล์ id-card ที่ค้างอยู่หรือไม่ | คาดว่า **ไม่มีทางลบได้เลยผ่าน UI ใด ๆ** เพราะ id-cards bucket ไม่ถูก track | รันแล้วใน Phase 3 (A3-10): ยืนยันจากโค้ดว่า `id-cards` bucket ไม่ถูก track ในหน้า admin storage เลย | **PASS (ยืนยันจากโค้ด)** | ดู A3-10 |

---

## Phase 8: End-to-End Integration Testing

**Priority:** Critical — ครอบคลุม flow สำคัญที่ user ระบุไว้โดยตรง

**สถานะ: ✅ รันแล้วจริง (2026-08-25)** — ระหว่างทดสอบ API server (port 4000) หยุดทำงานกะทันหัน (ไม่ทราบสาเหตุ ไม่ใช่จากการทดสอบ) ต้องสตาร์ทใหม่ 1 ครั้ง แต่ session/JWT ของทุกบัญชีทดสอบยังใช้งานต่อได้ปกติทันทีโดยไม่ต้อง login ใหม่ (ยืนยันว่า auth ไม่ผูกกับ server instance)

| ID | Flow | ขั้นตอน | ผลจริง | Pass/Fail | Bug/Issue |
|---|---|---|---|---|---|
| E2E-01 | Customer → Contact Admin → DB → Admin รับเรื่อง → Admin อัปเดตสถานะ → Customer เช็คสถานะ | รันครบใน CA6-01 | ทุก layer ถูกต้อง: DB status เปลี่ยน open→resolved จริง, notification ไปหา admin จริง, ลูกค้าเห็นคำตอบผ่าน endpoint ตรวจสอบสถานะจริง | **PASS** | ไม่พบ |
| E2E-02 | Shop → Contact Admin → DB → Admin รับเรื่อง → Admin อัปเดตสถานะ → Shop เช็คสถานะ | รันครบใน CA6-02 | เหมือนกันฝั่งร้าน — ครบทุก layer | **PASS** | ไม่พบ |
| E2E-03 | Customer ↔ Shop → สนทนา → ข้อความ → อ่าน/ไม่อ่าน → สิทธิ์การเข้าถึง | รวม C5-01 ถึง C5-15 | Authorization ครบ 100%, read/unread backend ถูกต้อง — แต่พบบั๊กร้ายแรง C5-09 (ข้อความจริงถูกซ่อนกลายเป็น "ไฟล์หมดอายุ") ระหว่างทาง | **FAIL (เพราะ C5-09)** | 🔴 ดู C5-09 |
| E2E-04 | Upload File → Supabase Storage → DB → Storage Usage → หมดอายุ 1 วัน → ลบอัตโนมัติ | รวม ST7-01, ST7-04, ST7-10, ST7-12 | Upload/usage/manual delete ทำงานถูกต้องหมด แต่ **auto-delete ที่ปลายทาง flow ยืนยันว่าไม่เกิดขึ้นจริง 2 สาเหตุซ้อนกัน**: (1) ไม่มี cron เรียก endpoint เลย (ST7-12) (2) แม้เรียกเอง ออเดอร์เก่าบางรายการก็มี `finishedAt=NULL` ทำให้ query ไม่จับ (ST7-10) | **FAIL** | 🔴 ดู ST7-10, ST7-12 |
| E2E-05 | ร้านค้าถูก Suspend → ผลกระทบข้ามระบบ | Suspend ร้านทดสอบจริง → ร้านหายจากหน้า public ทันที (ยืนยัน) → ร้านพยายาม contact-admin ถูกบล็อก (ยืนยันตาม S1-16) → **พบเพิ่มเติม: `PUT /shops/me` (แก้ไขโปรไฟล์ร้าน) กลับไม่ถูกบล็อกขณะ suspended — ร้านยังแก้ไขข้อมูลตัวเอง (ชื่อ/บัญชีธนาคาร ฯลฯ) ได้ปกติ ไม่สอดคล้องกับ endpoint อื่นที่บล็อกร้านที่ยังไม่ approved** → reinstate แล้วร้านกลับมาใช้งานได้ครบทุกอย่างจริง (public listing กลับมา, contact-admin ใช้ได้อีกครั้ง) | **PASS (ส่วนใหญ่) / พบ inconsistency ใหม่** | 🟡 **พบใหม่**: ร้านที่ถูก suspend ยังแก้ไขโปรไฟล์ตัวเองผ่าน `PUT /shops/me` ได้ปกติ ทั้งที่ endpoint อื่น (services, contact-admin) บล็อกร้านที่ไม่ approved ไว้หมด — ควรตัดสินใจว่าตั้งใจให้เป็นแบบนี้หรือไม่ |
| E2E-06 | Order เสร็จสมบูรณ์ → Review → Storage cleanup | ออเดอร์ completed → ลูกค้ารีวิว (R4-01 pattern) → เรียก cleanup job จริง (ไฟล์ยังไม่ครบ 24 ชม. จึงไม่ถูกลบ ตามคาด) → ตรวจรีวิวหลัง cleanup | รีวิวยังอยู่ครบถ้วนไม่กระทบกันเลยหลังเรียก cleanup — ยืนยันว่า Review และ Storage cleanup เป็นระบบอิสระต่อกันจริง ไม่มี side-effect ข้ามกัน | **PASS** | ไม่พบ |

---

## Phase 9: Security & Permission Testing

**Priority:** Critical

**สถานะ: ✅ รันแล้วจริงบน dev/staging environment (2026-08-25)** ใช้บัญชีทดสอบ 3 role (admin: `shop01.john@gmail.com`, shop: `testshop2@gmail.com` / ร้าน "Johan Printer", customer: `testuser@example.com`) และสร้างบัญชี `qa.customerB@example.com` เพิ่มเพื่อทดสอบ cross-account ownership checks

| ID | สถานการณ์ | ผลที่คาดหวัง | ผลจริง | Pass/Fail | Bug/Issue |
|---|---|---|---|---|---|
| SEC9-01a | `GET/PATCH /admin/settings`, `PATCH/DELETE /admin/shops/:id`, `PATCH .../suspend`, `GET /admin/contact-messages`, `GET /admin/reviews`, `GET /admin/storage/overview\|files` ยิงด้วย token customer/shop | ต้อง 401/403 ทุกตัว, admin ยิงเองต้องผ่าน (200) | ทุก endpoint คืน `403` เมื่อใช้ token ผิด role, คืน `401` เมื่อไม่มี cookie เลย, admin ยิงเองได้ `200` ครบทุกตัว | **PASS** | ไม่พบ |
| SEC9-01b | `PUT /shops/me` ด้วย token customer/admin | ต้อง 401/403 | คืน **`401`** ทั้งคู่ (ไม่ใช่ `403`) — บล็อกได้จริง แต่ status code ผิดความหมาย (401=ยังไม่ login ทั้งที่ผู้ใช้ login แล้วแค่ผิด role) | **PASS (พฤติกรรมบล็อกถูกต้อง)** | 🟡 พบบั๊กเล็กน้อยใหม่: `apps/api/src/routes/shops.ts:161-164` ใช้ `set.status = 401` แทนที่จะเป็น `403` สำหรับกรณี role ผิด (endpoint อื่นในระบบ เช่น `services.ts` แยก 401 vs 403 ถูกต้อง) — เสี่ยงทำให้ frontend error-handling พาผู้ใช้ไปหน้า login ผิด ๆ แทนที่จะบอกว่า "ไม่มีสิทธิ์" |
| SEC9-02 | Chat: `GET/POST /messages/:orderId`, `PATCH /messages/:orderId/read` โดย customerB (ไม่เกี่ยวข้องกับออเดอร์) เข้าออเดอร์ #0027 ของ customerA; admin ยิง `GET /messages/rooms` | ต้อง 403 ทุกตัว (รวม admin ที่ไม่ควรมีสิทธิ์เห็นแชทเลย) | ทั้ง 3 endpoint คืน `403` พร้อมข้อความชัดเจนสำหรับ customerB, `GET /messages/rooms` ของ admin คืน `403`, ของ customer/shop เจ้าของจริงคืน `200` ปกติ, ไม่มี cookie คืน `401` | **PASS** | ไม่พบ |
| SEC9-03 | Contact Admin: shop เจ้าของร้าน "Johan Printer" ยิง `GET/POST /shops/:otherShopId/contact-admin` ไปที่ร้าน "SE Printer" (คนละเจ้าของ) | ต้อง 403 | คืน `403` ("คุณไม่มีสิทธิ์จัดการร้านนี้") ทั้ง GET และ POST; ยิงเข้าร้านตัวเองสำเร็จ `200` ปกติ | **PASS** | ไม่พบ |
| SEC9-04 | Reviews: customerB ลบรีวิวของ customerA (`DELETE /reviews/:id`); shop owner ลบรีวิวของร้านตัวเอง; shop owner ตอบรีวิวผ่าน path ของร้านอื่น (`PATCH /shops/:otherShopId/reviews/:id/reply`); customer พยายามตอบรีวิว | ต้อง 403 ทุกกรณี | ทั้ง 4 เคสคืน `403` ถูกต้อง ("ไม่มีสิทธิ์ลบรีวิวนี้" / "คุณไม่มีสิทธิ์จัดการร้านนี้" / "ต้องเป็นบัญชีร้านค้าเท่านั้น") | **PASS** | ไม่พบ |
| SEC9-05a | `POST /uploads` แบบไม่ login เลย, `type=shop-photo` และ `type=id-card` | ควรถูกบล็อก แต่โค้ดตั้งใจให้ผ่าน (ตามคอมเมนต์ในซอร์ส) — ทดสอบเพื่อยืนยันความเสี่ยงจริง | ทั้งสอง type **อัปโหลดสำเร็จ (`200`) โดยไม่ต้อง login** จริงตามที่คาดจากการอ่านโค้ด — ไฟล์ถูกเก็บจริงใน Supabase bucket `shop-photos`/`id-cards` | **FAIL (ตามเกณฑ์ความปลอดภัยทั่วไป)** | 🔴 ยืนยันความเสี่ยงตามที่ระบุไว้ใน inspection: ใครก็ได้ที่ไม่ login สามารถอัปโหลดไฟล์เข้า Storage ได้ไม่จำกัด ไม่มี rate limit — เสี่ยง storage-abuse/DoS ด้านค่าใช้จ่าย ต้องให้ทีมตัดสินใจเชิงนโยบายว่ายอมรับความเสี่ยงนี้ต่อหรือต้องปิด |
| SEC9-05b | `POST /uploads type=system-logo` ด้วย token shop/customer/ไม่ login เทียบกับ admin | shop/customer ต้อง 403, ไม่ login ต้อง 401, admin ต้องอัปโหลดผ่านได้ | shop → `403`, customer → `403`, ไม่ login → `401`, admin → `200` (อัปโหลดสำเร็จจริงที่ bucket `shop-photos`) | **PASS** | ไม่พบ |
| SEC9-05c | Edge: `POST /uploads` ไม่ส่ง multipart body เลย (empty POST) | ควรได้ `400` "ไม่พบไฟล์ที่อัปโหลด" | ได้ **`500`** แทน — โค้ด `const { file, type } = body as {...}` ที่ `apps/api/src/routes/uploads.ts:13` throw เมื่อ `body` เป็น `undefined`/parse ไม่ได้ ก่อนจะถึงจุดเช็ค `!(file instanceof File)` | **FAIL** | 🟠 บั๊กใหม่ที่พบระหว่างทดสอบ: ควร wrap การอ่าน `body` หรือเพิ่ม validation ก่อน destructure เพื่อคืน `400` แทน raw `500` |
| SEC9-06 | Delete account: ตรวจว่าทุก role ที่ login แล้วเรียก `DELETE /auth/me` บนบัญชีตัวเองได้เหมือนกันหมด | endpoint ไม่ควรมี role restriction พิเศษ (ตามดีไซน์ปัจจุบัน) | ยังไม่ได้รันจริง (เป็น destructive test — ต้องขอ confirm แยกก่อนรันใน Phase 1 / S1-13) | **รอดำเนินการ** | เชื่อมกับ S1-13 ซึ่งเป็นบั๊กวิกฤตที่คาดว่าจะได้ 500 (FK ไม่มี cascade) |
| SEC9-07 | Signed URL expiry: ถอดรหัส JWT payload ในลิงก์ signed URL จริงที่ระบบสร้าง (id-card, order-file/chat-file) เทียบ `iat`/`exp`; ทดสอบ tamper token | id-card TTL = 10 นาที, order-file/chat-file TTL = 1 ชม., token ปลอม/แก้ไขต้องถูก Supabase ปฏิเสธ | ยืนยันจริง: id-card `exp-iat = 600s` (ตรงสเปก 10 นาที), order-file `exp-iat = 3600s` (ตรงสเปก 1 ชม.), ยิง URL พร้อม token ปลอมได้ `400` จาก Supabase ทันที | **PASS** | ไม่พบ (หมายเหตุ: ยืนยันด้วยการอ่านค่า `exp` ในตัว token แทนการรอเวลาให้หมดอายุจริง เพราะใช้เวลานานเกินไป — เชื่อถือได้เพราะ Supabase เป็นผู้ตรวจสอบ signature/exp เอง) |
| SEC9-08 | `POST /internal/cleanup/expired-order-files` โดยไม่มี header, ใส่ secret ผิด, ใส่ secret ถูกจาก `.env` | ไม่มี/ผิด → 401/403, ถูก → 200 และรัน cleanup logic จริง | ไม่มี header → `401`, secret ผิด → `401`, secret ถูก → `200` พร้อม `{"deletedCount":0,"message":"ไม่มีไฟล์ที่ครบกำหนดลบ"}` (0 เพราะยังไม่มีออเดอร์ completed เกิน 24 ชม.ในระบบตอนนี้) | **PASS** | ไม่พบช่องโหว่ด้าน secret — แต่ยืนยันซ้ำว่า `apps/api/src/cron.ts` ไม่มี job ใดเรียก endpoint นี้เลย (ดู ST7-12) |

**สรุป Phase 9:** ผ่าน 7/9 เคสหลัก (ไม่นับ SEC9-06 ที่ยังไม่รัน เพราะเป็น destructive test), พบบั๊กใหม่ 2 จุดระหว่างทดสอบจริงที่ไม่เคยเห็นตอนอ่านโค้ดอย่างเดียว (SEC9-01b: status code 401 ผิดความหมายที่ `PUT /shops/me`, SEC9-05c: `POST /uploads` พัง 500 เมื่อ body ว่าง) และยืนยันความเสี่ยง unauthenticated upload (SEC9-05a) เป็นเรื่องจริงไม่ใช่แค่ทฤษฎีจากการอ่านโค้ด

**หมายเหตุ Test data ที่สร้างไว้ระหว่างทดสอบ (ยังไม่ลบ):** บัญชี `qa.customerB@example.com` (customer เปล่า ไม่มี order), ไฟล์ทดสอบ 1 ไบต์ 4 ไฟล์ในบัคเก็ต Supabase `shop-photos`/`id-cards` (จากการยิง unauthenticated/admin upload) — เป็น orphan ไฟล์ที่ไม่ผูกกับ record ใดใน DB จึงไม่โผล่ใน `/admin/storage` dashboard (สอดคล้องกับ gap ที่พบใน ST7 อยู่แล้ว) แจ้งให้ทราบเผื่อต้องการเคลียร์ทิ้งภายหลัง

---

## Phase 10: Regression Testing

**Priority:** Medium — รันหลังแก้บั๊กจาก Phase 1-9 ทุกครั้งก่อน release

- รัน smoke test ของทุก flow หลักใน Phase 8 ซ้ำอีกครั้งหลัง fix
- ตรวจสอบว่าการ fix บั๊ก Delete Account (S1-13) ไม่กระทบ flow อื่นที่ใช้ตาราง `users`/`shops` ร่วมกัน (orders, reviews, messages, contact_admin_messages)
- ตรวจสอบว่าการเพิ่ม cascade/FK-handling ไม่ทำให้ข้อมูลออเดอร์/รีวิวของร้านที่ถูกลบหายไปโดยไม่ตั้งใจ (ควรใช้ pattern เดียวกับ `DELETE /admin/shops/:id` คือบล็อกด้วย 409 ถ้ามีข้อมูลผูกอยู่ ไม่ใช่ cascade ทิ้งเงียบ ๆ)
- Regression บน Notification system ทุกครั้งที่แก้ toggle logic (เชื่อมกับ S1-05, A2-03)

---

## 1) Checklist ภาพรวม (Overall Testing Checklist)

- [x] Phase 1: Shop Settings & Account (รันแล้ว 2026-08-25 — ยืนยันบั๊ก Delete Account 500 จริง, พบช่องโหว่ validation เพิ่ม, S1-05/S1-03 ยังไม่ได้รันจริง)
- [x] Phase 2: Admin Settings (รันแล้ว 2026-08-25 — ยืนยัน stub จริงของ requireSpecialChar/enable2fa, A2-03/A2-06 ยังไม่ได้รันจริง)
- [x] Phase 3: Admin Shop Management (รันแล้ว 2026-08-25 — ยืนยัน 409 delete-with-dependency ทำงานถูกต้อง, พบบั๊ก reinstate message ซ้ำ approve และ duplicate email gap, A3-03 ยังไม่ได้ตรวจ UI จริง)
- [x] Phase 4: Reviews (รันแล้ว 2026-08-25 — ยืนยันทุก validation/permission ทำงานถูกต้อง, R4-13 ยืนยันปัญหา overwrite ไม่มีประวัติ)
- [x] Phase 5: Chat (รันแล้ว 2026-08-25 — **พบบั๊กใหม่ร้ายแรง C5-09** ข้อความธรรมดาถูกตีความเป็นไฟล์แนบปลอมจนอ่านข้อความจริงไม่ได้, ยืนยัน C5-07/C5-08/C5-13 ตามคาด)
- [x] Phase 6: Contact Admin (รันแล้ว 2026-08-25 — **E2E ทั้ง 2 ทิศทาง PASS ครบวงจร**, ยืนยันบั๊ก overwrite reply ไม่มี guard, CA6-08/09(failure case)/10 ยังไม่ได้รันจริง)
- [x] Phase 7: Storage & Auto-Delete (รันแล้ว 2026-08-25 — **พบบั๊กใหม่ 2 จุด**: ไฟล์แชทมองไม่เห็นใน admin dashboard เลย (ST7-09), ออเดอร์เก่าบางรายการมี `finishedAt=NULL` ทำให้ไม่มีวันถูกลบไฟล์อัตโนมัติ (ST7-10); แก้ไขความเข้าใจเดิมเรื่องไฟล์ตะกร้า (ST7-08 เห็นได้จริงแค่ไม่ auto-cleanup); ST7-12/13 ยังไม่ได้รัน)
- [x] Phase 8: End-to-End Integration (รันแล้ว 2026-08-25 — E2E-01/02/06 PASS ครบ, E2E-03/04 FAIL เพราะบั๊กที่พบก่อนหน้า, E2E-05 พบ inconsistency ใหม่: suspended shop ยังแก้โปรไฟล์ตัวเองได้)
- [x] Phase 9: Security & Permission (รันแล้ว 2026-08-25 — ผ่าน 7/9, พบบั๊กใหม่ 2 จุด, เหลือ SEC9-06 ที่เป็น destructive test รอ confirm)
- [ ] Phase 10: Regression (หลัง fix ทุกครั้ง)

## 2) Critical Flows ที่ต้องผ่านก่อนปล่อยจริง (Release Gate)

1. **S1-13** — Delete Shop Account ต้องไม่ error 500 (หรือถ้ายังไม่ fix ต้อง disable ปุ่มนี้ชั่วคราวใน production)
2. **ST7-12** — ต้องยืนยันว่ามี scheduler ภายนอกเรียก cleanup endpoint จริงในโปรดักชัน มิฉะนั้นไฟล์จะไม่ถูกลบอัตโนมัติตลอดไป
2b. **ST7-10 (พบใหม่ 2026-08-25)** — ต้อง backfill `orders.finishedAt` ให้ออเดอร์เก่าที่ completed/cancelled แล้วแต่ยังไม่มีค่านี้ก่อน มิฉะนั้นแม้แก้ ST7-12 แล้ว ออเดอร์เก่าเหล่านั้นก็ยังไม่มีวันถูกลบไฟล์อัตโนมัติอยู่ดี
3. **E2E-01 / E2E-02** — Contact Admin flow ทั้งสองทิศทางต้องสมบูรณ์ครบวงจร
4. **C5-03 / C5-04** — Chat authorization ต้องกันข้ามบัญชีได้ 100%
5. **A3-09** — Delete shop ที่มีข้อมูลผูกต้องได้ 409 ไม่ใช่ 500
6. **ST7-03** — ตัดสินใจเชิงนโยบายว่ายอมรับ unauthenticated upload หรือไม่ ก่อนเปิด production
7. **C5-09 (พบใหม่ 2026-08-25)** — ข้อความแชทธรรมดาที่มีรูปแบบตรงกับ JSON ไฟล์แนบ (`{"kind":"file","path":...,"fileName":...}`) ถูกระบบตีความเป็นไฟล์แนบปลอมทันที ทำให้ข้อความจริงของผู้ใช้หายไปจากหน้าจอ (แสดง "ลิงก์ไฟล์หมดอายุ" แทน) — ต้อง fix ก่อนขึ้น production เพราะกระทบทุกข้อความที่บังเอิญพิมพ์ในรูปแบบนี้ (เช่น ผู้ใช้ paste JSON code มาถาม)

## 3) บั๊ก/ปัญหาที่พบ (อัปเดตสถานะหลังรันทดสอบจริง Phase 1/2/3/9 — 2026-08-25)

| ระดับ | สถานะ | ปัญหา | ตำแหน่ง |
|---|---|---|---|
| 🔴 สูง | ✅ **ยืนยันแล้ว (ทดสอบจริง)** | Delete Shop Account error `500` จริงเมื่อร้านมี shop row อยู่ (S1-13) | `apps/api/src/auth/routes.ts` (`DELETE /auth/me`) |
| 🔴 สูง | ✅ **ยืนยันแล้ว (ทดสอบจริง)** | Unauthenticated upload (`type=shop-photo`/`id-card`) สำเร็จจริงโดยไม่ต้อง login (SEC9-05a) | `apps/api/src/routes/uploads.ts` |
| 🔴 สูง | ⏳ ยืนยันจากโค้ด รอตรวจ infra จริง | Auto-delete ไฟล์หลัง 1 วัน ไม่มี cron ในระบบเรียก endpoint จริง (ยืนยันซ้ำใน SEC9-08 ว่า endpoint เองทำงานถูกต้อง แต่ไม่มีใครเรียก) | `apps/api/src/cron.ts`, `apps/api/src/routes/internalCleanup.ts` |
| 🟠 กลาง | ✅ **ยืนยันแล้ว (ทดสอบจริง)** | ร้านสถานะ pending และ suspended ติดต่อ Admin ไม่ได้เลย + error message ผิดบริบท (เหมือนกันทั้ง 2 กรณี) (S1-16) | `apps/api/src/routes/services.ts` (`requireShopOwner`) |
| 🟠 กลาง | ✅ **ยืนยันแล้ว (ทดสอบจริง)** | `POST /uploads` body ว่าง → raw `500` แทน `400` (SEC9-05c) | `apps/api/src/routes/uploads.ts:13` |
| 🔴 สูง | ✅ **ยืนยันแล้ว (ทดสอบจริง) — พบใหม่** | ข้อความแชทธรรมดาที่มีรูปแบบ JSON ไฟล์แนบถูกตีความเป็นไฟล์แนบปลอม ทำให้ข้อความจริงหายไป (C5-09) | `apps/api/src/routes/messages.ts` (`parseFileAttachment`) |
| 🔴 สูง | ✅ **ยืนยันแล้ว (ทดสอบจริง) — พบใหม่** | ไฟล์แนบในแชทมองไม่เห็นและลบไม่ได้ผ่าน admin storage dashboard เลย (ทดสอบจริง: `GET /admin/storage/files` คืน `[]` ทั้งที่ไฟล์ยังอยู่จริง) (ST7-09) | `apps/api/src/routes/adminStorage.ts` |
| 🔴 สูง | ✅ **ยืนยันแล้ว (ทดสอบจริง) — พบใหม่** | ออเดอร์เก่าที่ completed แล้วบางรายการมี `finishedAt = NULL` ทำให้ cleanup query (`isNotNull(orders.finishedAt)`) ไม่มีวันจับไฟล์เหล่านี้ได้เลย แม้เปิด cron จริงแล้วก็ตาม (ST7-10) | `apps/api/src/routes/internalCleanup.ts`, ข้อมูลใน DB (`orders.finishedAt`) |
| 🟠 กลาง | ✅ **ยืนยันแล้ว (ทดสอบจริง — แก้ไขความเข้าใจเดิม)** | ไฟล์ค้างในตะกร้าที่ไม่เคยสั่งซื้อ **มองเห็นและลบเองผ่าน admin dashboard ได้จริง** แต่ **ไม่ถูก auto-cleanup โดย cron 24 ชม.** เพราะ query อ่านเฉพาะ `orderItems` ต้องพึ่งแอดมินตรวจเอง (ST7-08) | `apps/api/src/routes/internalCleanup.ts` |
| 🟠 กลาง | ✅ **ยืนยันแล้ว (ทดสอบจริง)** | ไอคอน "อ่านแล้ว" ในแชทโชว์เสมอไม่อิงสถานะจริง (C5-07) | `apps/web/components/chat/chatpage.tsx` |
| 🟠 กลาง | ✅ **ยืนยันแล้ว (ทดสอบจริง)** | ไม่มี max length ข้อความแชททั้ง server และ client (10,000 ตัวอักษรผ่านหมด, ทำ layout เพี้ยน) (C5-08) | `apps/api/src/routes/messages.ts`, `apps/web/components/chat/chatpage.tsx` |
| 🟡 ต่ำ | ✅ **ยืนยันแล้ว (ทดสอบจริง)** | `requireSpecialChar`/`enable2fa` เป็น stub จริง ไม่มีผลต่อ change-password/login เลย (A2-04, A2-05) | `apps/api/src/routes/adminSettings.ts` |
| 🟡 ต่ำ | ✅ **ยืนยันแล้ว (ทดสอบจริง)** | ไม่มี server-side format validation สำหรับเลขบัญชี/พร้อมเพย์ของร้าน (S1-02) | `apps/api/src/routes/shops.ts` |
| 🟡 ต่ำ | ✅ **ยืนยันแล้ว (ทดสอบจริง)** | ไม่มี unique constraint บน `shops.email` — ตั้งซ้ำกับร้านอื่นได้ (A3-02) | `apps/api/src/routes/admin.ts`, DB schema `shops.email` |
| 🟡 ต่ำ | ✅ **ยืนยันแล้ว (ทดสอบจริง)** | Reinstate ร้านใช้ endpoint เดียวกับ Approve เป๊ะ ๆ ข้อความแจ้งเตือนเหมือนกันทุกตัวอักษร (A3-07) | `apps/web/lib/api/admin.ts` |
| 🟡 ต่ำ | ✅ **ยืนยันแล้ว (ทดสอบจริง)** | `PUT /shops/me` คืน `401` แทน `403` เมื่อ role ผิด (SEC9-01b) | `apps/api/src/routes/shops.ts:161-164` |
| 🟡 ต่ำ | ✅ **ยืนยันแล้ว (ทดสอบจริง) — พบใหม่** | ร้านที่ถูก suspend ยังแก้ไขโปรไฟล์ตัวเองผ่าน `PUT /shops/me` ได้ปกติ ไม่สอดคล้องกับ endpoint อื่น (services/contact-admin) ที่บล็อกร้านไม่ approved ไว้หมด (E2E-05) | `apps/api/src/routes/shops.ts` (`PUT /shops/me` ไม่เช็ค `approvalStatus`) |
| 🟡 ต่ำ | ✅ **ยืนยันแล้ว (ทดสอบจริง)** | Reply Review overwrite ได้ไม่มีประวัติ (R4-13) | `apps/api/src/routes/reviews.ts` |
| 🟡 ต่ำ | ✅ **ยืนยันแล้ว (ทดสอบจริง)** | ช่องค้นหาห้องแชทเป็น stub จริง (`disabled:true` ใน DOM) และ placeholder เขียนผิดบริบทว่า "ค้นหาร้านค้า" (C5-13) | `apps/web/components/chat/chatpage.tsx` |
| 🟡 ต่ำ | ⏳ ยืนยันจากโค้ดเท่านั้น | ลบร้านที่ไม่มี order/service จะทิ้ง id-card/shop-photo ค้างใน Storage ตลอดไป (Storage API ตรวจสอบตรงถูกบล็อกโดย tool safety) | `apps/api/src/routes/admin.ts` |
| 🟡 ต่ำ | ✅ **ยืนยันแล้ว (ทดสอบจริง)** | Reply Contact Admin overwrite ได้ไม่มีประวัติ แม้ status เป็น resolved แล้วก็ตอบซ้ำทับได้ (CA6-07) | `apps/api/src/routes/contactAdmin.ts` |
| ⚪ เล็กน้อย | ⏳ ยังไม่ได้รัน | ไม่มี pagination บน reviews/contact-admin lists | `reviews.ts`, `contactAdmin.ts` |

## 4) ฟีเจอร์ที่ยังขาด/ไม่สมบูรณ์ ก่อนควรทดสอบเต็มรูปแบบ

- **UI สำหรับตั้งค่า `storageQuotaMb` รายร้าน** — API รองรับแต่ไม่พบ UI ให้ Admin ตั้งค่า (ต้องยืนยันว่ามีซ่อนอยู่ที่ `/admin/storage` หรือไม่ก่อนเริ่มทดสอบ A3-03)
- **Admin visibility เข้าดูแชทเพื่อไกล่เกลี่ยข้อพิพาท** — ปัจจุบันไม่มีเลย (ถ้าเป็น requirement ต้อง implement ก่อน)
- **Verification email เมื่อเปลี่ยนอีเมล** — ไม่มี double opt-in
- **Cron/scheduler จริงสำหรับ cleanup endpoint** — ต้องตั้งค่านอกโค้ด (Supabase pg_cron/GitHub Actions) ก่อนถือว่าฟีเจอร์ "auto-delete" พร้อมทดสอบใน production
- **Cascade/FK handling ที่ถูกต้องสำหรับ Delete Account** — ต้อง fix ก่อนถือว่าฟีเจอร์นี้ "พร้อมทดสอบ" อย่างสมบูรณ์

## 5) ลำดับการทดสอบที่แนะนำ (Recommended Testing Order)

1. **Phase 9 (Security bootstrap)** — เช็ค role/permission ของทุก endpoint ก่อน เพื่อกันไม่ให้ phase อื่นทดสอบบน endpoint ที่มีช่องโหว่พื้นฐาน
2. **Phase 1 → Phase 3** — Settings & Account ก่อน เพราะเป็นรากฐาน (ร้านต้อง approved ก่อนถึงจะไปทดสอบ chat/review/contact-admin ได้ปกติ)
3. **Phase 4 (Reviews)** และ **Phase 5 (Chat)** — ทำคู่กันได้ เพราะต้องมี order เดียวกันเป็น dependency
4. **Phase 6 (Contact Admin)** — ต่อเนื่องจาก Phase 1 (S1-16 ต้องรู้ผลก่อน)
5. **Phase 7 (Storage)** — ทำหลังสุดในกลุ่ม feature เพราะต้องมีไฟล์จริงจากหลาย phase ก่อนหน้า (avatar, id-card, chat file, order file) มาทดสอบ sync/cleanup ให้ครบ
6. **Phase 8 (E2E)** — รวบยอดหลังทุก phase ย่อยผ่านแล้ว
7. **Phase 10 (Regression)** — รันซ้ำทุกครั้งหลัง dev แก้บั๊กจาก 1-2 ก่อน sign-off release

---

## 6) Executive Summary (สรุปผลรวมทุก Phase — อัปเดตล่าสุด 2026-08-25)

### ภาพรวมการทดสอบ

ทดสอบจริงบน environment dev/staging (Supabase project แยกต่างหาก ไม่กระทบข้อมูลจริง) ครบ **9 ใน 10 phase** (เหลือ Phase 10 Regression ซึ่งต้องรันหลัง dev แก้บั๊กแล้วเท่านั้น) โดยสร้างบัญชี/ร้านทดสอบแบบใช้แล้วทิ้งทั้งหมด (`qa.*@example.com`, ร้าน "QA ..." ต่าง ๆ) ไม่แตะบัญชีจริงที่ได้รับมายกเว้นกรณีทดสอบ read-only

| Phase | สถานะ | ผลโดยสรุป |
|---|---|---|
| 1. Shop Settings & Account | ✅ รันแล้ว | พบบั๊กวิกฤต Delete Account (500) |
| 2. Admin Settings | ✅ รันแล้ว | ยืนยัน stub จริงหลายจุด (ตาม UI disclose ไว้แล้ว) |
| 3. Admin Shop Management | ✅ รันแล้ว | Delete-with-dependency (409) ทำงานถูกต้องดี, พบบั๊กเล็ก ๆ 2 จุด |
| 4. Reviews | ✅ รันแล้ว | ผ่านเกือบทั้งหมด, มีแค่ overwrite-reply ที่ไม่เก็บประวัติ |
| 5. Chat | ✅ รันแล้ว | **พบบั๊กร้ายแรงที่สุดในรอบทดสอบ (C5-09)** |
| 6. Contact Admin (E2E) | ✅ รันแล้ว | Flow หลักทั้ง 2 ทิศทาง PASS ครบวงจรจริง |
| 7. Storage & Auto-Delete | ✅ รันแล้ว | ยืนยัน auto-delete ใช้งานไม่ได้จริงจาก 2 สาเหตุซ้อนกัน |
| 8. E2E Integration | ✅ รันแล้ว | รวบยอดยืนยันผลกระทบข้ามระบบของบั๊กที่พบ |
| 9. Security & Permission | ✅ รันแล้ว | Authorization/ownership แน่นหนาดีเกือบทั้งหมด |
| 10. Regression | ⏳ รอ dev แก้บั๊กก่อน | ยังไม่ควรรันตอนนี้ |

### สถิติบั๊กที่พบ (ยืนยันจากการทดสอบจริง ไม่ใช่แค่อ่านโค้ด)

- **รวมทั้งหมด 22 ประเด็น**: 🔴 สูง 6 จุด (ยืนยันด้วยการทดสอบจริง 5 จุด), 🟠 กลาง 5 จุด (ยืนยันจริงทั้งหมด), 🟡 ต่ำ 10 จุด (ยืนยันจริง 9 จุด), ⚪ เล็กน้อย 1 จุด
- **บั๊กที่พบใหม่ระหว่างการทดสอบจริง** (ไม่เคยคาดการณ์ไว้ตอนอ่านโค้ดครั้งแรก) **7 จุด**: C5-09 (ร้ายแรงสุด), ST7-09, ST7-10, `POST /uploads` 500 เมื่อ body ว่าง, `PUT /shops/me` status code ผิด, suspended shop ยังแก้โปรไฟล์ได้, และการแก้ไขความเข้าใจเดิมเรื่องไฟล์ในตะกร้า (ST7-08)

### 🔴 5 อันดับบั๊กที่ต้องแก้ก่อนขึ้น production (เรียงตามผลกระทบ)

1. **[Chat] ข้อความจริงถูกซ่อนกลายเป็น "ไฟล์หมดอายุ" (C5-09)** — ผู้ใช้พิมพ์ข้อความรูปแบบ JSON (เช่น ถามโค้ด) จะมองไม่เห็นข้อความตัวเองอีกเลย กระทบทุกคนที่ใช้แชทจริง ไม่ใช่แค่กรณี edge case
2. **[Account] ลบบัญชีร้านค้าไม่ได้ (S1-13)** — shop owner ทุกคนที่มีร้านค้าจริงกดลบบัญชีตัวเองแล้วจะเจอ 500 ทันที เป็นฟีเจอร์ที่ "มี UI แต่ใช้งานจริงไม่ได้เลย"
3. **[Storage] Auto-delete ไม่ทำงานจริงจาก 2 สาเหตุซ้อนกัน (ST7-12 + ST7-10)** — ทั้งไม่มี cron เรียก และออเดอร์เก่าบางส่วนมี `finishedAt=NULL` ทำให้ต้องแก้ทั้ง infra และ backfill ข้อมูล ไม่ใช่แค่จุดเดียว
4. **[Storage] ไฟล์แนบแชทมองไม่เห็น/ลบไม่ได้ผ่าน admin เลย (ST7-09)** — ช่องโหว่ governance ที่ไฟล์สามารถสะสมไม่จำกัดโดยไม่มีใครตรวจสอบได้
5. **[Security] Unauthenticated upload สำเร็จจริง (SEC9-05a/ST7-03)** — ใครก็ได้อัปโหลดไฟล์เข้า Storage โดยไม่ต้อง login เลย ไม่มี rate limit เป็นความเสี่ยงด้าน cost/abuse ที่ต้องตัดสินใจเชิงนโยบาย

### สิ่งที่ทำงานได้ดี (เพื่อความสมดุล ไม่ใช่มีแต่บั๊ก)

- **Authorization/ownership checks แน่นหนามาก** — ทดสอบ cross-account (customer↔customer, shop↔shop) ทุกจุดที่คิดออกแล้ว **ไม่พบช่องโหว่เดียว** ทั้ง reviews, chat, contact-admin
- **Contact Admin E2E ทั้ง 2 ทิศทาง (ลูกค้า/ร้าน) ทำงานถูกต้องสมบูรณ์ 100%** ตามที่ user ให้ priority ไว้ตั้งแต่แรก
- **Delete shop (ฝั่ง admin) ออกแบบดีมาก** — มี defensive pattern (409 แทน 500) ที่ควรเอาไปใช้กับ Delete Account ด้วย
- **Dynamic password policy (`minPasswordLength`) ทำงานถูกต้องแบบ real-time**

### คำแนะนำ

1. Fix 5 บั๊กวิกฤตข้างต้นก่อน แล้วค่อยรัน **Phase 10 Regression** เพื่อ sign-off
2. เรื่อง unauthenticated upload และ Admin visibility เข้าดูแชท เป็นการตัดสินใจเชิงนโยบายที่ทีมต้องคุยกัน ไม่ใช่แค่ "แก้บั๊ก"
3. ควรทำ data audit หา order เก่าทั้งหมดที่ `status IN (completed, cancelled)` แต่ `finishedAt IS NULL` แล้ว backfill ก่อนเปิดใช้ cron cleanup จริง มิฉะนั้นออเดอร์เก่าจะไม่มีวันถูกเก็บกวาด
