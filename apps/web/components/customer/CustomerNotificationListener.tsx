"use client";

import { useEffect, useRef } from "react";
import { useToast, ToastType } from "@/contexts/ToastContext";
import { getNotifications } from "@/lib/api/notifications";

// แก้ BUG-12-01 (QA Phase 12): เดิมฝั่งลูกค้าไม่มี UI แจ้งเตือนเลยทั้งระบบ (ไม่มี bell/toast/dropdown แม้แต่จุดเดียว)
// ทั้งที่ backend สร้าง notification ให้ลูกค้าไว้ถูกต้องอยู่แล้ว (เช่น แอดมินตอบกลับคำร้อง typeId:4, ร้านยกเลิกออเดอร์ typeId:2,
// ข้อความแชทใหม่ typeId:3) — คอมโพเนนต์นี้เป็นคู่ขนานของ GlobalNotificationListener ฝั่งร้านค้า แต่ตัดส่วนที่เกี่ยวกับ
// การตั้งค่าร้าน (notificationSettings, setup reminders) ออก เพราะลูกค้าไม่มีการตั้งค่าประเภทนี้ — แสดง toast ทุกรายการที่ยังไม่อ่านเสมอ
export default function CustomerNotificationListener() {
  const { addToast } = useToast();

  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef<boolean>(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await getNotifications();
        const notifications = res.notifications || [];

        const isInitial = initialLoadRef.current;
        if (isInitial) {
          initialLoadRef.current = false;
        }

        // โหลดครั้งแรก: แสดงเฉพาะรายการที่ "ยังไม่ได้อ่าน" / โหลดรอบถัดๆ ไป: แสดงเฉพาะรายการที่ "เพิ่งเพิ่มเข้ามาใหม่"
        const newNotifications = notifications.filter((n) =>
          isInitial ? !n.isRead : !seenIdsRef.current.has(n.id)
        );

        notifications.forEach((n) => seenIdsRef.current.add(n.id));

        newNotifications.forEach((n) => {
          let type: ToastType = "info";
          if (n.category === "chat" || n.title.includes("ข้อความ")) {
            type = "chat";
          } else if (n.title.includes("ออเดอร์") || n.title.includes("คำสั่งซื้อ")) {
            type = "order";
          } else if (n.title.includes("ตอบกลับ") || n.title.includes("อนุมัติ")) {
            type = "success";
          } else if (n.title.includes("ยกเลิก") || n.title.includes("ปฏิเสธ")) {
            type = "warning";
          }

          addToast({
            title: n.title,
            message: n.message,
            type,
            duration: 5000,
            link: n.link ?? undefined,
          });
        });
      } catch (err) {
        console.error("Error polling customer notifications:", err);
      }
    };

    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 15000); // Polling ทุก 15 วินาที (เหมือนฝั่งร้านค้า)

    return () => clearInterval(intervalId);
  }, [addToast]);

  return null; // Component นี้ไม่มี UI ของตัวเอง แค่ทำงานเบื้องหลัง
}
