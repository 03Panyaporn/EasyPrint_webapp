"use client";

import { useState } from "react";
import ServicesTabs from "@/components/shop/services/ServicesTabs";
import MainServicesTable from "@/components/shop/services/MainServicesTable";
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
  initialMainServices,
  initialAddOnServices,
  initialDeliveryOptions,
} from "@/lib/mock-data/services-mock";
import { Wrench, CheckCircle } from "lucide-react";

export default function ServicesPage() {
  // ── 1. States ──────────────────────────────────
  const [activeTab, setActiveTab] = useState<ServiceTypeTab>("main");

  const [mainServices, setMainServices] = useState<MainService[]>(initialMainServices);
  const [addOnServices, setAddOnServices] = useState<AddOnService[]>(initialAddOnServices);
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>(initialDeliveryOptions);
  const [isAllDeliveryEnabled, setIsAllDeliveryEnabled] = useState(true);

  // Modal States
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingMainService, setEditingMainService] = useState<MainService | null>(null);
  const [editingAddOnService, setEditingAddOnService] = useState<AddOnService | null>(null);
  const [serviceModalDefaultType, setServiceModalDefaultType] = useState<"main" | "addon">("main");

  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<DeliveryOption | null>(null);

  // Toast Notice State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ── 2. CRUD Handlers: Main Services ────────────
  const handleSaveMainService = (service: MainService) => {
    setMainServices((prev) => {
      const exists = prev.some((s) => s.id === service.id);
      if (exists) {
        return prev.map((s) => (s.id === service.id ? service : s));
      }
      return [service, ...prev];
    });
    showToast(`บันทึกบริการหลัก "${service.name}" เรียบร้อยแล้ว`);
  };

  const handleDeleteMainService = (id: string) => {
    const target = mainServices.find((s) => s.id === id);
    setMainServices((prev) => prev.filter((s) => s.id !== id));
    if (target) showToast(`ลบบริการหลัก "${target.name}" เรียบร้อยแล้ว`);
  };

  const handleToggleMainActive = (id: string) => {
    setMainServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  // ── 3. CRUD Handlers: Add-On Services ──────────
  const handleSaveAddOnService = (addOn: AddOnService) => {
    setAddOnServices((prev) => {
      const exists = prev.some((a) => a.id === addOn.id);
      if (exists) {
        return prev.map((a) => (a.id === addOn.id ? addOn : a));
      }
      return [addOn, ...prev];
    });
    showToast(`บันทึกบริการเสริม "${addOn.name}" เรียบร้อยแล้ว`);
  };

  const handleDeleteAddOnService = (id: string) => {
    const target = addOnServices.find((a) => a.id === id);
    setAddOnServices((prev) => prev.filter((a) => a.id !== id));
    // Remove binding from main services as well
    setMainServices((prev) =>
      prev.map((m) => ({
        ...m,
        availableAddOns: m.availableAddOns.filter((b) => b.addOnId !== id),
      }))
    );
    if (target) showToast(`ลบบริการเสริม "${target.name}" เรียบร้อยแล้ว`);
  };

  const handleToggleAddOnActive = (id: string) => {
    setAddOnServices((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
  };

  // ── 4. CRUD Handlers: Delivery Options ─────────
  const handleSaveDelivery = (delivery: DeliveryOption) => {
    setDeliveryOptions((prev) => {
      const exists = prev.some((d) => d.id === delivery.id);
      if (exists) {
        return prev.map((d) => (d.id === delivery.id ? delivery : d));
      }
      return [delivery, ...prev];
    });
    showToast(`บันทึกประเภทการจัดส่ง "${delivery.name}" เรียบร้อยแล้ว`);
  };

  const handleDeleteDelivery = (id: string) => {
    const target = deliveryOptions.find((d) => d.id === id);
    setDeliveryOptions((prev) => prev.filter((d) => d.id !== id));
    if (target) showToast(`ลบประเภทการจัดส่ง "${target.name}" เรียบร้อยแล้ว`);
  };

  const handleToggleDeliveryActive = (id: string) => {
    setDeliveryOptions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isActive: !d.isActive } : d))
    );
  };

  // ── 5. Modal Trigger Helpers ───────────────────
  const openAddServiceModal = (type: "main" | "addon") => {
    setEditingMainService(null);
    setEditingAddOnService(null);
    setServiceModalDefaultType(type);
    setIsServiceModalOpen(true);
  };

  const openEditMainServiceModal = (service: MainService) => {
    setEditingMainService(service);
    setEditingAddOnService(null);
    setServiceModalDefaultType("main");
    setIsServiceModalOpen(true);
  };

  const openEditAddOnServiceModal = (addOn: AddOnService) => {
    setEditingAddOnService(addOn);
    setEditingMainService(null);
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
        <MainServicesTable
          services={mainServices}
          allAddOns={addOnServices}
          onAddClick={() => openAddServiceModal("main")}
          onEditClick={openEditMainServiceModal}
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

      {/* Shared Service Modal (Main & Add-on) */}
      <AddServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onSaveMain={handleSaveMainService}
        onSaveAddOn={handleSaveAddOnService}
        allAddOnServices={addOnServices}
        allMainServices={mainServices}
        editingMainService={editingMainService}
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
