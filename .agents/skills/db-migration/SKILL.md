---
name: db-migration
description: "ใช้ skill นี้ทุกครั้งที่ต้องแก้โครงสร้างฐานข้อมูล (เพิ่ม/แก้/ลบ column หรือ table) เพื่อไม่ให้ schema ในเครื่องกับบน Supabase ไม่ตรงกัน"
---

# วิธีแก้โครงสร้างฐานข้อมูลอย่างปลอดภัย

**ห้ามแก้ตรงใน Supabase dashboard เด็ดขาด** — ต้องแก้ผ่านไฟล์ `apps/api/drizzle/schema.ts` เท่านั้น เพราะจะได้มีประวัติการเปลี่ยนแปลง (migration) ย้อนกลับได้ถ้าพัง

ลำดับขั้นตอน:

1. แก้ที่ `apps/api/drizzle/schema.ts` — เพิ่ม/แก้ table หรือ column ตามต้องการ
2. รัน `bun --cwd apps/api drizzle-kit push` เพื่อ sync ขึ้น Supabase
3. เช็คด้วย `bun --cwd apps/api drizzle-kit studio` ว่าโครงสร้างถูกต้องก่อนใช้งานจริง
4. ถ้าเพิ่ม table ใหม่ ให้อัปเดต `docs/erd.md` ให้ตรงด้วย เพื่อให้ทีมเห็นภาพรวมฐานข้อมูลที่อัปเดตล่าสุด
5. ถ้า column ที่แก้มีข้อมูลอยู่แล้ว (เช่น เปลี่ยนชื่อ column) ให้เตือนผู้ใช้ก่อนรัน push เพราะอาจทำให้ข้อมูลเดิมหายหรือ error ถ้าไม่ได้ backup ก่อน
