"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import ServiceBuilderWizard from "@/components/shop/services/wizard/ServiceBuilderWizard";
import { getMyShop, getAddOnServices } from "@/lib/api/services";
import { ApiError } from "@/lib/api/client";
import type { AddOnService } from "@/components/shop/services/types";

export default function NewServicePage() {
  const [shopId, setShopId] = useState<string | null>(null);
  const [addOns, setAddOns] = useState<AddOnService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { shop } = await getMyShop();
        const { addOns: ao } = await getAddOnServices(shop.id);
        setShopId(shop.id);
        setAddOns(ao);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "โหลดข้อมูลร้านค้าไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen gap-2 text-gray-400">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">กำลังโหลด...</span>
      </div>
    );
  }

  if (error || !shopId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-red-500">{error || "ไม่พบข้อมูลร้านค้า"}</p>
      </div>
    );
  }

  return (
    <ServiceBuilderWizard
      mode="create"
      shopId={shopId}
      availableAddOns={addOns}
    />
  );
}
