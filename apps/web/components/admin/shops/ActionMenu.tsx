"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  MoreHorizontal,
  Eye,
  FileSearch,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { ShopStatus } from "@/lib/mock/adminShops";

interface ActionMenuProps {
  shopId: string;
  shopStatus: ShopStatus;
  onViewDetail: () => void;
  onViewDocuments: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export default function ActionMenu({
  shopStatus,
  onViewDetail,
  onViewDocuments,
  onApprove,
  onReject,
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  // เมนูถูก render ผ่าน portal ออกไปที่ document.body (ดูด้านล่าง) เพื่อไม่ให้การ์ดตาราง
  // ที่มี overflow-hidden/overflow-x-auto ตัดขอบป๊อบอัพ — เก็บ ref ทั้งปุ่มและเมนูไว้เช็ค outside-click
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        menuRef.current && !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const menuWidth = 208; // w-52
      setMenuPos({
        top: rect.bottom + 4,
        left: Math.max(8, rect.right - menuWidth),
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  const items = [
    {
      label: "ดูรายละเอียด",
      icon: Eye,
      onClick: onViewDetail,
      color: "text-gray-700 hover:bg-gray-50",
    },
    {
      label: "ตรวจสอบเอกสาร",
      icon: FileSearch,
      onClick: onViewDocuments,
      color: "text-gray-700 hover:bg-gray-50",
    },
    ...(shopStatus === "รอตรวจสอบ"
      ? [
          {
            label: "อนุมัติร้านค้า",
            icon: CheckCircle,
            onClick: onApprove,
            color: "text-green-700 hover:bg-green-50",
          },
          {
            label: "ไม่อนุมัติร้านค้า",
            icon: XCircle,
            onClick: onReject,
            color: "text-red-600 hover:bg-red-50",
          },
        ]
      : []),
  ];


  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="จัดการ"
      >
        <MoreHorizontal size={18} />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: menuPos.top, left: menuPos.left }}
            className="w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
          >
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    item.onClick();
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium transition-colors ${item.color}`}
                >
                  <Icon size={15} className="shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
