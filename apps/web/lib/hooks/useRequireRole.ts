"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, type PublicUser } from "@/lib/api/auth";

// หน้าแรกของแต่ละ role หลัง login — ใช้ตอน role ไม่ตรง (ผู้ใช้ login อยู่แล้วแค่ผิด role ไม่ต้อง login ใหม่)
const ROLE_HOME: Record<PublicUser["role"], string> = {
  customer: "/Dashboard",
  shop_owner: "/shop",
  admin: "/admin",
};

/**
 * Client-side auth guard สำหรับ layout ที่ต้องจำกัดเฉพาะ role เดียว (เช่น admin, shop_owner)
 * — เดิม (admin)/layout.tsx และ (shop)/layout.tsx ไม่มีการเช็คสิทธิ์เลยฝั่ง frontend
 * พึ่งพาแค่ API 401/403 รายจุด ทำให้ role อื่น (หรือคน logout ไปแล้ว) ยังเห็นหน้า UI shell เต็มรูปแบบได้
 * (ยืนยันบั๊กจริงจาก QA Phase 01 — ดู BUG-01-02 ใน QA_BUG_REPORT.md)
 *
 * ใช้ตรวจสอบทันทีตอน mount แล้ว redirect ก่อน render children:
 * - ไม่ได้ login เลย (401) → ไป /login
 * - login แล้วแต่ role ไม่ตรง → ไปหน้าแรกของ role ตัวเอง (ไม่ใช่ /login เพราะ login อยู่แล้ว)
 */
export function useRequireRole(requiredRole: PublicUser["role"]) {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getMe()
      .then(({ user }) => {
        if (cancelled) return;
        if (user.role !== requiredRole) {
          router.replace(ROLE_HOME[user.role] ?? "/login");
          return;
        }
        setUser(user);
        setChecking(false);
      })
      .catch(() => {
        if (cancelled) return;
        router.replace("/login");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requiredRole]);

  return { user, checking };
}
