"use client";

import { ServiceTypeTab } from "./types";
import { Wrench, Layers, Truck } from "lucide-react";

interface ServicesTabsProps {
  activeTab: ServiceTypeTab;
  onTabChange: (tab: ServiceTypeTab) => void;
  mainCount: number;
  addOnCount: number;
  deliveryCount: number;
}

export default function ServicesTabs({
  activeTab,
  onTabChange,
  mainCount,
  addOnCount,
  deliveryCount,
}: ServicesTabsProps) {
  const tabs = [
    {
      id: "main" as ServiceTypeTab,
      label: "บริการหลัก",
      count: mainCount,
      icon: Wrench,
    },
    {
      id: "addon" as ServiceTypeTab,
      label: "บริการเสริม",
      count: addOnCount,
      icon: Layers,
    },
    {
      id: "delivery" as ServiceTypeTab,
      label: "ตั้งค่าการจัดส่ง",
      count: deliveryCount,
      icon: Truck,
    },
  ];

  return (
    <div className="border-b border-gray-200 mb-6">
      <div className="flex gap-2 sm:gap-6 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-2.5 py-3.5 px-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap relative
                ${
                  isActive
                    ? "border-orange-500 text-orange-600 font-semibold"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              <Icon
                size={18}
                className={isActive ? "text-orange-500" : "text-gray-400"}
              />
              <span>{tab.label}</span>
              <span
                className={`
                  px-2 py-0.5 rounded-full text-xs font-semibold
                  ${
                    isActive
                      ? "bg-orange-100 text-orange-600"
                      : "bg-gray-100 text-gray-600"
                  }
                `}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
