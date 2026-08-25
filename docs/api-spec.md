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
| POST | `/auth/change-password` | ผู้ใช้ล็อกอินอยู่แล้วเปลี่ยนรหัสผ่านเอง ตรวจรหัสผ่านปัจจุบันก่อน + ห้ามซ้ำกับรหัสเดิม | ต้อง login |

## Uploads

| Method | Path | คำอธิบาย | Auth |
|---|---|---|---|
| POST | `/uploads` | อัปโหลดไฟล์ (multipart/form-data: `file` + `type` เป็น `"shop-photo"` / `"id-card"` / `"service-image"` / `"delivery-logo"` / `"payment-slip"` / `"order-file"` / `"system-logo"`) — คืน `{ path, url }`, `url` เป็น `null` ถ้า bucket private (`id-card`, `payment-slip`, `order-file`) | ไม่ต้อง ยกเว้น `order-file`/`payment-slip` ที่ต้อง login เป็น customer และ `system-logo` ที่ต้อง login เป็น admin |

โค้ดอยู่ที่ `apps/api/src/routes/uploads.ts` + `apps/api/src/storage.ts` — ใช้ Supabase Storage จริง bucket: `shop-photos` (public), `id-cards` (private), `payment-slips` (private), `order-files` (private, สร้างใหม่ตอนทำระบบตะกร้า) — `service-image`/`delivery-logo`/`system-logo` ใช้ bucket `shop-photos` ร่วมกับ `shop-photo` เพราะเป็นรูปสาธารณะเหมือนกัน ไม่ต้องสร้าง bucket ใหม่ ส่วน `order-file` (ไฟล์งานพิมพ์ในตะกร้า/ออเดอร์) รับ JPG/PNG/WEBP/PDF ไม่เกิน 20MB ต่างจาก type อื่นที่รับแค่รูปไม่เกิน 5MB และเป็น private เพราะอาจมีข้อมูลส่วนตัวในไฟล์

⚠️ endpoint นี้เปิดสาธารณะโดยไม่มี rate limit (ยกเว้น `order-file`/`payment-slip`/`system-logo` ที่บังคับ login แล้ว) — กันได้แค่ระดับ mime type + ขนาดไฟล์ ยอมรับความเสี่ยงนี้ไว้ก่อนสำหรับ scope โปรเจกต์นี้

## Orders

| Method | Path | คำอธิบาย | Auth |
|---|---|---|---|
| POST | `/orders` | สร้างคำสั่งพิมพ์ใหม่ (ลูกค้า) — `customerId` ดึงจาก JWT เท่านั้น ห้ามรับจาก body (กัน spoof), รันเลขที่ออเดอร์ (`code` ต่อร้าน + `ref` ทั้งระบบ) อัตโนมัติ, ลองใหม่ 3 ครั้งถ้าเลขชนกัน (unique constraint `shop_id`+`code`), ส่งอีเมลยืนยันคำสั่งซื้อให้ลูกค้าแบบ best-effort หลังบันทึกสำเร็จ | ต้อง login เป็น customer |
| GET | `/shops/:shopId/orders` | list ออเดอร์ของร้าน เรียงใหม่สุดก่อน, filter ด้วย `?status=` ได้ (ไม่ใส่ = เอาทุกสถานะ) | ต้อง login เป็น shop_owner ของร้านนี้ |
| GET | `/orders/:id` | รายละเอียดออเดอร์เดียว | shop_owner ของร้านนี้ หรือ customer เจ้าของออเดอร์เอง หรือ admin |
| PATCH | `/orders/:id/status` | เปลี่ยนสถานะออเดอร์ — ใช้ endpoint เดียวกันทั้ง "เดินหน้า" (`{ status }`), "ยกเลิก", และ "ปฏิเสธการชำระเงิน" (`{ status: "cancelled", cancelReason, cancelNote? }` บังคับ `cancelReason` เมื่อ `status: "cancelled"`) — บังคับเดินตามลำดับ `pending_review → accepted → in_progress → shipping/completed` (ข้าม `shipping` อัตโนมัติถ้า `deliveryMethod: "self_pickup"`) ห้ามข้ามขั้น (400 ถ้าข้าม), ยกเลิกได้เฉพาะออเดอร์ที่ยังไม่ `completed`/`cancelled` — ส่งอีเมลแจ้งเตือนลูกค้าเฉพาะตอนร้านเป็นคนยกเลิก/ปฏิเสธเท่านั้น (แยกข้อความ "ปฏิเสธการชำระเงิน" ถ้ายกเลิกตอนสถานะยังเป็น `pending_review` กับ "ยกเลิกงาน" ถ้ายกเลิกตอนอื่น) ส่วนเดินหน้าสถานะปกติ (accepted/in_progress/shipping/completed) **ไม่ส่งอีเมล** ลูกค้าติดตามผ่านหน้าเว็บของลูกค้าแทน (ตาม `docs/proposal.md` หัวข้อ 1.3.2) — สร้าง `admin_notifications` (type `order_cancelled`) ทุกครั้งที่ยกเลิก ไม่ว่าฝั่งไหนเป็นคนกด | ต้อง login เป็น shop_owner ของร้านนี้ **หรือ**ลูกค้าเจ้าของออเดอร์ (จำกัดกว่า: ยกเลิกได้อย่างเดียว เฉพาะตอน `status` ยังเป็น `pending_review` เท่านั้น, ล็อก `cancelReason` เป็น `customer_request` เสมอไม่สนใจค่าที่ส่งมา) |
| GET | `/customers/orders` | ประวัติ/รายการออเดอร์ทั้งหมดของลูกค้าที่ login อยู่ (ทุกสถานะ) — หน้า "ประวัติการสั่งซื้อ" ฝั่ง web กรองเอาเฉพาะ `status: "completed"` เองจากผลลัพธ์นี้ | ต้อง login เป็น customer |

โค้ดอยู่ที่ `apps/api/src/routes/orders.ts` — Zod schema อยู่ที่ `packages/shared/src/schemas/order.ts` (`createOrderSchema`, `updateOrderStatusSchema`, `orderListQuerySchema`) — มี seed script (`bun --cwd apps/api run seed`) ไว้ใส่ออเดอร์จำลองทดสอบ เพราะหน้าสั่งซื้อจริงฝั่งลูกค้ายังไม่เสร็จ (ดู `apps/api/src/seed.ts`)

⚠️ **`POST /orders` เป็น endpoint เก่า (Schema v1) ที่ไม่มี frontend เรียกใช้แล้ว — ตกค้างไว้เฉยๆ ไม่ได้ลบ:** `totalPrice` ยังคำนวณจากสูตรชั่วคราว (`pages * copies * 100`) ไม่อิงราคาจริง และไม่ได้สร้าง `order_items` เลย ส่วน flow สั่งซื้อจริงที่ frontend ใช้อยู่ตอนนี้คือ `POST /shops/:shopId/cart/checkout` (ดูหัวข้อ Cart) ที่คำนวณราคาฝั่ง server ครบถ้วนและ snapshot ราคา ณ ตอนสั่งไว้ใน `order_items` แล้ว — ควรพิจารณาลบ `POST /orders` ทิ้งถ้ายืนยันว่าไม่มีที่ไหนเรียกใช้อีก

## Reviews (รีวิว)

| Method | Path | คำอธิบาย | Auth |
|---|---|---|---|
| POST | `/orders/:id/review` | ลูกค้ารีวิวออเดอร์ของตัวเอง (`{ rating: 1-5, comment?: string }`) — รีวิวได้เฉพาะออเดอร์ `status: "completed"` เท่านั้น และรีวิวได้ครั้งเดียวต่อออเดอร์ (409 ถ้ารีวิวไปแล้ว) | ต้อง login เป็น customer เจ้าของออเดอร์ |
| GET | `/orders/:id/review` | ดูรีวิวของออเดอร์ตัวเอง — คืน `{ review: null }` ถ้ายังไม่เคยรีวิว ใช้เช็คก่อนแสดงฟอร์มเขียนรีวิว/แสดงรีวิวที่เขียนไปแล้ว | ต้อง login เป็นเจ้าของออเดอร์หรือ admin |
| GET | `/shops/:shopId/reviews` | list รีวิวทั้งหมดของร้าน (ใหม่สุดก่อน) พร้อมสรุปคะแนนเฉลี่ยและ distribution ตามดาว | ไม่ต้อง |
| PATCH | `/shops/:shopId/reviews/:id/reply` | ร้านตอบกลับรีวิว (`{ reply: string }`) — ตอบซ้ำได้ (แก้ทับคำตอบเดิม) | ต้อง login เป็น shop_owner ของร้านนี้ |
| DELETE | `/reviews/:id` | ลบรีวิว | เจ้าของรีวิวเอง (customer) หรือ admin เท่านั้น |
| GET | `/admin/reviews` | list รีวิวทั้งหมดจากทุกร้านในระบบ (ใหม่สุดก่อน) พร้อมชื่อร้าน — ใช้หน้า moderation `/admin/reviews` ฝั่ง web | ต้อง login เป็น admin |

โค้ดอยู่ที่ `apps/api/src/routes/reviews.ts` — Zod/type ที่ `packages/shared/src/schemas/review.ts` — ชื่อลูกค้าที่แสดงในรีวิวสาธารณะตัดเหลือแค่ชื่อจริง + นามสกุลอักษรย่อ (เช่น "สมชาย จ.") เพื่อความเป็นส่วนตัว — `GET /shops` (list) และ `GET /shops/:shopId` (detail) เพิ่ม field `avgRating`/`reviewCount` เข้าไปในทุก response แล้ว (คำนวณจากตาราง `reviews` สด ไม่มี cache) — หน้าแอดมิน moderation อยู่ที่ `apps/web/app/(admin)/admin/reviews/page.tsx`

## Shops (สาธารณะฝั่งลูกค้า)

| Method | Path | คำอธิบาย | Auth |
|---|---|---|---|
| GET | `/shops` | list ร้านค้าที่ `approvalStatus: "approved"` เท่านั้น (เรียงตามใหม่สุดก่อน) ใช้แสดงหน้าแรกฝั่งลูกค้า | ไม่ต้อง |
| GET | `/shops/me` | ร้านของบัญชี shop_owner ที่ login อยู่ (`id`, `name`, `approvalStatus`, `rejectedReason`, `deliveryEnabled`) ใช้ตอนเปิดหน้า `/shop/services` เพื่อรู้ shopId ตัวเอง | ต้อง login เป็น shop_owner |
| GET | `/shops/:shopId` | รายละเอียดร้านเดี่ยว (`id`, `name`, `phone`, `address`, `serviceTypes`, `deliveryMethods`, `googleMapLink`, `socialMedia`, `openingHours`, `shopPhotoUrl`) ใช้หน้ารายละเอียดร้านฝั่งลูกค้า — คืน 404 ถ้าร้านยัง `pending`/`rejected` หรือไม่มีจริง | ไม่ต้อง |

โค้ดอยู่ที่ `apps/api/src/routes/shops.ts` — ร้านที่ยัง `pending`/`rejected` จะไม่ถูกส่งออกมาจาก endpoint นี้เด็ดขาด (กรองด้วย `WHERE approval_status = 'approved'` ในคำสั่ง SQL โดยตรง ไม่ใช่กรองฝั่ง frontend) — ⚠️ param ชื่อ `:shopId` ต้องตรงกับที่ประกาศไว้ใน `services.ts`/`cart.ts` เสมอ (Elysia/memoirist บังคับให้ทุก route ที่ path prefix ตรงกันใช้ชื่อ param เดียวกัน ไม่งั้น error ตอน compile route ทันที)

## Main Services (บริการหลัก)

| Method | Path | คำอธิบาย | Auth |
|---|---|---|---|
| GET | `/shops/:shopId/services` | list บริการหลักของร้าน พร้อม `availableAddOns`, `options` (พร้อม `values` ซ้อนใน) ที่ผูกไว้ | ไม่ต้อง |
| POST | `/shops/:shopId/services` | สร้างบริการหลัก (เช็คชื่อซ้ำในร้านเดียวกัน) — บังคับส่ง `pricingModel` + `basePrice` | ต้อง login เป็น shop_owner ของร้านนี้ |
| POST | `/shops/:shopId/services/:id/duplicate` | คัดลอกบริการหลัก (พร้อม options/values/addon binding) ตั้งชื่อใหม่อัตโนมัติ (เช่น "... (คัดลอก)") และปิดใช้งานไว้ก่อนเสมอให้ร้านตรวจสอบก่อนเปิดขายจริง | ต้อง login เป็น shop_owner ของร้านนี้ |
| PATCH | `/shops/:shopId/services/:id` | แก้ไข/toggle `isActive`, แก้ addOns binding ทั้งชุด, แก้ `options` ทั้งชุด (ลบของเดิมแล้วใส่ใหม่) | ต้อง login เป็น shop_owner ของร้านนี้ |
| DELETE | `/shops/:shopId/services/:id` | ลบ (cascade ลบ `main_service_addons` + `service_options` + `service_option_values` ที่ผูกอยู่อัตโนมัติ) | ต้อง login เป็น shop_owner ของร้านนี้ |

**`pricingModel`**: `"per_page" | "per_piece" | "per_sqm" | "fixed"` (default `"fixed"`) — วิธีคิด "หน่วย" ที่ `basePrice` ถูกคูณด้วย: `per_page` = จำนวนหน้า PDF ที่นับได้จริง (ดูหัวข้อ Cart), `per_sqm` = พื้นที่ (ตร.ม.) จากกว้าง/สูงที่ลูกค้ากรอกเอง, `per_piece`/`fixed` = ไม่มีหน่วยพิเศษ (คูณด้วย `quantity` เหมือนกันทุกโหมดที่ชั้นตะกร้า)

**`basePrice`**: `number` (≥0) — ราคาพื้นฐานต่อหน่วยตาม `pricingModel` หรือราคาเหมาจ่ายทั้งงานถ้าเป็น `fixed`

**`requiresFileUpload`**: `boolean` (default `true`) + **`allowedFileTypes`**: `("pdf"|"jpg"|"png"|"ai"|"psd")[]` — ควบคุมว่าบริการนี้ต้องให้ลูกค้าแนบไฟล์ไหม และรับไฟล์ชนิดใดบ้าง

**`options`**: `{ name: string, type: "dropdown"|"radio"|"checkbox"|"number"|"text", values: { name: string, extraPrice: number }[] }[]` — ร้านค้าสร้างตัวเลือกได้ไม่จำกัด (เช่น ประเภทกระดาษ, สี, วัสดุ) แทนที่ระบบ `priceOptions`/`areaRates`/`pageRates` แบบ hardcode เดิมทั้งหมด:
- `dropdown`/`radio`/`checkbox` ต้องมี `values` อย่างน้อย 1 รายการ, `number`/`text` ต้องไม่มี `values` เลย (ลูกค้ากรอกเองอิสระ ไม่มีราคาเพิ่ม)
- `checkbox` เป็น toggle เดียวเท่านั้น (ไม่ใช่ multi-select) — บังคับมี `values` แถวเดียวพอดี
- `dropdown`/`radio`/`number` บังคับให้ลูกค้าเลือก/กรอกก่อนสั่งซื้อ (validate ที่ `POST/PATCH .../cart/items`), `checkbox`/`text` ไม่บังคับ
- ห้ามมีชื่อ option ซ้ำกันในบริการเดียวกัน, ห้ามมีชื่อ value ซ้ำกันในตัวเลือกเดียวกัน, `extraPrice` ห้ามติดลบ

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

## Cart (ตะกร้าของลูกค้า)

| Method | Path | คำอธิบาย | Auth |
|---|---|---|---|
| GET | `/carts` | ตะกร้าทั้งหมดของลูกค้าที่ login อยู่ (คนละร้านคนละใบ) พร้อมราคาคำนวณสดทุกรายการ | ต้อง login เป็น customer |
| GET | `/shops/:shopId/cart` | ตะกร้าของร้านนี้ร้านเดียว (`null` ถ้ายังไม่เคยเพิ่มของจากร้านนี้) | ต้อง login เป็น customer |
| POST | `/shops/:shopId/cart/items` | เพิ่มสินค้าลงตะกร้าของร้านนี้ — สร้างตะกร้าใหม่ให้เลยถ้ายังไม่มี | ต้อง login เป็น customer |
| PATCH | `/cart/items/:id` | แก้ไขรายการในตะกร้า (ส่งข้อมูลเต็มเหมือนตอนเพิ่ม รวม `mainServiceId`) | ต้อง login เป็น customer เจ้าของตะกร้านั้น |
| DELETE | `/cart/items/:id` | ลบรายการเดียวออกจากตะกร้า | ต้อง login เป็น customer เจ้าของตะกร้านั้น |
| PATCH | `/shops/:shopId/cart` | เลือก/ยกเลิกวิธีจัดส่งของตะกร้าร้านนี้ (`{ deliveryOptionId: string \| null }`) | ต้อง login เป็น customer เจ้าของตะกร้านั้น |
| DELETE | `/shops/:shopId/cart` | ล้างตะกร้าของร้านนี้ | ต้อง login เป็น customer เจ้าของตะกร้านั้น |
| POST | `/shops/:shopId/cart/checkout` | แปลงตะกร้าของร้านนี้เป็นออเดอร์จริง — คำนวณราคาฝั่ง server แล้ว snapshot ทุกอย่าง (ชื่อบริการ/ราคา/ตัวเลือก/สี ณ ตอนสั่ง) ลง `order_items`, ลบตะกร้าทิ้งหลังสำเร็จ, ส่งอีเมลยืนยันคำสั่งซื้อให้ลูกค้าแบบ best-effort | ต้อง login เป็น customer เจ้าของตะกร้านั้น |

โค้ดอยู่ที่ `apps/api/src/routes/cart.ts` — Zod schema ที่ `packages/shared/src/schemas/cart.ts`

**กฎสำคัญของตะกร้า:**
- **1 ลูกค้ามีได้หลายตะกร้าพร้อมกัน แต่ 1 ตะกร้าผูกกับ 1 ร้านเท่านั้น** (unique constraint บน `carts(customer_id, shop_id)`) — เพิ่มสินค้าจากร้าน A และร้าน B พร้อมกันได้โดยไม่ชนกัน แต่ละ endpoint ที่แก้ไข/ล้างตะกร้าจึงต้องระบุ `:shopId` เสมอเพื่อบอกว่ากำลังแก้ตะกร้าของร้านไหน
- **ราคาไม่เคยเก็บไว้ในตะกร้าเลย** — ทุกครั้งที่ `GET /carts`, `GET /shops/:shopId/cart` หรือหลัง mutation ใดๆ ระบบคำนวณสดจาก `main_services`/`service_options`/`service_option_values`/`main_service_addons` กันราคาไม่ตรงกับของจริงถ้าร้านแก้ราคาทีหลัง — สูตร: `(basePrice + ผลรวม extraPrice ของ optionSelections ที่เลือก) x หน่วยตาม pricingModel x quantity` แล้วบวก add-on ที่เลือก
- ทุก endpoint ที่แก้ไข/ลบ item เช็คความเป็นเจ้าของผ่าน join `cart_items` ↔ `carts` ↔ `customerId` เสมอ กัน IDOR (ลูกค้า A แก้ตะกร้าของลูกค้า B ผ่านการเดา cart item id ไม่ได้)
- **`optionSelections`**: `{ optionId: string, valueId?: string, textValue?: string }[]` — ส่งเฉพาะตัวเลือกที่ลูกค้าเลือก/กรอกจริง เซิร์ฟเวอร์ validate ว่าทุก `optionId` ผูกกับ `mainServiceId` นี้จริง, `dropdown`/`radio`/`number` ต้องมีอยู่ในลิสต์เสมอ (บังคับกรอก), `dropdown`/`radio`/`checkbox` ต้องมี `valueId` ที่มีอยู่จริงในตัวเลือกนั้น, `number` ต้องแปลงเป็นตัวเลขได้จริง
- `addOnIds` ที่ส่งมาทุกตัวต้องผูกกับ `mainServiceId` นั้นจริง (กันส่ง ID มั่วๆ ข้ามร้าน/ข้ามบริการ)
- **`pricingModel: "per_page"`**: ลูกค้าต้องแนบ `fileUrl` (ไฟล์ PDF ที่อัปโหลดไว้แล้ว) — **ไม่มี field `pageCount` ให้ client ส่งเลย** เซิร์ฟเวอร์ดาวน์โหลดไฟล์จาก Supabase Storage แล้วนับจำนวนหน้าเองด้วย `pdf-lib` (`countPdfPages()` ใน `apps/api/src/routes/cart.ts`) ทุกครั้งที่เพิ่ม/แก้ไขรายการ — กัน customer ปลอมจำนวนหน้าผ่าน request ตรงๆ เพื่อกดราคาถูกลง
- **`pricingModel: "per_sqm"`**: ลูกค้าต้องส่ง `widthCm`/`heightCm` เอง (1-1000 ซม.) คำนวณพื้นที่ = กว้าง(ม.) x สูง(ม.) ฝั่ง server เสมอ

## Reports (รายงานร้านค้า)

| Method | Path | คำอธิบาย | Auth |
|---|---|---|---|
| GET | `/shops/:shopId/reports` | สรุปรายงานร้าน — `?period=today\|7days\|30days\|thisMonth\|thisYear` — คืน `metrics` (รายได้รวม/วันนี้, จำนวนออเดอร์รวม/สำเร็จ พร้อม % เปลี่ยนแปลงเทียบช่วงก่อนหน้า), `categories` (สัดส่วนรายได้ตามชื่อบริการ รวมค่าจัดส่งเป็นหมวดแยก), `series` (จุดกราฟตามช่วงเวลา), `ordersByStatus` (จำนวน/ยอดตามใบสั่งซื้อ แยกครบทุกสถานะ นับทุกสถานะไม่ใช่แค่ completed) | ต้อง login เป็น shop_owner ของร้านนี้ |
| GET | `/shops/:shopId/reports/orders` | รายการออเดอร์แบบละเอียดในช่วงเวลาเดียวกับ `?period=` — ใช้ประกอบการ export Excel เท่านั้น (แยก endpoint จากตัวบนเพราะข้อมูลหนักกว่า ไม่ต้องดึงทุกครั้งที่เปิดหน้า) | ต้อง login เป็น shop_owner ของร้านนี้ |

โค้ดอยู่ที่ `apps/api/src/routes/reports.ts` — Zod schema + type ที่ `packages/shared/src/schemas/report.ts` — เวลาไทย (UTC+7) แปลงจาก UTC ทุกครั้งก่อน query กันขอบเขต "วันนี้"/"เดือนนี้" ผิดเวลา — ฝั่ง web export เป็นไฟล์ `.xlsx` จริงด้วย `exceljs` (2 sheet: สรุป + รายการออเดอร์ละเอียด) ไม่ใช่ CSV แล้ว

## Contact Admin (ร้านค้าติดต่อแอดมิน)

| Method | Path | คำอธิบาย | Auth |
|---|---|---|---|
| POST | `/shops/:shopId/contact-admin` | ร้านส่งข้อความ/คำร้องถึงแอดมิน (`{ subject, message }`) — สร้าง `admin_notifications` (type `contact_admin_message`) ให้อัตโนมัติ | ต้อง login เป็น shop_owner ของร้านนี้ |
| GET | `/shops/:shopId/contact-admin` | ประวัติข้อความที่ร้านตัวเองเคยส่ง (ใหม่สุดก่อน) | ต้อง login เป็น shop_owner ของร้านนี้ |
| GET | `/admin/contact-messages` | แอดมินดูข้อความ contact-admin ทั้งหมดจากทุกร้าน | ต้อง login เป็น admin |
| PATCH | `/admin/contact-messages/:id/reply` | แอดมินตอบกลับข้อความ (`{ adminReply }`) — ตั้ง `status` เป็น `resolved` อัตโนมัติ | ต้อง login เป็น admin |

โค้ดอยู่ที่ `apps/api/src/routes/contactAdmin.ts` — Zod schema ที่ `packages/shared/src/schemas/notification.ts`

## Messages (แชทลูกค้า ↔ ร้านค้า ผูกกับออเดอร์)

| Method | Path | คำอธิบาย | Auth |
|---|---|---|---|
| GET | `/messages/rooms` | list "ห้องแชท" (ออเดอร์ที่มีข้อความ) ของผู้ใช้ปัจจุบัน พร้อมข้อความล่าสุดและจำนวนที่ยังไม่อ่าน เรียงตามข้อความล่าสุดก่อน | ต้อง login เป็น customer หรือ shop_owner |
| POST | `/messages` | ส่งข้อความในออเดอร์ — ข้อความปกติ `{ orderId, content }` หรือไฟล์แนบ `{ orderId, filePath, fileName }` (`filePath` คือ path ที่ได้จาก `POST /uploads` type `order-file`) — สร้าง notification (type 3) ให้อีกฝั่งแบบ best-effort | ต้อง login เป็นลูกค้าเจ้าของออเดอร์ หรือเจ้าของร้านของออเดอร์นั้น |
| PATCH | `/messages/:orderId/read` | มาร์คข้อความทั้งหมดในออเดอร์นี้ที่ไม่ได้ส่งโดยตัวเองว่าอ่านแล้ว | เหมือนข้างบน |
| GET | `/messages/:orderId` | ประวัติแชทของออเดอร์นี้ (ใหม่สุดก่อน) — แต่ละข้อความมี `isFile`/`fileUrl` (signed URL อายุ 1 ชม.)/`fileName` เพิ่มมาให้ถ้าเป็นไฟล์แนบ | เหมือนข้างบน |

โค้ดอยู่ที่ `apps/api/src/routes/messages.ts` — สิทธิ์ฝั่งร้านค้าต้อง join `shops` เทียบ `ownerId` กับ user ที่ login เสมอ (`order.shopId` เป็น id ของร้าน ไม่ใช่ id ของ user เจ้าของร้าน) — ไฟล์แนบในแชทเก็บ path ของ bucket private `order-files` เป็น JSON marker ใน `messages.content` (ไม่มีคอลัมน์แยก) แล้วแปลงเป็น signed URL ตอนอ่านเท่านั้น — `POST /uploads` type `order-file` เปิดให้ทั้ง customer และ shop_owner อัปโหลดได้แล้ว (เดิมจำกัดแค่ customer)

## Admin — การแจ้งเตือน (in-app)

| Method | Path | คำอธิบาย | Auth |
|---|---|---|---|
| GET | `/admin/notifications` | list การแจ้งเตือน 50 รายการล่าสุด (ใหม่สุดก่อน) + จำนวนที่ยังไม่อ่าน — ฝั่ง web polling ทุก 30 วิ (ไม่มี WebSocket ในระบบ) | ต้อง login เป็น admin |
| PATCH | `/admin/notifications/:id/read` | มาร์คอ่านแล้วรายการเดียว | ต้อง login เป็น admin |
| PATCH | `/admin/notifications/read-all` | มาร์คอ่านแล้วทั้งหมด | ต้อง login เป็น admin |

โค้ดอยู่ที่ `apps/api/src/routes/adminNotificationsRoutes.ts` + helper กลาง `apps/api/src/adminNotifications.ts` (เรียกจาก route อื่นแบบ best-effort ไม่ทำให้ request หลัก fail ถ้าแจ้งเตือนพลาด) — event ที่มีตอนนี้ 3 อย่าง: ร้านสมัครใหม่ (`shop_registered`, ยิงจาก `POST /auth/register/shop`), ออเดอร์ถูกยกเลิก/ปฏิเสธชำระเงิน (`order_cancelled`, ยิงจาก `PATCH /orders/:id/status`), ข้อความ contact-admin ใหม่ (`contact_admin_message`)

## Admin — ตรวจสอบร้านค้า

| Method | Path | คำอธิบาย | Auth |
|---|---|---|---|
| GET | `/admin/dashboard` | สรุปภาพรวมหน้าหลักแอดมิน — จำนวนร้านทั้งหมด/อนุมัติแล้ว/รอตรวจสอบ, จำนวนลูกค้าทั้งหมด (พร้อม % เปลี่ยนแปลงเทียบ 7 วันที่แล้วเฉพาะยอดที่อิง `createdAt`), รายชื่อร้านรอตรวจสอบ 5 อันดับล่าสุด | ต้อง login เป็น admin |
| GET | `/admin/shops` | list ร้านทั้งหมด พร้อมข้อมูลเจ้าของร้าน (join `users`) | ต้อง login เป็น admin |
| GET | `/admin/shops/:id` | รายละเอียดร้าน + signed URL ชั่วคราว (10 นาที) สำหรับดูรูปบัตรประชาชน | ต้อง login เป็น admin |
| PATCH | `/admin/shops/:id` | แก้ข้อมูลร้านค้าแทนเจ้าของร้าน (ชื่อ/เบอร์/อีเมล/ที่อยู่/ประเภทบริการ) | ต้อง login เป็น admin |
| DELETE | `/admin/shops/:id` | ลบร้านค้า — ลบไม่ได้ถ้ามีบริการ/ออเดอร์ผูกอยู่ (409, ให้ใช้ระงับ/ปฏิเสธแทน) | ต้อง login เป็น admin |
| PATCH | `/admin/shops/:id/approve` | อนุมัติร้าน (`approvalStatus` → `approved`, ล้าง `rejectedReason`) — ใช้ endpoint เดียวกันทั้งอนุมัติร้านสมัครใหม่และ "คืนสถานะ" ร้านที่เคยถูกระงับ (`suspended` → `approved`) เพราะทำสิ่งเดียวกันเป๊ะ | ต้อง login เป็น admin |
| PATCH | `/admin/shops/:id/reject` | ไม่อนุมัติร้าน พร้อมเหตุผล (`{ reason: string }`, บังคับกรอก) — ใช้กับร้านสมัครใหม่ที่ยังไม่เคยอนุมัติเท่านั้น | ต้อง login เป็น admin |
| PATCH | `/admin/shops/:id/suspend` | ระงับร้านที่เคยอนุมัติแล้ว พร้อมเหตุผล (`{ reason: string }`, บังคับกรอก, `approvalStatus` → `suspended`) — ต่างจาก `reject` ตรงที่ใช้กับร้านที่เปิดขายอยู่จริงแล้วโดนระงับทีหลัง ไม่ใช่ร้านสมัครใหม่ | ต้อง login เป็น admin |

โค้ดอยู่ที่ `apps/api/src/routes/admin.ts` — ร้านต้อง `approvalStatus: "approved"` ก่อนถึงจะเรียก endpoint แก้ไข/ลบใน Main Services / Add-on Services / Delivery Options ด้านบนได้ (ร้าน `suspended` ถูกกันแบบเดียวกับ `pending`/`rejected` โดยอัตโนมัติ เพราะ `requireShopOwner()`/`canViewShopPublicly()` เช็คแบบ `!== "approved"`/`=== "approved"` อยู่แล้ว ไม่ต้องแก้โค้ดจุดนั้นเพิ่มตอนเพิ่มสถานะ `suspended`) — `GET /shops` (list สาธารณะ) กรองด้วย `WHERE approvalStatus = 'approved'` ตรงๆ เลยไม่ต้องแก้เพิ่มเช่นกัน ร้าน `suspended` จะหายจากรายการสาธารณะทันที

## Admin — จัดการพื้นที่จัดเก็บ

| Method | Path | คำอธิบาย | Auth |
|---|---|---|---|
| GET | `/admin/storage/overview` | สรุปพื้นที่ใช้งานต่อร้าน (พื้นที่ใช้ไป/โควต้า/เปอร์เซ็นต์/สถานะ `normal`\|`warning`(>65%)\|`danger`(>85%)) พร้อมยอดรวมทั้งระบบ | ต้อง login เป็น admin |
| GET | `/admin/storage/files` | list ไฟล์งานพิมพ์ทั้งหมด (ทั้งที่ยังอยู่ในตะกร้าและอยู่ในออเดอร์แล้ว) เรียงไฟล์ใหญ่สุดก่อน — filter เฉพาะร้านเดียวด้วย `?shopId=` ได้ | ต้อง login เป็น admin |
| GET | `/admin/storage/files/:path/url` | ออก signed URL ชั่วคราว (10 นาที) ให้ดูตัวอย่าง/ดาวน์โหลดไฟล์ | ต้อง login เป็น admin |
| DELETE | `/admin/storage/files/:path` | ลบไฟล์เดียวถาวรจาก Storage จริง + เคลียร์ `fileUrl`/`fileName` ใน DB (ไม่มีถังขยะ/กู้คืน) | ต้อง login เป็น admin |
| DELETE | `/admin/storage/shops/:shopId/files` | ลบไฟล์ทั้งหมดของร้านเดียวในทีเดียว | ต้อง login เป็น admin |

โค้ดอยู่ที่ `apps/api/src/routes/adminStorage.ts` — Zod/type ที่ `packages/shared/src/schemas/adminStorage.ts` — `path` = ชื่อไฟล์ใน bucket `order-files` (UUID สุ่ม ไม่ใช่ DB id เพราะไม่มีตาราง "ไฟล์" แยก) `storageQuotaMb` แก้ผ่าน `PATCH /admin/shops/:id` เดิม (เพิ่ม field นี้เข้า `adminUpdateShopSchema` แล้ว) ส่ง `null` เพื่อล้าง override กลับไปใช้ `system_settings.defaultShopStorageQuotaMb`

⚠️ **ที่มาของขนาดไฟล์:** DB (`cart_items`/`order_items`) ไม่เก็บขนาดไฟล์เลย เพราะ bucket `order-files` ตั้งชื่อไฟล์เป็น UUID สุ่มล้วนไม่มีโฟลเดอร์แยกตามร้าน วิธีเดียวที่รู้ขนาด/เจ้าของคือ list ทั้ง bucket จาก Supabase Storage API (`listBucketFiles()` ใน `apps/api/src/storage.ts`) แล้ว join กับ DB เอาเอง (`collectAllFiles()` ใน `adminStorage.ts`) — คำนวณสดทุกครั้งที่เรียก ไม่มี cache ถ้าไฟล์เยอะมากในอนาคตอาจต้องพิจารณาแคช

⚠️ **ขอบเขต:** ครอบคลุมเฉพาะ bucket `order-files` (ไฟล์งานพิมพ์ของลูกค้า) เท่านั้น ไม่รวม `shop-photos`/`id-cards`/`payment-slips` เพราะเป็น bucket ที่ไม่โตไม่จำกัดแบบ order-files (รูปโปรไฟล์/เอกสารยืนยันตัวตน ไม่ใช่ไฟล์งานพิมพ์ต่อออเดอร์)

## Internal — งานลบไฟล์อัตโนมัติ

| Method | Path | คำอธิบาย | Auth |
|---|---|---|---|
| POST | `/internal/cleanup/expired-order-files` | ลบไฟล์งานพิมพ์ (bucket `order-files`) ของออเดอร์ที่ `status` เป็น `completed`/`cancelled` มาแล้วเกิน 1 วัน (นับจาก `orders.finishedAt`) — idempotent เรียกซ้ำได้ปลอดภัย (ไฟล์ที่ลบไปแล้ว `fileUrl` เป็น `null` แล้วจะไม่ถูกเลือกมาอีก) | ต้องส่ง header `x-cleanup-secret` ตรงกับ env `CLEANUP_SECRET` — **ไม่ใช่ JWT cookie ปกติ** เพราะเป็น machine-to-machine ไม่มีแอดมิน login ตอนเรียก |

โค้ดอยู่ที่ `apps/api/src/routes/internalCleanup.ts` — `orders.finishedAt` ตั้งค่าอัตโนมัติที่ `PATCH /orders/:id/status` ตอนสถานะเปลี่ยนเป็น `completed`/`cancelled` (ดูหัวข้อ Orders ด้านบน) ออเดอร์ที่ยังทำงานอยู่ (`pending_review`/`accepted`/`in_progress`/`shipping`) จะไม่ถูกแตะเลยไม่ว่าจะสร้างมานานแค่ไหน

⚠️ **ต้องตั้ง cron ภายนอกเองหลัง deploy — โค้ดนี้ให้แค่ endpoint ไม่ได้ตั้งเวลาเรียกเองในตัว** เพราะ Render free tier backend จะหลับหลังไม่มี request 15 นาที (ดู `AGENTS.md` หัวข้อ 7) ถ้าใช้ `setInterval` ในโปรเซส Bun เองงานจะไม่รันตอน backend หลับอยู่ ต้องใช้ตัวจับเวลาจากภายนอกมายิง endpoint นี้แทน เช่น:
- **cron-job.org** (ฟรี, ตั้งง่ายสุด) — ตั้ง POST ไปที่ `https://<api-domain>/internal/cleanup/expired-order-files` พร้อม header `x-cleanup-secret: <ค่าจาก .env>` ทุกวัน
- **Supabase pg_cron + pg_net (แนะนำ — เปิด extension ไว้ให้แล้วในโปรเจกต์นี้)** — เช็คแล้วว่า Supabase project นี้เปิดใช้ extension `pg_cron`/`pg_net` ได้จริง (`CREATE EXTENSION` ผ่านทั้งคู่) แต่**ยังไม่ได้ตั้ง job จริง เพราะยังไม่มี URL backend ที่ deploy จริงให้ยิงถึง** (ไม่เจอ Render/Vercel URL ที่ไหนในโปรเจกต์นี้เลย) พอ deploy backend เสร็จแล้วรัน SQL นี้ผ่าน Supabase SQL Editor (แทนที่ `<API_URL>` และ `<CLEANUP_SECRET>` ด้วยค่าจริง — **ห้าม commit ค่า secret ตัวจริงลง docs นี้**):
  ```sql
  select cron.schedule(
    'cleanup-expired-order-files',
    '0 3 * * *', -- ทุกวันตี 3 (UTC)
    $$
    select net.http_post(
      url := '<API_URL>/internal/cleanup/expired-order-files',
      headers := jsonb_build_object('x-cleanup-secret', '<CLEANUP_SECRET>', 'Content-Type', 'application/json')
    );
    $$
  );
  ```
  เช็คผลรันย้อนหลังได้ที่ `select * from cron.job_run_details order by start_time desc limit 10;` — ยกเลิก job ด้วย `select cron.unschedule('cleanup-expired-order-files');`
- **GitHub Actions scheduled workflow** — `on: schedule` ยิง `curl` ไปที่ endpoint เดียวกัน

## Admin — ตั้งค่าระบบ

| Method | Path | คำอธิบาย | Auth |
|---|---|---|---|
| GET | `/admin/settings` | อ่านค่าตั้งค่าระบบปัจจุบัน (ข้อมูลระบบ/การแจ้งเตือน/ความปลอดภัย/โควต้าพื้นที่ default) — ถ้ายังไม่เคยมีแถวใน DB เลย จะสร้างแถว default ให้อัตโนมัติแล้วคืนค่านั้น | ต้อง login เป็น admin |
| PATCH | `/admin/settings` | แก้ค่าตั้งค่าระบบ (ส่งเฉพาะ field ที่เปลี่ยนได้ ไม่ต้องส่งครบทุกตัว) | ต้อง login เป็น admin |

โค้ดอยู่ที่ `apps/api/src/routes/adminSettings.ts` + helper กลาง `apps/api/src/systemSettings.ts` (`getSystemSettings()` — ใช้ที่นี่และใน `apps/api/src/auth/routes.ts` ตอนเช็คความยาวรหัสผ่านขั้นต่ำ) — Zod schema ที่ `packages/shared/src/schemas/admin.ts` (`updateAdminSettingsSchema`) — ตาราง `system_settings` มีแถวเดียวเสมอ (singleton)

⚠️ **ขอบเขตของฟิลด์ "ความปลอดภัย":** `minPasswordLength` เท่านั้นที่บังคับใช้จริง (เช็คที่ `POST /auth/register`, `POST /auth/register/shop`, `POST /auth/reset-password`, `POST /auth/change-password` เพิ่มจาก Zod ที่เช็คขั้นต่ำ 8 ตัวอักษรแบบ hardcode อยู่แล้ว) ส่วน `requireSpecialChar`/`enable2fa`/`autoLogoutMinutes` เก็บค่าไว้ในฐานข้อมูลจริงแต่**ยังไม่มีผลบังคับใช้จริงในระบบ** เก็บไว้ให้ UI แสดงผล/แก้ไขได้ก่อนเฉยๆ

## ยังไม่ได้ทำ (ตาม scope ในข้อเสนอโครงการ)

- แจ้งเตือนอีเมลจริงตอนอนุมัติ/ไม่อนุมัติร้านค้า (ตอนนี้ backend อัปเดตสถานะอย่างเดียว ไม่ได้ส่งอีเมล — ต่างจาก orders ที่มีแจ้งเตือนแล้ว, มี in-app notification ให้แอดมินตอนร้านสมัครใหม่แล้วแต่ยังไม่มีอีเมลแจ้งร้านตอนผลอนุมัติออก)
- ระบบ auto-verify สลิป (OCR อ่านยอด/ธนาคารอัตโนมัติ) — ตอนนี้ร้านต้องดูสลิปด้วยตาแล้วกดอนุมัติ/ปฏิเสธเอง
- บังคับใช้จริง `requireSpecialChar`/`enable2fa`/`autoLogoutMinutes` ใน `system_settings` (ตอนนี้เก็บค่าไว้เฉยๆ ยังไม่มีผลกับระบบจริง — ดูหัวข้อ Admin — ตั้งค่าระบบด้านบน)
- ระบบแจ้งเตือน (email/push) ตาม `system_settings.notificationSettings` ที่แอดมินตั้งไว้ — ตอนนี้เก็บ preference ไว้เฉยๆ ยังไม่ผูกกับการส่งจริง
