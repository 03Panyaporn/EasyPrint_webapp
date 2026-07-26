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

## Orders

| Method | Path | คำอธิบาย | Auth |
|---|---|---|---|
| POST | `/orders` | สร้างคำสั่งพิมพ์ใหม่ | ยังไม่ใส่ (TODO) |

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

ทุก endpoint ที่แก้ไข/ลบในกลุ่มนี้เช็ค JWT ผ่าน `requireShopOwner()` แล้ว (401 ถ้ายังไม่ login, 403 ถ้า login แต่ไม่ใช่เจ้าของร้าน `:shopId` นี้) — endpoint GET (list) ยังคงเปิดสาธารณะเพราะลูกค้าต้องดูบริการได้โดยไม่ต้อง login

## ยังไม่ได้ทำ (ตาม scope ในข้อเสนอโครงการ)

- Shops: `GET /shops/:id`, `PATCH /shops/:id` (รวมถึง toggle `delivery_enabled` ทั้งร้าน)
- Orders: `GET /orders/:id`, `PATCH /orders/:id/status`, `GET /shops/:id/orders`
- Dashboard: `GET /shops/:id/dashboard` (สรุปรายได้ตาม 1.3.1.6)
- Admin: `GET /admin/shops`, `PATCH /admin/shops/:id/approve`
- อัปโหลดรูปภาพจริงผ่าน Supabase Storage (ตอนนี้ frontend เป็นกล่อง mock)
