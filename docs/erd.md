# ERD — EasyPrint (ฉบับเริ่มต้น)

> ไฟล์นี้อธิบายโครงสร้างฐานข้อมูลคู่กับ `apps/api/drizzle/schema.ts` — ถ้าแก้ schema.ts ให้อัปเดตไฟล์นี้ตามด้วยเสมอ (ดู `.agents/skills/db-migration/SKILL.md`)

## ตารางเริ่มต้น

### `users`
| column | type | note |
|---|---|---|
| id | uuid (PK) | |
| email | text (unique) | |
| password_hash | text | เข้ารหัสด้วย Argon2 เท่านั้น |
| role | enum: shop_owner / customer / admin | |
| firstname | text | |
| lastname | text | |
| phone | text | |
| address | text | ไม่บังคับ |
| created_at | timestamp | |

### `password_reset_tokens`
| column | type | note |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK → users.id) | |
| token_hash | text (unique) | เก็บ hash ของ token เท่านั้น ไม่เก็บ token ดิบ (ส่งแค่ในลิงก์อีเมล) |
| expires_at | timestamp | ปกติตั้งให้หมดอายุใน 1 ชั่วโมง |
| used_at | timestamp | null จนกว่าจะถูกใช้ยืนยันเปลี่ยนรหัสผ่าน (ใช้ซ้ำไม่ได้) |
| created_at | timestamp | |

### `shops`
| column | type | note |
|---|---|---|
| id | uuid (PK) | |
| owner_id | uuid (FK → users.id) | |
| name | text | |
| phone | text | |
| address | text | ประกอบจากฟอร์มที่แยกเป็นบ้านเลขที่/หมู่/ถนน/ตำบล/อำเภอ/จังหวัด/รหัสไปรษณีย์ ตอนสมัคร แล้ว format รวมเป็นข้อความเดียว |
| service_types | text[] | "บริการของร้าน" เลือกได้หลายรายการตอนสมัคร (เดิมเป็น dropdown ประเภทร้านค้าเลือกได้ทีละ 1 — เลิกใช้ ลบคอลัมน์ `category` ออกแล้ว) ดูค่าที่รองรับที่ `shopServiceTypeSchema` ใน `packages/shared/src/schemas/auth.ts` |
| delivery_methods | text[] | "วิธีรับสินค้า" เลือกได้หลายรายการตอนสมัคร (รับที่หน้าร้าน / จัดส่งโดยร้าน) คนละความหมายกับ `delivery_enabled` ด้านล่าง (นั่นคือสวิตช์เปิด/ปิดระบบจัดส่งทั้งร้านทีหลัง) |
| google_map_link | text | บังคับกรอกตอนสมัคร |
| id_card_url | text | **storage path** (ไม่ใช่ URL จริง) จาก Supabase Storage bucket `id-cards` (private — ข้อมูลบัตรประชาชนห้ามเปิดสาธารณะ) อัปโหลดผ่าน `POST /uploads` |
| shop_photo_url | text | public URL เต็มจาก Supabase Storage bucket `shop-photos` (public) อัปโหลดผ่าน `POST /uploads` |
| social_media | text | ช่องทาง Social Media ที่กรอกตอนสมัคร |
| opening_hours | jsonb | array ตารางเวลาทำการ 7 วัน `[{ day, isOpen, openTime, closeTime }, ...]` |
| approval_status | enum: pending / approved / rejected / suspended | default `pending` — ร้านใหม่ต้องรอแอดมินอนุมัติก่อน ถึงจะตั้งบริการ/ราคาได้ (ดู `requireShopOwner()` ใน `apps/api/src/routes/services.ts`) — `suspended` = ร้านที่เคย approved แล้วโดนแอดมินระงับทีหลัง แยกจาก `rejected` (ร้านสมัครใหม่ที่ไม่ผ่านตรวจสอบ) |
| rejected_reason | text | nullable — ใส่ตอนแอดมินกด "ไม่อนุมัติ"/"ระงับ" เท่านั้น, ถูกล้างเป็น null อัตโนมัติถ้ากลับมาอนุมัติทีหลัง |
| delivery_enabled | boolean | default true |
| storage_quota_mb | integer | nullable — โควต้าพื้นที่จัดเก็บของร้านนี้ (MB) override ค่ากลาง — null = ใช้ `system_settings.default_shop_storage_quota_mb` |
| created_at | timestamp | |

### `orders`
| column | type | note |
|---|---|---|
| id | uuid (PK) | |
| shop_id | uuid (FK → shops.id) | |
| customer_id | uuid (FK → users.id) | |
| code | text | เลขที่แสดงสั้นๆ ต่อร้าน เช่น `#0005` — unique เฉพาะภายในร้านเดียวกัน (`unique(shop_id, code)`) รันเลขอัตโนมัติที่ `generateOrderCode()` ใน `apps/api/src/routes/orders.ts` |
| ref | text (unique ทั้งระบบ) | รหัสอ้างอิงเต็ม เช่น `ORD-20260516-B0F2` (วันที่ + สุ่ม 4 ตัวอักษร) |
| service_type | text | photocopy / color_print / poster |
| pages | integer | |
| copies | integer | |
| color_mode | text | bw / color |
| paper_size | text | A4 / A3 / letter |
| binding | boolean | |
| lamination | boolean | |
| selected_add_ons | text[] | nullable — ชื่อบริการเสริมที่ลูกค้าเลือกตอนสั่ง (denormalized ไว้แสดงผล ไม่ผูก FK เพราะราคา ณ ตอนสั่งอาจต่างจากราคาปัจจุบันของร้าน) |
| file_url | text | ลิงก์ไฟล์งานใน Supabase Storage |
| total_price | integer | หน่วยสตางค์ กันปัญหา floating point |
| status | enum | pending_review / accepted / in_progress / shipping / completed / cancelled — **ต้องตรงกับ `OrderStatus` ฝั่ง frontend (`apps/web/components/shop/orders/types.ts`) เสมอ** |
| note | text | nullable |
| delivery_method | enum | shop_delivery / self_pickup, default `self_pickup` |
| delivery_address | text | nullable — ใช้เมื่อ delivery_method = shop_delivery เท่านั้น |
| slip_url | text | storage path จาก bucket private `payment-slips` — ลูกค้าต้องแนบสลิปมาพร้อมตอนสั่งเสมอ |
| slip_uploaded_at | timestamp | nullable |
| cancel_reason | enum | nullable — customer_request / invalid_payment_slip / amount_mismatch / no_transfer_found / invalid_file / shop_unavailable / other (ใส่ตอนสถานะเป็น cancelled เท่านั้น รวมถึงกรณีปฏิเสธการชำระเงิน) |
| cancel_note | text | nullable |
| finished_at | timestamp | nullable — ตั้งอัตโนมัติตอนสถานะเปลี่ยนเป็น `completed`/`cancelled` (ดู `PATCH /orders/:id/status`) ใช้เป็นจุดเริ่มนับ 1 วันก่อนลบไฟล์งานพิมพ์อัตโนมัติใน bucket `order-files` |
| created_at | timestamp | |

⚠️ ตารางนี้เป็น placeholder เก่าจาก scaffold เริ่มโปรเจกต์ ยังไม่เชื่อมกับระบบ `main_services`/`service_options`/`service_option_values` จริงเลย (ดู TODO ใน `docs/api-spec.md` หัวข้อ Orders) — ระบบสั่งซื้อจริงที่แปลงจากตะกร้า (`carts`) เป็นออเดอร์ยังไม่ได้สร้าง เป็นงาน phase ถัดไป

### `carts`
ตะกร้าสินค้าของลูกค้า — **1 ลูกค้ามีได้หลายตะกร้าพร้อมกัน แต่ 1 ตะกร้าผูกกับ 1 ร้านเท่านั้น** (unique composite `(customer_id, shop_id)`) ห้ามผสมสินค้าจากหลายร้านในตะกร้าเดียว แต่ลูกค้าช้อปจากร้าน A และร้าน B พร้อมกันได้ (คนละตะกร้า ไม่ชนกัน) — เพิ่มสินค้าจากร้านไหนก็ find-or-create ตะกร้าของร้านนั้นให้อัตโนมัติ ไม่มี conflict/replace อีกต่อไป
| column | type | note |
|---|---|---|
| id | uuid (PK) | |
| customer_id | uuid (FK → users.id) | ร่วมกับ shop_id เป็น unique composite |
| shop_id | uuid (FK → shops.id) | ร่วมกับ customer_id เป็น unique composite |
| delivery_option_id | uuid (FK → delivery_options.id) | nullable — เลือกทีหลังตอนดูตะกร้าได้ |
| created_at | timestamp | |

### `cart_items`
รายการสินค้าในตะกร้า — **ไม่เก็บราคาไว้เลย** คำนวณสดจาก `main_services`/`service_options`/`service_option_values` ทุกครั้งที่อ่าน (กันราคาไม่ตรงกับของจริงถ้าร้านเปลี่ยนราคาทีหลัง)
| column | type | note |
|---|---|---|
| id | uuid (PK) | |
| cart_id | uuid (FK → carts.id, ON DELETE CASCADE) | |
| main_service_id | uuid (FK → main_services.id) | |
| width_cm | numeric(10,2) | ใช้เมื่อ `pricing_model` ของบริการ = `per_sqm` เท่านั้น — ลูกค้ากรอกเอง จำกัดไว้ 1-1000 ซม. ที่ Zod |
| height_cm | numeric(10,2) | ใช้เมื่อ `pricing_model` = `per_sqm` เท่านั้น |
| page_count | integer | ใช้เมื่อ `pricing_model` = `per_page` เท่านั้น — **server นับเองจากไฟล์ PDF จริงด้วย pdf-lib เสมอ ไม่เคยรับค่าจาก client** |
| quantity | integer | default 1 — คูณกับราคาต่อหน่วยเสมอไม่ว่า pricing_model ไหน |
| file_url | text | nullable — storage path จาก bucket private `order-files` (ชื่อไฟล์เป็น UUID สุ่ม ไม่ใช่ชื่อไฟล์จริง) |
| file_name | text | nullable — ชื่อไฟล์ต้นฉบับที่ลูกค้าอัปโหลด ใช้แสดงผลใน UI เท่านั้น (แยกจาก file_url เพราะ path ใน storage ถูกสุ่มเป็น UUID) |
| note | text | nullable |
| created_at | timestamp | |

### `cart_item_addons`
บริการเสริมที่เลือกต่อรายการในตะกร้า — `extraPrice` ไม่เก็บที่นี่ อ่านสดจาก `main_service_addons` เสมอ (เหตุผลเดียวกับที่ `cart_items` ไม่เก็บราคา)
| column | type | note |
|---|---|---|
| cart_item_id | uuid (FK → cart_items.id, ON DELETE CASCADE) | ส่วนหนึ่งของ PK ร่วม |
| addon_service_id | uuid (FK → addon_services.id) | ส่วนหนึ่งของ PK ร่วม |

### `cart_item_option_selections`
ค่าที่ลูกค้าเลือก/กรอกของแต่ละ `service_options` ต่อรายการในตะกร้า — 1 รายการมีได้อย่างมาก 1 แถวต่อ 1 ตัวเลือก (PK ร่วม `cart_item_id`+`option_id`)
| column | type | note |
|---|---|---|
| cart_item_id | uuid (FK → cart_items.id, ON DELETE CASCADE) | ส่วนหนึ่งของ PK ร่วม |
| option_id | uuid (FK → service_options.id, ON DELETE CASCADE) | ส่วนหนึ่งของ PK ร่วม |
| value_id | uuid (FK → service_option_values.id) | nullable — มีค่าเมื่อ option type เป็น `dropdown`/`radio`/`checkbox` (checkbox ติ๊กเลือก = มีค่า, ไม่ติ๊ก = ไม่มีแถวนี้เลย) |
| text_value | text | nullable — มีค่าเมื่อ option type เป็น `number`/`text` (ลูกค้ากรอกเอง ไม่มีผลต่อราคา) |

### `main_services`
| column | type | note |
|---|---|---|
| id | uuid (PK) | |
| shop_id | uuid (FK → shops.id) | |
| name | text | |
| description | text | nullable |
| pricing_model | enum: `per_page` / `per_piece` / `per_sqm` / `fixed` | default `fixed` — วิธีคิด "หน่วย" ที่ `base_price` จะถูกคูณด้วย: `per_page` = จำนวนหน้า PDF ที่นับได้จริง, `per_piece`/`fixed` = 1 (คูณด้วย quantity เหมือนกันทั้งคู่ที่ชั้นถัดไป), `per_sqm` = พื้นที่ (ตร.ม.) ที่ลูกค้ากรอกเอง |
| base_price | numeric(10,2) | ราคาพื้นฐานต่อหน่วยตาม `pricing_model` (หรือราคาเหมาจ่ายทั้งงานถ้าเป็น `fixed`) — ราคารวมจริง = `(base_price + ผลรวม extraPrice ของตัวเลือกที่เลือก) x หน่วยตาม pricing_model x quantity` |
| requires_file_upload | boolean | default true — ปิดได้ถ้าบริการนี้ไม่ต้องใช้ไฟล์จากลูกค้า |
| allowed_file_types | text[] | nullable — เช่น `["pdf","jpg","png"]` ใช้ตอน requires_file_upload = true เท่านั้น |
| unit | text | เช่น "แผ่น", "เล่ม" — ใช้แสดงผลเฉยๆ ไม่กระทบการคำนวณราคา |
| estimated_time | text | nullable |
| image_url | text | nullable |
| is_active | boolean | default true |
| created_at | timestamp | |

**ออกแบบใหม่ (2026-07):** เปลี่ยนจากราคาคงที่ตาม paperSize/color hardcode (`fixed`/`area`/`per_page` 3 โหมดแยกตาราง `main_service_price_options`/`main_service_area_rates`/`main_service_page_rates`) มาเป็นระบบทั่วไป — ร้านค้าเลือก "วิธีคิดราคาพื้นฐาน" (`pricing_model`) 1 แบบ + ตั้ง `base_price` เดียว แล้วเพิ่ม "ตัวเลือกบริการ" (`service_options`) ได้ไม่จำกัดจำนวนเอง ไม่ hardcode ประเภทกระดาษ/สี/วัสดุอีกต่อไป — migration ลบตาราง `main_service_price_options`/`main_service_area_rates`/`main_service_page_rates` ทิ้งทั้งหมด (dev data เท่านั้น ยังไม่มีลูกค้าจริง จึงไม่ทำ migration แปลงข้อมูลเก่า)

### `service_options`
ตัวเลือกของบริการหลัก — ร้านค้าสร้างเองได้ไม่จำกัด เช่น "ประเภทกระดาษ", "สี", "วัสดุ"
| column | type | note |
|---|---|---|
| id | uuid (PK) | |
| main_service_id | uuid (FK → main_services.id, ON DELETE CASCADE) | |
| name | text | ชื่อตัวเลือกที่ลูกค้าเห็น เช่น "ประเภทกระดาษ" |
| type | enum: `dropdown` / `radio` / `checkbox` / `number` / `text` | กฎบังคับกรอกอัตโนมัติ: `dropdown`/`radio`/`number` ต้องเลือก/กรอกก่อนสั่งซื้อ, `checkbox`/`text` ไม่บังคับ |
| sort_order | integer | default 0 — ลำดับแสดงผล |
| created_at | timestamp | |

**หมายเหตุเรื่อง `checkbox`:** ออกแบบเป็น toggle เดียว (ไม่ใช่ multi-select) — 1 ตัวเลือก type `checkbox` ต้องมี `service_option_values` แถวเดียวพอดี (บังคับด้วย Zod) ติ๊กเลือก = ใช้ราคาเพิ่มของแถวนั้น ไม่ติ๊ก = ไม่มีผลต่อราคา

### `service_option_values`
ค่าที่ลูกค้าเลือกได้ของแต่ละตัวเลือก — ใช้กับ type `dropdown`/`radio`/`checkbox` เท่านั้น (`number`/`text` ให้ลูกค้ากรอกเองอิสระ ไม่มีค่าตายตัว/ไม่มีราคาเพิ่ม)
| column | type | note |
|---|---|---|
| id | uuid (PK) | |
| option_id | uuid (FK → service_options.id, ON DELETE CASCADE) | |
| name | text | เช่น "A4", "กระดาษ 80 แกรม", "ขาวดำ" |
| extra_price | numeric(10,2) | default 0 — **ห้ามติดลบ** (บังคับที่ Zod) |
| sort_order | integer | default 0 |
| created_at | timestamp | |

### `addon_services`
| column | type | note |
|---|---|---|
| id | uuid (PK) | |
| shop_id | uuid (FK → shops.id) | |
| name | text | |
| description | text | nullable |
| price | numeric(10,2) | หน่วยบาท |
| unit | text | |
| estimated_time | text | nullable |
| image_url | text | nullable — public URL จาก Supabase Storage bucket `shop-photos` อัปโหลดผ่าน `POST /uploads` (`type: "service-image"`) |
| is_active | boolean | default true |
| created_at | timestamp | |

### `main_service_addons`
ตารางเชื่อมบริการหลัก ↔ บริการเสริม พร้อมราคาบวกเพิ่มเฉพาะคู่นั้น
| column | type | note |
|---|---|---|
| main_service_id | uuid (FK → main_services.id, ON DELETE CASCADE) | ส่วนหนึ่งของ PK ร่วม |
| addon_service_id | uuid (FK → addon_services.id, ON DELETE CASCADE) | ส่วนหนึ่งของ PK ร่วม |
| extra_price | numeric(10,2) | default 0, หน่วยบาท |

### `delivery_options`
| column | type | note |
|---|---|---|
| id | uuid (PK) | |
| shop_id | uuid (FK → shops.id) | |
| name | text | |
| description | text | nullable |
| logo_url | text | nullable |
| base_fee | numeric(10,2) | หน่วยบาท |
| free_shipping_threshold | numeric(10,2) | nullable = ไม่มีเงื่อนไขส่งฟรี |
| is_active | boolean | default true |
| created_at | timestamp | |

### `admin_notifications`
การแจ้งเตือนฝั่งแอดมิน (in-app) — เพิ่มแถวอัตโนมัติจาก 3 event เท่านั้น: ร้านสมัครใหม่ (`shop_registered`), ออเดอร์ถูกยกเลิก/ปฏิเสธชำระเงิน (`order_cancelled`), มีข้อความ contact-admin ใหม่ (`contact_admin_message`) — ไม่มี FK ไปยัง entity ต้นทาง (shops/orders/contact_admin_messages) โดยตั้งใจ เพราะแต่ละ event มี entity ต้นทางต่างชนิดกัน ใช้ `link` เก็บ path แทน
| column | type | note |
|---|---|---|
| id | uuid (PK) | |
| type | enum: `shop_registered` / `order_cancelled` / `contact_admin_message` | |
| title | text | |
| message | text | |
| link | text | nullable — path ฝั่ง web เช่น `/admin/shops/:id` ให้กดแล้วไปดูรายละเอียด |
| is_read | boolean | default false |
| created_at | timestamp | |

### `contact_admin_messages`
ข้อความที่ร้านค้าส่งถึงแอดมิน (หน้า `/shop/contact-admin`)
| column | type | note |
|---|---|---|
| id | uuid (PK) | |
| shop_id | uuid (FK → shops.id) | |
| subject | text | |
| message | text | |
| status | enum: `open` / `resolved` | default `open` |
| admin_reply | text | nullable — ใส่ตอนแอดมินตอบกลับ |
| created_at | timestamp | |

### `system_settings`
ตั้งค่าระบบฝั่งแอดมิน (ข้อมูลระบบ/การแจ้งเตือน/ความปลอดภัย) — **มีแถวเดียวเสมอ (singleton)** อ่าน/เขียนผ่าน `GET /admin/settings`, `PATCH /admin/settings` เท่านั้น
| column | type | note |
|---|---|---|
| id | uuid (PK) | |
| system_name | text | default `"EasyPrint"` |
| logo_url | text | nullable |
| contact_email | text | nullable |
| contact_phone | text | nullable |
| website | text | nullable |
| notification_settings | jsonb | nullable — toggle การแจ้งเตือนต่างๆ (newShop, storageWarning90 ฯลฯ) ยังไม่ผูกกับการส่งอีเมลจริง เก็บเป็น preference ก่อน |
| min_password_length | integer | default `8` — **บังคับใช้จริง** ตอนสมัคร/เปลี่ยนรหัสผ่าน (ดู `apps/api/src/auth/routes.ts`) |
| require_special_char | boolean | default `true` — เก็บไว้แสดงผลเฉยๆ ยังไม่บังคับใช้จริง |
| enable_2fa | boolean | default `false` — เก็บไว้แสดงผลเฉยๆ ยังไม่บังคับใช้จริง |
| auto_logout_minutes | integer | default `30` — เก็บไว้แสดงผลเฉยๆ ยังไม่บังคับใช้จริง |
| default_shop_storage_quota_mb | integer | default `1024` — ค่า default โควต้าพื้นที่ต่อร้าน (MB) เมื่อร้านนั้นไม่ได้ตั้ง `shops.storage_quota_mb` ของตัวเองไว้ |
| updated_at | timestamp | |
| created_at | timestamp | |

### `reviews`
รีวิวร้านค้าจากลูกค้า — รีวิวได้เฉพาะออเดอร์ที่ `completed` เท่านั้น และ 1 ออเดอร์รีวิวได้ 1 ครั้ง (unique `order_id`)
| column | type | note |
|---|---|---|
| id | uuid (PK) | |
| shop_id | uuid (FK → shops.id) | |
| order_id | uuid (FK → orders.id, unique) | 1 ออเดอร์รีวิวได้ครั้งเดียว |
| customer_id | uuid (FK → users.id) | |
| rating | integer | 1-5 — ช่วงคะแนนบังคับที่ Zod ชั้น API เท่านั้น (ไม่มี DB check constraint เพราะ drizzle-kit 0.31.10 พังตอน introspect CHECK บน Postgres 17 ของ Supabase — ดูหมายเหตุด้านล่าง) |
| comment | text | nullable — อนุญาตรีวิวแค่ให้คะแนนโดยไม่ต้องเขียนข้อความ |
| shop_reply | text | nullable — คำตอบกลับจากร้าน (ใส่ได้ครั้งเดียว แก้ทับได้) |
| shop_replied_at | timestamp | nullable |
| created_at | timestamp | |

⚠️ **หมายเหตุเรื่อง `drizzle-kit push`:** ตอนนี้ `bun --cwd apps/api drizzle-kit push` จะ crash ("Cannot read properties of undefined (reading 'replace')" ใน `checkValue.replace`) ตอน "Pulling schema from database" — พิสูจน์แล้วว่าเป็น bug ของ `drizzle-kit@0.31.10` เองตอน introspect DB บน Postgres 17.6 (ไม่เกี่ยวกับ schema ของโปรเจกต์นี้ เกิดกับ schema.ts เดิมก่อนแก้ด้วย) การเปลี่ยนแปลงรอบนี้ (enum `suspended`, `shops.storage_quota_mb`, `orders.finished_at`, ตาราง `system_settings`/`reviews`) ถูก apply ขึ้น Supabase ด้วย SQL ตรงแทน (ตรวจสอบแล้วว่าตรงกับ `schema.ts` 100%) — ครั้งหน้าที่แก้ schema ให้ลอง `drizzle-kit push` ก่อน ถ้ายัง crash อยู่ ให้ apply SQL ด้วยมือแบบเดียวกันแล้วเช็คกับ `schema.ts` ให้ตรงกันเสมอ

## ความสัมพันธ์ (Relationships)

```
users (1) ──< shops (owner_id)
users (1) ──< orders (customer_id)
users (1) ──< password_reset_tokens (user_id)
shops (1) ──< orders (shop_id)
shops (1) ──< main_services (shop_id)
shops (1) ──< addon_services (shop_id)
shops (1) ──< delivery_options (shop_id)
main_services (1) ──< main_service_addons (main_service_id) [ON DELETE CASCADE]
addon_services (1) ──< main_service_addons (addon_service_id) [ON DELETE CASCADE]
main_services (1) ──< service_options (main_service_id) [ON DELETE CASCADE]
service_options (1) ──< service_option_values (option_id) [ON DELETE CASCADE]
users (1) ──< carts (customer_id) [unique ร่วมกับ shop_id — 1 คนได้หลายตะกร้า คนละร้าน]
shops (1) ──< carts (shop_id) [unique ร่วมกับ customer_id — 1 ร้านต่อ 1 ตะกร้าต่อลูกค้า]
delivery_options (1) ──< carts (delivery_option_id)
carts (1) ──< cart_items (cart_id) [ON DELETE CASCADE]
main_services (1) ──< cart_items (main_service_id)
cart_items (1) ──< cart_item_addons (cart_item_id) [ON DELETE CASCADE]
addon_services (1) ──< cart_item_addons (addon_service_id)
cart_items (1) ──< cart_item_option_selections (cart_item_id) [ON DELETE CASCADE]
service_options (1) ──< cart_item_option_selections (option_id) [ON DELETE CASCADE]
service_option_values (1) ──< cart_item_option_selections (value_id)
shops (1) ──< contact_admin_messages (shop_id)
shops (1) ──< reviews (shop_id)
orders (1) ──< reviews (order_id) [unique — 1 ออเดอร์รีวิวได้ 1 ครั้ง]
users (1) ──< reviews (customer_id)
```

## ยังไม่ได้ทำ (TODO ตาม scope ในข้อเสนอโครงการ)

- ตารางวัน-เวลาทำการของร้าน (`shop_hours`) — ตาม 1.3.1.2.2
- Dashboard/สรุปรายได้ — อาจทำเป็น query แบบ aggregate แทนตารางแยก — ตาม 1.3.1.6
- ตาราง `order_status_history` (audit log การเปลี่ยนสถานะออเดอร์) — ยังไม่ได้ทำ ตอนนี้ `orders.status` เก็บแค่สถานะปัจจุบันอันเดียว ไม่มีประวัติย้อนหลัง
- คำนวณ `total_price` จริงตามอัตราร้าน — ตอนนี้ `POST /orders` ยังใช้สูตรชั่วคราว (`pages * copies * 100`) ดู TODO ใน `apps/api/src/routes/orders.ts`
