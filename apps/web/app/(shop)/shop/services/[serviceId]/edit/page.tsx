"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import ServiceBuilderWizard from "@/components/shop/services/wizard/ServiceBuilderWizard";
import { getMyShop, getMainServices, getAddOnServices } from "@/lib/api/services";
import { ApiError } from "@/lib/api/client";
import type { AddOnService, MainService } from "@/components/shop/services/types";

export default function EditServicePage() {
  const params = useParams<{ serviceId: string }>();
  const serviceId = params.serviceId;

  const [shopId, setShopId] = useState<string | null>(null);
  const [service, setService] = useState<MainService | null>(null);
  const [addOns, setAddOns] = useState<AddOnService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { shop } = await getMyShop();
        const [{ services }, { addOns: ao }] = await Promise.all([
          getMainServices(shop.id),
          getAddOnServices(shop.id),
        ]);
        const target = services.find((s) => s.id === serviceId);
        if (!target) throw new Error("ไม่พบบริการที่ต้องการแก้ไข");
        setShopId(shop.id);
        setService(target);
        setAddOns(ao);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : (err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ"));
      } finally {
        setLoading(false);
      }
    })();
  }, [serviceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen gap-2 text-gray-400">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">กำลังโหลดข้อมูลบริการ...</span>
      </div>
    );
  }

  if (error || !shopId || !service) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-red-500">{error || "ไม่พบข้อมูลบริการ"}</p>
      </div>
    );
  }

  return (
    <ServiceBuilderWizard
      mode="edit"
      initialService={service}
      shopId={shopId}
      availableAddOns={addOns}
    />
  );
}
