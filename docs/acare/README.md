# EasyPrint Development Summary (Acare)

เอกสารสรุปความคืบหน้าการทำงาน ส่วนของโค้ดที่เขียน ฟีเจอร์ที่สำเร็จ ปัญหาที่พบ และคู่มือสำหรับเพื่อนร่วมทีมเมื่อทำการดึงโค้ด (Pull) ไปพัฒนาต่อ

---

## 1. ฟีเจอร์ที่ทำเสร็จแล้ว (Features Implemented)

### 📌 หน้าสมัครสมาชิก (Register Page)
*   **ไฟล์ที่สร้าง/แก้ไข:** [apps/web/app/(auth)/register/page.tsx](file:///d:/EasyPrint_webapp/apps/web/app/(auth)/register/page.tsx)
*   **รายละเอียดฟีเจอร์:**
    *   หน้าจอดีไซน์แบบการ์ดจัดวางกึ่งกลางหน้าจอ (Centered Card Layout) คลีน ทันสมัยสไตล์ Stripe/Notion
    *   มีแถบกดเลือกประเภทบัญชี (👤 ลูกค้า vs 🏪 เจ้าของร้านค้า) ทำงานด้วย React State
    *   ลบระบบโซเชียลล็อกอิน (Google / Apple) ออกตามข้อกำหนด
    *   เปลี่ยนภาษาของหัวข้อเป็นภาษาไทยทั้งหมด (ข้อมูลบัญชี, ข้อมูลส่วนตัว, ข้อตกลงทางกฎหมาย)
    *   เปลี่ยนคำระบุความปลอดภัยและช่องกรอกที่อยู่เป็น **"(ไม่บังคับ)"**
    *   ระบบตรวจสอบความปลอดภัยของรหัสผ่าน (Password Strength Indicator) ปรับระดับสีและความแรงแบบไดนามิก (น้อย: แดง 🔴, ปานกลาง: ส้ม 🟡, สูง: ฟ้า 🟢)
    *   ช่องเบอร์โทรแสดง Placeholder รูปแบบ `0XX-XXX-XXXX`
    *   ปุ่มกดสมัครสมาชิกจะ **ปิดการใช้งาน (Disabled)** อัตโนมัติ จนกว่าจะกรอกข้อมูลครบถ้วน ถูกต้อง และติ๊กยอมรับข้อกำหนดกฎหมาย (PDPA) ครบ 2 ช่อง

### 📌 หน้าเข้าสู่ระบบ (Login Page)
*   **ไฟล์ที่สร้าง/แก้ไข:** [apps/web/app/(auth)/login/page.tsx](file:///d:/EasyPrint_webapp/apps/web/app/(auth)/login/page.tsx)
*   **รายละเอียดฟีเจอร์:**
    *   หน้าจอดีไซน์แบบแบ่งสองฝั่งซ้าย-ขวา (Split Screen Layout) 
    *   **ฝั่งซ้าย (Hero):** เฉดสีตามโทนสีส้ม-ฟ้า-ชมพู มีลูกเล่นทรงกลม 3 มิติต่างขนาดลอยขยับช้าๆ (Floating Spheres) พื้นผิวตารางกริต ไมโครเทกเจอร์ และกล่องแสดงสถานะจำลองการพิมพ์เอกสารจริง ("กำลังพิมพ์เอกสาร... 85%") ที่ลอยนิ่งสวยงาม โชว์คำว่า **EasyPrint** เด่นชัดด้วยการไล่ระดับสีข้อความ
    *   **ฝั่งขวา (Form):** ฟอร์มล็อกอินเรียบหรู ใช้ไอคอนเวกเตอร์ SVG นำหน้าช่องรหัสผ่านและชื่อผู้ใช้แทนการใช้อิโมจิ
    *   มีปุ่มกดเปิด/ปิดการแสดงรหัสผ่าน ("แสดง" / "ซ่อน")
    *   มีกล่องติ๊กเลือก "จดจำฉันไว้" (Remember Me) ที่ผู้ใช้สามารถเลือกติ๊กหรือไม่ติ๊กก็ได้ (ไม่บังคับกดส่งฟอร์ม)
    *   ลบข้อความส่วนข้อมูลคุ้มครองความปลอดภัย PDPA ส่วนท้ายสุดออกตามดีไซน์ที่ต้องการ

### 📌 ปุ่มโปรไฟล์ฝั่งหน้าหลักลูกค้า (Customer Layout)
*   **ไฟล์ที่แก้ไข:** [apps/web/app/(customer)/layout.tsx](file:///d:/EasyPrint_webapp/apps/web/app/(customer)/layout.tsx)
*   **รายละเอียดฟีเจอร์:**
    *   เพิ่มปุ่มไอคอนรูปคน (User Avatar SVG) ที่มุมขวาบนของแถบนำทาง (Navbar) เพื่อลิงก์ไปหน้าเข้าสู่ระบบ `/login`

---

## 2. คำสั่งแพ็คเกจที่ติดตั้งเพิ่มเติม (Commands & Packages)

*   **สิ่งที่ติดตั้ง:** ได้รันการติดตั้งไลบรารีและแพ็คเกจการทำงานเริ่มต้นทั้งหมดในระดับ Root ของ Monorepo แล้ว
*   **สิ่งที่เพื่อนร่วมทีมต้องพิมพ์หลังดึงโค้ด (Pull):**
    เพื่อป้องกันปัญหาหาเครื่องมือหรือแพ็คเกจไม่เจอ เพื่อนร่วมทีมต้องเปิด Terminal ในโฟลเดอร์หลัก `easyprint/` แล้วสั่งรันติดตั้งตัวนี้เป็นอันดับแรกสุด:
    ```bash
    bun install
    ```

---

## 3. สิ่งที่เพื่อนร่วมทีมต้องทำเมื่อดึงโค้ดไปรัน (Teammates Workflow)

1.  **ติดตั้ง Dependency:**
    ```bash
    bun install
    ```
2.  **สั่งรันหน้าเว็บเฉพาะฝั่ง Frontend (ไม่ต้องเปิด API หลังบ้านพร้อมกันก็ได้):**
    ```bash
    bun run dev:web
    ```
3.  **เปิดเบราว์เซอร์เข้าชมหน้าเพจที่สร้างไว้:**
    *   หน้าเข้าสู่ระบบ: [http://localhost:3000/login](http://localhost:3000/login)
    *   หน้าสมัครสมาชิก: [http://localhost:3000/register](http://localhost:3000/register)

---

## 4. รายการบั๊ก/ปัญหาที่พบและวิธีการแก้ไข (Bugs & Troubleshooting)

### ❌ ปัญหาที่ 1: รันคำสั่งตรวจสอบการ Build แล้วแจ้งว่า `bun: command not found: next`
*   **สาเหตุ:** ยังไม่ได้รันดาวน์โหลดไลบรารีของโปรเจกต์ลงในโฟลเดอร์ `node_modules`
*   **วิธีแก้ไข:** ให้รันคำสั่ง `bun install` ที่โฟลเดอร์หลักของโปรเจกต์ เพื่อติดตั้งความต้องการระบบทั้งหมด

### ❌ ปัญหาที่ 2: ขึ้นเส้นหยักสีแดง (Error/Warning) ใต้โค้ดนำเข้า เช่น `"next/link"` ในหน้าจอโปรแกรมแก้โค้ด
*   **สาเหตุ:** TypeScript Server ของตัวโปรแกรมแคชค่าเดิมก่อนที่จะรันติดตั้งแพ็คเกจเสร็จ
*   **วิธีแก้ไข:**
    *   กดเปิด Command Palette ของโปรแกรมเขียนโค้ด (กดปุ่มคีย์บอร์ด `Ctrl + Shift + P`)
    *   พิมพ์และรันคำสั่ง: `TypeScript: Restart TS Server`
    *   หรือทำการปิด-เปิดโปรแกรมแต่งโค้ดใหม่อีกครั้ง เส้นแดงจะหายไปทั้งหมด

### ❌ ปัญหาที่ 3: เปิดหน้าเว็บ `http://localhost:3000` แล้วรันหน้าเว็บไม่ติด หรือขึ้น `404 Not Found`
*   **สาเหตุ:** พอร์ต `3000` ถูกใช้งานหรือยึดครองโดยโปรแกรมอื่นบนเครื่องคอมพิวเตอร์ก่อนแล้ว (เช่น `drawio-mcp-server` หรือการรัน API หลังบ้าน)
*   **วิธีแก้ไข:**
    *   **แนวทางที่ 1 (แนะนำ):** สั่งเปิดรันหนีไปที่พอร์ต `3005` (หรือพอร์ตอื่นๆ ที่ไม่ชน) โดยรันผ่านคำสั่งดังนี้:
        ```bash
        bun run dev:web -- -p 3005
        ```
        และเข้าเปิดชมที่หน้าเว็บ: [http://localhost:3005/login](http://localhost:3005/login)
    *   **แนวทางที่ 2 (สั่งปิดโปรแกรมที่พอร์ต 3000):** รันคำสั่ง PowerShell บน Windows เพื่อเคลียร์พอร์ตว่างทันที:
        ```powershell
        Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
        ```

---

## 5. อัปเดตวันที่ 2026-07-25 — เชื่อมต่อ Backend จริงให้หน้า Auth ครบวงจร (Login / Register / Forgot / Reset Password)

ก่อนหน้านี้ 4 หน้า Auth (Login, Register ลูกค้า, Forgot Password, Reset Password) มีแค่ frontend/UI เสร็จ ปุ่ม submit ยังเป็นแค่ `console.log` ไม่ได้ต่อ API จริง วันนี้ทำให้ครบ full-stack ทั้งหมด รวมถึงทดสอบ end-to-end จริงผ่านเบราว์เซอร์แล้ว

### 📌 ไฟล์ที่สร้างใหม่

**Backend (`apps/api`)**
*   [src/auth/jwt.ts](file:///d:/EasyPrint_webapp/apps/api/src/auth/jwt.ts) — sign/verify JWT (แยก rememberMe = อายุ token 30 วัน / ปกติ 1 วัน)
*   [src/auth/password.ts](file:///d:/EasyPrint_webapp/apps/api/src/auth/password.ts) — hash/verify รหัสผ่านด้วย Argon2 + สร้าง reset token (สุ่ม 32 bytes เก็บแค่ sha256 hash ใน DB)
*   [src/auth/routes.ts](file:///d:/EasyPrint_webapp/apps/api/src/auth/routes.ts) — endpoints `/auth/register`, `/login`, `/logout`, `/me`, `/forgot-password`, `/reset-password`
*   [src/email.ts](file:///d:/EasyPrint_webapp/apps/api/src/email.ts) — ส่งอีเมลลิงก์รีเซ็ตรหัสผ่านผ่าน Resend (ถ้ายังไม่ตั้ง `RESEND_API_KEY` จะ log ลิงก์ลง console แทน ทดสอบ flow ได้โดยไม่ต้องมี key จริง)

**Shared**
*   [packages/shared/src/schemas/auth.ts](file:///d:/EasyPrint_webapp/packages/shared/src/schemas/auth.ts) — Zod schema `registerSchema`, `loginSchema`, `forgotPasswordSchema`, `resetPasswordSchema` ใช้ตรวจสอบข้อมูลทั้งฝั่ง web และ api

**Frontend (`apps/web`)**
*   [lib/api/client.ts](file:///d:/EasyPrint_webapp/apps/web/lib/api/client.ts) — fetch wrapper กลาง (แนบ cookie อัตโนมัติ, แปลง error จาก server เป็น `ApiError`)
*   [lib/api/auth.ts](file:///d:/EasyPrint_webapp/apps/web/lib/api/auth.ts) — ฟังก์ชันเรียก auth API (`register`, `login`, `logout`, `getMe`, `forgotPassword`, `resetPassword`)
*   `.env.local` — เก็บ `NEXT_PUBLIC_API_URL` (⚠️ ไฟล์นี้ถูก .gitignore ไม่ถูก push ขึ้น GitHub — ดูหัวข้อ "สิ่งที่เพื่อนร่วมทีมต้องทำ" ด้านล่าง)

### 📌 ไฟล์ที่แก้ไข

| ไฟล์ | แก้อะไร |
|---|---|
| [apps/api/drizzle/schema.ts](file:///d:/EasyPrint_webapp/apps/api/drizzle/schema.ts) | เพิ่มคอลัมน์ `firstname`, `lastname`, `phone`, `address` ในตาราง `users`; เพิ่มตารางใหม่ `password_reset_tokens` |
| [apps/api/src/index.ts](file:///d:/EasyPrint_webapp/apps/api/src/index.ts) | mount `authRoutes`, เปิด CORS (`@elysiajs/cors`) ให้ web เรียกข้าม origin พร้อมส่ง cookie ได้ — ตอน dev รับ localhost ทุกพอร์ต กัน error ตอนพอร์ตชนแล้ว auto-fallback |
| [apps/api/package.json](file:///d:/EasyPrint_webapp/apps/api/package.json) | เพิ่ม dependency `resend`, `@elysiajs/cors` |
| [packages/shared/src/index.ts](file:///d:/EasyPrint_webapp/packages/shared/src/index.ts) | export schema auth ใหม่ |
| [docs/erd.md](file:///d:/EasyPrint_webapp/docs/erd.md), [docs/api-spec.md](file:///d:/EasyPrint_webapp/docs/api-spec.md) | อัปเดตให้ตรงกับ schema/endpoint จริง |
| `.env` (root) | เพิ่ม `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NODE_ENV`, `WEB_ORIGIN`, `APP_URL`; เปลี่ยน `PORT` จาก `3000` เป็น **`3001`** (กันชนพอร์ตกับ `apps/web`) |
| `apps/web/app/(auth)/login/page.tsx`, `register/page.tsx`, `forgot-password/page.tsx`, `reset-password/page.tsx` | เอา `console.log`/TODO ออก เชื่อม API จริง เพิ่ม loading state ตอนกด submit, แสดง error message จาก server, redirect หลังสำเร็จ (login/register → `/orders` ตาม role, reset password → หน้ายืนยันสำเร็จ) |

ไม่มีไฟล์ไหนถูกลบ

### 📌 แพ็กเกจที่ติดตั้งเพิ่ม
*   `resend` — ส่งอีเมล (ฝั่ง `apps/api`)
*   `@elysiajs/cors` — เปิด CORS (ฝั่ง `apps/api`)
*   รันแล้วด้วย `bun install` ที่ root — เพื่อนร่วมทีมต้อง `bun install` ใหม่หลัง pull เพื่อดึง 2 แพ็กเกจนี้มาด้วย

### 📌 Database (Supabase จริง — apply ให้แล้ว ไม่ต้องรันซ้ำ)
*   เพิ่มคอลัมน์ `firstname text NOT NULL`, `lastname text NOT NULL`, `phone text NOT NULL`, `address text` ในตาราง `users` (ตอน apply ตาราง `users` มี 0 rows จึงปลอดภัย ไม่กระทบข้อมูลเดิม)
*   สร้างตารางใหม่ `password_reset_tokens` (id, user_id FK → users.id, token_hash unique, expires_at, used_at, created_at)
*   Apply ผ่าน raw SQL ในทรานแซกชันเดียว (ไม่ใช้ `drizzle-kit push` เพราะ prompt แบบโต้ตอบของมันค้างตอนรันผ่าน tool อัตโนมัติ) — ตรวจสอบแล้วว่าคอลัมน์ตรงกับ `schema.ts` เป๊ะ

### 📌 ทดสอบ End-to-End แล้ว (ผ่านทุกจุด)
1.  สมัครสมาชิก → บันทึกลง DB จริง → ตั้ง JWT httpOnly cookie → redirect ไป `/orders`
2.  Login ด้วยรหัสผ่านผิด → ระบบแสดง error "อีเมลหรือรหัสผ่านไม่ถูกต้อง" จาก server
3.  Login ถูกต้อง → redirect ตาม role
4.  ลืมรหัสผ่าน → สร้าง reset token → log ลิงก์ลง console (ยังไม่มี Resend key)
5.  เปิดลิงก์ reset password ด้วย token จริง → เปลี่ยนรหัสผ่านสำเร็จ
6.  ทดสอบ login ด้วยรหัสผ่านเก่า (ต้องล้มเหลว) และรหัสผ่านใหม่ (ต้องสำเร็จ) — ผ่านทั้งคู่
7.  ทดสอบใช้ reset token ซ้ำครั้งที่สอง (ต้องถูกปฏิเสธเพราะใช้ไปแล้ว) — ผ่าน
*   ลบ test user ที่ใช้ทดสอบออกจาก DB เรียบร้อยแล้วหลังทดสอบเสร็จ ไม่มีข้อมูลทดสอบตกค้าง

### ❌ ปัญหาที่พบวันนี้และวิธีแก้

**ปัญหา A: `drizzle-kit push` ค้างที่ "Pulling schema from database..." ไม่จบ**
*   **สาเหตุ:** `DATABASE_URL` ใน `.env` ใช้ Supabase transaction-mode pooler (พอร์ต `6543`) ซึ่งไม่รองรับ prepared statements ที่ `drizzle-kit` ใช้ตอน introspect schema
*   **วิธีแก้:** สลับไปใช้ session-mode pooler (พอร์ต `5432`) เฉพาะตอนรัน migration แล้ว apply schema ด้วย raw SQL ในทรานแซกชันเดียวแทนเครื่องมือ interactive ของ `drizzle-kit push` (prompt แบบเลือกด้วยลูกศรของมันใช้ผ่าน stdin อัตโนมัติไม่ได้)

**ปัญหา B: พอร์ต `3000` ถูกโปรเซสอื่นยึดอยู่ก่อนแล้ว ทำให้ `apps/web` ต้องขยับไปรันพอร์ตอื่นอัตโนมัติ**
*   **สาเหตุ:** มีโปรเซส Node อื่นครองพอร์ต 3000 อยู่ก่อน (ไม่ทราบที่มา ไม่ได้ปิดให้เพราะอาจเป็นงานที่ทำค้างไว้)
*   **วิธีแก้:** ปรับ CORS ฝั่ง `apps/api` (ใน `src/index.ts`) ให้ตอน dev รับ origin จาก `localhost` ทุกพอร์ต แทนการ hardcode `localhost:3000` เพียงพอร์ตเดียว ทำให้ต่อ API ได้ไม่ว่า `apps/web` จะขยับไปรันพอร์ตไหนก็ตาม

**ปัญหา C: `bunx tsc --noEmit` เจอ type error ใน `jwt.ts` และ `routes.ts`**
*   **สาเหตุ:** TypeScript ไม่ narrow type `string | undefined` ของ `JWT_SECRET`/`cookie.value` ให้อัตโนมัติข้าม closure, และ overload ของ `jsonwebtoken` เลือกไม่ตรงเวอร์ชันที่ต้องการ
*   **วิธีแก้:** ประกาศ `const JWT_SECRET: string` แยกหลัง early-throw check, และ cast ผลลัพธ์ `jwt.verify` / ค่า `cookie.value` เป็น type ที่ต้องการอย่างชัดเจน

### 📌 สิ่งที่เพื่อนร่วมทีมต้องทำหลัง `git pull` (สำคัญ — มีไฟล์ที่ git ไม่เก็บ)

1.  **`bun install`** ที่ root — ดึง dependency ใหม่ (`resend`, `@elysiajs/cors`)
2.  **ขอไฟล์ `.env` (root) ใหม่จากเจ้าของงาน** หรือเพิ่มเองด้วยมือ 4 บรรทัดนี้ (ไฟล์ `.env` ไม่ได้อยู่ใน git ตาม `AGENTS.md` ข้อ 8):
    ```
    RESEND_API_KEY=
    RESEND_FROM_EMAIL=EasyPrint <onboarding@resend.dev>
    NODE_ENV=development
    WEB_ORIGIN=http://localhost:3000
    APP_URL=http://localhost:3000
    ```
    และเปลี่ยน `PORT=3000` เป็น `PORT=3001` ในไฟล์เดิม
3.  **สร้างไฟล์ใหม่ `apps/web/.env.local`** (ไม่อยู่ใน git เช่นกัน) ใส่:
    ```
    NEXT_PUBLIC_API_URL=http://localhost:3001
    ```
4.  **ไม่ต้องรัน migration DB เอง** — schema ใหม่ apply บน Supabase กลางเรียบร้อยแล้ว ทุกคนที่ต่อ DB เดียวกันเห็นคอลัมน์/ตารางใหม่ทันที
5.  รันปกติ: `bun --cwd apps/api dev` (terminal หนึ่ง) และ `bun --cwd apps/web dev` (อีก terminal หนึ่ง)
6.  (ไม่บังคับ) ถ้าอยากทดสอบส่งอีเมลจริง ไปสมัคร [resend.com](https://resend.com) ฟรี (3,000 อีเมล/เดือน ไม่ต้องผูกบัตร) แล้วใส่ key ใน `RESEND_API_KEY` — ถ้าไม่ใส่ ระบบยัง test flow ลืมรหัสผ่านได้ปกติ แค่ลิงก์จะโผล่ใน console ของ `apps/api` แทนอีเมลจริง

### ✅ สถานะยืนยัน ณ วันที่ 2026-07-25: 4 หน้า Auth หลักเสร็จสมบูรณ์แล้ว

**Login, Register (ลูกค้า), Forgot Password, Reset Password — เสร็จทั้ง frontend และ backend แล้ว** ไม่มีอะไรค้างในส่วนนี้ ยืนยันด้วยการทดสอบจริงตามหัวข้อ "ทดสอบ End-to-End" ด้านบน:
*   Register → บันทึก DB จริง → login อัตโนมัติผ่าน JWT cookie → redirect
*   Login → ตรวจรหัสผ่านถูก/ผิดถูกต้อง, error message จาก server แสดงผล
*   Forgot Password → สร้าง reset token, ส่งอีเมล (หรือ log ลิงก์ถ้ายังไม่ตั้ง Resend key)
*   Reset Password → เปลี่ยนรหัสผ่านสำเร็จ, รหัสเก่าใช้ไม่ได้, token ใช้ซ้ำไม่ได้

### 🔲 สิ่งที่ยังไม่เสร็จ (นอกเหนือจาก 4 หน้าข้างต้น)

| จุดที่ขาด | สถานะ | ผลกระทบ |
|---|---|---|
| **Route protection (middleware)** | ไม่มีไฟล์ `middleware.ts` เลย | ตอนนี้ใครก็เข้า `/orders`, `/shop`, `/admin` ได้ตรงๆ โดยไม่ต้อง login ก่อน — เป็นช่องโหว่ความปลอดภัยจริง |
| **ปุ่ม Logout** | ลองสร้าง [components/auth/LogoutButton.tsx] แล้วเชื่อมใน [apps/web/app/(customer)/layout.tsx](file:///d:/EasyPrint_webapp/apps/web/app/(customer)/layout.tsx) แต่ **ผู้ใช้สั่งยกเลิก (revert) ทั้งหมดแล้ว** — โค้ดถูกลบออก layout.tsx กลับไปเหมือนเดิม | ผู้ใช้ login แล้วไม่มีทางกด "ออกจากระบบ" จาก UI (endpoint `/auth/logout` ฝั่ง backend ยังใช้งานได้ปกติ แค่ยังไม่มีปุ่มเรียก) |
| **หน้า Change Password** ([apps/web/app/(customer)/change-password/page.tsx](file:///d:/EasyPrint_webapp/apps/web/app/(customer)/change-password/page.tsx) — คนละหน้ากับ reset-password) | ยังเป็น mock, มี `console.log` TODO ค้างอยู่ | ผู้ใช้ที่ login อยู่แล้วเปลี่ยนรหัสผ่านจากในระบบไม่ได้ |
| **Shop Register** ([apps/web/app/(auth)/register/shop-register/page.tsx](file:///d:/EasyPrint_webapp/apps/web/app/(auth)/register/shop-register/page.tsx)) | ยังไม่แตะเลย | ยังไม่มี backend รองรับสมัครสมาชิกฝั่งร้านค้า (role `shop_owner`) |

---

## 6. อัปเดตวันที่ 2026-07-26 — หน้า Orders ฝั่งร้านค้า (Shop) เสร็จ + เปิด PR

วันนี้ทำหน้า "รายการคำสั่งซื้อ" (`/shop/orders`) ให้ร้านค้าใช้ดู/อัปเดตสถานะออเดอร์ ตั้งแต่ commit โค้ดที่มีอยู่ในเครื่อง (ยังไม่เคยขึ้น GitHub) ไปจนถึงปรับ UX หลายรอบตามฟีดแบ็กจริง แล้วเปิด Pull Request สำเร็จ

### 📌 งานที่ทำเสร็จวันนี้

1.  **Commit หน้า Orders ครั้งแรกและเปิด PR**
    *   สร้าง branch `feat/shop-orders-page`, commit หน้า [apps/web/app/(shop)/shop/orders/page.tsx](file:///d:/EasyPrint_webapp/apps/web/app/(shop)/shop/orders/page.tsx) พร้อม component ใหม่ 12 ไฟล์ในโฟลเดอร์ [apps/web/components/shop/orders/](file:///d:/EasyPrint_webapp/apps/web/components/shop/orders/) (ตาราง, การ์ดสรุปสถานะ, modal รายละเอียด/อัปเดตสถานะ/ยกเลิก, ตัวดูไฟล์+PDF, mock data) รวม 15 ไฟล์ ~1,850 บรรทัด
    *   Push ขึ้น GitHub และเปิด PR: **[#6](https://github.com/03Panyaporn/EasyPrint_webapp/pull/6)**

2.  **ปรับ popup "หมายเหตุ" / "ที่อยู่" ในตาราง** ([OrdersTable.tsx](file:///d:/EasyPrint_webapp/apps/web/components/shop/orders/OrdersTable.tsx))
    *   เดิมเป็น dropdown เล็กๆ โผล่ใต้ปุ่ม อ่านยาก → เปลี่ยนเป็นการ์ดลอยกึ่งกลางจอ (fixed + backdrop มืด) มีปุ่มปิด (X) ชัดเจน

3.  **จัดเนื้อหาในตารางให้อยู่กึ่งกลางใต้หัวข้อคอลัมน์** ([OrdersTable.tsx](file:///d:/EasyPrint_webapp/apps/web/components/shop/orders/OrdersTable.tsx), [FileThumbnail.tsx](file:///d:/EasyPrint_webapp/apps/web/components/shop/orders/FileThumbnail.tsx))
    *   เจอบั๊กเบราว์เซอร์: ปุ่ม (`<button>`) ที่ตั้ง `display:flex` ไม่ยอมขยายเต็มความกว้างเหมือน `<div>`/`<span>` (ปุ่ม/inputs ใช้ขนาดตามเนื้อหาเสมอ ไม่ว่าจะตั้ง display อะไรก็ตาม) ทำให้ `justify-center` ใช้ไม่ได้ผล ต้องแก้ด้วย `mx-auto` แทน
    *   ตามคำขอภายหลัง ปรับปุ่ม "ดูที่อยู่" กลับไปชิดซ้ายเหมือนเดิม (ส่วนอื่นในคอลัมน์ยังกึ่งกลาง)

4.  **แก้การ์ดสถานะ/ปุ่มอัปเดตสถานะออเดอร์** ([UpdateStatusModal.tsx](file:///d:/EasyPrint_webapp/apps/web/components/shop/orders/UpdateStatusModal.tsx), [statusConfig.ts](file:///d:/EasyPrint_webapp/apps/web/components/shop/orders/statusConfig.ts))
    *   **เจอบั๊ก logic เดิม:** โค้ดเดิมรวม case `"accepted"` กับ `"in_progress"` ไว้ด้วยกัน ทำให้กดปุ่มจาก "รับงานแล้ว" แล้วสถานะกระโดดข้าม "กำลังดำเนินการ" ไปที่ "กำลังจัดส่ง" ทันที (สังเกตเจอจากรูปหน้าจอที่ผู้ใช้ส่งมา) → แก้แยก case ให้ขยับทีละสถานะ: รอตรวจสอบ → รับงานแล้ว → กำลังดำเนินการ → กำลังจัดส่ง (กรณีจัดส่ง) / เสร็จสิ้น (กรณีมารับเอง) → เสร็จสิ้น
    *   ปรับวงกลม step ให้: สถานะปัจจุบัน = พื้นสีเข้มเต็มวง + ติ๊กถูก, สถานะถัดไป = ขอบหนา + เงา 3 มิติ + ขยายเล็กน้อยให้เด่น, สถานะที่เหลือ = วงกลมเทาเรียบ
    *   ชื่อปุ่มกดหลักเปลี่ยนให้ตรงกับชื่อสถานะถัดไปเป๊ะๆ (ลบ label ที่พิมพ์เองซ้ำซ้อนออก ใช้ `statusConfig[nextStatus].label` แทน) และสีทุกจุด (ปุ่ม, วงกลม step ถัดไป) อิงตามสีประจำของสถานะนั้นๆ เอง
    *   ทดสอบเดินผ่านทุก transition จริงในเบราว์เซอร์ (ทั้งกรณีจัดส่งและมารับเองที่ร้าน) ผ่านหมด

5.  **เพิ่มปุ่ม "ทั้งหมด" ในการ์ดสรุปสถานะ** ([OrderStatusCards.tsx](file:///d:/EasyPrint_webapp/apps/web/components/shop/orders/OrderStatusCards.tsx))
    *   เดิมกดการ์ดสถานะเพื่อกรองตารางได้ แต่ไม่มีปุ่มกลับมาดูรายการทั้งหมด (ต้องกดการ์ดเดิมซ้ำเพื่อ toggle ปิด ซึ่งไม่มีใครรู้) → เพิ่มการ์ด "ทั้งหมด" เป็นอันแรกสุด กดแล้วเคลียร์ตัวกรองเสมอ

6.  Commit ที่ 2 ของวันนี้รวมข้อ 2–5 ไว้ด้วยกัน push ขึ้น branch เดิม ทำให้ PR #6 อัปเดตอัตโนมัติ (ไม่ต้องเปิด PR ใหม่)

### 📌 การติดตั้งเพิ่มเติม / สิ่งที่เพื่อนร่วมทีมต้องทำหลัง pull

**ไม่มี** — งานวันนี้เป็นการแก้ไฟล์ React/Tailwind ที่มีอยู่แล้วทั้งหมด ไม่มีแพ็กเกจใหม่ ไม่มีตัวแปร env ใหม่ ไม่มีการแก้ฐานข้อมูล ดึงโค้ดแล้วรัน `bun run dev:web` ตามขั้นตอนเดิมในหัวข้อ 3 ได้เลย

### 🔲 สิ่งที่ยังไม่เสร็จ (เฉพาะส่วน Orders)

*   ยังไม่มี automated test ให้หน้า Orders/component ที่เกี่ยวข้อง — ตรวจสอบด้วยการรันจริงในเบราว์เซอร์ (manual) เท่านั้น
*   PR #6 ยังไม่ถูก review/merge
*   repo นี้ยังไม่มี GitHub Actions (`.github/workflows`) เลย ดังนั้น PR #6 (และ PR อื่นๆ) จะไม่มี CI ตรวจ lint/build ให้อัตโนมัติ
*   รายการ "สิ่งที่ยังไม่เสร็จ" จากหัวข้อ 5 (route protection, ปุ่ม Logout, หน้า Change Password, Shop Register) ยังคงค้างอยู่เหมือนเดิม ไม่เกี่ยวกับงานวันนี้
