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
  const [coords, setCoords] = useState<{ top: number; right: number }>({
    top: 0,
    right: 0,
  });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((prev) => !prev);
  };

  // Close menu on click outside or window resize / scroll
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleScrollOrResize = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + 6,
          right: window.innerWidth - rect.right,
        });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open]);

  const items = [
    {
      label: "ดูรายละเอียด",
      icon: Eye,
      onClick: onViewDetail,
      className: "text-slate-700 hover:bg-orange-50 hover:text-[#FF6B35]",
      iconClass: "text-slate-500",
    },
    {
      label: "ตรวจสอบเอกสาร",
      icon: FileSearch,
      onClick: onViewDocuments,
      className: "text-blue-700 hover:bg-blue-50",
      iconClass: "text-blue-600",
    },
    ...(shopStatus === "รอตรวจสอบ"
      ? [
          {
            label: "อนุมัติร้านค้า",
            icon: CheckCircle,
            onClick: onApprove,
            className: "text-emerald-700 hover:bg-emerald-50 font-bold",
            iconClass: "text-emerald-600",
          },
          {
            label: "ไม่อนุมัติร้านค้า",
            icon: XCircle,
            onClick: onReject,
            className: "text-rose-600 hover:bg-rose-50 font-bold",
            iconClass: "text-rose-600",
          },
        ]
      : []),
  ];

  return (
    <>
      {/* 3-Dots Trigger Button (Original Style) */}
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer shadow-2xs"
        aria-label="จัดการร้านค้า"
      >
        <MoreHorizontal size={18} />
      </button>

      {/* Dropdown Menu Portal (Floats on top of overflow-x-auto container) */}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              right: `${coords.right}px`,
            }}
            className="w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-1.5 z-[9999] animate-in fade-in slide-in-from-top-1 duration-150"
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
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors text-left cursor-pointer ${item.className}`}
                >
                  <Icon size={15} className={`shrink-0 ${item.iconClass}`} />
                  <span className="flex-1">{item.label}</span>
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
