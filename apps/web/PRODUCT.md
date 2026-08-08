# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

นักศึกษาและบุคคลทั่วไปที่ต้องการพิมพ์งานโดยไม่ต้องรอคิวที่ร้าน ผู้ใช้ฝั่งร้านค้า (เจ้าของร้านถ่ายเอกสาร) ที่รับออเดอร์ออนไลน์และจัดการงานผ่านแดชบอร์ด และ Admin ที่ดูแลระบบและอนุมัติร้านค้า

## Product Purpose

EasyPrint คือ marketplace ออนไลน์สำหรับร้านถ่ายเอกสาร/ร้านปริ้น ลูกค้าอัปโหลดไฟล์ล่วงหน้า เลือกร้าน กำหนดสเปกงาน และสั่งพิมพ์ได้ทั้งแบบรับเองและให้ร้านจัดส่ง ร้านค้าได้รับออเดอร์พร้อมไฟล์ล่วงหน้า ทำให้เตรียมงานได้ก่อนลูกค้ามาถึง

## Positioning

อัปโหลดล่วงหน้า — ลูกค้าส่งไฟล์ก่อน ร้านเตรียมงานรอ ลดเวลารอที่ร้านโดยไม่ต้องเดินทางไปรอคิวโดยเปล่าประโยชน์

## Operating Context

- ลูกค้า: เลือกร้านจาก marketplace, ดูสถานะเปิด/ปิดแบบ real-time, กำหนดสเปก (สี/ขาวดำ, จำนวน, การเย็บ), อัปโหลด PDF/ไฟล์งาน, ตะกร้าสินค้า, checkout, ติดตามสถานะ
- ร้านค้า: แดชบอร์ดรับออเดอร์, จัดการบริการและราคา, chat กับลูกค้า, รายงานยอดขาย, ตั้งค่าเวลาทำการ
- Admin: จัดการและอนุมัติร้านค้า, ดูแลผู้ใช้

## Capabilities and Constraints

- โปรเจกต์การศึกษา (educational project) — ไม่ใช่ระบบ production เชิงพาณิชย์
- Stack: Next.js 14, TypeScript, Tailwind CSS, monorepo (Bun/Turborepo)
- API แยกต่างหาก (apps/api), shared types ใน packages/shared
- ภาษา UI: ไทย เป็นหลัก
- สามบทบาท: Customer, Shop, Admin (auth/routing แยกกัน)
- รองรับทั้ง desktop และ mobile

## Brand Commitments

- ชื่อ: **EASYPRINT** (ตัวพิมพ์ใหญ่ในบางบริบท, "EasyPrint" ในข้อความทั่วไป)
- สีหลัก: Orange (#f97316 / from-orange-500) + Teal (#4bc5e0, #96f2eb)
- Logo: ไอคอน Printer บนวงกลม gradient orange-to-amber
- Tagline: "ร้านถ่ายเอกสารออนไลน์" / "ใช้ง่ายแค่เลือกร้านที่คุณต้องการ อัปโหลดไฟล์"

## Evidence on Hand

- หน้า landing (apps/web/app/page.tsx): shop listing พร้อม filter การจัดส่ง, ประเภทงาน, เวลาทำการ
- Customer flow: Dashboard → ค้นหาร้าน → Shop page → สั่งงาน → Cart → Checkout → ติดตาม Order
- Shop flow: Dashboard → จัดการ Services → รับ Orders → Reports → Settings → Chat
- Admin flow: จัดการ Shops, Users

## Product Principles

1. **อัปโหลดก่อน รอน้อยลง** — งานทุกชิ้นเริ่มจากไฟล์ที่ลูกค้าส่งล่วงหน้า
2. **โปร่งใสทั้งสองฝั่ง** — ลูกค้าเห็นสถานะงานแบบ real-time, ร้านเห็นรายละเอียดครบก่อนรับงาน
3. **Simple first** — สำหรับโปรเจกต์การศึกษา เน้น usability และ completeness มากกว่าความซับซ้อน
