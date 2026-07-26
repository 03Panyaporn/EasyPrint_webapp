"use client";

import { ZoomIn } from "lucide-react";
import { Order } from "./types";
import { MOCK_WIDTH, renderFileMock } from "./FilePreviewContent";

interface FileThumbnailProps {
  order: Order;
  kind: "file" | "slip";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

const boxPx = { sm: 64, md: 96, lg: 128 };
const textWidth = { sm: "max-w-[80px]", md: "max-w-[112px]", lg: "max-w-[144px]" };

export default function FileThumbnail({ order, kind, size = "sm", onClick }: FileThumbnailProps) {
  const file = kind === "slip" ? order.paymentSlip : order.file;
  const target = boxPx[size];
  const scale = target / MOCK_WIDTH;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 group mx-auto ${
        onClick ? "cursor-pointer" : "cursor-default"
      }`}
    >
      <div
        className="relative overflow-hidden rounded-lg ring-1 ring-gray-100 group-hover:ring-orange-300 transition-all shrink-0"
        style={{ width: target, height: target }}
      >
        <div
          style={{
            width: MOCK_WIDTH,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {renderFileMock(order, kind)}
        </div>
        {onClick && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/25 transition-colors">
            <ZoomIn
              size={Math.max(14, target * 0.2)}
              className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
        )}
      </div>
      <div className="text-center">
        <p className={`text-[11px] font-medium text-gray-700 truncate ${textWidth[size]}`}>
          {file.name}
        </p>
        <p className="text-[10px] text-gray-400">({file.sizeLabel})</p>
      </div>
    </button>
  );
}
