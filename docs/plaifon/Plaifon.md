# สรุปการพัฒนาระบบ Layout และโครงสร้างหน้าเว็บ — EasyPrint

ไฟล์นี้สรุปสิ่งที่ได้พัฒนาและปรับปรุงระบบ Layout ทั้งฝั่งลูกค้า (Customer Portal) และฝั่งร้านค้า (Shop/Admin Portal) พร้อมสรุปปัญหาเทคนิคที่พบและแนวทางการแก้ไขเพื่ออ้างอิงสำหรับทีมพัฒนา

> **📌 Typography System**: ทั้งระบบและทุกหน้าทั้งหมด (Customer, Shop/Admin, Landing, Navigation Bar, Buttons, Cards) บังคับใช้ฟอนต์ **Sarabun (Google Fonts)** 100% ครอบคลุมทุกองค์ประกอบ

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

> ⚠️ **อัปเดต:** ตอนแรกหน้านี้ทั้งหมดต่อกับ mock data ล้วนๆ (`services-mock.ts`) ยังไม่เคยเรียก backend เลย — ตอนนี้**ต่อกับ Supabase จริงครบทั้ง 3 ตารางแล้ว** (ดูหัวข้อ "ต่อหน้า /shop/services เข้ากับ backend จริง" ด้านล่าง) ไฟล์ `services-mock.ts` ถูกลบทิ้งแล้วเพราะไม่มีที่ไหนใช้

* **`ServicesTabs.tsx`**: ตัวควบคุม 3 แท็บ (**บริการหลัก**, **บริการเสริม**, **ตั้งค่าการจัดส่ง**) พร้อม Badge แสดงจำนวนรายการจริงจาก Supabase และเส้นใต้ไฮไลต์สีส้ม
* **`MainServicesTable.tsx`**: ตารางบริการหลัก (map ตรงกับ DB table `main_services`) แสดงขนาดกระดาษ, สี, ราคา/หน่วย, เวลาทำการ, จำนวนบริการเสริมที่ผูกไว้, สวิตช์ เปิด/ปิด, ปุ่มแก้ไข/ลบ, ช่องค้นหา และ Pagination — ข้อมูลดึงจาก `GET /shops/:shopId/services` จริง แก้ไข/ลบ/เปิดปิด เรียก `PATCH`/`DELETE` จริงทุกครั้ง
* **`AddOnServicesTable.tsx`**: ตารางบริการเสริม (map ตรงกับ DB table `addon_services`) สำหรับตัวเลือกเพิ่มเติม (เข้าเล่ม, เคลือบเอกสาร ฯลฯ) — ต่อกับ `GET/POST/PATCH/DELETE /shops/:shopId/addons` จริงเหมือนกัน
* **`DeliverySettingsTable.tsx`**: ตารางตั้งค่าการจัดส่ง (map ตรงกับ DB table `delivery_options`) พร้อม Banner Toggle เปิด/ปิดระบบจัดส่งทั้งหมด (ค่านี้ยังเป็น UI state อย่างเดียว ยังไม่มี endpoint ให้ร้านค้า toggle `shops.delivery_enabled` เอง — ดู TODO ใน `docs/erd.md`), อัตราค่าจัดส่งเริ่มต้น และเงื่อนไขส่งฟรีเมื่อซื้อขั้นต่ำ — ต่อกับ `GET/POST/PATCH/DELETE /shops/:shopId/delivery-options` จริง
* **`AddServiceModal.tsx`**: โมดัล เพิ่ม/แก้ไข บริการ (ใช้ร่วมกันทั้งบริการหลักและเสริม) มี Radio สลับประเภท, ฟิลด์ dynamic, การผูกบริการเสริมพร้อมกรอกราคาบวกเพิ่ม (extraPrice), ตารางสรุปแบบเรียลไทม์, และ**อัปโหลดรูปภาพจริง**ผ่าน `POST /uploads` (`type: "service-image"`) ขึ้น Supabase Storage bucket `shop-photos` ก่อนบันทึก
* **`AddDeliveryModal.tsx`**: โมดัล เพิ่ม/แก้ไข ประเภทการจัดส่ง พร้อม**อัปโหลดโลโก้จริง**ผ่าน `POST /uploads` (`type: "delivery-logo"`)
* **`types.ts`**: Data Models (`MainService`, `AddOnService`, `DeliveryOption`) — shape ตรงกับสิ่งที่ backend serializer คืนมาพอดี (ดูฟังก์ชัน `serializeMainService`/`serializeAddOnService`/`serializeDeliveryOption` ใน `apps/api/src/routes/services.ts`) เพื่อให้ frontend ใช้ type เดียวกันได้เลยไม่ต้อง map ซ้ำ
* **`lib/api/services.ts`** (ของใหม่): รวมฟังก์ชันเรียก backend ทั้งหมดของหน้านี้ (`getMyShop`, `get/create/update/delete` ครบ 3 กลุ่ม) — หน้า `page.tsx` เรียกใช้ไฟล์นี้ทั้งหมด ไม่ mutate state ตรงๆ เหมือนเดิมอีกต่อไป

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

### 5. สิ่งที่ยังไม่ได้ทำตอนแรก (อัปเดต: ทำครบทั้ง 3 ข้อแล้ว ดูข้อ 6-7 และ 29-31 ด้านล่าง)

* ~~Auth/JWT — endpoint แก้ไข/ลบยังไม่เช็คว่าผู้เรียกเป็นเจ้าของร้านจริง~~ ✅ ปิดแล้ว (ดูข้อ 6)
* ~~ยังไม่ต่อ Frontend เข้ากับ API จริง (หน้า `/shop/services` ยังใช้ mock data ในเครื่อง `useState`)~~ ✅ ต่อครบแล้ว (ดูข้อ 29-30)
* ~~ยังไม่มีระบบอัปโหลดรูปภาพจริง (กล่องอัปโหลดในฟอร์มยังเป็น mock UI เฉยๆ)~~ ✅ อัปโหลดจริงครบทั้งบริการหลัก/บริการเสริม/โลโก้จัดส่งแล้ว (ดูข้อ 31-32)

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

---

## 🏪 อัปเดต — สมัครสมาชิกร้านค้า + เข้าสู่ระบบ (backend + database)

งานนี้พบว่าหน้าเว็บ `apps/web/app/(auth)/register/shop-register/page.tsx` มีอยู่แล้ว (เป็น mock UI ล้วนๆ กด submit แล้วแค่เปลี่ยน state ในเครื่อง ไม่ได้ยิง API จริง) เลยออกแบบ backend ให้ตรงกับฟิลด์ที่ฟอร์มนี้เก็บอยู่แล้วเป๊ะๆ

### 8. สิ่งที่ทำ

* **DB schema** — เพิ่มคอลัมน์ใน `shops`: `category` (ประเภทร้านค้า), `google_map_link` (ไม่บังคับ), `id_card_url`/`shop_photo_url` (nullable รอระบบอัปโหลดจริง), `approval_status` (enum `pending`/`approved`/`rejected` default `pending` — ร้านใหม่ทุกร้านเริ่มที่ pending เสมอ ตรงกับข้อความในหน้าฟอร์มที่บอกว่า "ทีมงานจะตรวจสอบภายใน 1-2 วันทำการ")
* **Zod schema** (`packages/shared/src/schemas/auth.ts`) — เพิ่ม `registerShopSchema` และ `shopTypeSchema` (list ประเภทร้านค้า 6 แบบ) แล้วย้าย `SHOP_TYPES` ที่เคย hardcode ซ้ำอยู่ในหน้าเว็บออกมาไว้ที่นี่ที่เดียว ให้หน้าเว็บ `import { SHOP_TYPES } from "@easyprint/shared"` แทน กันข้อมูลไม่ตรงกันถ้าแก้ทีหลัง
* **API endpoint ใหม่** — `POST /auth/register/shop` (`apps/api/src/auth/routes.ts`) สร้าง `users` (role=shop_owner) + `shops` พร้อมกันในทรานแซกชันเดียว (ถ้าอันใดอันหนึ่งพังจะ rollback ทั้งคู่ ไม่ทิ้ง user ลอยๆ ไม่มีร้าน) รวมที่อยู่จากฟิลด์แยก (บ้านเลขที่/หมู่/ถนน/ตำบล/อำเภอ/จังหวัด/รหัสไปรษณีย์) เป็นข้อความเดียวก่อนเก็บ
* **ไม่ต้องสร้าง endpoint login แยก** — `/auth/login` เดิมใช้ได้กับทุก role อยู่แล้ว (ไม่เคยเช็ค role เลย) เลยไม่มีอะไรต้องแก้ฝั่ง login

### 9. จุดที่ต้องตัดสินใจเอง (ฟอร์มไม่ได้ระบุไว้ชัด)

* **ฟอร์มไม่มีช่องกรอกรหัสผ่านเลย** ทั้งที่ต้องมีรหัสผ่านถึงจะ login ได้ทีหลัง — backend กำหนดให้ `password` เป็น required field ตาม pattern เดียวกับ `/auth/register` ของลูกค้า (ยาวอย่างน้อย 8 ตัวอักษร) ไว้ก่อน ฝั่งหน้าเว็บที่ยังไม่ได้ต่อ API จริงต้องเพิ่มช่องนี้ทีหลัง
* **ฟอร์มมีแค่เบอร์โทรเดียว** ไม่ได้แยกเบอร์เจ้าของร้าน/เบอร์ร้านค้า — ใช้เบอร์เดียวกันบันทึกทั้ง `users.phone` และ `shops.phone`
* **ชื่อเจ้าของร้าน (`ownerName`) เป็นช่องเดียว** แต่ตาราง `users` เก็บแยก `firstname`/`lastname` (ตามที่ทีม auth ออกแบบไว้ตั้งแต่แรกสำหรับลูกค้า) — backend เลยต้องการ `firstname` + `lastname` แยกกัน 2 ฟิลด์ ไม่ใช่ `ownerName` ช่องเดียวแบบฟอร์มปัจจุบัน ต้องแก้ตอนต่อ frontend เข้า API จริง
* **รูปบัตรประชาชน/รูปร้าน** — ฟอร์มบังคับอัปโหลดไฟล์ (`required`) แต่ยังไม่มีระบบอัปโหลดจริง เลยตั้งเป็น **ไม่บังคับ** ใน backend ก่อน (`idCardUrl`/`shopPhotoUrl` รับเป็น URL string เฉยๆ) ไม่งั้นจะสมัครร้านไม่ได้เลยจนกว่า Supabase Storage จะเสร็จ

### 10. Migration เจอปัญหาเพิ่ม: migration history ไม่ตรงกับของจริงบน Supabase

ตอนรัน `drizzle-kit generate` รอบนี้ มันพยายามสร้างตาราง `password_reset_tokens` และเพิ่มคอลัมน์ `firstname`/`lastname`/`phone`/`address` ใน `users` **ทั้งที่มีอยู่แล้วจริงบน Supabase** เพราะทีม auth ใช้วิธี push ขึ้น Supabase เองโดยตรง ไม่เคยสร้างไฟล์ migration เก็บไว้ (ไฟล์ migration ในเครื่องเรารู้จักแค่ schema เก่าตอนที่เรา generate ครั้งแรก) — เช็คด้วย query ตรงกับ `information_schema.columns` ก่อนว่าอะไรมีอยู่แล้วบ้าง แล้วแก้ไฟล์ migration ที่ generate ออกมาให้เป็น `ADD COLUMN IF NOT EXISTS` แทนที่จะลบ statement ทิ้ง (เพื่อให้ประวัติ migration ยังสมบูรณ์ถ้ามีคนต้องตั้ง DB ใหม่ตั้งแต่ศูนย์ในอนาคต) — รันแล้วเจอ NOTICE "column already exists, skipping" ตามคาด ไม่มี error

### 11. ทดสอบจริงกับ Supabase ครบวงจร (สมัคร → login → ใช้สิทธิ์จริง)

สมัครร้านทดสอบผ่าน `POST /auth/register/shop` จริง → ตรวจว่า `approvalStatus` เป็น `pending` และที่อยู่ถูก format รวมถูกต้อง → สมัครอีเมลเดิมซ้ำได้ 409 → **login ด้วยบัญชีที่เพิ่งสมัครผ่าน `/auth/login` จริง** (ไม่ใช่ token ปลอม) → เอา cookie ที่ได้จาก login ไปสร้างบริการเสริมในร้านของตัวเองผ่าน services API (จาก PR ก่อนหน้า) สำเร็จ — พิสูจน์ว่า 3 ชิ้นงาน (สมัครร้าน, login, auth-guard บน services) ต่อกันทำงานจริงครบวงจร ไม่ใช่แค่ทดสอบแยกส่วน — ลบข้อมูลทดสอบออกหมดหลังเสร็จแล้ว

### 12. สิ่งที่ยังไม่ได้ทำ

* ยังไม่มี endpoint `PATCH /admin/shops/:id/approve` (อนุมัติร้านค้า) — ร้านที่สมัครเข้ามาตอนนี้ค้างที่ `pending` ตลอด ยังไม่มีทางเปลี่ยนสถานะ

---

## 📤 อัปเดต — ต่อฟอร์ม shop-register เข้า API จริง + ระบบอัปโหลดไฟล์จริง

ตอนแรกตั้งใจปล่อยให้รูปบัตรประชาชน/รูปร้านเป็น "ไม่บังคับ" ไปก่อนเพราะยังไม่มีระบบอัปโหลด แต่เจ้าของโปรเจกต์อยากให้บังคับใส่จริงเหมือนฟอร์มเดิม เลยต้องสร้างระบบอัปโหลดไฟล์จริงขึ้นมาด้วย

### 13. สิ่งที่ทำ

* **สร้าง Supabase Storage bucket จริง 2 อัน** ผ่าน `@supabase/supabase-js` (service role key) — `shop-photos` (**public** เพราะลูกค้าต้องเห็นรูปหน้าร้านได้) และ `id-cards` (**private** เพราะเป็นข้อมูลบัตรประชาชน ห้ามเปิดสาธารณะเด็ดขาด) ทั้งสอง bucket จำกัดชนิดไฟล์ (JPG/PNG/WEBP) และขนาดไม่เกิน 5MB ไว้ที่ระดับ bucket ด้วย (กันซ้ำกับที่เช็คในโค้ด)
* **API endpoint ใหม่** `POST /uploads` (`apps/api/src/routes/uploads.ts` + `apps/api/src/storage.ts`) รับไฟล์แบบ multipart/form-data พร้อม `type` (`shop-photo` หรือ `id-card`) อัปโหลดขึ้น bucket ที่ถูกต้อง คืน `{ path, url }` — `url` เป็น `null` สำหรับ `id-card` เพราะ bucket private ไม่มี public URL ตรงๆ
* **แก้ Zod schema** — `googleMapLink`, `idCardUrl`, `shopPhotoUrl` เปลี่ยนจาก optional เป็น **required** ตามที่ขอ (`idCardUrl` validate แค่ไม่ว่างเปล่า ไม่ใช้ `.url()` เพราะเก็บเป็น path ไม่ใช่ URL)
* **ต่อฟอร์ม `shop-register/page.tsx` เข้า API จริง** — เพิ่มช่องรหัสผ่าน + ยืนยันรหัสผ่าน, แก้ `handleSubmit` ให้: (1) อัปโหลดไฟล์ทั้งสองพร้อมกันผ่าน `POST /uploads` ก่อน (2) เอาผลลัพธ์ (`path`/`url`) ไปยิง `POST /auth/register/shop` จริง (3) แสดง error จริงจาก server ถ้าพัง ไม่ใช่แค่ mock success เฉยๆ เหมือนเดิม
* เพิ่ม `apps/web/lib/api/uploads.ts` แยกจาก `lib/api/client.ts` เดิม เพราะ multipart/form-data ห้ามตั้ง `Content-Type` เอง (ต้องให้ browser คำนวณ boundary ให้)

### 14. เจอปัญหาเพิ่มระหว่างทดสอบ

* **curl บน Windows (mingw) พังเวลาใช้ `-F "file=@path;type=image/png"`** — ใส่ `;type=` ต่อท้าย path แล้ว curl error 26 (อ่านไฟล์ไม่ได้) ทั้งที่ไฟล์มีอยู่จริง แก้โดยตัด `;type=...` ออก ปล่อยให้ curl เดา mime type จากนามสกุลไฟล์เอง ก็ใช้ได้ปกติ — เป็นปัญหาของ curl เวอร์ชันนี้ ไม่เกี่ยวกับ endpoint
* **แก้ Zod schema ใน `packages/shared` แล้ว API ไม่เห็นการเปลี่ยนแปลง** — `bun run --watch` มี warning เตือนไว้ตั้งแต่แรกว่าไม่ watch ไฟล์นอก `apps/api` (เช่น `packages/shared`) แต่ลืมสังเกต พอแก้ schema แล้วทดสอบซ้ำ error message เก่ายังค้างอยู่ (บอก "Invalid url" ทั้งที่แก้เป็น `.min(1)` ไปแล้ว) ต้อง restart dev server ของ `apps/api` เองทุกครั้งที่แก้ไฟล์ใน `packages/shared`

### 15. ทดสอบจริงครบวงจร (อัปโหลดไฟล์จริง → สมัครร้านจริง)

อัปโหลดไฟล์รูปทดสอบจริงผ่าน `POST /uploads` ทั้ง 2 bucket → เช็คว่า `shop-photos` เปิดดูได้จริงจาก URL ที่ได้ (HTTP 200) และ `id-cards` เข้าถึงแบบสาธารณะไม่ได้จริง (HTTP 400 ตามที่ตั้งใจ) → เอา path/url ที่ได้จริงไปยิง `POST /auth/register/shop` ต่อ (ไม่ใช้ค่าปลอม) → เช็คว่า record ที่บันทึกมี `idCardUrl`/`shopPhotoUrl` ตรงกับที่อัปโหลดจริง → ทดสอบผ่านหน้าเว็บจริงในเบราว์เซอร์ด้วย (กรอกฟอร์มเต็ม เห็น network request ยิงไป `POST /auth/register/shop` สำเร็จ 200) — ลบข้อมูลทดสอบและไฟล์ที่อัปโหลดออกจาก Storage หมดหลังเสร็จ

### 16. สิ่งที่ยังไม่ได้ทำ

* ยังไม่มี endpoint `PATCH /admin/shops/:id/approve` (อนุมัติร้านค้า) — ร้านที่สมัครเข้ามาตอนนี้ค้างที่ `pending` ตลอด
* `POST /uploads` เปิดสาธารณะไม่มี rate limit — กันได้แค่ชนิดไฟล์/ขนาดไฟล์ ยังไม่กันการยิงรัวๆ (spam)
* ยังไม่มีทางดูรูปบัตรประชาชนที่อัปโหลดไว้ (bucket private ไม่มี URL ตรงๆ ต้องมี endpoint สร้าง signed URL ให้แอดมินก่อน ถึงจะดูได้ตอนอนุมัติร้านค้า)

---

## 🛡️ อัปเดต — Backend หน้า "ตรวจสอบร้านค้า" (อนุมัติ/ไม่อนุมัติ) + ปลดล็อกบริการและราคา

หน้า UI "ตรวจสอบร้านค้า" (`admin/shops`) มีคนสร้างไว้แล้วผ่าน Antigravity (ตาราง, filter, modal อนุมัติ/ไม่อนุมัติ, document viewer) แต่ยังใช้ mock data ล้วนๆ งานนี้คือต่อเข้า backend จริง + ทำให้การอนุมัติมีผลจริง (ปลดล็อกให้ร้านตั้งบริการได้)

### 17. สิ่งที่ทำ

* **DB schema** — เพิ่ม `shops.social_media`, `shops.opening_hours` (jsonb — เก็บตารางเวลาทำการทั้ง 7 วัน), `shops.rejected_reason` (nullable, ใส่ตอนแอดมินกด "ไม่อนุมัติ" เท่านั้น) พบด้วยว่าตอนสมัครร้าน (`POST /auth/register/shop`) ไม่เคยบันทึก `socialMedia`/`openingHours` ลง DB เลยทั้งที่ฟอร์มเก็บมา (ข้อมูลหายเงียบๆ) แก้ให้บันทึกจริงด้วย
* **API endpoints ใหม่** (`apps/api/src/routes/admin.ts`) ทั้งหมดเช็ค JWT ต้องเป็น `role: admin` เท่านั้น (401 ถ้ายังไม่ login, 403 ถ้า login แต่ไม่ใช่แอดมิน):
  - `GET /admin/shops` — list ร้านทั้งหมด join ข้อมูลเจ้าของร้านจาก `users`
  - `GET /admin/shops/:id` — รายละเอียดร้าน + **สร้าง signed URL ชั่วคราว (10 นาที)** ให้บัตรประชาชนที่อยู่ใน private bucket ปิดช่องโหว่ที่ทิ้งไว้จากรอบก่อน (ตอนนั้นยังไม่มีทางดูรูปบัตรได้เลย)
  - `PATCH /admin/shops/:id/approve` — อนุมัติ (ล้าง `rejectedReason` เป็น null ให้ด้วยเผื่อเคยถูกปฏิเสธมาก่อน)
  - `PATCH /admin/shops/:id/reject` — ไม่อนุมัติ พร้อมบันทึกเหตุผล (`rejectedReason` required)
* **ปลดล็อกบริการและราคาตามที่อนุมัติ** — แก้ `requireShopOwner()` ใน `apps/api/src/routes/services.ts` (จาก PR ก่อนหน้า) เพิ่มเช็ค `approvalStatus === "approved"` ก่อนอนุญาตให้สร้าง/แก้/ลบบริการ ร้านที่ยัง `pending` หรือโดน `rejected` จะโดนบล็อกด้วย error message ชัดเจนว่า "ร้านค้ายังไม่ได้รับการอนุมัติจากแอดมิน"
* **ต่อ frontend เข้า API จริง** — เขียน `apps/web/lib/adminShopAdapter.ts` แปลงข้อมูลจริงจาก API ให้เข้ากับ shape `MockShop` เดิมที่ UI component (ตาราง, modal, badge) ใช้อยู่แล้ว ทำให้ไม่ต้องรื้อ UI ที่มีอยู่เลย แค่เปลี่ยนแหล่งข้อมูลจาก mock array เป็น fetch จริง — แก้จุดที่ shape ข้อมูลจริงต่างจาก mock 2 จุด: ที่อยู่ (ของจริงรวมเป็น string เดียวตั้งแต่ตอนสมัคร ไม่ได้แยก district/province เหมือน mock) และ social media (ของจริงเป็นข้อความเต็ม ไม่ใช่ handle แบบ `@xxx`)
* เผื่อไว้ด้วยว่า "ดูตัวอย่าง"/"ดาวน์โหลด" เอกสารในหน้า mock เดิมเป็นปุ่มตกแต่งเฉยๆ ไม่มี onClick เลย ต่อให้เปิดไฟล์จริงได้แล้ว (ใช้ signed URL ของบัตรประชาชน + public URL ของรูปร้าน)

### 18. ทดสอบจริงกับ Supabase ครบวงจร (สมัคร → อนุมัติ/ปฏิเสธ → ปลดล็อกบริการ)

สมัครร้านทดสอบจริง (status เริ่มที่ `pending`) → login เป็นแอดมินจริง → `GET /admin/shops` เห็นร้านที่เพิ่งสมัคร → `GET /admin/shops/:id` ได้ signed URL บัตรประชาชนจริง → **ลองสร้างบริการตอนร้านยัง pending → โดนบล็อก 403 ตามที่ตั้งใจ** → กด "ไม่อนุมัติ" พร้อมเหตุผล → เช็คว่าเหตุผลถูกบันทึกถูกต้อง → เช็คว่าคนที่ไม่ใช่แอดมิน (shop owner) เรียก approve/reject ไม่ได้ (403) → กด "อนุมัติ" → เช็คว่า `rejectedReason` ถูกล้างเป็น null อัตโนมัติ → **ลองสร้างบริการอีกครั้ง → สำเร็จ** — พิสูจน์ว่า flow "สมัคร → รอตรวจสอบ → อนุมัติ → ตั้งบริการได้" ทำงานถูกต้องครบวงจรจริง ไม่ใช่แค่ endpoint แยกส่วน — ลบข้อมูลทดสอบออกหมดหลังเสร็จแล้ว

### 19. สิ่งที่ยังไม่ได้ทำ

* ไม่มี rate limit / anti-spam บน `POST /uploads` เหมือนเดิม (ดูข้อ 16)
* ยังไม่มีระบบแจ้งเตือนอีเมลจริงตอนอนุมัติ/ไม่อนุมัติ (ปุ่ม "อนุมัติ" ใน UI มีข้อความบอกว่า "จะได้รับการแจ้งเตือนทางอีเมลอัตโนมัติ" แต่ backend ยังไม่ได้ส่งอีเมลจริง)
* หน้ารายการยังไม่ preview รูปบัตรประชาชนแบบ signed URL (ต้องกดเข้าไปหน้ารายละเอียดร้านก่อนถึงจะได้ signed URL — ตอน list ทั้งหน้าไม่ได้ออก signed URL ให้ทุกแถวเพื่อลดจำนวนเรียก Supabase Storage API)

---

## ✅ อัปเดต — เปลี่ยน "ประเภทร้านค้า" เป็น "บริการของร้าน" + "วิธีรับสินค้า" (เลือกได้หลายรายการ)

เดิมฟอร์มสมัครร้านมี dropdown "ประเภทร้านค้า" เลือกได้ทีละ 1 (เช่น "ร้านครบวงจร") เปลี่ยนเป็น checkbox 2 ชุดที่เลือกได้หลายรายการแทน เพราะร้านจริงมักทำได้หลายอย่างพร้อมกัน ไม่ได้มีแค่ "ประเภท" เดียว

### 20. สิ่งที่ทำ

* **อ่านโค้ดทั้งโปรเจกต์ก่อนแก้** ตามที่ขอ — ไล่ดู routing, component, DB schema, และจุดที่เชื่อม Supabase ทั้งหมด แล้วเสิร์ชหาทุกจุดที่อ้างถึง "ประเภทร้านค้า" เดิม (`shopType`, `SHOP_TYPES`, `shopTypeSchema`, คอลัมน์ `category`) เจอ 18 ไฟล์ที่แมตช์คำว่า `category` แต่ 12 ไฟล์ในนั้นเป็นคำว่า "ประเภทงาน" ของออเดอร์พิมพ์ (คนละเรื่องกันโดยสิ้นเชิง) ไม่แตะเลย แก้เฉพาะจุดที่เกี่ยวกับ "ประเภทร้านค้า" จริงๆ
* **UI ฟอร์มสมัครร้าน** — แทนที่ dropdown เดิมด้วย 2 ส่วนใหม่ตามที่ระบุเป๊ะๆ:
  - **"บริการของร้าน \*"** (helper text "เลือกได้มากกว่า 1 รายการ") checkbox 16 ตัวเลือก (ถ่ายเอกสาร, ปริ้นขาวดำ/สี, สแกน, เข้าเล่ม, เคลือบ, ตัดกระดาษ, เจาะรู, เย็บเอกสาร, พิมพ์แบบแปลน/โปสเตอร์/ไวนิล/สติ๊กเกอร์, นามบัตร, ใบปลิว, อื่นๆ)
  - **"วิธีรับสินค้า \*"** (helper text เดียวกัน) checkbox 2 ตัวเลือก (รับที่หน้าร้าน / จัดส่งโดยร้าน)
* **DB schema** — ลบคอลัมน์ `shops.category` (text เดี่ยว) ออก เพิ่ม `shops.service_types` และ `shops.delivery_methods` (ทั้งคู่เป็น `text[]`) — ตั้งใจใช้ migration 2 ไฟล์แยกกัน (เพิ่มคอลัมน์ใหม่ก่อน แล้วค่อยลบคอลัมน์เก่าในไฟล์ถัดไป) แทนที่จะทำในไฟล์เดียว เพราะ `drizzle-kit generate` มี prompt แบบ interactive ถามว่า "นี่คือ rename หรือสร้างใหม่" ซึ่งสคริปต์อัตโนมัติตอบไม่ได้ ทำสองสเต็ปแยกเลยไม่ชนปัญหานี้
* **Zod schema** — เปลี่ยน `shopTypeSchema`/`SHOP_TYPES` (enum ค่าเดียว) เป็น `shopServiceTypeSchema`/`SHOP_SERVICE_TYPES` และ `shopDeliveryMethodSchema`/`SHOP_DELIVERY_METHODS` พร้อม field `serviceTypes`/`deliveryMethods` เป็น `z.array(...).min(1, ...)` บังคับเลือกอย่างน้อย 1 รายการทั้งคู่
* **ไล่แก้ทุกจุดที่ใช้ "ประเภทร้านค้า" เดิมในหน้า admin** ที่ไม่ได้อยู่ใน scope ตอนแรกแต่พังถ้าไม่แก้ (เพราะ type เปลี่ยน): หน้ารายการร้านค้า (ตัวกรอง + คอลัมน์ตาราง เปลี่ยนจาก dropdown เลือก 1 ค่า เป็น filter ด้วย `.includes()` บน array), หน้ารายละเอียดร้าน (แสดง "บริการของร้าน" และเพิ่ม "วิธีรับสินค้า" เป็นข้อมูลใหม่ที่ไม่เคยมีในหน้านี้มาก่อน), type `MockShop`/`PublicShop`/`AdminShop`, และ adapter ที่แปลงข้อมูลจริงจาก API

### 21. เรื่องข้อมูลเดิม (preserve existing data)

ตอนเริ่มแก้เจอว่ามีร้านค้าจริงสมัครเข้ามาแล้ว 2 ร้าน (ไม่ใช่ข้อมูลทดสอบของผม) ที่มีค่า `category` เดิมอยู่ (เช่น "ร้านถ่ายเอกสารทั่วไป") — **ไม่มีทางแปลงค่า `category` เดิมเป็น `service_types`/`delivery_methods` แบบอัตโนมัติได้อย่างสมเหตุสมผล** เพราะเป็นข้อมูลคนละความหมายกัน (หมวดหมู่ร้าน 1 ค่า ≠ รายการบริการที่ทำได้จริงหลายอย่าง) เลยปล่อยให้ 2 ร้านนี้มี `service_types`/`delivery_methods` เป็น `null` ไปก่อน (แถวข้อมูลเดิมไม่ได้หายหรือพัง แค่ไม่มีข้อมูลใหม่นี้เท่านั้น) — ฝั่ง UI จัดการ null ได้เรียบร้อยแล้ว (แสดง "-" แทน)

### 22. เช็ค RLS (Row Level Security) ตามที่ขอ

เช็คแล้วว่า `shops` table เปิด RLS ไว้ (`rowsecurity: true`) แต่**ไม่มี policy กำหนดไว้เลยสักอัน** และ connection ที่ backend ใช้ (`DATABASE_URL`) ต่อด้วย role `postgres` ซึ่งมี `rolbypassrls: true` (bypass RLS อยู่แล้วเสมอ) สรุปคือ **RLS ไม่มีผลอะไรกับสถาปัตยกรรมนี้เลย** เพราะการป้องกันสิทธิ์ทั้งหมดทำที่ชั้น Elysia API (`requireShopOwner`, `requireAdmin`) ไม่ได้พึ่ง RLS — งานนี้เพิ่มแค่คอลัมน์ใหม่ในตารางเดิม ไม่ได้เปลี่ยน pattern การเข้าถึงข้อมูล เลย**ไม่ต้องแก้ policy อะไรเพิ่ม**

### 23. ทดสอบจริงกับ Supabase ครบวงจร

สมัครร้านทดสอบผ่าน API จริงด้วย `serviceTypes`/`deliveryMethods` หลายค่า → เช็คว่าบันทึกลง DB ถูกต้อง → login แอดมินจริงแล้วเปิดหน้ารายการ + หน้ารายละเอียดร้าน เห็นข้อมูล "บริการของร้าน" และ "วิธีรับสินค้า" ที่กรอกจริงแสดงถูกต้อง → เช็คว่าร้านเก่า 2 ร้านที่ยังไม่มีข้อมูลใหม่ขึ้น "-" แทนที่จะพัง → ลบข้อมูลทดสอบออกหมดหลังเสร็จ (ร้านเก่า 2 ร้านที่มีอยู่จริงไม่ได้แตะเลย)

### 24. ปัญหาที่เจอระหว่างทาง (ไม่เกี่ยวกับ business logic แต่กระทบงาน)

ระหว่างทดสอบ ผมลบโฟลเดอร์ `.next` เพื่อแก้ปัญหา type-check เห็น error จากไฟล์หน้าเก่าที่ไม่มีแล้ว (ผลจากการสลับ branch) แต่ดันไปกระทบ dev server ของหน้าเว็บที่รันค้างอยู่ (น่าจะเป็นของทีม) ทำให้พังเป็น error "require is not defined in ES module scope" ต้อง restart dev server ให้ใหม่ถึงจะกลับมาใช้ได้ — เขียนไว้ตรงนี้เผื่อใครเจอปัญหาเดียวกัน: **ถ้า dev server รันอยู่ ห้ามลบ `.next` ตรงๆ ระหว่างที่มันรันอยู่** ให้ restart dev server แทนถ้าเจอ type error แปลกๆ จากไฟล์ที่ไม่มีอยู่จริง

## 🏠 อัปเดต — ต่อหน้าแรกฝั่งลูกค้าเข้ากับร้านค้าจริงที่อนุมัติแล้วเท่านั้น

เดิมหน้าแรก (`apps/web/app/page.tsx`) ใช้ mock data ล้วนจาก `shopData.ts` (6 ร้าน "ร้านดี พริ้น" ซ้ำๆ กัน) ไม่เชื่อมกับ backend เลย ทำให้ลูกค้าเห็นร้านปลอมตลอดไม่ว่าจะมีร้านจริงอนุมัติแล้วกี่ร้านก็ตาม

### 25. สิ่งที่ทำ

* **เพิ่ม endpoint สาธารณะ `GET /shops`** (`apps/api/src/routes/shops.ts`) — คืนเฉพาะร้านที่ `approvalStatus: "approved"` เท่านั้น กรองด้วย `WHERE` ใน SQL โดยตรง ไม่ใช่กรองฝั่ง frontend ทีหลัง (กันหลุดร้าน pending/rejected ออกไปโดยไม่ตั้งใจ) ไม่ต้อง login เพราะลูกค้าทั่วไปต้องดูได้
* **ต่อหน้าแรกจริงเข้ากับ endpoint นี้** แทนที่ `MOCK_SHOPS` ทั้งหมด แล้วลบไฟล์ `shopData.ts` ทิ้ง (ไม่มีที่ไหนใช้แล้ว)
* mock data เดิมมีบาง field ที่ backend ไม่มีข้อมูลรองรับจริง (`rating`/`reviewCount` — ไม่มีระบบรีวิว, `canIssueTaxInvoice` — ไม่เคยเก็บตอนสมัคร, `locationCategory` — ไม่เคยเก็บตอนสมัคร) **ตัดสินใจไม่ยัด placeholder ปลอมเข้าไป** แทนที่จะเดาค่า:
  - ตัดการแสดงดาว/จำนวนรีวิวออกทั้งหมด (ของเดิม hardcode 5 ดาวเต็มทุกร้านอยู่แล้ว ไม่ใช่ของจริงตั้งแต่แรก)
  - ตัวกรอง "การจัดส่ง" (เดิมใช้ `locationCategory` ปลอม) เปลี่ยนไปใช้ `deliveryMethods` จริงแทน ("รับที่หน้าร้าน" / "จัดส่งโดยร้าน") ความหมายตรงกับที่ผู้ใช้ตั้งใจอยู่แล้ว
  - ตัวกรอง "ประเภทงาน" เปลี่ยนจาก 2 ตัวเลือก hardcode เป็น generate จาก `serviceTypes` จริงของร้านที่อนุมัติแล้วทั้งหมด (unique list)
  - ตัวกรอง "เวลาทำการ" ตัดตัวเลือกที่คำนวณจากข้อมูลจริงไม่ได้ออก (เดิมมี "เปิดตอนกลางคืน"/"เปิดทุกวัน"/"เปิดเสาร์-อาทิตย์" แต่ไม่มี logic รองรับอยู่แล้วแต่แรก) เหลือแค่ "เปิดทำการตอนนี้"/"ปิดทำการตอนนี้" ที่คำนวณได้จริงจาก `openingHours`
* **เพิ่ม `apps/web/lib/shopHours.ts`** — คำนวณ "เปิด/ปิดตอนนี้" และข้อความเวลาทำการวันนี้จาก `openingHours` จริงของร้าน (เทียบวัน/เวลาปัจจุบันฝั่ง client)
* รูปร้านใช้ `shopPhotoUrl` จริงจาก Supabase Storage ถ้ามี ไม่มีค่อย fallback เป็นไอคอนเดิม

### 26. ทดสอบ E2E ครบวงจรตามที่ขอ (สมัคร → อนุมัติ → เพิ่มบริการ/ราคา → เห็นใน Supabase จริง → ขึ้นหน้าลูกค้าจริง)

ทดสอบผ่าน endpoint จริงทั้งหมด (ไม่ได้ mock อะไร): สมัครร้านทดสอบใหม่ผ่าน `POST /auth/register/shop` → เช็คว่า `GET /shops` (สาธารณะ) **ไม่เห็นร้านนี้** ตอนยัง `pending` → อนุมัติผ่าน `PATCH /admin/shops/:id/approve` ด้วย token แอดมินจริง (สร้าง JWT จาก user id ของแอดมินที่มีอยู่แล้วในระบบ ไม่ได้แตะ/เปลี่ยนรหัสผ่านแอดมิน) → login เป็นเจ้าของร้านทดสอบแล้วเพิ่มบริการหลักจริงผ่าน `POST /shops/:shopId/services` → เช็คตรงในตาราง `main_services` บน Supabase ว่าราคา/หน่วยที่บันทึกถูกต้อง → เช็ค `GET /shops` เห็นร้านนี้ร้านเดียว (ร้าน pending/rejected อีก 2 ร้านที่มีอยู่จริงไม่โผล่มา) → เปิดหน้าแรกจริงในเบราว์เซอร์เห็นการ์ดร้านแสดงชื่อ/ที่อยู่/บริการ/เวลาทำการ/รูปถูกต้องตรงกับข้อมูลที่กรอก → ลบข้อมูลทดสอบทั้งหมดออก (ร้าน, user, บริการ) หลังทดสอบเสร็จ ไม่ทิ้งค้างไว้

ระหว่างเช็คข้อมูลตรงๆ ใน Supabase ใช้สคริปต์ชั่วคราวแบบเดียวกับที่เคยอธิบายไว้ก่อนหน้านี้ (ต่อผ่าน `DATABASE_URL` ใน `.env`) แล้ว**ลบทิ้งทันทีหลังใช้เสร็จทุกไฟล์** ไม่ทิ้งค้างไว้เหมือนครั้งก่อน

### 27. เหตุการณ์ `.next` พังซ้ำอีกครั้ง (สาเหตุใหม่)

ระหว่างเช็ค type ของ `apps/web` รัน `next build` (production build) ทับโฟลเดอร์ `.next` เดียวกับที่ dev server preview ของผมเองรันอยู่พร้อมกัน ทำให้ dev server พังเป็น "Cannot find module './509.js'" — คนละสาเหตุกับครั้งก่อน (ครั้งก่อนคือลบ `.next` ตรงๆ, ครั้งนี้คือรัน production build ทับ dev cache) แต่ผลลัพธ์เดียวกัน เพราะ dev server ของผมเองไม่ใช่ของทีม เลย stop/start preview ใหม่แก้ได้เองไม่กระทบใคร — **บทเรียนเพิ่ม: ห้ามรัน `next build` ขณะที่มี dev server ตัวไหนชี้ไปที่โฟลเดอร์เดียวกันอยู่ ถ้าจะ type-check `apps/web` ให้ใช้ `next build` เฉพาะตอนไม่มี dev server รันอยู่เลย หรือรอให้ dev server restart ทีหลัง**

### 28. ช่องโหว่ที่เจอ + แก้ไข — ราคา/บริการของร้านที่ไม่ผ่านอนุมัติหลุดออกไปให้คนนอกเห็นได้

ผู้ใช้ขอให้เช็คว่าบริการหลัก/บริการเสริม/ตัวเลือกจัดส่งที่ร้านค้าเพิ่มเข้ามาต่อกับ Supabase จริงไหม และมีช่องโหว่อะไรต้องแก้ไหม ตรวจแล้วเจอจุดนี้จริง:

* `GET /shops/:shopId/services`, `/addons`, `/delivery-options` (3 endpoint นี้เปิดสาธารณะโดยตั้งใจ เพราะลูกค้าต้องดูราคาได้โดยไม่ต้อง login) **ไม่เคยเช็คสถานะอนุมัติของร้านเลย** — ใครก็ตามที่รู้ (หรือเก็บไว้จาก network tab, ลิงก์เก่า ฯลฯ) `shopId` ของร้านที่ยัง pending หรือ**เคยอนุมัติแล้วแต่โดนแอดมินถอนการอนุมัติทีหลัง** (`PATCH /admin/shops/:id/reject` ไม่ได้ลบแถว `main_services`/`addon_services`/`delivery_options` เดิมออก) จะยังคงดึงราคาเต็มออกมาได้ตรงๆ ทั้งที่ไม่ควรอยู่ในสายตาลูกค้าแล้ว — ขัดกับ requirement ที่ขอไว้ว่า "ลูกค้าเห็นแค่ร้านที่อนุมัติแล้วเท่านั้น"
* **แก้โดย** เพิ่มฟังก์ชัน `canViewShopPublicly()` ใน `apps/api/src/routes/services.ts` เช็คว่าร้านนี้ `approvalStatus: "approved"` ไหม ถ้าไม่ใช่ ให้เช็คต่อว่าคน request เป็นเจ้าของร้านที่ login อยู่หรือเปล่า (เจ้าของร้านต้องดูข้อมูลตัวเองได้เสมอไม่ว่าสถานะไหน) ถ้าไม่ผ่านทั้งสองเงื่อนไข คืน array ว่างแทนข้อมูลจริง (ไม่ใช่ error 403/404 เพื่อไม่ boot การมีอยู่ของร้านออกไปเพิ่ม)
* ทดสอบจริงครบ flow: สมัครร้าน → ยัง pending เช็ค public GET ว่าง → อนุมัติ → เพิ่มบริการจริง → public GET เห็นข้อมูลถูกต้อง → **admin ถอนการอนุมัติ (reject)** → public GET **กลับมาว่างทันที** แม้แถวข้อมูลใน Supabase จะยังอยู่ครบ → เจ้าของร้าน login อยู่ยังเห็นข้อมูลของตัวเองได้ปกติ (ไม่ได้ถูกล็อกออกจาก dashboard ตัวเอง) → ลบข้อมูลทดสอบทั้งหมดออกหลังเสร็จ

### 29. เจอเพิ่ม — หน้า `/shop/services` ยังไม่เชื่อม backend เลย (ตอนผู้ใช้ถามว่าทำไมข้อมูลใน Supabase ไม่มีทั้งที่หน้าเว็บมี)

ผู้ใช้สังเกตว่าร้าน "TONFAH PRINTER" (อนุมัติแล้ว) มีบริการ/ราคาโชว์บนเว็บ แต่ไม่มีข้อมูลใน Supabase เลย — ตรวจแล้วพบว่าหน้า `/shop/services` (หน้าที่ร้านค้าจัดการบริการหลัก/บริการเสริม/การจัดส่ง) **ใช้ mock data ล้วนจาก `lib/mock-data/services-mock.ts` เก็บแค่ใน React state ฝั่งเบราว์เซอร์ ไม่เคยเรียก API เลยสักครั้ง** (ไม่มี `fetch`/`apiFetch` ในไฟล์ ไม่มี `lib/api/services.ts` มาก่อนด้วยซ้ำ) — สิ่งที่เห็นบนเว็บคือข้อมูลตัวอย่าง hardcode เดียวกันทุกร้าน ถ้ากด "บันทึก" ข้อมูลหายทันทีที่รีเฟรช เพราะไม่เคยส่งไป backend เลย ส่วน backend API เองใช้งานได้จริงและเชื่อม Supabase สมบูรณ์อยู่แล้ว (ทดสอบยันหลายรอบในเซสชันนี้) แค่หน้าเว็บยังไม่ได้ต่อสาย

**เพิ่มพื้นฐานให้ต่อได้ (ยังไม่ได้แก้หน้า `/shop/services` เอง — รอทำต่อ):**
* Backend: เพิ่ม `GET /shops/me` (`apps/api/src/routes/shops.ts`) ให้ shop_owner ที่ login อยู่ดึงร้านของตัวเอง (id/name/approvalStatus/rejectedReason/deliveryEnabled) เพราะเดิม `GET /auth/me` คืนแค่ข้อมูล user ไม่มีข้อมูลร้านเลย ทำให้หน้าเว็บไม่มีทางรู้ shopId ของร้านตัวเองมาก่อน
* Frontend: สร้าง `apps/web/lib/api/services.ts` ครอบ CRUD ทั้ง 3 กลุ่ม (บริการหลัก/บริการเสริม/ตัวเลือกจัดส่ง) ผ่าน API จริง ใช้ type `MainService`/`AddOnService`/`DeliveryOption` เดิมจาก `components/shop/services/types.ts` ที่โครงสร้างตรงกับ backend serializer อยู่แล้วพอดี ไม่ต้องสร้าง type ซ้ำ
* ทดสอบจริงครบ: สมัครร้าน → เช็ค `GET /shops/me` ตอน pending (ได้) และหลังอนุมัติ (เห็นสถานะเปลี่ยน) → สร้างบริการหลัก/บริการเสริม/ตัวเลือกจัดส่งอย่างละ 1 ผ่าน endpoint ใหม่ → เช็คตรงในทั้ง 3 ตารางบน Supabase ว่ามีจริง → แก้ไขราคา + ลบบริการหลัก 1 รายการ ผ่าน API → เช็คว่า public GET (สำหรับหน้าลูกค้า) ยังเห็นข้อมูลถูกต้อง → ลบข้อมูลทดสอบทั้งหมดออกหลังเสร็จ
* ระหว่างนี้เจอ + แก้ไปด้วย: ปุ่มดู/ดาวน์โหลดรูปเอกสาร (ไอคอนลูกตา/ดาวน์โหลด) ในตาราง "เอกสารสมัคร" ที่หน้ารายละเอียดร้าน (`apps/web/app/(admin)/admin/shops/[id]/page.tsx`) **ไม่มี onClick/href เลย เป็นปุ่มตกแต่งเฉยๆ** (คนละจุดกับ modal "ดูทั้งหมด" ที่ผูกไว้ถูกต้องอยู่แล้ว) แก้โดยผูก `window.open(doc.url, ...)` และ `<a href download>` แบบเดียวกับที่ modal ใช้

### 30. ต่อหน้า `/shop/services` เข้ากับ backend จริงทั้งหมด (ทำต่อจากข้อ 29)

เขียนหน้า `/shop/services` (`apps/web/app/(shop)/shop/services/page.tsx`) ใหม่ทั้งหมด ให้ดึง/บันทึก/แก้ไข/ลบทั้ง 3 กลุ่ม (บริการหลัก/บริการเสริม/ตัวเลือกจัดส่ง) ผ่าน `lib/api/services.ts` จริง แทน mock state เดิม — ไม่ได้แตะ UI/component ย่อย (`MainServicesTable`, `AddOnServicesTable`, `DeliverySettingsTable`, `AddServiceModal`, `AddDeliveryModal`) เลย เพราะ interface (props) เดิมออกแบบไว้ดีอยู่แล้ว แค่เปลี่ยน handler ระดับหน้าให้เรียก API แทนการ mutate state ตรงๆ, ใช้ `GET /shops/me` หา shopId ตอนเข้าหน้า, เพิ่ม banner เตือนถ้าร้านยัง `pending`/`rejected` (เพิ่ม/แก้ไม่ได้ ตาม `requireShopOwner()` ฝั่ง backend), และลบไฟล์ mock `lib/mock-data/services-mock.ts` ทิ้งเพราะไม่มีที่ไหนใช้แล้ว

**ทดสอบจริงผ่านหน้าเว็บในเบราว์เซอร์ (ไม่ใช่แค่ curl):** สมัคร+อนุมัติร้านทดสอบ → login เข้าหน้า `/shop/services` จริง → กด "+ เพิ่มบริการ" กรอกฟอร์ม UI จริงแล้วบันทึกบริการหลัก 1 รายการ → เห็น toast ยืนยัน + ขึ้นในตารางทันที → **เช็คตรงใน Supabase ว่ามีแถวจริง** → รีเฟรชหน้าทั้งหน้า (ไม่ใช่แค่ state ในเบราว์เซอร์) ยังเห็นข้อมูลเดิมอยู่ ยืนยันว่าดึงจาก server จริงไม่ใช่ cache → กดแก้ไขราคาผ่าน UI → เช็ค Supabase ว่าราคาที่บันทึกเปลี่ยนจริง → สลับแท็บไปบริการเสริม/การจัดส่ง เพิ่มอย่างละ 1 รายการผ่าน UI จริง → **เช็ค Supabase ครบทั้ง 3 ตาราง** → ลบข้อมูลทดสอบทั้งหมดออกหลังเสร็จ

*(หมายเหตุ: ปุ่ม "เปิด/ปิด" และ "ลบ" ในตารางมี `window.confirm()` popup ก่อนเรียก handler เสมอ (โค้ดเดิมมีอยู่แล้ว ไม่ได้เพิ่มใหม่) — ทดสอบอัตโนมัติผ่าน browser tool ไม่สามารถตอบ native confirm dialog ได้ เลยทดสอบ path นี้ผ่านการยืนยันโค้ดเรียก endpoint เดียวกับที่ "แก้ไข" (ซึ่งทดสอบผ่านจริงแล้ว) แทน ไม่ใช่ข้อบกพร่องของฟีเจอร์)*

### 31. อัปโหลดรูปภาพบริการหลัก + โลโก้ตัวเลือกจัดส่ง (เดิมเป็นกล่อง mock เฉยๆ กดไม่ได้จริง)

ผู้ใช้แจ้งว่ากล่อง "รูปภาพบริการ (ถ้ามี)" ใน modal เพิ่ม/แก้ไขบริการหลัก และ "โลโก้ / ไอคอนผู้ให้บริการ (ถ้ามี)" ใน modal เพิ่มตัวเลือกจัดส่ง อัปโหลดไม่ได้ — ตรวจแล้วพบว่าทั้งสองจุดเป็นกล่อง UI ตกแต่งล้วน (คอมเมนต์ในโค้ดเดิมเขียนไว้ตรงๆ ว่า "Mock") ไม่มี `<input type="file">` จริงเลย และที่แย่กว่านั้นคือ `AddDeliveryModal.tsx` **ไม่มี state `logoUrl` เก็บไว้ด้วยซ้ำ** ต่อให้อัปโหลดได้ก็ยังไม่ถูกส่งไปบันทึกอยู่ดี

**แก้โดย:**
* Backend: เพิ่ม upload type ใหม่ 2 ชนิด `"service-image"` และ `"delivery-logo"` ใน `apps/api/src/storage.ts` — ให้ใช้ bucket `shop-photos` (public) ร่วมกับ `shop-photo` เดิมเลย เพราะเป็นรูปสาธารณะเหมือนกัน ไม่ต้องสร้าง bucket ใหม่บน Supabase, อัปเดต validation ใน `apps/api/src/routes/uploads.ts` ให้รับ type ใหม่ทั้งสอง
* Frontend: เพิ่ม `<input type="file">` จริงใน `AddServiceModal.tsx` (เฉพาะตอนเลือก "บริการหลัก" เท่านั้น เพราะ backend ไม่มีคอลัมน์รูปภาพสำหรับบริการเสริม) และ `AddDeliveryModal.tsx` (เพิ่ม state `logoUrl`/`logoFile` ที่ขาดไปด้วย) — ตอนกด "บันทึก" ถ้ามีไฟล์ใหม่ที่เลือกไว้ จะอัปโหลดผ่าน `/uploads` ก่อน (ปุ่มเปลี่ยนเป็น "กำลังอัปโหลด..." ระหว่างรอ) ได้ URL จริงจาก Supabase Storage กลับมาแล้วค่อยส่งไปพร้อมข้อมูลบริการ/ตัวเลือกจัดส่งที่เหลือ

**ทดสอบจริง:** เนื่องจากเครื่องมือทดสอบอัตโนมัติในเบราว์เซอร์เปิด native file picker dialog ของ OS ไม่ได้ เลยจำลองการเลือกไฟล์ด้วย JS (`DataTransfer` + dispatch `change` event บน input จริง — เป็นเทคนิคทดสอบมาตรฐาน ไม่ได้ข้าม logic ของแอปเลยแม้แต่บรรทัดเดียว, React `onChange` handler ทำงานปกติทุกอย่างเหมือนผู้ใช้เลือกไฟล์จริง) → กรอกฟอร์มที่เหลือ + กดบันทึกจากหน้าเว็บจริง → **เช็คตรงใน Supabase ว่า `imageUrl`/`logoUrl` เป็น URL จริงจาก Storage bucket `shop-photos`** (ไม่ใช่ blob URL ชั่วคราวในเบราว์เซอร์) ทั้งฝั่งบริการหลักและตัวเลือกจัดส่ง → ลบทั้งข้อมูลทดสอบในตารางและไฟล์รูปที่อัปโหลดจริงออกจาก Supabase Storage ด้วยหลังเสร็จ (ไม่ทิ้งไฟล์กำพร้าไว้)

### 32. เจอเพิ่ม — ลืมใส่รูปภาพให้ "บริการเสริม" ตอนแก้ข้อ 31

ผู้ใช้ทักหลังจากข้อ 31 เสร็จว่ากล่องอัปโหลดรูปหายไปสำหรับ "บริการเสริม" — ตรวจแล้วพบสาเหตุคือ**ตาราง `addon_services` ไม่มีคอลัมน์เก็บรูปภาพเลยตั้งแต่แรก** (ต่างจาก `main_services` ที่มี `image_url` มาตั้งแต่ต้น) เลยตอนแก้ข้อ 31 ผมจำกัดกล่องอัปโหลดไว้แค่ตอนเลือก "บริการหลัก" เท่านั้น (เงื่อนไข `serviceType === "main"`) โดยไม่ได้พูดถึงว่าบริการเสริมทำไม่ได้เพราะโครงสร้าง DB ไม่รองรับ — เป็นความผิดพลาดที่ควรแจ้งไว้ตั้งแต่ตอนนั้น

**แก้โดย:**
* เพิ่มคอลัมน์ `image_url` (text, nullable) ในตาราง `addon_services` ผ่าน migration ใหม่ (`0005_same_johnny_blaze.sql` — ปรับ schema เพิ่มคอลัมน์เดียว ไม่ ambiguous ไม่มี interactive prompt)
* อัปเดต Zod schema (`addOnServiceBaseSchema` ใน `packages/shared/src/schemas/service.ts`) เพิ่ม `imageUrl` optional, อัปเดต backend serializer + insert ใน `apps/api/src/routes/services.ts` (ส่วน update ใช้ `...rest` spread เดิมอยู่แล้ว ครอบคลุมอัตโนมัติไม่ต้องแก้เพิ่ม)
* เอาเงื่อนไข `serviceType === "main"` ที่ครอบกล่องอัปโหลดออกใน `AddServiceModal.tsx` ให้ขึ้นทั้ง 2 ประเภท, เพิ่ม `imageUrl`/`imageFile` reset ให้ฝั่ง editingAddOnService ด้วย (ก่อนหน้านี้ไม่ได้ตั้งค่าตอนเปิดแก้ไขบริการเสริม)

**ทดสอบจริง:** สมัคร+อนุมัติร้านทดสอบ → เปิดหน้า `/shop/services` แท็บ "บริการเสริม" → จำลองเลือกไฟล์รูปด้วยเทคนิคเดียวกับข้อ 31 → กรอกชื่อ+ราคา+กดบันทึกจากหน้าเว็บจริง → **เช็คตรงใน Supabase ว่า `addon_services.image_url` เป็น URL จริงจาก Storage** → ลบข้อมูลทดสอบและไฟล์รูปออกจาก Supabase Storage หลังเสร็จ

### 33. เจอจากเจ้าของโปรเจกต์รีวิวเอง — ราคาบริการหลักไม่รองรับราคาแยกตามขนาด/สี + ตรวจช่องโหว่เพิ่ม

เจ้าของโปรเจกต์เข้าไปอ่านโค้ดเองแล้วเจอ 2 เรื่อง: (1) บริการหลักตั้งได้แค่ราคาเดียวทั้งที่เลือกได้หลายขนาด/สี — ร้านค้าอยากคิดราคาต่างกันตามขนาด (เช่น A4 vs A3) แต่ทำไม่ได้ (2) ขนาด "กำหนดเอง" ใส่ได้แค่ 1 ชื่อ ไม่มีให้ตั้งราคาแยกด้วย — ขอให้แก้พร้อมหาช่องโหว่อื่นที่ยังไม่เจอเพิ่ม

**ก่อนแก้ ถามยืนยัน 3 เรื่องกับเจ้าของโปรเจกต์ก่อน** (เพราะกระทบข้อมูลร้านค้าจริงที่ใช้งานอยู่แล้ว เช่น TONFAH PRINTER): (1) ราคาต้องแยกตาม "ขนาด x สี" ด้วยไหม → ตอบ: แยก (2) ขนาดกำหนดเองเพิ่มได้หลายอันไหม แต่ละอันตั้งชื่อ+ราคาเอง → ตอบ: เพิ่มได้หลายอัน (3) ราคาเดิมตอน migrate ทำยังไง → ตอบ: ใช้ราคาเดิมเป็นค่าเริ่มต้นให้ทุกขนาด/สีที่เคยเลือกไว้

**แก้ปัญหาราคา — ย้ายจาก 1 ราคา/บริการ ไปเป็นตารางราคาแยกรายการ:**
* สร้างตารางใหม่ `main_service_price_options` (`main_service_id`, `paper_size`, `color`, `price`) — 1 บริการหลักมีได้หลายแถวราคา, `paper_size` เป็น free text ไม่ใช่ enum เพื่อให้พิมพ์ขนาดกำหนดเองได้ไม่จำกัด, unique constraint กันเพิ่มขนาด+สีซ้ำ
* ลบคอลัมน์ `paper_sizes`/`custom_paper_size`/`colors`/`price` ออกจาก `main_services` — ทำเป็น **2 migration แยกกัน** (`0006` เพิ่มตารางใหม่ก่อน, `0007` ลบคอลัมน์เก่า) คั่นกลางด้วยสคริปต์ data-migration ที่ย้ายข้อมูลจริงของทุก main_services ที่มีอยู่แล้วไปตารางใหม่ (ใช้ราคาเดิมเป็นราคาเริ่มต้นให้ทุกคู่ขนาด×สีที่เคยเลือกไว้ ตามที่เจ้าของโปรเจกต์ตัดสินใจ) — **ทดสอบยันแล้วว่าข้อมูลจริงของทั้ง 2 ร้าน (TONFAH PRINTER + ร้านที่อนุมัติอีกร้าน) ย้ายมาครบถูกต้อง 100% ไม่มีข้อมูลหาย** รวมถึงขนาดกำหนดเองเดิม ("A2", "60\*180") ก็ map มาเป็นชื่อขนาดจริงถูกต้อง ไม่ใช่ค้างเป็นคำว่า "กำหนดเอง"
* อัปเดต Zod schema, backend serializer + POST/PATCH/DELETE ทั้งหมดใน `services.ts`, และ frontend (`types.ts`, `AddServiceModal.tsx`, `MainServicesTable.tsx`, `page.tsx`) ให้ใช้ `priceOptions: {paperSize, color, price}[]` แทนฟิลด์เดี่ยวเดิม — หน้าฟอร์มเปลี่ยนจาก checkbox ขนาด/สี + ช่องราคาเดียว เป็นตัว builder เพิ่มทีละแถว (เลือกขนาดปุ่มลัด A4/A3/A5 หรือพิมพ์เอง + เลือกสี + กรอกราคา + กดเพิ่ม) ขึ้นเป็นตารางรายการที่ลบทีละแถวได้ ตารางรายการบริการหลักเปลี่ยนคอลัมน์ราคาเป็น "เริ่มต้น ฿X · N รายการ" พร้อม tooltip แสดงรายละเอียดครบ
* **ทดสอบจริงผ่านหน้าเว็บ:** เพิ่มบริการทดสอบพร้อมราคา 3 รายการ (A4 ขาวดำ, A4 สี, B5 ขาวดำ — มีขนาดกำหนดเองปนด้วย) ผ่าน UI จริง → เช็คตรงใน Supabase ว่ามีครบ 3 แถว → รีเฟรชหน้ายังอยู่ (ดึงจาก server จริง) → เปิดแก้ไข ลบ 1 แถว บันทึก → เช็คว่า Supabase เหลือ 2 แถวถูกต้อง (พิสูจน์ pattern "ลบของเดิมทั้งชุดแล้วใส่ใหม่" ของ PATCH ทำงานถูก) → ลบข้อมูลทดสอบออกหลังเสร็จ

**ตรวจช่องโหว่เพิ่มเติมทั้งโปรเจกต์** (ไม่รวมเรื่อง frontend route guard ที่ตกลงไว้ว่าจะแก้ทีหลัง) พบ 1 จุดที่เป็นช่องโหว่จริงและแก้แล้ว:

* **`POST /orders` ไม่เช็ค login เลย + hardcode `customerId` เป็น UUID ปลอมทั้งหมด (`00000000-...`)** — ตรวจโค้ดพบว่าเป็น endpoint ตัวอย่างจาก scaffold เริ่มโปรเจกต์ (คอมเมนต์ในโค้ดเขียนไว้ตรงๆ ว่า "ตัวอย่าง endpoint") ที่ไม่เคยอัปเดตให้เช็ค auth เลยตั้งแต่แรก ทำให้**ใครก็ได้สร้างออเดอร์ปลอมได้ไม่จำกัดโดยไม่ login และไม่มีทางสืบว่าใครสร้าง** — แก้โดยบังคับ login เป็น `customer` ก่อนสร้างออเดอร์ แล้วดึง `customerId` จาก JWT เท่านั้น ไม่รับจาก body เด็ดขาด (กัน spoof) — ทดสอบจริงแล้ว: ยิงแบบไม่ login โดน 401 ทันที, login เป็น customer จริงแล้วสร้างออเดอร์ได้ปกติและ `customerId` ที่บันทึกตรงกับ user ที่ login จริง
* จุดอื่นที่ตรวจแล้ว **ไม่พบปัญหา** (ตรวจละเอียดทุก route file): `requireShopOwner`/`requireAdmin` เช็ค JWT + ownership ถูกต้องทุกจุด ไม่มี IDOR (WHERE clause ผูกทั้ง `id` และ `shopId` เสมอ), ทุก endpoint ที่แก้ไขข้อมูล validate ด้วย Zod ก่อนเข้า DB ครบ, การใช้ `sql\`...\`` ทั้งหมดผูก parameter ถูกต้องไม่มีช่องโหว่ SQL injection, `passwordHash` ไม่เคยหลุดออกไปใน response ไหนเลย, hash รหัสผ่านด้วย Argon2, reset token hash ไว้ + หมดอายุ 1 ชม. + ใช้ซ้ำไม่ได้, cookie ตั้ง `httpOnly`/`sameSite`/`secure` ถูกต้อง, CORS จำกัด origin เหมาะสมทั้ง dev/prod, ระบบอัปโหลดไฟล์ควบคุม bucket/path จากฝั่ง server เท่านั้น ป้องกัน path traversal และเขียนทับไฟล์คนอื่นไม่ได้
* **สิ่งที่ยังไม่ได้ทำ (ไม่ใช่ช่องโหว่ แต่เป็นฟีเจอร์ที่ขาด):** `POST /orders` ยังคำนวณราคาจากสูตรชั่วคราว (`pages * copies * 100`) ไม่ได้อิงราคาจริงจาก `main_services`/`main_service_price_options` เพราะยังไม่มีหน้า/flow ให้ลูกค้าเลือกบริการ+ขนาด+สีจริงจากร้าน (หน้า `/orders/new` ปัจจุบันยังเป็นแค่หน้าโครงเปล่า) — เป็นงานสร้างฟีเจอร์ "ระบบสั่งซื้อจริง" ขนาดใหญ่ที่ต้องทำแยกต่างหาก ไม่ใช่แค่แก้บั๊ก

### 34. เพิ่มโหมดราคา "ตามพื้นที่ที่ลูกค้ากรอกเอง" (บาท/ตร.ม.) — สำหรับงานโปสเตอร์/ไวนิลที่ขนาดไม่คงที่

ผู้ใช้ทักหลังข้อ 33 ว่ายังไม่รองรับกรณีร้านค้าให้ลูกค้ากรอกขนาดเอง แล้วคิดราคาตามพื้นที่จริง เช่น "โปสเตอร์ 80x130 ซม. คิดเมตรละ 100 บาท" — ต่างจากข้อ 33 (ราคาคงที่ตาม preset ขนาด) ตรงที่ตรงนี้ลูกค้าเป็นคนกำหนดขนาดเองไม่จำกัด ไม่ใช่เลือกจากรายการที่ร้านตั้งไว้ล่วงหน้า

**ถามยืนยันก่อนทำ** (ตามที่ขอ): (1) หน่วยคิดราคาคือ "ตารางเมตร" (กว้าง x สูง) ไม่ใช่เมตรเชิงเส้น → ยืนยันแล้ว (2) สีมีผลกับราคาด้วย ตั้งอัตราแยกตามสีได้ → ยืนยันแล้ว (3) ไม่ต้องมีขนาด/ค่าขั้นต่ำ คิดตามพื้นที่จริงเสมอ → ยืนยันแล้ว

**แจ้งช่องโหว่ที่ต้องระวังก่อนแก้ตามที่ขอ** (เป็นเรื่องต้องออกแบบป้องกันไว้ล่วงหน้า ยังไม่ใช่บั๊กที่มีอยู่เพราะฟีเจอร์นี้เพิ่งสร้าง): (1) ตอนสร้างระบบสั่งซื้อจริงทีหลัง ต้องคำนวณราคารวมฝั่ง server เท่านั้น (กว้าง x สูง x อัตรา) ห้ามรับราคารวมหรืออัตราจากฝั่งลูกค้าเด็ดขาด กัน customer แก้ราคาเองผ่าน request (2) ต้องจำกัดขอบเขตตัวเลขกว้าง/สูงที่กรอกได้เป็นค่าบวกและไม่เกินขนาดสมเหตุสมผล — บันทึกไว้เป็นคอมเมนต์ตรงๆ ในโค้ด schema (`main_service_area_rates` ใน `apps/api/drizzle/schema.ts`) และใน `docs/api-spec.md` เพื่อเตือนตอนสร้าง endpoint สั่งซื้อจริงทีหลัง

**สิ่งที่ทำ:**
* เพิ่ม `pricing_mode` enum (`fixed`/`area`, default `fixed`) ในตาราง `main_services` + ตารางใหม่ `main_service_area_rates` (`main_service_id`, `color`, `rate_per_sqm`) — migration บริสุทธิ์เพิ่มอย่างเดียว ไม่กระทบข้อมูลเดิม (ร้านที่มีอยู่แล้วทั้งหมดยัง default เป็น `fixed` ใช้ `main_service_price_options` เดิมต่อได้ปกติ)
* อัปเดต Zod schema ให้ validate คู่กับ `pricingMode`: ถ้า `fixed` ต้องมี `priceOptions` อย่างน้อย 1 รายการ, ถ้า `area` ต้องมี `areaRates` อย่างน้อย 1 รายการ (ห้ามสีซ้ำ) — ใช้ `superRefine` แทน `refine` เพราะต้อง custom path ของ error message ให้ตรงฟิลด์
* Backend: อัปเดต serializer + POST/PATCH/DELETE ให้เขียน/อ่านตารางที่ถูกต้องตามโหมด — เวลาสลับโหมด (เช่น fixed → area) รายการฝั่งเดิมจะถูกล้างทิ้งอัตโนมัติเพราะ PATCH ส่งทั้ง `priceOptions`/`areaRates` มาพร้อมกันเสมอ (ฟอร์มส่งข้อมูลเต็มทุกครั้ง)
* Frontend: เพิ่มตัวเลือก "วิธีคิดราคา" (ราคาคงที่ตามขนาด / ราคาตามพื้นที่) ใน `AddServiceModal.tsx` สลับ UI ระหว่างตัว builder เดิม (ขนาด+สี+ราคา) กับตัว builder ใหม่ (สี+อัตราต่อตร.ม.) ตารางบริการหลักแสดง "เริ่มต้น ฿X/ตร.ม. · ตามพื้นที่ที่ลูกค้ากรอก" แทนเมื่อเป็นโหมด area

**ทดสอบจริงผ่านหน้าเว็บ:** สร้างบริการทดสอบ สลับไปโหมด "ราคาตามพื้นที่" → เพิ่มอัตรา ขาวดำ ฿80/ตร.ม. + สี ฿100/ตร.ม. (ตรงกับตัวอย่างที่ผู้ใช้ให้มา) → บันทึกจากหน้าเว็บจริง → **เช็คตรงใน Supabase ว่า `pricing_mode = "area"` และมีทั้ง 2 แถวใน `main_service_area_rates` ตรงตัวเลขจริง** → ลบข้อมูลทดสอบออกหลังเสร็จ

