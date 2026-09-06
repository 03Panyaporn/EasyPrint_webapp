# QA_BUG_REPORT.md — บั๊กที่พบ (รอบทดสอบใหม่ทั้งหมด เริ่ม 2026-09-06)

> อัปเดตล่าสุด: 2026-09-06
> ไฟล์นี้จะถูกเติมบั๊กใหม่ทันทีที่เจอระหว่างทดสอบ Phase 01-19 ตาม `QA_TESTING_PROGRESS.md`
> ใช้ฟอร์แมต: Bug ID `BUG-[PHASE]-[NUMBER]` เช่น `BUG-10-01` (Phase 10, บั๊กที่ 1)

---

## 📌 จุดที่ควรเพ่งเล็งเป็นพิเศษ (จากประวัติรอบก่อน 2026-08-25 — ยังไม่ยืนยันซ้ำในรอบนี้)

รายละเอียดเต็มอยู่ที่ [docs/qa/test-plan.md](docs/qa/test-plan.md) — สรุปย่อเป็น "จุดต้องสงสัย" ที่จะตรวจซ้ำตาม test case ที่เกี่ยวข้องใน `QA_TEST_CASES.md`:

| จุดต้องสงสัย | Phase ในรอบนี้ | Test case ที่จะยืนยัน |
|---|---|---|
| `DELETE /auth/me` (shop owner มีร้านผูกอยู่) อาจได้ 500 | Phase 08 | SS08-04 |
| ข้อความแชทรูปแบบ JSON ถูกตีความเป็นไฟล์แนบปลอม (โค้ดปัจจุบันยังมี logic เดิม) | Phase 10 | M10-04 |
| ไม่มี cron เรียก auto-delete cleanup endpoint | Phase 15 | ST15-06 |
| `PUT /shops/me` คืน 401 แทน 403 เมื่อ role ผิด | Phase 02 | SEC02-02 |
| Unauthenticated upload (`shop-photo`/`id-card`) — เป็นการตัดสินใจเชิงนโยบายที่ยอมรับแล้ว | Phase 15 | ST15-01 |
| ร้าน pending/suspended contact-admin ไม่ได้ + error message ผิดบริบท | Phase 11 | CA11-04 |
| ไฟล์แนบแชทมองไม่เห็นใน admin storage dashboard | Phase 15 | ST15-05 |
| Order เก่า `finishedAt` เป็น NULL | Phase 15 | ST15-08 |
| Reply overwrite ไม่มี audit trail (review + contact-admin) | Phase 09, 11 | R09-04, CA11-05 |
| ร้าน suspended ยังแก้ `PUT /shops/me` ได้ (ไม่ถูกบล็อกเหมือน endpoint อื่น) | Phase 17 | E17-03 |

---

## 🆕 บั๊กที่ยืนยันแล้วในรอบทดสอบนี้ (2026-09-06 เป็นต้นไป)

_(ยังไม่เริ่มทดสอบ — จะเพิ่มที่นี่ทันทีที่พบและยืนยันจริง)_

<!--
ฟอร์แมตสำหรับแต่ละบั๊ก:

### BUG-[PHASE]-[NUMBER]: [สรุปสั้น]
- **Phase:**
- **Page/URL:**
- **Feature/Endpoint:**
- **Severity:** Critical / High / Medium / Low
- **Steps to Reproduce:**
  1.
  2.
- **Expected Result:**
- **Actual Result:**
- **Evidence:** (Console/API/HTTP status/screenshot)
- **Possible Cause:**
- **Status:** OPEN
-->
