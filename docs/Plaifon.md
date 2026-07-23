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

