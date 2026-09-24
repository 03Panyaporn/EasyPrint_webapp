"use client";

import { useEffect, useState } from "react";
import { getChatRooms } from "@/lib/api/messages";

const ROOMS_POLL_MS = 15000; // เท่ากับ interval ที่ chatpage.tsx ใช้ดึงรายการห้องแชท

// ยอดรวม unread ทุกห้องแชท ใช้แสดง badge ที่ nav "แชท" (เดิมไม่มี component ไหนดึงค่านี้มาโชว์เลย
// นอกจากใน chatpage.tsx เอง — nav link เลยไม่มี indicator ให้เห็นว่ามีข้อความใหม่)
export function useUnreadChatCount(enabled: boolean) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setUnreadCount(0);
      return;
    }

    let cancelled = false;

    const load = () => {
      getChatRooms()
        .then(({ rooms }) => {
          if (cancelled) return;
          setUnreadCount(rooms.reduce((sum, room) => sum + room.unreadCount, 0));
        })
        .catch(() => {
          if (cancelled) return;
          setUnreadCount(0);
        });
    };

    load();
    const timer = setInterval(load, ROOMS_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [enabled]);

  return unreadCount;
}
