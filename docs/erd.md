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
| created_at | timestamp | |

### `shops`
| column | type | note |
|---|---|---|
| id | uuid (PK) | |
| owner_id | uuid (FK → users.id) | |
| name | text | |
| phone | text | |
| address | text | |
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

## ความสัมพันธ์ (Relationships)

```
users (1) ──< shops (owner_id)
users (1) ──< orders (customer_id)
shops (1) ──< orders (shop_id)
```

## ยังไม่ได้ทำ (TODO ตาม scope ในข้อเสนอโครงการ)

ตาราง/ฟีเจอร์ต่อไปนี้ยังไม่มีใน `schema.ts` — เพิ่มตามที่ทีมออกแบบเพิ่มเติม อ้างอิงจาก `docs/proposal.md` หัวข้อ 1.3:

- ตารางกำหนดราคา/อัตราค่าบริการของแต่ละร้าน (`pricing_rules`) — ตาม 1.3.1.3
- ตารางวัน-เวลาทำการของร้าน (`shop_hours`) — ตาม 1.3.1.2.2
- Dashboard/สรุปรายได้ — อาจทำเป็น query แบบ aggregate แทนตารางแยก — ตาม 1.3.1.6
