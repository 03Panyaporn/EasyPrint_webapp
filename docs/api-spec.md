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
| POST | `/uploads` | อัปโหลดไฟล์ (multipart/form-data: `file` + `type` เป็น `"shop-photo"` / `"id-card"` / `"service-image"` / `"delivery-logo"` / `"payment-slip"` / `"order-file"`) — คืน `{ path, url }`, `url` เป็น `null` ถ้า bucket private (`id-card`, `payment-slip`, `order-file`) | ไม่ต้อง ยกเว้น `order-file` ที่ต้อง login เป็น customer |

โค้ดอยู่ที่ `apps/api/src/routes/uploads.ts` + `apps/api/src/storage.ts` — ใช้ Supabase Storage จริง bucket: `shop-photos` (public), `id-cards` (private), `payment-slips` (private), `order-files` (private, สร้างใหม่ตอนทำระบบตะกร้า) — `service-image`/`delivery-logo` ใช้ bucket `shop-photos` ร่วมกับ `shop-photo` เพราะเป็นรูปสาธารณะเหมือนกัน ไม่ต้องสร้าง bucket ใหม่ ส่วน `order-file` (ไฟล์งานพิมพ์ในตะกร้า/ออเดอร์) รับ JPG/PNG/WEBP/PDF ไม่เกิน 20MB ต่างจาก type อื่นที่รับแค่รูปไม่เกิน 5MB และเป็น private เพราะอาจมีข้อมูลส่วนตัวในไฟล์

⚠️ endpoint นี้เปิดสาธารณะโดยไม่มี rate limit (ยกเว้น `order-file` ที่บังคับ login แล้ว) — กันได้แค่ระดับ mime type + ขนาดไฟล์ ยอมรับความเสี่ยงนี้ไว้ก่อนสำหรับ scope โปรเจกต์นี้

⚠️ **TODO ที่ยังเหลือจากการ merge:** `apps/api/src/routes/uploads.ts` ยัง whitelist แค่ `["shop-photo", "id-card", "service-image", "delivery-logo", "order-file"]` — ขาด `"payment-slip"` (และฝั่ง frontend `apps/web/lib/api/uploads.ts` ก็ยังไม่มี type นี้ใน union) ทั้งที่ `storage.ts` เตรียม bucket ไว้แล้ว ต้องเพิ่มก่อนฟีเจอร์อัปโหลดสลิปจะใช้งานได้จริง

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
| PATCH | `/admin/shops/:id/approve` | อนุมัติร้าน (`approvalStatus` → `approved`, ล้าง `rejectedReason`) | ต้อง login เป็น admin |
| PATCH | `/admin/shops/:id/reject` | ไม่อนุมัติร้าน พร้อมเหตุผล (`{ reason: string }`, บังคับกรอก) | ต้อง login เป็น admin |

โค้ดอยู่ที่ `apps/api/src/routes/admin.ts` — ร้านต้อง `approvalStatus: "approved"` ก่อนถึงจะเรียก endpoint แก้ไข/ลบใน Main Services / Add-on Services / Delivery Options ด้านบนได้

## ยังไม่ได้ทำ (ตาม scope ในข้อเสนอโครงการ)

- แจ้งเตือนอีเมลจริงตอนอนุมัติ/ไม่อนุมัติร้านค้า (ตอนนี้ backend อัปเดตสถานะอย่างเดียว ไม่ได้ส่งอีเมล — ต่างจาก orders ที่มีแจ้งเตือนแล้ว, มี in-app notification ให้แอดมินตอนร้านสมัครใหม่แล้วแต่ยังไม่มีอีเมลแจ้งร้านตอนผลอนุมัติออก)
- ระบบ auto-verify สลิป (OCR อ่านยอด/ธนาคารอัตโนมัติ) — ตอนนี้ร้านต้องดูสลิปด้วยตาแล้วกดอนุมัติ/ปฏิเสธเอง
- เพิ่ม `"payment-slip"` เข้า whitelist ของ `POST /uploads` (ดูหัวข้อ Uploads ด้านบน) — ตอนนี้ bucket พร้อมแต่ endpoint ยังปฏิเสธ type นี้อยู่
