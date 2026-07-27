"use client";

import { useEffect, useRef, useState } from "react";
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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="จัดการ"
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
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
        </div>
      )}
    </div>
  );
}
