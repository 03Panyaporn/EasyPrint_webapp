# API Spec — EasyPrint

> รายการ endpoint ทั้งหมด — เพิ่มบรรทัดใหม่ที่นี่ทุกครั้งหลังสร้าง endpoint เสร็จ (ดู `.agents/skills/api-endpoint/SKILL.md`)

## Auth

| Method | Path | คำอธิบาย | Auth |
|---|---|---|---|
| POST | `/auth/register` | สมัครสมาชิกลูกค้าใหม่ (role = customer) ตั้ง JWT httpOnly cookie ให้เลย | ไม่ต้อง |
| POST | `/auth/register/shop` | สมัครสมาชิกร้านค้าใหม่ (role = shop_owner) สร้าง user + shop พร้อมกันในทรานแซกชันเดียว, ร้านเริ่มที่ `approvalStatus: "pending"` เสมอ, ตั้ง JWT httpOnly cookie ให้เลย | ไม่ต้อง |
| POST | `/auth/login` | เข้าสู่ระบบ (ใช้ได้ทุก role รวมถึง shop_owner ที่สมัครผ่าน `/auth/register/shop`) ตั้ง JWT httpOnly cookie (rememberMe คุม maxAge) | ไม่ต้อง |
| POST | `/auth/logout` | ล้าง JWT cookie | ไม่ต้อง |
| GET | `/auth/me` | เช็ค session ปัจจุบันจาก cookie | ต้อง login |
| POST | `/auth/forgot-password` | สร้าง reset token ส่งลิงก์ไปทางอีเมล (ตอบ success เหมือนกันไม่ว่าจะเจออีเมลหรือไม่) | ไม่ต้อง |
| POST | `/auth/reset-password` | ยืนยัน token + ตั้งรหัสผ่านใหม่ (Argon2 hash) | ไม่ต้อง (ใช้ token แทน) |

## Uploads

| Method | Path | คำอธิบาย | Auth |
|---|---|---|---|
| POST | `/uploads` | อัปโหลดไฟล์รูปภาพ (multipart/form-data: `file` + `type` เป็น `"shop-photo"` / `"id-card"` / `"service-image"` / `"delivery-logo"` / `"payment-slip"`) จำกัด JPG/PNG/WEBP ไม่เกิน 5MB — คืน `{ path, url }`, `url` เป็น `null` ถ้า type เป็น `id-card`/`payment-slip` (bucket private) | ไม่ต้อง (เรียกได้ก่อน login เพราะใช้ตอนสมัครร้านค้า) |

โค้ดอยู่ที่ `apps/api/src/routes/uploads.ts` + `apps/api/src/storage.ts` — ใช้ Supabase Storage จริง bucket: `shop-photos` (public), `id-cards` (private), `payment-slips` (private, สร้างอัตโนมัติผ่าน `ensureSlipBucket()` ใน `apps/api/src/seed.ts` ถ้ายังไม่มี) — `service-image`/`delivery-logo` ใช้ bucket `shop-photos` ร่วมกับ `shop-photo` เพราะเป็นรูปสาธารณะเหมือนกัน ไม่ต้องสร้าง bucket ใหม่

⚠️ endpoint นี้เปิดสาธารณะโดยไม่มี rate limit — กันได้แค่ระดับ mime type + ขนาดไฟล์ ยอมรับความเสี่ยงนี้ไว้ก่อนสำหรับ scope โปรเจกต์นี้

## Orders

| Method | Path | คำอธิบาย | Auth |
|---|---|---|---|
| POST | `/orders` | สร้างคำสั่งพิมพ์ใหม่ (ลูกค้า) — รันเลขที่ออเดอร์ (`code` ต่อร้าน + `ref` ทั้งระบบ) อัตโนมัติ, ลองใหม่ 3 ครั้งถ้าเลขชนกัน (unique constraint `shop_id`+`code`), ส่งอีเมลยืนยันคำสั่งซื้อให้ลูกค้าแบบ best-effort หลังบันทึกสำเร็จ | ต้อง login เป็น customer |
| GET | `/shops/:shopId/orders` | list ออเดอร์ของร้าน เรียงใหม่สุดก่อน, filter ด้วย `?status=` ได้ (ไม่ใส่ = เอาทุกสถานะ) | ต้อง login เป็น shop_owner ของร้านนี้ |
| GET | `/orders/:id` | รายละเอียดออเดอร์เดียว | shop_owner ของร้านนี้ หรือ customer เจ้าของออเดอร์เอง หรือ admin |
| PATCH | `/orders/:id/status` | เปลี่ยนสถานะออเดอร์ — ใช้ endpoint เดียวกันทั้ง "เดินหน้า" (`{ status }`), "ยกเลิก", และ "ปฏิเสธการชำระเงิน" (`{ status: "cancelled", cancelReason, cancelNote? }` บังคับ `cancelReason` เมื่อ `status: "cancelled"`) — บังคับเดินตามลำดับ `pending_review → accepted → in_progress → shipping/completed` (ข้าม `shipping` อัตโนมัติถ้า `deliveryMethod: "self_pickup"`) ห้ามข้ามขั้น (400 ถ้าข้าม), ยกเลิกได้เฉพาะออเดอร์ที่ยังไม่ `completed`/`cancelled` — ส่งอีเมลแจ้งเตือนลูกค้าเฉพาะตอนยกเลิกเท่านั้น (แยกข้อความ "ปฏิเสธการชำระเงิน" ถ้ายกเลิกตอนสถานะยังเป็น `pending_review` กับ "ยกเลิกงาน" ถ้ายกเลิกตอนอื่น) ส่วนเดินหน้าสถานะปกติ (accepted/in_progress/shipping/completed) **ไม่ส่งอีเมล** ลูกค้าติดตามผ่านหน้าเว็บของลูกค้าแทน (ตาม `docs/proposal.md` หัวข้อ 1.3.2) | ต้อง login เป็น shop_owner ของร้านนี้ |

โค้ดอยู่ที่ `apps/api/src/routes/orders.ts` — Zod schema อยู่ที่ `packages/shared/src/schemas/order.ts` (`createOrderSchema`, `updateOrderStatusSchema`, `orderListQuerySchema`) — มี seed script (`bun --cwd apps/api run seed`) ไว้ใส่ออเดอร์จำลองทดสอบ เพราะหน้าสั่งซื้อจริงฝั่งลูกค้ายังไม่เสร็จ (ดู `apps/api/src/seed.ts`)

## Shops (สาธารณะฝั่งลูกค้า)

| Method | Path | คำอธิบาย | Auth |
|---|---|---|---|
| GET | `/shops` | list ร้านค้าที่ `approvalStatus: "approved"` เท่านั้น (เรียงตามใหม่สุดก่อน) ใช้แสดงหน้าแรกฝั่งลูกค้า | ไม่ต้อง |
| GET | `/shops/me` | ร้านของบัญชี shop_owner ที่ login อยู่ (`id`, `name`, `approvalStatus`, `rejectedReason`, `deliveryEnabled`) ใช้ตอนเปิดหน้า `/shop/services` เพื่อรู้ shopId ตัวเอง | ต้อง login เป็น shop_owner |

โค้ดอยู่ที่ `apps/api/src/routes/shops.ts` — ร้านที่ยัง `pending`/`rejected` จะไม่ถูกส่งออกมาจาก endpoint นี้เด็ดขาด (กรองด้วย `WHERE approval_status = 'approved'` ในคำสั่ง SQL โดยตรง ไม่ใช่กรองฝั่ง frontend)

## Main Services (บริการหลัก)

| Method | Path | คำอธิบาย | Auth |
|---|---|---|---|
| GET | `/shops/:shopId/services` | list บริการหลักของร้าน พร้อม `availableAddOns` ที่ผูกไว้ | ไม่ต้อง |
| POST | `/shops/:shopId/services` | สร้างบริการหลัก (เช็คชื่อซ้ำในร้านเดียวกัน) | ต้อง login เป็น shop_owner ของร้านนี้ |
| PATCH | `/shops/:shopId/services/:id` | แก้ไข/toggle `isActive`, แก้ addOns binding ทั้งชุด | ต้อง login เป็น shop_owner ของร้านนี้ |
| DELETE | `/shops/:shopId/services/:id` | ลบ (cascade ลบ `main_service_addons` ที่ผูกอยู่อัตโนมัติ) | ต้อง login เป็น shop_owner ของร้านนี้ |

## Add-on Services (บริการเสริม)

| Method | Path | คำอธิบาย | Auth |
|---|---|---|---|
| GET | `/shops/:shopId/addons` | list บริการเสริมของร้าน | ไม่ต้อง |
| POST | `/shops/:shopId/addons` | สร้างบริการเสริม (เช็คชื่อซ้ำ) | ต้อง login เป็น shop_owner ของร้านนี้ |
| PATCH | `/shops/:shopId/addons/:id` | แก้ไข/toggle `isActive` | ต้อง login เป็น shop_owner ของร้านนี้ |
| DELETE | `/shops/:shopId/addons/:id` | ลบ (cascade ลบ binding ที่บริการหลักอื่นผูกไว้อัตโนมัติ) | ต้อง login เป็น shop_owner ของร้านนี้ |

## Delivery Options (ตัวเลือกการจัดส่ง)

| Method | Path | คำอธิบาย | Auth |
|---|---|---|---|
| GET | `/shops/:shopId/delivery-options` | list ตัวเลือกจัดส่งของร้าน | ไม่ต้อง |
| POST | `/shops/:shopId/delivery-options` | สร้างตัวเลือกจัดส่ง (เช็คชื่อซ้ำ) | ต้อง login เป็น shop_owner ของร้านนี้ |
| PATCH | `/shops/:shopId/delivery-options/:id` | แก้ไข/toggle `isActive`, ส่ง `freeShippingThreshold: null` เพื่อลบเงื่อนไขส่งฟรี | ต้อง login เป็น shop_owner ของร้านนี้ |
| DELETE | `/shops/:shopId/delivery-options/:id` | ลบ | ต้อง login เป็น shop_owner ของร้านนี้ |

โค้ดอยู่ที่ `apps/api/src/routes/services.ts` — Zod schema ที่ใช้ validate อยู่ที่ `packages/shared/src/schemas/service.ts`

ทุก endpoint ที่แก้ไข/ลบในกลุ่มนี้เช็ค JWT ผ่าน `requireShopOwner()` แล้ว (401 ถ้ายังไม่ login, 403 ถ้า login แต่ไม่ใช่เจ้าของร้าน `:shopId` นี้, **403 ถ้าร้านยังไม่ได้รับการอนุมัติจากแอดมิน**) — endpoint GET (list) ยังคงเปิดสาธารณะเพราะลูกค้าต้องดูบริการได้โดยไม่ต้อง login แต่จะ**คืนค่าว่างถ้าร้านนั้นยังไม่ได้อนุมัติหรือถูกปฏิเสธไปแล้ว** (เช็คผ่าน `canViewShopPublicly()`) — ยกเว้นเจ้าของร้านที่ login อยู่ดูข้อมูลของร้านตัวเองได้เสมอไม่ว่าสถานะไหน กันไม่ให้ราคา/บริการของร้านที่ไม่ได้รับอนุมัติ (หรือเคยอนุมัติแล้วโดนถอนทีหลัง) หลุดออกไปให้คนนอกเห็นผ่าน `shopId` ตรงๆ

## Admin — ตรวจสอบร้านค้า

| Method | Path | คำอธิบาย | Auth |
|---|---|---|---|
| GET | `/admin/shops` | list ร้านทั้งหมด พร้อมข้อมูลเจ้าของร้าน (join `users`) | ต้อง login เป็น admin |
| GET | `/admin/shops/:id` | รายละเอียดร้าน + signed URL ชั่วคราว (10 นาที) สำหรับดูรูปบัตรประชาชน | ต้อง login เป็น admin |
| PATCH | `/admin/shops/:id/approve` | อนุมัติร้าน (`approvalStatus` → `approved`, ล้าง `rejectedReason`) | ต้อง login เป็น admin |
| PATCH | `/admin/shops/:id/reject` | ไม่อนุมัติร้าน พร้อมเหตุผล (`{ reason: string }`, บังคับกรอก) | ต้อง login เป็น admin |

โค้ดอยู่ที่ `apps/api/src/routes/admin.ts` — ร้านต้อง `approvalStatus: "approved"` ก่อนถึงจะเรียก endpoint แก้ไข/ลบใน Main Services / Add-on Services / Delivery Options ด้านบนได้

## ยังไม่ได้ทำ (ตาม scope ในข้อเสนอโครงการ)

- Shops: `GET /shops/:id`, `PATCH /shops/:id` (รวมถึง toggle `delivery_enabled` ทั้งร้าน)
- Dashboard: `GET /shops/:id/dashboard` (สรุปรายได้ตาม 1.3.1.6)
- แจ้งเตือนอีเมลจริงตอนอนุมัติ/ไม่อนุมัติร้านค้า (ตอนนี้ backend อัปเดตสถานะอย่างเดียว ไม่ได้ส่งอีเมล — ต่างจาก orders ที่มีแจ้งเตือนแล้ว)
- หน้าสั่งซื้อของลูกค้าจริง (`apps/web/app/(customer)/orders/new`) ยังเป็น stub เปล่า — `POST /orders` backend พร้อมใช้แล้วแต่ยังไม่มีฟอร์มเรียกจริง
- คำนวณ `total_price` จริงตามอัตราร้าน (ตอนนี้ `POST /orders` ใช้สูตรชั่วคราว)
- ระบบ auto-verify สลิป (OCR อ่านยอด/ธนาคารอัตโนมัติ) — ตอนนี้ร้านต้องดูสลิปด้วยตาแล้วกดอนุมัติ/ปฏิเสธเอง
- อัปโหลดรูปภาพจริงผ่าน Supabase Storage (ตอนนี้ frontend เป็นกล่อง mock)
