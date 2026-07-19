# API Spec — EasyPrint

> รายการ endpoint ทั้งหมด — เพิ่มบรรทัดใหม่ที่นี่ทุกครั้งหลังสร้าง endpoint เสร็จ (ดู `.agents/skills/api-endpoint/SKILL.md`)

## Orders

| Method | Path | คำอธิบาย | Auth |
|---|---|---|---|
| POST | `/orders` | สร้างคำสั่งพิมพ์ใหม่ | ยังไม่ใส่ (TODO) |

## ยังไม่ได้ทำ (ตาม scope ในข้อเสนอโครงการ)

- Auth: `POST /auth/register`, `POST /auth/login`
- Shops: `GET /shops/:id`, `PATCH /shops/:id`, `POST /shops/:id/services`
- Orders: `GET /orders/:id`, `PATCH /orders/:id/status`, `GET /shops/:id/orders`
- Dashboard: `GET /shops/:id/dashboard` (สรุปรายได้ตาม 1.3.1.6)
- Admin: `GET /admin/shops`, `PATCH /admin/shops/:id/approve`
