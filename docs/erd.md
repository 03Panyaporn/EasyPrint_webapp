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
| category | text | ประเภทร้านค้า — ดูค่าที่รองรับที่ `shopTypeSchema` ใน `packages/shared/src/schemas/auth.ts` |
| google_map_link | text | บังคับกรอกตอนสมัคร |
| id_card_url | text | **storage path** (ไม่ใช่ URL จริง) จาก Supabase Storage bucket `id-cards` (private — ข้อมูลบัตรประชาชนห้ามเปิดสาธารณะ) อัปโหลดผ่าน `POST /uploads` |
| shop_photo_url | text | public URL เต็มจาก Supabase Storage bucket `shop-photos` (public) อัปโหลดผ่าน `POST /uploads` |
| social_media | text | ช่องทาง Social Media ที่กรอกตอนสมัคร |
| opening_hours | jsonb | array ตารางเวลาทำการ 7 วัน `[{ day, isOpen, openTime, closeTime }, ...]` |
| approval_status | enum: pending / approved / rejected | default `pending` — ร้านใหม่ต้องรอแอดมินอนุมัติก่อน ถึงจะตั้งบริการ/ราคาได้ (ดู `requireShopOwner()` ใน `apps/api/src/routes/services.ts`) |
| rejected_reason | text | nullable — ใส่ตอนแอดมินกด "ไม่อนุมัติ" เท่านั้น, ถูกล้างเป็น null อัตโนมัติถ้ากลับมาอนุมัติทีหลัง |
| delivery_enabled | boolean | default true |
| created_at | timestamp | |

### `orders`
| column | type | note |
|---|---|---|
| id | uuid (PK) | |
| shop_id | uuid (FK → shops.id) | |
| customer_id | uuid (FK → users.id) | |
| service_type | text | photocopy / color_print / poster |
| pages | integer | |
| copies | integer | |
| color_mode | text | bw / color |
| paper_size | text | A4 / A3 / letter |
| binding | boolean | |
| lamination | boolean | |
| file_url | text | ลิงก์ไฟล์ใน Supabase Storage |
| total_price | integer | หน่วยสตางค์ กันปัญหา floating point |
| status | enum | pending_payment / in_progress / completed / cancelled |
| note | text | |
| created_at | timestamp | |

### `main_services`
| column | type | note |
|---|---|---|
| id | uuid (PK) | |
| shop_id | uuid (FK → shops.id) | |
| name | text | |
| description | text | nullable |
| paper_sizes | text[] | เช่น ["A4","A3"] |
| custom_paper_size | text | nullable, ใช้เมื่อ paper_sizes มี "กำหนดเอง" |
| colors | text[] | เช่น ["ขาวดำ","สี"] |
| price | numeric(10,2) | หน่วยบาท (ไม่ใช่สตางค์แบบ orders.total_price) |
| unit | text | เช่น "แผ่น", "เล่ม" |
| estimated_time | text | nullable |
| image_url | text | nullable |
| is_active | boolean | default true |
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
```

## ยังไม่ได้ทำ (TODO ตาม scope ในข้อเสนอโครงการ)

- ตารางวัน-เวลาทำการของร้าน (`shop_hours`) — ตาม 1.3.1.2.2
- Dashboard/สรุปรายได้ — อาจทำเป็น query แบบ aggregate แทนตารางแยก — ตาม 1.3.1.6
