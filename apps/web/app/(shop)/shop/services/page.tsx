"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ServicesTabs from "@/components/shop/services/ServicesTabs";
import MainServicesList from "@/components/shop/services/MainServicesTable";
import AddOnServicesTable from "@/components/shop/services/AddOnServicesTable";
import DeliverySettingsTable from "@/components/shop/services/DeliverySettingsTable";
import AddServiceModal from "@/components/shop/services/AddServiceModal";
import AddDeliveryModal from "@/components/shop/services/AddDeliveryModal";
import {
  MainService,
  AddOnService,
  DeliveryOption,
  ServiceTypeTab,
} from "@/components/shop/services/types";
import {
  getMyShop,
  getMainServices,
  createMainService,
  updateMainService,
  deleteMainService,
  duplicateMainService,
  getAddOnServices,
  createAddOnService,
  updateAddOnService,
  deleteAddOnService,
  getDeliveryOptions,
  createDeliveryOption,
  updateDeliveryOption,
  deleteDeliveryOption,
  type MyShop,
} from "@/lib/api/services";
import { ApiError } from "@/lib/api/client";
import type {
  CreateMainServiceInput,
  CreateAddOnServiceInput,
  CreateDeliveryOptionInput,
} from "@easyprint/shared";
import { Wrench, CheckCircle, Loader2 } from "lucide-react";

function toMainServiceInput(service: MainService): CreateMainServiceInput {
  return {
    name: service.name,
    description: service.description,
    pricingModel: service.pricingModel,
    basePrice: Number(service.basePrice),
    requiresFileUpload: service.requiresFileUpload,
    allowedFileTypes: service.allowedFileTypes as CreateMainServiceInput["allowedFileTypes"],
    options: service.options as CreateMainServiceInput["options"],
    colorTiers: service.colorTiers,
    quantityTiers: service.quantityTiers,
    pageCountingMode: service.pageCountingMode,
    minArea: service.minArea ? Number(service.minArea) : undefined,
    areaRoundingIncrement: Number(service.areaRoundingIncrement),
    unit: service.unit as CreateMainServiceInput["unit"],
    estimatedTime: service.estimatedTime as CreateMainServiceInput["estimatedTime"],
    imageUrl: service.imageUrl,
    isActive: service.isActive,
    addOns: service.availableAddOns,
  };
}

function toAddOnServiceInput(service: AddOnService): CreateAddOnServiceInput {
  return {
    name: service.name,
    description: service.description,
    price: Number(service.price),
    unit: service.unit as CreateAddOnServiceInput["unit"],
    estimatedTime: service.estimatedTime as CreateAddOnServiceInput["estimatedTime"],
    imageUrl: service.imageUrl,
    isActive: service.isActive,
  };
}

function toDeliveryOptionInput(delivery: DeliveryOption): CreateDeliveryOptionInput {
  return {
    name: delivery.name,
    description: delivery.description,
    logoUrl: delivery.logoUrl,
    baseFee: Number(delivery.baseFee),
    freeShippingThreshold: delivery.freeShippingThreshold != null ? Number(delivery.freeShippingThreshold) : null,
    isActive: delivery.isActive,
  };
}

function ServicesContent() {
  // ── 1. States ──────────────────────────────────
  const searchParams = useSearchParams();
  const [shop, setShop] = useState<MyShop | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [activeTab, setActiveTab] = useState<ServiceTypeTab>("main");

  const [mainServices, setMainServices] = useState<MainService[]>([]);
  const [addOnServices, setAddOnServices] = useState<AddOnService[]>([]);
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [isAllDeliveryEnabled, setIsAllDeliveryEnabled] = useState(true);

  // Modal States (add-on + delivery only — main service uses wizard route)
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingAddOnService, setEditingAddOnService] = useState<AddOnService | null>(null);
  const [serviceModalDefaultType, setServiceModalDefaultType] = useState<"main" | "addon">("addon");

  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<DeliveryOption | null>(null);

  // Toast Notice State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Show success toast from wizard redirect (?success=1)
  useEffect(() => {
    if (searchParams.get("success") === "1") {
      showToast("เพิ่มบริการสำเร็จ — บริการถูกสร้างและเปิดใช้งานเรียบร้อยแล้ว");
      // Clean URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      window.history.replaceState({}, "", url.toString());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showApiError = (err: unknown, fallback: string) => {
    window.alert(err instanceof ApiError ? err.message : fallback);
  };

  // ── โหลดข้อมูลจริงตอนเข้าหน้า ────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const { shop: myShop } = await getMyShop();
      setShop(myShop);
      setIsAllDeliveryEnabled(myShop.deliveryEnabled);

      const [servicesRes, addOnsRes, deliveryRes] = await Promise.all([
        getMainServices(myShop.id),
        getAddOnServices(myShop.id),
        getDeliveryOptions(myShop.id),
      ]);
      setMainServices(servicesRes.services);
      setAddOnServices(addOnsRes.addOns);
      setDeliveryOptions(deliveryRes.deliveryOptions);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "โหลดข้อมูลร้านค้าไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── 2. CRUD Handlers: Main Services ────────────
  const handleSaveMainService = async (service: MainService) => {
    if (!shop) return;
    const isEditing = mainServices.some((s) => s.id === service.id);
    try {
      if (isEditing) {
        const { service: saved } = await updateMainService(shop.id, service.id, toMainServiceInput(service));
        setMainServices((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
      } else {
        const { service: saved } = await createMainService(shop.id, toMainServiceInput(service));
        setMainServices((prev) => [saved, ...prev]);
      }
      showToast(`บันทึกบริการหลัก "${service.name}" เรียบร้อยแล้ว`);
    } catch (err) {
      showApiError(err, "บันทึกบริการหลักไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleDuplicateMainService = async (service: MainService, newName: string) => {
    if (!shop) return;
    try {
      const { service: saved } = await duplicateMainService(shop.id, service.id);
      // patch name if different
      let final = saved;
      if (newName !== saved.name) {
        const res = await updateMainService(shop.id, saved.id, { name: newName });
        final = res.service;
      }
      setMainServices((prev) => [final, ...prev]);
      showToast(`คัดลอกบริการ "${service.name}" เป็น "${final.name}" แล้ว`);
    } catch (err) {
      showApiError(err, "คัดลอกบริการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleDeleteMainService = async (id: string) => {
    if (!shop) return;
    const target = mainServices.find((s) => s.id === id);
    try {
      await deleteMainService(shop.id, id);
      setMainServices((prev) => prev.filter((s) => s.id !== id));
      if (target) showToast(`ลบบริการหลัก "${target.name}" เรียบร้อยแล้ว`);
    } catch (err) {
      showApiError(err, "ลบบริการหลักไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleToggleMainActive = async (id: string) => {
    if (!shop) return;
    const target = mainServices.find((s) => s.id === id);
    if (!target) return;
    try {
      const { service: saved } = await updateMainService(shop.id, id, { isActive: !target.isActive });
      setMainServices((prev) => prev.map((s) => (s.id === id ? saved : s)));
    } catch (err) {
      showApiError(err, "เปลี่ยนสถานะบริการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  // ── 3. CRUD Handlers: Add-On Services ──────────
  const handleSaveAddOnService = async (addOn: AddOnService) => {
    if (!shop) return;
    const isEditing = addOnServices.some((a) => a.id === addOn.id);
    try {
      if (isEditing) {
        const { addOn: saved } = await updateAddOnService(shop.id, addOn.id, toAddOnServiceInput(addOn));
        setAddOnServices((prev) => prev.map((a) => (a.id === saved.id ? saved : a)));
      } else {
        const { addOn: saved } = await createAddOnService(shop.id, toAddOnServiceInput(addOn));
        setAddOnServices((prev) => [saved, ...prev]);
      }
      showToast(`บันทึกบริการเสริม "${addOn.name}" เรียบร้อยแล้ว`);
    } catch (err) {
      showApiError(err, "บันทึกบริการเสริมไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleDeleteAddOnService = async (id: string) => {
    if (!shop) return;
    const target = addOnServices.find((a) => a.id === id);
    try {
      await deleteAddOnService(shop.id, id);
      setAddOnServices((prev) => prev.filter((a) => a.id !== id));
      // Remove binding from main services as well (ฝั่ง backend cascade ลบ binding ให้แล้ว อันนี้แค่ sync UI local state)
      setMainServices((prev) =>
        prev.map((m) => ({
          ...m,
          availableAddOns: m.availableAddOns.filter((b) => b.addOnId !== id),
        }))
      );
      if (target) showToast(`ลบบริการเสริม "${target.name}" เรียบร้อยแล้ว`);
    } catch (err) {
      showApiError(err, "ลบบริการเสริมไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleToggleAddOnActive = async (id: string) => {
    if (!shop) return;
    const target = addOnServices.find((a) => a.id === id);
    if (!target) return;
    try {
      const { addOn: saved } = await updateAddOnService(shop.id, id, { isActive: !target.isActive });
      setAddOnServices((prev) => prev.map((a) => (a.id === id ? saved : a)));
    } catch (err) {
      showApiError(err, "เปลี่ยนสถานะบริการเสริมไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  // ── 4. CRUD Handlers: Delivery Options ─────────
  const handleSaveDelivery = async (delivery: DeliveryOption) => {
    if (!shop) return;
    const isEditing = deliveryOptions.some((d) => d.id === delivery.id);
    try {
      if (isEditing) {
        const { deliveryOption: saved } = await updateDeliveryOption(
          shop.id,
          delivery.id,
          toDeliveryOptionInput(delivery)
        );
        setDeliveryOptions((prev) => prev.map((d) => (d.id === saved.id ? saved : d)));
      } else {
        const { deliveryOption: saved } = await createDeliveryOption(shop.id, toDeliveryOptionInput(delivery));
        setDeliveryOptions((prev) => [saved, ...prev]);
      }
      showToast(`บันทึกประเภทการจัดส่ง "${delivery.name}" เรียบร้อยแล้ว`);
    } catch (err) {
      showApiError(err, "บันทึกประเภทการจัดส่งไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleDeleteDelivery = async (id: string) => {
    if (!shop) return;
    const target = deliveryOptions.find((d) => d.id === id);
    try {
      await deleteDeliveryOption(shop.id, id);
      setDeliveryOptions((prev) => prev.filter((d) => d.id !== id));
      if (target) showToast(`ลบประเภทการจัดส่ง "${target.name}" เรียบร้อยแล้ว`);
    } catch (err) {
      showApiError(err, "ลบประเภทการจัดส่งไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleToggleDeliveryActive = async (id: string) => {
    if (!shop) return;
    const target = deliveryOptions.find((d) => d.id === id);
    if (!target) return;
    try {
      const { deliveryOption: saved } = await updateDeliveryOption(shop.id, id, { isActive: !target.isActive });
      setDeliveryOptions((prev) => prev.map((d) => (d.id === id ? saved : d)));
    } catch (err) {
      showApiError(err, "เปลี่ยนสถานะการจัดส่งไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  // ── 5. Modal Trigger Helpers ───────────────────
  const openAddServiceModal = (type: "main" | "addon") => {
    setEditingAddOnService(null);
    setServiceModalDefaultType(type);
    setIsServiceModalOpen(true);
  };

  const openEditAddOnServiceModal = (addOn: AddOnService) => {
    setEditingAddOnService(addOn);
    setServiceModalDefaultType("addon");
    setIsServiceModalOpen(true);
  };

  const openAddDeliveryModal = () => {
    setEditingDelivery(null);
    setIsDeliveryModalOpen(true);
  };

  const openEditDeliveryModal = (option: DeliveryOption) => {
    setEditingDelivery(option);
    setIsDeliveryModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-gray-400">
        <Loader2 size={24} className="animate-spin" />
        <p className="text-sm">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (loadError || !shop) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-4">
        <p className="text-sm text-red-500 font-semibold">{loadError || "ไม่พบร้านค้าของบัญชีนี้"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gray-900 text-white text-sm rounded-xl shadow-xl animate-fade-in border border-gray-700">
          <CheckCircle size={18} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-200">
              <Wrench size={20} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              บริการและราคา
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            จัดการรายการบริการพิมพ์ ถ่ายเอกสาร บริการเสริม และตั้งค่าอัตราค่าจัดส่งของร้าน
          </p>
        </div>
      </div>

      {/* Approval status banner — ร้านต้องอนุมัติก่อนถึงจะเพิ่ม/แก้ไข/ลบได้ (backend เช็คซ้ำอีกชั้นอยู่แล้ว) */}
      {shop.approvalStatus !== "approved" && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm font-medium">
          {shop.approvalStatus === "pending"
            ? "ร้านค้ายังไม่ได้รับการอนุมัติจากแอดมิน ยังตั้งบริการและราคาไม่ได้"
            : `ร้านค้าถูกปฏิเสธ${shop.rejectedReason ? `: ${shop.rejectedReason}` : ""} ยังตั้งบริการและราคาไม่ได้`}
        </div>
      )}

      {/* Tabs Controller */}
      <ServicesTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        mainCount={mainServices.length}
        addOnCount={addOnServices.length}
        deliveryCount={deliveryOptions.length}
      />

      {/* Tab Contents */}
      {activeTab === "main" && (
        <MainServicesList
          services={mainServices}
          allAddOns={addOnServices}
          onDuplicateClick={handleDuplicateMainService}
          onDeleteClick={handleDeleteMainService}
          onToggleActive={handleToggleMainActive}
        />
      )}

      {activeTab === "addon" && (
        <AddOnServicesTable
          addOns={addOnServices}
          mainServices={mainServices}
          onAddClick={() => openAddServiceModal("addon")}
          onEditClick={openEditAddOnServiceModal}
          onDeleteClick={handleDeleteAddOnService}
          onToggleActive={handleToggleAddOnActive}
        />
      )}

      {activeTab === "delivery" && (
        <DeliverySettingsTable
          deliveryOptions={deliveryOptions}
          isAllDeliveryEnabled={isAllDeliveryEnabled}
          onToggleAllDelivery={() => setIsAllDeliveryEnabled(!isAllDeliveryEnabled)}
          onAddClick={openAddDeliveryModal}
          onEditClick={openEditDeliveryModal}
          onDeleteClick={handleDeleteDelivery}
          onToggleActive={handleToggleDeliveryActive}
        />
      )}

      {/* Add-On Service Modal (Main services now use wizard route) */}
      <AddServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onSaveMain={handleSaveMainService}
        onSaveAddOn={handleSaveAddOnService}
        allAddOnServices={addOnServices}
        allMainServices={mainServices}
        editingMainService={null}
        editingAddOnService={editingAddOnService}
        defaultType={serviceModalDefaultType}
      />

      {/* Delivery Option Modal */}
      <AddDeliveryModal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
        onSave={handleSaveDelivery}
        allDeliveryOptions={deliveryOptions}
        editingDelivery={editingDelivery}
      />
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">กำลังโหลด...</div>}>
      <ServicesContent />
    </Suspense>
  );
}
