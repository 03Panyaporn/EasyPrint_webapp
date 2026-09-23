"use client";

import { useEffect, useState, useRef } from "react";
import { useToast, ToastType } from "@/contexts/ToastContext";
import { getNotifications } from "@/lib/api/notifications";
import { DEFAULT_NOTIFICATION_SETTINGS, notificationSettingKeyForType } from "@easyprint/shared";
import { getMyShopProfile, type MyShopProfile } from "@/lib/api/shops";

export default function GlobalNotificationListener() {
  const { addToast } = useToast();
  const [shop, setShop] = useState<MyShopProfile | null>(null);
  
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef<boolean>(true);
  const setupRemindersShownRef = useRef<boolean>(false);

  // 1. โหลดข้อมูลร้านค้าและเช็ค Setup Reminders
  useEffect(() => {
    async function loadShop() {
      try {
        const res = await getMyShopProfile();
        setShop(res.shop);

        // แสดง Setup Reminders แค่ครั้งแรกตอนโหลดเข้าหน้าเว็บ (ถ้ายังไม่ได้แสดง)
        if (!setupRemindersShownRef.current) {
          setupRemindersShownRef.current = true;
          
          const s = res.shop;
          
          // เช็คการตั้งค่าการชำระเงิน
          if (!s.bankAccountNumber && !s.promptpayNumber) {
            addToast({
              title: "แจ้งเตือนการตั้งค่าร้านค้า",
              message: "คุณยังไม่ได้ตั้งค่าช่องทางการรับเงิน (บัญชีธนาคาร/พร้อมเพย์)",
              type: "warning",
              duration: 10000,
            });
          }
          
          // เช็คการตั้งค่าบริการและราคา
          if (!s.serviceTypes || s.serviceTypes.length === 0) {
            addToast({
              title: "แจ้งเตือนการตั้งค่าร้านค้า",
              message: "คุณยังไม่ได้ตั้งค่าบริการและราคาถ่ายเอกสาร/ปริ้นงาน",
              type: "warning",
              duration: 10000,
            });
          }

          // เช็คการตั้งค่าการจัดส่ง
          if (!s.deliveryMethods || s.deliveryMethods.length === 0) {
            addToast({
              title: "แจ้งเตือนการตั้งค่าร้านค้า",
              message: "คุณยังไม่ได้ตั้งค่าช่องทางการรับสินค้าหรือจัดส่ง",
              type: "warning",
              duration: 10000,
            });
          }
          
          // เช็คการตั้งค่าเวลาทำการ
          if (!s.openingHours || s.openingHours.length === 0) {
            addToast({
              title: "แจ้งเตือนการตั้งค่าร้านค้า",
              message: "คุณยังไม่ได้กำหนดเวลาเปิด-ปิดร้านค้า",
              type: "warning",
              duration: 10000,
            });
          }
        }
      } catch (err) {
        console.error("Error loading shop profile:", err);
      }
    }
    loadShop();
  }, [addToast]);

  // 2. Polling ระบบแจ้งเตือนทุกๆ 15 วินาที
  useEffect(() => {
    if (!shop) return;

    const fetchNotifications = async () => {
      try {
        const res = await getNotifications();
        const notifications = res.notifications || [];

        const isInitial = initialLoadRef.current;
        if (isInitial) {
          initialLoadRef.current = false;
        }

        // เช็คการแจ้งเตือนที่จะนำมาแสดง popup
        const newNotifications = notifications.filter((n: any) => {
          if (isInitial) {
            // โหลดครั้งแรก: แสดงเฉพาะรายการที่ "ยังไม่ได้อ่าน"
            return !n.isRead;
          } else {
            // Polling รอบถัดๆ ไป: แสดงรายการที่ "เพิ่งเพิ่มเข้ามาใหม่"
            return !seenIdsRef.current.has(n.id);
          }
        });

        // อัปเดตรายการที่เคยเห็นแล้วทั้งหมด
        notifications.forEach((n: any) => seenIdsRef.current.add(n.id));

        // ค่าเริ่มต้น + mapping typeId → สวิตช์ ชุดเดียวกับ backend (utils/notification.ts) — เดิมเดาหมวดจากคำในหัวข้อ
        // (เช่น "ข้อความใหม่จากออเดอร์..." มีคำว่า "ออเดอร์" เลยถูกจัดเป็นหมวดออเดอร์แทนแชท)
        const settings = { ...DEFAULT_NOTIFICATION_SETTINGS, ...(shop.notificationSettings ?? {}) };

        newNotifications.forEach((n: any) => {
          const key = notificationSettingKeyForType(n.typeId);
          const shouldShow = key ? settings[key] !== false : true;
          const type: ToastType =
            n.category === "chat" || n.typeId === 3
              ? "chat"
              : n.typeId === 1 || n.typeId === 2
                ? "order"
                : n.typeId === 10
                  ? "success"
                  : "system";

          if (shouldShow) {
            addToast({
              title: n.title,
              message: n.message,
              type: type,
              duration: 5000,
              link: n.link,
            });
            // ส่ง event เผื่อส่วนอื่นๆใน Dashboard (เช่น widget การแจ้งเตือน) อยากอัปเดตข้อมูลด้วย
            window.dispatchEvent(new Event("new-notification"));
          }
        });

      } catch (err) {
        console.error("Error polling notifications:", err);
      }
    };

    fetchNotifications(); // เรียกครั้งแรกทันทีเมื่อ shop โหลดเสร็จ
    const intervalId = setInterval(fetchNotifications, 15000); // Polling ทุก 15 วินาที

    return () => clearInterval(intervalId);
  }, [shop, addToast]);

  return null; // Component นี้ไม่มี UI ของตัวเอง แค่ทำงานเบื้องหลัง
}
