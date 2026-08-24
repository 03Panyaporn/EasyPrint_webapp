"use client";

import { useEffect, useState, useRef } from "react";
import { useToast, ToastType } from "@/contexts/ToastContext";
import { getNotifications } from "@/lib/api/notifications";
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

        // ถ้าโหลดครั้งแรก ให้บันทึก ID ทั้งหมดไว้เป็น seen เพื่อไม่ให้เด้งแจ้งเตือนย้อนหลัง
        if (initialLoadRef.current) {
          notifications.forEach((n: any) => seenIdsRef.current.add(n.id));
          initialLoadRef.current = false;
          return;
        }

        // เช็คการแจ้งเตือนใหม่ที่ยังไม่เคยเห็น
        const settings = shop.notificationSettings || {
          newOrder: true,
          orderUpdate: false,
          chatAndRequests: false,
          closingWarning: false,
          autoShopStatus: false,
          adminUpdates: false,
        };

        const newNotifications = notifications.filter((n: any) => !seenIdsRef.current.has(n.id));

        newNotifications.forEach((n: any) => {
          seenIdsRef.current.add(n.id);

          // วิเคราะห์ Category และเช็ค Setting ของร้านค้า
          let shouldShow = false;
          let type: ToastType = "info";

          if (n.category === "order" || n.title.includes("ออเดอร์")) {
            shouldShow = settings.newOrder || settings.orderUpdate;
            type = "order";
          } else if (n.category === "payment" || n.title.includes("เงิน")) {
            shouldShow = settings.orderUpdate;
            type = "success";
          } else if (n.category === "system" || n.title.includes("ระบบ") || n.category === "alert") {
            shouldShow = settings.adminUpdates || settings.closingWarning || settings.autoShopStatus;
            type = n.title.includes("ความปลอดภัย") ? "success" : "system";
          } else if (n.category === "chat" || n.title.includes("ข้อความ")) {
            shouldShow = settings.chatAndRequests;
            type = "chat";
          } else {
            // Default show if unknown category but not empty
            shouldShow = true;
          }

          // ข้อยกเว้น: แจ้งเตือนเกี่ยวกับความปลอดภัย ควรโชว์เสมอ
          if (n.title.includes("ความปลอดภัย") || n.title.includes("รหัสผ่าน")) {
            shouldShow = true;
            type = "success";
          }

          if (shouldShow) {
            addToast({
              title: n.title,
              message: n.message,
              type: type,
              duration: 5000,
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
