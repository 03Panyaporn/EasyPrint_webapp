"use client";

import { Order, OrderStatus } from "./types";
import { statusConfig, statusOrder } from "./statusConfig";

interface OrderStatusCardsProps {
  orders: Order[];
  activeStatus: OrderStatus | null;
  onSelectStatus: (status: OrderStatus | null) => void;
}

export default function OrderStatusCards({
  orders,
  activeStatus,
  onSelectStatus,
}: OrderStatusCardsProps) {
  const counts = statusOrder.reduce<Record<OrderStatus, number>>((acc, status) => {
    acc[status] = orders.filter((o) => o.status === status).length;
    return acc;
  }, {} as Record<OrderStatus, number>);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {statusOrder.map((status) => {
        const meta = statusConfig[status];
        const Icon = meta.icon;
        const isActive = activeStatus === status;

        return (
          <button
            key={status}
            onClick={() => onSelectStatus(isActive ? null : status)}
            className={`flex items-center gap-3 bg-white rounded-2xl border p-4 text-left shadow-sm transition-all duration-150 ${
              isActive
                ? "border-orange-300 ring-2 ring-orange-500/20"
                : "border-gray-100 hover:border-gray-200"
            }`}
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${meta.iconBg}`}
            >
              <Icon size={20} className={meta.iconColor} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-500 truncate">
                {meta.label}
              </p>
              <p className="text-lg font-bold text-gray-800 leading-tight">
                {counts[status]} <span className="text-xs font-medium text-gray-400">ออเดอร์</span>
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
