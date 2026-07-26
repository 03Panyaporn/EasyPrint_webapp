# สรุปการพัฒนาระบบ Layout และโครงสร้างหน้าเว็บ — EasyPrint

ไฟล์นี้สรุปสิ่งที่ได้พัฒนาและปรับปรุงระบบ Layout ทั้งฝั่งลูกค้า (Customer Portal) และฝั่งร้านค้า (Shop/Admin Portal) พร้อมสรุปปัญหาเทคนิคที่พบและแนวทางการแก้ไขเพื่ออ้างอิงสำหรับทีมพัฒนา

---

## 🛠️ สิ่งที่เพื่อนร่วมทีมต้องติดตั้งและรันเพิ่ม

1. เปิด Terminal ที่โฟลเดอร์หลัก (`easyprint/`)
2. อัปเดต dependencies:
   ```bash
   bun install
   ```
3. การรันโปรเจกต์:
   - **รันฝั่ง Web (Frontend):** `bun --cwd apps/web dev`
   - **รันฝั่ง API (Backend):** `bun --cwd apps/api dev`

---

## 📂 โครงสร้าง Layout ฝั่งร้านค้า (Shop/Admin Portal)

ได้รับการออกแบบตามแนวทางดีไซน์ (สีหลักส้ม `#F97316`, การ์ดขาวมุมโค้งมีเงาบาง, ไอคอนวงกลม):

### 1. Components หลัก (`components/shop/` & `components/layout/`)
* **`Sidebar.tsx`**: เมนูด้านซ้ายจัดเรียงตามลำดับสเปก:
  - 🏠 **หน้าหลัก** (`/shop/dashboard`)
  - 📦 **รายการคำสั่งซื้อ** (`/shop/orders`) — มีลูกศร `>` ด้านขวาเตรียมพร้อมสำหรับ sub-menu ในอนาคต
  - 💬 **แชท** (`/shop/chat`)
  - 📊 **รายงาน** (`/shop/reports`) — เมนูเดี่ยว
  - ⚙️ **Section "จัดการร้าน"**: บริการและราคา (`/shop/services`), โปรไฟล์ร้าน (`/shop/profile`)
  - 🛠️ **Section "ระบบ"**: ตั้งค่า (`/shop/settings`), ติดต่อแอดมิน (`/shop/contact-admin`)
  - *Feature พิเศษ:* รองรับการยุบ Sidebar เหลือเฉพาะไอคอน (Collapse mode) พร้อม Tooltip และเปลี่ยนเป็น Drawer เลื่อนบนมือถือ
* **`Topbar.tsx`**: แถบบนมีช่องค้นหา, ปุ่มแจ้งเตือน (Badge ตัวเลข 3), และ Dropdown โปรไฟล์ "ร้าน EasyPrint" (โปรไฟล์/ตั้งค่า/ออกจากระบบ)
### 2. หน้า "บริการและราคา" (Services & Pricing Portal — /shop/services)
* **`ServicesTabs.tsx`**: ตัวควบคุม 3 แท็บ (**บริการหลัก**, **บริการเสริม**, **ตั้งค่าการจัดส่ง**) พร้อม Badge แสดงจำนวนรายการและเส้นใต้ไฮไลต์สีส้ม
* **`MainServicesTable.tsx`**: ตารางบริการหลัก แสดงขนาดกระดาษ, สี, ราคา/หน่วย, เวลาทำการ, จำนวนบริการเสริมที่ผูกไว้, สวิตช์ เปิด/ปิด, ปุ่มแก้ไข/ลบ, ช่องค้นหา และ Pagination
* **`AddOnServicesTable.tsx`**: ตารางบริการเสริมสำหรับตัวเลือกเพิ่มเติม (เข้าเล่ม, เคลือบเอกสาร ฯลฯ)
* **`DeliverySettingsTable.tsx`**: ตารางตั้งค่าการจัดส่ง พร้อม Banner Toggle เปิด/ปิดระบบจัดส่งทั้งหมด, อัตราค่าจัดส่งเริ่มต้น และเงื่อนไขส่งฟรีเมื่อซื้อขั้นต่ำ
* **`AddServiceModal.tsx`**: โมดัล เพิ่ม/แก้ไข บริการ (ใช้ร่วมกันทั้งบริการหลักและเสริม) มี Radio สลับประเภท, ฟิลด์ dynamic, การผูกบริการเสริมพร้อมกรอกราคาบวกเพิ่ม (extraPrice) และตารางสรุปแบบเรียลไทม์
* **`AddDeliveryModal.tsx`**: โมดัล เพิ่ม/แก้ไข ประเภทการจัดส่ง
* **`types.ts` & `services-mock.ts`**: Data Models (`MainService`, `AddOnService`, `DeliveryOption`) และ Mock Data เริ่มต้น

---

## ⚠️ ปัญหาเทคนิคที่พบและแนวทางแก้ไข (พร้อมเหตุผล)

### 1. ปัญหา React Render Error / "missing required error components" เมื่อเปลี่ยนหน้า
* **อาการที่เจอ:** เมื่อคลิกเปลี่ยนหน้าใน Sidebar ฝั่งร้านค้า หน้าจอบางหน้าเกิด Error หรือแสดงข้อความ `missing required error components` ใน Next.js client-side navigation.
* **สาเหตุ:**
  1. ไฟล์ `ShopPlaceholder.tsx` มีการเรียกใช้ไอคอน `Construction` จาก `lucide-react` ซึ่งไอคอนดังกล่าวไม่มีในแพ็กเกจเวอร์ชันที่ติดตั้ง ทำให้ค่าไอคอนเป็น `undefined` และส่งผลให้ React crash ตอน render component.
  2. ใน Route group `app/(shop)` ยังไม่มีไฟล์ `error.tsx` (Error Boundary) ทำให้เมื่อเกิด render error ใน Client component Next.js ไม่สามารถจับ Error ดังกล่าวได้ จึงล้มทั้ง layout และแสดงข้อความเตือนของ Next.js.
  3. แคชของ Next.js dev server (`.next`) มีการสะสม Route chunk เก่าจากการสร้างไฟล์ `page.tsx` ใหม่จำนวนมากพร้อมกันขณะ dev server กำลังรันอยู่.
* **แนวทางแก้ไขและเหตุผลที่เลือกทำ:**
  1. **เปลี่ยนไอคอนใน `ShopPlaceholder.tsx` เป็น `Wrench`:** เนื่องจาก `Wrench` เป็นไอคอนมาตรฐานใน `lucide-react` ทุกเวอร์ชัน มีตัวตนแน่นอน และสื่อถึงหน้าเพจที่กำลังปรับปรุง/พัฒนาได้ตรงธีม.
  2. **สร้าง `app/(shop)/error.tsx` (Error Boundary):** เพื่อรองรับความผิดพลาดใน Client Component ในกรณีที่มี runtime error เกิดขึ้น Next.js จะแสดงกล่องแจ้งเตือนพร้อมปุ่ม "ลองใหม่อีกครั้ง" ได้อย่างเป็นมิตร โดยไม่พังล้มไปทั้งแอปพลิเคชัน.
  3. **ลบโฟลเดอร์แคช `.next` แล้วรัน dev server ใหม่:** เพื่อให้ Next.js ทำการ build และ map route chunks ใหม่ทั้งหมดอย่างสะอาด 100%.

### 2. ปัญหา Port สับสนระหว่าง 3000 กับ 3001
* **อาการที่เจอ:** เปิด `http://localhost:3001/shop/dashboard` แล้วเปิดไม่ได้ หรือบางครั้งเป็น `3000`.
* **สาเหตุ:** หากรัน backend API (`bun dev:api`) ก่อน Backend จะจับ Port `3000` ไว้ หรือมีโปรเซสเก่าค้าง ทำให้ Next.js ฝั่ง Web สลับไปใช้ Port `3001` อัตโนมัติ.
* **แนวทางแก้ไข:** สั่งปิดโปรเซส Node/Bun ที่ค้างด้วย `Get-Process -Name node, bun | Stop-Process -Force` แล้วรัน `bun dev:web` ใหม่เพื่อให้จับ Port 3000 ตัวหลักเสมอ.

### 3. ปัญหาแถบ `import` ขึ้นขีดเส้นใต้สีแดงใน IDE (`@/*`)
* **อาการที่เจอ:** ในไฟล์ `page.tsx` มีเส้นขีดแดงเตือนตรงบรรทัด `import ... from "@/components/..."` แต่ Next.js build และรันผ่าน 100% ไม่มี error.
* **สาเหตุ:** IDE (VS Code / Antigravity) เปิดโปรเจกต์ที่ Root โฟลเดอร์หลัก (`easyprint`) แต่ก่อนหน้านี้ยังไม่มีไฟล์ `tsconfig.json` ที่โฟลเดอร์ Root ทำให้ตัว TypeScript Language Server ของ IDE หาการตั้งค่า Path Alias (`@/*`) ไม่เจอ.
* **แนวทางแก้ไข:** สร้างไฟล์ `tsconfig.json` ที่ Root โฟลเดอร์หลัก และเพิ่ม `"baseUrl": "."` ใน `apps/web/tsconfig.json` เพื่อให้ IDE รู้จักการตั้งค่า Path Alias อย่างถูกต้อง.

---

## 🚀 ลิงก์ทดสอบหน้าฝั่งร้านค้า (Shop Portal URLs)

| เมนู | URL (พอร์ต 3000) |
|---|---|
| 🏠 หน้าหลัก | [http://localhost:3000/shop/dashboard](http://localhost:3000/shop/dashboard) |
| 📦 รายการคำสั่งซื้อ | [http://localhost:3000/shop/orders](http://localhost:3000/shop/orders) |
| 💬 แชท | [http://localhost:3000/shop/chat](http://localhost:3000/shop/chat) |
| 📊 สรุปและรายงาน | [http://localhost:3000/shop/reports](http://localhost:3000/shop/reports) |
| 🔧 บริการและราคา | [http://localhost:3000/shop/services](http://localhost:3000/shop/services) |
| 🏪 โปรไฟล์ร้าน | [http://localhost:3000/shop/profile](http://localhost:3000/shop/profile) |
| ⚙️ ตั้งค่า | [http://localhost:3000/shop/settings](http://localhost:3000/shop/settings) |
| 📞 ติดต่อแอดมิน | [http://localhost:3000/shop/contact-admin](http://localhost:3000/shop/contact-admin) |

---

## 🧩 สรุปงานเพิ่มเติม — Backend หน้า "บริการและราคา" (/shop/services)

ต่อยอดจากหน้า Frontend ที่ทำไว้ด้านบน คราวนี้ทำทั้งฝั่งแก้บั๊ก Frontend และสร้าง Backend ให้ครบวงจร

### 1. แก้บั๊กฝั่ง Frontend ที่เจอตอนทดสอบกรอกฟอร์ม

| บั๊ก | ไฟล์ | วิธีแก้ |
|---|---|---|
| ราคาบวกเพิ่มของบริการเสริม (`extraPrice`) ใส่ค่าติดลบได้ | `AddServiceModal.tsx` | clamp ด้วย `Math.max(0, ...)` ใน `handleExtraPriceChange` |
| สร้างบริการ/บริการเสริม/วิธีจัดส่งชื่อซ้ำได้ไม่จำกัด | `AddServiceModal.tsx`, `AddDeliveryModal.tsx` | เพิ่ม duplicate-name check ใน `validate()` เทียบกับรายการที่มีอยู่แล้ว (exclude ตัวเองตอนแก้ไข) |
| แก้ไขบริการหลักอยู่ แล้วมือลื่นไปแตะ radio "บริการเสริม" — ระบบไม่อัปเดตของเดิม แต่สร้างบริการเสริมใหม่แทน เพราะ `editingAddOnService` ยังเป็น null | `AddServiceModal.tsx` | disable radio ทั้งสองปุ่มระหว่างโหมดแก้ไข (`isEditing`) |
| ลบ/ปิดบริการเสริมที่ผูกกับบริการหลักอยู่ โดยไม่เตือนผลกระทบ | `AddOnServicesTable.tsx` | popup ยืนยันบอกจำนวนบริการหลักที่ผูกอยู่ก่อนลบ/ปิดทุกครั้ง |
| ปุ่มเปิด/ปิดบริการหลัก, ตัวเลือกจัดส่งรายการ, และสวิตช์ใหญ่ "เปิดใช้งานระบบจัดส่งทั้งหมด" ไม่มี popup ยืนยันเลย | `MainServicesTable.tsx`, `DeliverySettingsTable.tsx` | เพิ่ม `confirm()` เฉพาะตอนกด **ปิด** (ตอนเปิดไม่ต้องเตือน เพราะไม่เสี่ยงข้อมูลหาย) |

### 2. สร้าง Backend ครบ 3 ชั้น (DB schema → Zod validation → API)

* **DB schema** (`apps/api/drizzle/schema.ts`): เพิ่มตาราง `main_services`, `addon_services`, `main_service_addons` (junction table ผูกราคาบวกเพิ่มเฉพาะคู่ พร้อม `ON DELETE CASCADE` ทั้งสองด้าน), `delivery_options`, และคอลัมน์ `shops.delivery_enabled` — ราคาทุกตารางเก็บเป็น `numeric(10,2)` หน่วย**บาท** (ต่างจาก `orders.total_price` ที่เก็บเป็นสตางค์ ตั้งใจไม่ให้ตรงกันเพราะ frontend กรอก/แสดงเป็นบาทอยู่แล้ว ไม่อยากเพิ่มการแปลงหน่วยโดยไม่จำเป็น)
* **Zod schema** (`packages/shared/src/schemas/service.ts`): validate กติกาเดียวกับที่ฝั่ง frontend ใช้ ให้ web กับ api ใช้ร่วมกันจุดเดียว
* **API endpoints** (`apps/api/src/routes/services.ts`): ครบ GET/POST/PATCH/DELETE ทั้ง 3 resource (`/shops/:shopId/services`, `/shops/:shopId/addons`, `/shops/:shopId/delivery-options`) เช็คชื่อซ้ำที่ฝั่ง handler ก่อน insert/update ด้วย

รายละเอียด endpoint ทั้งหมดอยู่ที่ `docs/api-spec.md`, โครงสร้างตารางอยู่ที่ `docs/erd.md`

### 3. ปัญหาที่เจอระหว่างทำ Backend + วิธีแก้

**ปัญหา A: `drizzle-kit push` (v0.24.2) crash ตอน sync ขึ้น Supabase จริง**
* **อาการ:** รัน `bun --cwd apps/api drizzle-kit push` แล้ว error `TypeError: Cannot read properties of undefined (reading 'endsWith')` ระหว่างขั้นตอน "Pulling schema from database"
* **สาเหตุ:** บั๊กภายในของ `drizzle-kit` เองตอน introspect (อ่านโครงสร้าง) DB ที่มีอยู่จริงบน Supabase แล้วไปเจอ column ที่ driver คืนค่า `column_default` เป็น `undefined` แทนที่จะเป็น `null` — เช็คแล้วด้วย query ตรงผ่าน `information_schema.columns` ว่าไม่ใช่ปัญหาจาก schema ที่เราออกแบบเอง เป็นบั๊กของเครื่องมือ ไม่เกี่ยวกับตารางใหม่ที่เพิ่ม
* **วิธีแก้:** เลี่ยงคำสั่ง `push` (ที่ต้อง introspect live DB) แล้วใช้ `drizzle-kit generate` (สร้างไฟล์ SQL migration จาก diff กับ snapshot ในเครื่อง ไม่ต้อง introspect DB จริง) ตามด้วย `drizzle-kit migrate` (รันไฟล์ SQL ที่ generate ไว้เข้า DB จริง) แทน — ได้ผลลัพธ์เดียวกันแต่ไม่ชนบั๊กตัวนี้

**ปัญหา B: migration แรกไม่รู้ว่าตาราง `shops` มีอยู่แล้ว เลยไม่เพิ่มคอลัมน์ใหม่ให้**
* **อาการ:** เพราะเป็น migration ไฟล์แรกของโปรเจกต์ (ไม่เคยมี migration history มาก่อน) `drizzle-kit generate` เลยมองว่าทุกตาราง "ใหม่หมด" แล้วสร้างเป็น `CREATE TABLE IF NOT EXISTS` ให้ทั้งหมดรวมถึง `users`/`shops`/`orders` ที่มีอยู่แล้วจริงบน Supabase — ผลคือ statement นั้น no-op (ไม่มีผล) สำหรับตารางเดิม ทำให้คอลัมน์ใหม่ที่เพิ่มเข้าไปใน `shops` (`delivery_enabled`) ไม่ถูกสร้างจริงตามไปด้วย
* **วิธีแก้:** เติม `ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "delivery_enabled" ...` เพิ่มเองในไฟล์ migration ที่ generate ออกมา แล้วค่อยรัน migrate — เช็คย้อนกลับด้วย query ตรงจนมั่นใจว่าคอลัมน์ถูกสร้างจริงในเครื่อง Supabase

**ปัญหา C: ทดสอบ API ด้วย `curl` ที่ localhost:3000 แต่ดันเจอ HTML ของหน้าเว็บแทน JSON**
* **อาการ:** รัน API dev server (Elysia) แล้วมันบอกว่ารันที่ port 3000 สำเร็จ (ไม่ error) ทั้งที่ Next.js web ก็รันที่ port 3000 อยู่แล้วเหมือนกัน พอ `curl http://localhost:3000` กลับได้ HTML ของหน้าเว็บ ไม่ใช่ JSON ของ API
* **สาเหตุ:** ทั้งสองตัวรันที่ port 3000 จริงพร้อมกันได้แบบไม่ error เพราะ bind กันคนละ address family — Next.js bind ที่ `::` (IPv6 all-interfaces) ส่วน Elysia bind ที่ `0.0.0.0` (IPv4 all-interfaces) บน Windows คำว่า `localhost` มักถูก resolve เป็น IPv6 (`::1`) ก่อน เลยชนกับ Next.js ตลอด
* **วิธีแก้:** ยิง curl ไปที่ `http://127.0.0.1:3000` ตรงๆ (บังคับ IPv4) แทน `localhost` เพื่อให้ชนกับ Elysia API แน่นอน

**ปัญหา D: ยิง curl ส่งข้อความภาษาไทยแบบ inline argument แล้วข้อมูลเพี้ยนเป็น `????`**
* **อาการ:** ทดสอบ POST เข้า API ด้วย `curl -d '{"name":"เข้าเล่มสันกาว", ...}'` แล้ว API ตอบ error ว่าข้อมูลไม่ตรง enum เพราะค่าที่ได้รับกลายเป็น `"10 ????"` แทนที่จะเป็น `"10 นาที"`
* **สาเหตุ:** การเข้ารหัสตัวอักษร (encoding) เพี้ยนระหว่างทาง Git Bash บน Windows ตอนส่ง argument ภาษาไทยแบบ inline เข้า `curl` ไม่ใช่บั๊กของ API หรือ Zod schema เลย (ยืนยันได้จาก error message ที่ตอบกลับมาถูกต้องตามที่ validate จริง)
* **วิธีแก้:** เขียน payload JSON ลงไฟล์ (`.json`) แยกต่างหากด้วย UTF-8 ก่อน แล้วใช้ `curl --data-binary @ไฟล์.json` แทนการพิมพ์ inline ในคำสั่ง — encoding ผ่านไฟล์ไม่เพี้ยน

### 4. ทดสอบจริงกับ Supabase แล้ว ไม่ใช่แค่ typecheck

สร้าง shop/user ปลอมชั่วคราว → ยิง curl ทดสอบ CRUD ครบทั้ง 3 resource, ทดสอบ cascade delete (ลบ addon แล้ว binding หายจากบริการหลักอัตโนมัติจริง), ทดสอบ duplicate-name ถูกบล็อกที่ server, ทดสอบ shop-scoping (ใช้ `shopId` ผิดแล้วได้ 404 ไม่ใช่แก้ข้ามร้านได้) → ลบข้อมูลทดสอบออกหมดหลังเสร็จ เช็คซ้ำแล้วว่าทุกตารางว่าง 0 แถว ไม่มีอะไรตกค้าง

### 5. สิ่งที่ยังไม่ได้ทำตอนแรก (อัปเดต: ข้อ Auth/JWT ทำเสร็จแล้ว ดูข้อ 6-7 ด้านล่าง)

* ~~Auth/JWT — endpoint แก้ไข/ลบยังไม่เช็คว่าผู้เรียกเป็นเจ้าของร้านจริง~~ ✅ ปิดแล้ว (ดูข้อ 6)
* ยังไม่ต่อ Frontend เข้ากับ API จริง (หน้า `/shop/services` ยังใช้ mock data ในเครื่อง `useState`)
* ยังไม่มีระบบอัปโหลดรูปภาพจริง (กล่องอัปโหลดในฟอร์มยังเป็น mock UI เฉยๆ)

---

## 🔐 อัปเดต — ปิดช่องโหว่ auth บน Services API

หลังจากทีม (คนทำ auth) push ระบบ login/register/JWT ขึ้น `main` แล้ว กลับมาปิด TODO ที่ค้างไว้จากตอนแรก ว่า services API ยังไม่เช็คว่าผู้เรียกเป็นเจ้าของร้านจริง

### 6. สิ่งที่ทำ

* เพิ่มฟังก์ชัน `requireShopOwner()` ใน `apps/api/src/routes/services.ts` เรียกใช้ต่อ JWT ที่มีอยู่แล้ว (`apps/api/src/auth/jwt.ts` — `verifyAuthToken` + cookie `easyprint_token`) เช็ค 3 ชั้นก่อนให้แก้/ลบข้อมูลทุกครั้ง:
  1. มี JWT ที่ verify ผ่านไหม (ไม่งั้น 401 "ยังไม่ได้เข้าสู่ระบบ")
  2. role เป็น `shop_owner` ไหม (ไม่งั้น 403 "ต้องเป็นบัญชีร้านค้าเท่านั้น")
  3. `shopId` ใน URL เป็นร้านที่ user คนนั้นเป็นเจ้าของจริงไหม (query `shops` ด้วย `owner_id`, ไม่งั้น 403 "คุณไม่มีสิทธิ์จัดการร้านนี้")
* ใส่การเช็คนี้ในทุก endpoint ที่แก้ไข/ลบข้อมูล (POST/PATCH/DELETE ของบริการหลัก, บริการเสริม, ตัวเลือกจัดส่ง รวม 9 endpoint) — endpoint GET (list/อ่านอย่างเดียว) ยังคงเปิดสาธารณะเหมือนเดิม เพราะลูกค้าต้องดูบริการได้โดยไม่ต้อง login
* ย้ายชื่อ cookie (`"easyprint_token"`) จากที่เคยเป็นค่าคงที่ซ้ำอยู่ในไฟล์ auth ไปไว้ที่เดียวที่ `jwt.ts` (export เป็น `AUTH_COOKIE_NAME`) แล้วให้ทั้ง `auth/routes.ts` และ `services.ts` เรียกใช้ค่าเดียวกัน กันพิมพ์ผิด/ลืมแก้ตอนเปลี่ยนชื่อ cookie ทีหลัง

### 7. ทดสอบจริงกับ Supabase + JWT จริง (ไม่ใช่ mock)

สร้างเจ้าของร้าน 2 คนกับร้าน 2 ร้านชั่วคราว → login ผ่าน `/auth/login` จริงเพื่อได้ JWT cookie จริง (ไม่ได้ปลอม token เอง) → ทดสอบ 4 เคส:

| เคส | ผลที่ได้ | ตรงตามที่ตั้งใจไหม |
|---|---|---|
| POST เข้าร้านตัวเอง พร้อม cookie ที่ login ไว้ | 200 สร้างสำเร็จ | ✅ |
| POST เข้าร้านของเจ้าของคนอื่น ด้วย cookie ของตัวเอง | 403 | ✅ (นี่คือช่องโหว่ที่เพิ่งปิด) |
| POST ด้วย cookie ปลอม/ไม่ถูกต้อง | 401 | ✅ |
| GET (ดูรายการบริการ) โดยไม่ login เลย | 200 ยังอ่านได้ปกติ | ✅ (ตั้งใจให้ลูกค้าดูได้โดยไม่ต้อง login) |

ลบข้อมูลทดสอบ (user 2 คน, ร้าน 2 ร้าน, บริการเสริมที่สร้างทดสอบ) ออกหมดหลังเสร็จแล้ว

