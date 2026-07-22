# Login Page & Navbar Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a profile link in the customer layout navigation bar and create a fully interactive, high-fidelity "Login / Sign In" page at `apps/web/app/(auth)/login/page.tsx` based on Approach A (Split Screen) using SVG icons.

**Architecture:** 
1. Update `apps/web/app/(customer)/layout.tsx` to add a profile icon.
2. Build `apps/web/app/(auth)/login/page.tsx` as a Client Component with user/password inputs, validation, eye toggle, remember me checkbox, and a split screen layout with decorative floating spheres.

**Tech Stack:** Next.js (App Router), React (useState), Tailwind CSS.

---

### Task 1: Add Profile Link to Customer Layout

**Files:**
- Modify: [apps/web/app/(customer)/layout.tsx](file:///d:/EasyPrint_webapp/apps/web/app/(customer)/layout.tsx)

- [ ] **Step 1: Edit layout.tsx to insert Profile link**
  Modify the navigation bar to include a circular link with an avatar SVG icon pointing to `/login`.

  ```tsx
  import Link from "next/link";

  export default function CustomerLayout({ children }: { children: React.ReactNode }) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <span className="font-bold text-blue-600">EasyPrint — ลูกค้า</span>
          <div className="flex gap-4 text-sm text-gray-600 items-center">
            <Link href="/orders" className="hover:text-blue-600 font-medium">
              ประวัติสั่งพิมพ์
            </Link>
            <Link href="/orders/new" className="hover:text-blue-600 font-medium">
              สั่งพิมพ์ใหม่
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 hover:border-blue-400 hover:text-blue-600 transition text-gray-500"
              title="โปรไฟล์"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </Link>
          </div>
        </nav>
        {children}
      </div>
    );
  }
  ```

---

### Task 2: Implement Login Page Component

**Files:**
- Modify: [apps/web/app/(auth)/login/page.tsx](file:///d:/EasyPrint_webapp/apps/web/app/(auth)/login/page.tsx)

- [ ] **Step 1: Write the Login page code**
  Replace the placeholder in `login/page.tsx` with the high-fidelity Split Screen React code.

  ```tsx
  "use client";

  import { useState } from "react";
  import Link from "next/link";

  export default function LoginPage() {
    const [usernameOrEmail, setUsernameOrEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const isFormValid = usernameOrEmail.trim() !== "" && password.length >= 8;

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!isFormValid) return;
      
      console.log("EasyPrint Login Form Submitted:", {
        usernameOrEmail,
        password,
        rememberMe,
      });
    };

    return (
      <main className="min-h-screen bg-slate-50 text-slate-800 antialiased flex flex-col lg:flex-row relative overflow-hidden">
        
        {/* LEFT COLUMN: Welcome Panel (Orange-Teal-Pink gradient + Floating Spheres) */}
        <div className="hidden lg:flex lg:w-[50%] bg-gradient-to-tr from-[#F46A2F] via-[#F3DADA] to-[#8FD2D5] flex-col justify-between p-16 relative overflow-hidden">
          {/* Glowing background circles for depth */}
          <div className="absolute top-[10%] left-[20%] w-72 h-72 rounded-full bg-gradient-to-br from-[#FFB273] to-[#F46A2F] opacity-80 shadow-2xl blur-sm animate-bounce pointer-events-none" style={{ animationDuration: '6s' }}></div>
          <div className="absolute bottom-[15%] right-[10%] w-80 h-80 rounded-full bg-gradient-to-tr from-[#8FD2D5] to-[#F3DADA] opacity-70 shadow-2xl blur-sm pointer-events-none"></div>
          <div className="absolute top-[50%] right-[30%] w-36 h-36 rounded-full bg-white/20 backdrop-blur-md opacity-60 shadow-xl pointer-events-none"></div>

          {/* Logo Header */}
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white text-[#F46A2F] flex items-center justify-center font-extrabold text-xl shadow-md">
              EP
            </div>
            <span className="text-xl font-bold tracking-tight text-white">EasyPrint</span>
          </div>

          {/* Welcome Text */}
          <div className="my-auto space-y-4 relative z-10 max-w-md">
            <span className="text-white/80 font-semibold text-sm tracking-wider uppercase">ยินดีต้อนรับกลับมา</span>
            <h1 className="text-5xl font-black text-white tracking-tight leading-tight uppercase">
              Welcome
            </h1>
            <p className="text-white/90 text-lg font-medium leading-relaxed">
              จัดการทุกเรื่องพิมพ์เอกสารของคุณให้เสร็จง่ายในที่เดียว รวดเร็ว ปลอดภัย
            </p>
          </div>

          {/* Footer guard */}
          <div className="text-white/70 text-xs relative z-10">
            © 2026 EasyPrint App. All rights reserved.
          </div>
        </div>

        {/* RIGHT COLUMN: Sign In Form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16 relative z-10 bg-white lg:bg-slate-50/20">
          
          {/* Subtle decoration for mobile */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#FFB273]/5 blur-3xl pointer-events-none lg:hidden"></div>

          {/* Card Container */}
          <div className="w-full max-w-[480px] bg-white rounded-[24px] shadow-xl sm:border border-slate-100 p-8 sm:p-10 space-y-8 my-auto">
            
            {/* Logo for mobile */}
            <div className="flex lg:hidden items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#F46A2F] flex items-center justify-center text-white font-bold">
                EP
              </div>
              <span className="text-lg font-bold text-slate-900">Easy<span className="text-[#F46A2F]">Print</span></span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">เข้าสู่ระบบ</h2>
              <p className="text-sm text-slate-400 font-medium">กรอกชื่อบัญชีและรหัสผ่านเพื่อเข้าใช้งาน</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              
              {/* Username Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">ชื่อผู้ใช้งาน หรือ อีเมล</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-3.5 text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    required
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F46A2F] focus:ring-1 focus:ring-[#F46A2F] transition"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">รหัสผ่าน</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-3.5 text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-16 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#F46A2F] focus:ring-1 focus:ring-[#F46A2F] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-xs font-bold text-[#F46A2F] hover:text-[#E05B22] transition"
                  >
                    {showPassword ? "ซ่อน" : "แสดง"}
                  </button>
                </div>
              </div>

              {/* Remember Me and Forgot Password */}
              <div className="flex items-center justify-between text-xs font-semibold">
                <label className="flex items-center gap-2 text-slate-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-350 text-[#F46A2F] focus:ring-[#F46A2F]"
                  />
                  จดจำฉันไว้
                </label>
                <Link href="/forgot-password" className="text-[#F46A2F] hover:underline">
                  ลืมรหัสผ่าน?
                </Link>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!isFormValid}
                  className={`w-full py-3.5 font-bold rounded-[14px] shadow-lg transition-all duration-300 ${
                    isFormValid
                      ? "bg-[#F46A2F] text-white hover:bg-[#E05B22] hover:-translate-y-0.5 active:translate-y-0 shadow-[#F46A2F]/20 cursor-pointer"
                      : "bg-slate-300 text-white cursor-not-allowed"
                  }`}
                >
                  เข้าสู่ระบบ
                </button>
              </div>

            </form>

            {/* Signup Link */}
            <div className="text-center pt-2">
              <p className="text-sm text-slate-400 font-medium">
                ยังไม่มีบัญชีใช่ไหม?{" "}
                <Link href="/register" className="text-[#F46A2F] hover:text-[#F46A2F]/80 font-bold hover:underline transition">
                  สมัครสมาชิก
                </Link>
              </p>
            </div>

            {/* Footer PDPA */}
            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium pt-4 border-t border-slate-100">
              <svg className="w-3.5 h-3.5 text-[#8FD2D5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              ข้อมูลของคุณได้รับการปกป้องตามมาตรฐานความปลอดภัยและ PDPA
            </div>

          </div>
        </div>
      </main>
    );
  }
  ```

---

### Task 3: Build Verification

- [ ] **Step 1: Run Next.js production build**
  Run: `bun --cwd apps/web build`
  Expected: Success without TypeScript or configuration compile errors.
