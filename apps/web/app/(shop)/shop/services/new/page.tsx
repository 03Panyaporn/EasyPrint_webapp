"use client";

import { useEffect, useState } from "react";
import ServiceBuilderWizard from "@/components/shop/services/wizard/ServiceBuilderWizard";
import { getMyShop, getAddOnServices } from "@/lib/api/services";
import { ApiError } from "@/lib/api/client";
import type { AddOnService } from "@/components/shop/services/types";
import { LoadingSection } from "@/components/ui/Spinner";

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
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSection label="กำลังโหลดข้อมูลร้านค้า..." />
      </div>
    );
  }

  if (error || !shopId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center border-2 border-dashed border-red-200 space-y-3 max-w-md">
          <p className="text-sm sm:text-base text-red-500 font-semibold">{error || "ไม่พบข้อมูลร้านค้า"}</p>
        </div>
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
