# Design Specification: EasyPrint Login Page & Customer Layout

This document outlines the design and implementation specifications for the Login page and the customer navbar update of the EasyPrint web application, based on **Approach A (Split Screen Layout)** using vector icons instead of emojis.

---

## 1. Customer Layout Navbar Update

- **File to modify:** [apps/web/app/(customer)/layout.tsx](file:///d:/EasyPrint_webapp/apps/web/app/(customer)/layout.tsx)
- **Changes:**
  - Add a "Profile" icon to the top right of the navbar.
  - The profile icon will be represented by an SVG user avatar icon instead of an emoji.
  - Clicking the profile icon will navigate to `/login`.

---

## 2. Login Page Design & Layout (Approach A)

- **File to create:** [apps/web/app/(auth)/login/page.tsx](file:///d:/EasyPrint_webapp/apps/web/app/(auth)/login/page.tsx)
- **Layout Structure (Desktop split screen, Mobile stacked):**
  - **Left Column (~50% width, hidden on mobile):**
    - High-fidelity visual styling.
    - Large background with a smooth gradient blending orange (`#F46A2F`), teal/aqua (`#8FD2D5`), and soft pink (`#F3DADA`) in a radial/conic fashion.
    - Text: "WELCOME" and "EASYPRINT" in bold white typography.
    - A series of 3D-like floating circular spheres rendered with custom CSS gradients (`from-[#FFB273]` to `to-[#F46A2F]` / `to-[#8FD2D5]`) and shadows to create depth.
  - **Right Column (~50% width):**
    - Large white card, rounded corners (`rounded-[24px]`), soft drop shadows, generous internal padding.
    - Branding: EasyPrint Logo centered at the top.
    - Title: "เข้าสู่ระบบ" (Sign In) in bold Thai typography.
    
---

## 3. Login Form Details

The form in the right pane contains the following fields:

1.  **ชื่อผู้ใช้งาน หรือ อีเมล (Username/Email):**
    - Text input with a leading SVG User icon inside the input block (replacing any emoji representation).
2.  **รหัสผ่าน (Password):**
    - Password input with a leading SVG Lock icon.
    - Toggle action button "แสดง" / "ซ่อน" (Show / Hide) at the right end of the input field.
3.  **ตัวเลือกเสริม (Form Options):**
    - Checkbox: "จดจำฉันไว้" (Remember me).
    - Link: "ลืมรหัสผ่าน?" (Forgot Password?) linking to `/forgot-password`.
4.  **ปุ่มส่งข้อมูล (CTA):**
    - Label: "เข้าสู่ระบบ"
    - Style: Full width, orange background (`#F46A2F`), rounded corners (`rounded-[14px]`), active hover state with translation.
5.  **ปุ่มสำรอง/ลิงก์:**
    - Link at the bottom: "ยังไม่มีบัญชี? สมัครสมาชิก" linking to `/register`.
    - No social login buttons.

---

## 4. Emojis to Icons Transition

All emojis are strictly replaced by SVG icons:
- User icon: `<svg ...><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`
- Lock icon: `<svg ...><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>`
- Settings / Profile icon in Navbar: Avatar SVG icon.

---

## 5. Verification Plan

- Check compilation of `apps/web/app/(auth)/login/page.tsx` and `apps/web/app/(customer)/layout.tsx`.
- Run `bun --cwd apps/web build` to verify no TypeScript or lint issues.
