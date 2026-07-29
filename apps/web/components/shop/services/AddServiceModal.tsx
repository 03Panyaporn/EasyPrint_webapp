"use client";

import { useState, useEffect } from "react";
import { MainService, AddOnService, AddOnPriceBinding, PriceOption, AreaRate, MainServicePricingMode } from "./types";
import { X, Upload, Layers, AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";
import { uploadFile } from "@/lib/api/uploads";
import { ApiError } from "@/lib/api/client";

const QUICK_PAPER_SIZES = ["A4", "A3", "A5"];

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMain: (service: MainService) => void;
  onSaveAddOn: (addOn: AddOnService) => void;
  allAddOnServices: AddOnService[];
  allMainServices: MainService[];
  editingMainService?: MainService | null;
  editingAddOnService?: AddOnService | null;
  defaultType?: "main" | "addon";
}

export default function AddServiceModal({
  isOpen,
  onClose,
  onSaveMain,
  onSaveAddOn,
  allAddOnServices,
  allMainServices,
  editingMainService,
  editingAddOnService,
  defaultType = "main",
}: AddServiceModalProps) {
  const [serviceType, setServiceType] = useState<"main" | "addon">("main");

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  // ราคาบริการเสริม (addon) ใช้ฟิลด์นี้ตรงๆ — บริการหลัก (main) ใช้ priceOptions/areaRates แทนตาม pricingMode
  const [price, setPrice] = useState<number | "">(0);
  const [pricingMode, setPricingMode] = useState<MainServicePricingMode>("fixed");
  const [priceOptions, setPriceOptions] = useState<PriceOption[]>([]);
  const [draftPaperSize, setDraftPaperSize] = useState("A4");
  const [draftColor, setDraftColor] = useState("ขาวดำ");
  const [draftPrice, setDraftPrice] = useState<number | "">("");
  const [areaRates, setAreaRates] = useState<AreaRate[]>([]);
  const [draftAreaColor, setDraftAreaColor] = useState("ขาวดำ");
  const [draftAreaRate, setDraftAreaRate] = useState<number | "">("");
  const [unit, setUnit] = useState("แผ่น");
  const [estimatedTime, setEstimatedTime] = useState("5 นาที");
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // AddOn Bindings for Main Service
  const [selectedAddOns, setSelectedAddOns] = useState<AddOnPriceBinding[]>([]);
  const [noAddOns, setNoAddOns] = useState(false);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingMainService) {
      setServiceType("main");
      setName(editingMainService.name);
      setDescription(editingMainService.description || "");
      setPricingMode(editingMainService.pricingMode || "fixed");
      setPriceOptions(editingMainService.priceOptions || []);
      setAreaRates(editingMainService.areaRates || []);
      setDraftPaperSize("A4");
      setDraftColor("ขาวดำ");
      setDraftPrice("");
      setDraftAreaColor("ขาวดำ");
      setDraftAreaRate("");
      setUnit(editingMainService.unit || "แผ่น");
      setEstimatedTime(editingMainService.estimatedTime || "5 นาที");
      setIsActive(editingMainService.isActive);
      setImageUrl(editingMainService.imageUrl || "");
      setImageFile(null);
      setSelectedAddOns(editingMainService.availableAddOns || []);
      setNoAddOns((editingMainService.availableAddOns || []).length === 0);
    } else if (editingAddOnService) {
      setServiceType("addon");
      setName(editingAddOnService.name);
      setDescription(editingAddOnService.description || "");
      setPrice(editingAddOnService.price);
      setUnit(editingAddOnService.unit || "ชิ้น");
      setEstimatedTime(editingAddOnService.estimatedTime || "5 นาที");
      setIsActive(editingAddOnService.isActive);
      setImageUrl(editingAddOnService.imageUrl || "");
      setImageFile(null);
      setSelectedAddOns([]);
    } else {
      // Reset form
      setServiceType(defaultType);
      setName("");
      setDescription("");
      setPrice(0);
      setPricingMode("fixed");
      setPriceOptions([]);
      setDraftPaperSize("A4");
      setDraftColor("ขาวดำ");
      setDraftPrice("");
      setAreaRates([]);
      setDraftAreaColor("ขาวดำ");
      setDraftAreaRate("");
      setUnit(defaultType === "main" ? "แผ่น" : "เล่ม");
      setEstimatedTime("5 นาที");
      setIsActive(true);
      setImageUrl("");
      setImageFile(null);
      setSelectedAddOns([]);
      setNoAddOns(false);
    }
    setErrors({});
    setIsUploading(false);
  }, [editingMainService, editingAddOnService, defaultType, isOpen]);

  if (!isOpen) return null;

  const isEditing = !!(editingMainService || editingAddOnService);

  const handleServiceTypeChange = (type: "main" | "addon") => {
    if (isEditing) return; // ห้ามเปลี่ยนประเภทระหว่างแก้ไข ไม่งั้นจะบันทึกเป็นรายการใหม่แทนการแก้ไขของเดิม
    setServiceType(type);
    setUnit(type === "main" ? "แผ่น" : "เล่ม");
  };

  const handleAddPriceOption = () => {
    const size = draftPaperSize.trim();
    if (!size) {
      setErrors((e) => ({ ...e, priceOptions: "กรุณากรอกขนาด" }));
      return;
    }
    if (draftPrice === "" || Number(draftPrice) < 0) {
      setErrors((e) => ({ ...e, priceOptions: "กรุณากรอกราคาที่ถูกต้อง" }));
      return;
    }
    const isDuplicate = priceOptions.some(
      (p) => p.paperSize.trim().toLowerCase() === size.toLowerCase() && p.color === draftColor
    );
    if (isDuplicate) {
      setErrors((e) => ({ ...e, priceOptions: `มีขนาด "${size}" + สี "${draftColor}" อยู่แล้ว` }));
      return;
    }
    setPriceOptions([...priceOptions, { paperSize: size, color: draftColor, price: Number(draftPrice) }]);
    setDraftPrice("");
    setErrors((e) => {
      const { priceOptions: _removed, ...rest } = e;
      return rest;
    });
  };

  const handleRemovePriceOption = (index: number) => {
    setPriceOptions(priceOptions.filter((_, i) => i !== index));
  };

  const handleAddAreaRate = () => {
    if (draftAreaRate === "" || Number(draftAreaRate) < 0) {
      setErrors((e) => ({ ...e, areaRates: "กรุณากรอกอัตราราคาที่ถูกต้อง" }));
      return;
    }
    const isDuplicate = areaRates.some((r) => r.color === draftAreaColor);
    if (isDuplicate) {
      setErrors((e) => ({ ...e, areaRates: `มีสี "${draftAreaColor}" อยู่แล้ว` }));
      return;
    }
    setAreaRates([...areaRates, { color: draftAreaColor, ratePerSqm: Number(draftAreaRate) }]);
    setDraftAreaRate("");
    setErrors((e) => {
      const { areaRates: _removed, ...rest } = e;
      return rest;
    });
  };

  const handleRemoveAreaRate = (index: number) => {
    setAreaRates(areaRates.filter((_, i) => i !== index));
  };

  const handleAddOnToggle = (addOnId: string, defaultAddOnPrice: number) => {
    if (noAddOns) setNoAddOns(false);

    const exists = selectedAddOns.find((b) => b.addOnId === addOnId);
    if (exists) {
      setSelectedAddOns(selectedAddOns.filter((b) => b.addOnId !== addOnId));
    } else {
      setSelectedAddOns([
        ...selectedAddOns,
        { addOnId, extraPrice: defaultAddOnPrice },
      ]);
    }
  };

  const handleExtraPriceChange = (addOnId: string, newExtraPrice: number) => {
    const safePrice = Math.max(0, newExtraPrice);
    setSelectedAddOns(
      selectedAddOns.map((b) =>
        b.addOnId === addOnId ? { ...b, extraPrice: safePrice } : b
      )
    );
  };

  const handleNoAddOnsToggle = () => {
    setNoAddOns(!noAddOns);
    if (!noAddOns) {
      setSelectedAddOns([]);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "กรุณากรอกชื่อบริการ";
    else {
      const trimmedName = name.trim().toLowerCase();
      const currentId = serviceType === "main" ? editingMainService?.id : editingAddOnService?.id;
      const duplicateList = serviceType === "main" ? allMainServices : allAddOnServices;
      const isDuplicate = duplicateList.some(
        (s) => s.id !== currentId && s.name.trim().toLowerCase() === trimmedName
      );
      if (isDuplicate) errs.name = "มีบริการชื่อนี้อยู่แล้ว กรุณาใช้ชื่ออื่น";
    }
    if (serviceType === "addon" && (price === "" || Number(price) < 0)) {
      errs.price = "กรุณากรอกราคาที่ถูกต้อง";
    }

    if (serviceType === "main" && pricingMode === "fixed" && priceOptions.length === 0) {
      errs.priceOptions = "กรุณาเพิ่มราคาอย่างน้อย 1 รายการ (ขนาด + สี + ราคา)";
    }
    if (serviceType === "main" && pricingMode === "area" && areaRates.length === 0) {
      errs.areaRates = "กรุณาเพิ่มอัตราราคาต่อตารางเมตรอย่างน้อย 1 สี";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    let finalImageUrl = imageUrl;
    if (imageFile) {
      setIsUploading(true);
      try {
        const { url } = await uploadFile(imageFile, "service-image");
        finalImageUrl = url || "";
      } catch (err) {
        setErrors({ image: err instanceof ApiError ? err.message : "อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" });
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    if (serviceType === "main") {
      const newMain: MainService = {
        id: editingMainService ? editingMainService.id : `main-${Date.now()}`,
        name: name.trim(),
        description: description.trim() || undefined,
        pricingMode,
        priceOptions: pricingMode === "fixed" ? priceOptions : [],
        areaRates: pricingMode === "area" ? areaRates : [],
        unit,
        estimatedTime,
        availableAddOns: noAddOns ? [] : selectedAddOns,
        imageUrl: finalImageUrl || undefined,
        isActive,
      };
      onSaveMain(newMain);
    } else {
      const newAddOn: AddOnService = {
        id: editingAddOnService ? editingAddOnService.id : `addon-${Date.now()}`,
        name: name.trim(),
        description: description.trim() || undefined,
        price: Number(price),
        unit,
        estimatedTime,
        imageUrl: finalImageUrl || undefined,
        isActive,
      };
      onSaveAddOn(newAddOn);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              {editingMainService || editingAddOnService
                ? "แก้ไขรายการบริการ"
                : "เพิ่มบริการใหม่"}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              กำหนดรายละเอียด อัตราราคา และตัวเลือกเสริมสำหรับลูกค้า
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Service Type Radio */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              ประเภทบริการ <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`
                  flex items-center gap-3 p-3 rounded-xl border transition-all
                  ${
                    serviceType === "main"
                      ? "border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20"
                      : "border-gray-200 hover:bg-gray-50"
                  }
                  ${isEditing ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                <input
                  type="radio"
                  name="serviceType"
                  value="main"
                  checked={serviceType === "main"}
                  disabled={isEditing}
                  onChange={() => handleServiceTypeChange("main")}
                  className="text-orange-500 focus:ring-orange-500"
                />
                <div>
                  <div className="font-semibold text-sm text-gray-800">บริการหลัก</div>
                  <div className="text-[11px] text-gray-500">พิมพ์, ถ่ายเอกสาร, สแกน ฯลฯ</div>
                </div>
              </label>

              <label
                className={`
                  flex items-center gap-3 p-3 rounded-xl border transition-all
                  ${
                    serviceType === "addon"
                      ? "border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20"
                      : "border-gray-200 hover:bg-gray-50"
                  }
                  ${isEditing ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                <input
                  type="radio"
                  name="serviceType"
                  value="addon"
                  checked={serviceType === "addon"}
                  disabled={isEditing}
                  onChange={() => handleServiceTypeChange("addon")}
                  className="text-orange-500 focus:ring-orange-500"
                />
                <div>
                  <div className="font-semibold text-sm text-gray-800">บริการเสริม</div>
                  <div className="text-[11px] text-gray-500">เข้าเล่ม, เคลือบเอกสาร ฯลฯ</div>
                </div>
              </label>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              ชื่อบริการ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="เช่น ถ่ายเอกสารขาวดำ, เข้าเล่มสันกาว"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              คำอธิบายบริการ (อุปกรณ์/จุดเด่น)
            </label>
            <textarea
              rows={2}
              placeholder="ระบุรายละเอียดสั้น ๆ เพื่อประกอบการตัดสินใจของลูกค้า..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
            />
          </div>

          {/* FIELDS FOR MAIN SERVICE ONLY — เลือกโหมดคิดราคา */}
          {serviceType === "main" && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                วิธีคิดราคา <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    pricingMode === "fixed"
                      ? "border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="pricingMode"
                    checked={pricingMode === "fixed"}
                    onChange={() => setPricingMode("fixed")}
                    className="text-orange-500 focus:ring-orange-500"
                  />
                  <div>
                    <div className="font-semibold text-sm text-gray-800">ราคาคงที่ตามขนาด</div>
                    <div className="text-[11px] text-gray-500">เช่น A4 ขาวดำ ฿1, A3 สี ฿5</div>
                  </div>
                </label>
                <label
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    pricingMode === "area"
                      ? "border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="pricingMode"
                    checked={pricingMode === "area"}
                    onChange={() => setPricingMode("area")}
                    className="text-orange-500 focus:ring-orange-500"
                  />
                  <div>
                    <div className="font-semibold text-sm text-gray-800">ราคาตามพื้นที่ (ตร.ม.)</div>
                    <div className="text-[11px] text-gray-500">ลูกค้ากรอกกว้าง/สูงเอง เช่น โปสเตอร์/ไวนิล</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* ราคาคงที่ตามขนาด + สี */}
          {serviceType === "main" && pricingMode === "fixed" && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                ราคาตามขนาด + สี <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-gray-500 mb-2">
                เพิ่มได้หลายรายการ แต่ละขนาด/สี ตั้งราคาแยกกันเอง — พิมพ์ขนาดเองได้อิสระ ไม่จำกัดแค่ A4/A3/A5
              </p>

              {/* Draft row builder */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2.5">
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PAPER_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setDraftPaperSize(size)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        draftPaperSize === size
                          ? "border-orange-500 bg-orange-50 text-orange-600 font-semibold"
                          : "border-gray-200 text-gray-600 hover:bg-gray-100 bg-white"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
                  <input
                    type="text"
                    placeholder="ขนาด เช่น A4, B5, โปสเตอร์ A2"
                    value={draftPaperSize}
                    onChange={(e) => setDraftPaperSize(e.target.value)}
                    className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white"
                  />
                  <select
                    value={draftColor}
                    onChange={(e) => setDraftColor(e.target.value)}
                    className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white"
                  >
                    <option value="ขาวดำ">ขาวดำ</option>
                    <option value="สี">สี</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="ราคา (บาท)"
                    value={draftPrice}
                    onChange={(e) => setDraftPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddPriceOption}
                    className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition"
                  >
                    <Plus size={14} /> เพิ่ม
                  </button>
                </div>
              </div>
              {errors.priceOptions && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.priceOptions}
                </p>
              )}

              {/* Added rows table */}
              {priceOptions.length > 0 && (
                <div className="mt-2.5 space-y-1.5">
                  {priceOptions.map((p, i) => (
                    <div
                      key={`${p.paperSize}-${p.color}-${i}`}
                      className="flex items-center justify-between text-xs bg-white px-3 py-2 rounded-lg border border-gray-100"
                    >
                      <span className="text-gray-700">
                        <span className="font-semibold">{p.paperSize}</span>
                        <span className="text-gray-400 mx-1.5">·</span>
                        {p.color}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-orange-600">฿{p.price.toLocaleString()}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePriceOption(i)}
                          className="text-gray-400 hover:text-red-500 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ราคาตามพื้นที่ (ตร.ม.) — ลูกค้ากรอกกว้าง/สูงเองตอนสั่งซื้อ */}
          {serviceType === "main" && pricingMode === "area" && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                อัตราราคาต่อตารางเมตร <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-gray-500 mb-2">
                ลูกค้ากรอกกว้าง x สูงเองตอนสั่งซื้อ ระบบคำนวณราคารวม = พื้นที่ (ตร.ม.) x อัตรานี้โดยอัตโนมัติ ตั้งอัตราแยกตามสีได้
              </p>

              {/* Draft row builder */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-center">
                  <select
                    value={draftAreaColor}
                    onChange={(e) => setDraftAreaColor(e.target.value)}
                    className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white"
                  >
                    <option value="ขาวดำ">ขาวดำ</option>
                    <option value="สี">สี</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="บาท / ตร.ม."
                    value={draftAreaRate}
                    onChange={(e) => setDraftAreaRate(e.target.value === "" ? "" : Number(e.target.value))}
                    className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddAreaRate}
                    className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition"
                  >
                    <Plus size={14} /> เพิ่ม
                  </button>
                </div>
              </div>
              {errors.areaRates && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.areaRates}
                </p>
              )}

              {/* Added rows table */}
              {areaRates.length > 0 && (
                <div className="mt-2.5 space-y-1.5">
                  {areaRates.map((r, i) => (
                    <div
                      key={`${r.color}-${i}`}
                      className="flex items-center justify-between text-xs bg-white px-3 py-2 rounded-lg border border-gray-100"
                    >
                      <span className="text-gray-700 font-semibold">{r.color}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-orange-600">฿{r.ratePerSqm.toLocaleString()} / ตร.ม.</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAreaRate(i)}
                          className="text-gray-400 hover:text-red-500 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Price & Unit Grid — ราคาเดี่ยวใช้กับบริการเสริมเท่านั้น บริการหลักใช้ priceOptions ด้านบนแทน */}
          <div className={`grid grid-cols-1 gap-4 ${serviceType === "addon" ? "sm:grid-cols-2" : ""}`}>
            {serviceType === "addon" && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  ราคาเริ่มต้น (บาท) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
                />
                {errors.price && (
                  <p className="text-xs text-red-500 mt-1">{errors.price}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                หน่วยคิดราคา
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white"
              >
                <option value="แผ่น">ต่อแผ่น</option>
                <option value="เล่ม">ต่อเล่ม</option>
                <option value="ชิ้น">ต่อชิ้น</option>
                <option value="หน้า">ต่อหน้า</option>
                <option value="งาน">ต่องาน</option>
              </select>
            </div>
          </div>

          {/* Estimated Time */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              เวลาสำหรับบริการ (โดยประมาณ)
            </label>
            <select
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 bg-white"
            >
              <option value="2 นาที">2 นาที</option>
              <option value="5 นาที">5 นาที</option>
              <option value="10 นาที">10 นาที</option>
              <option value="15 นาที">15 นาที</option>
              <option value="30 นาที">30 นาที</option>
              <option value="1 ชั่วโมง">1 ชั่วโมง</option>
              <option value="2 ชั่วโมง">2 ชั่วโมง</option>
              <option value="1 วัน">1 วัน</option>
            </select>
          </div>

          {/* MAIN SERVICE ADD-ON BINDING SECTION */}
          {serviceType === "main" && (
            <div className="border-t border-gray-100 pt-5 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Layers size={16} className="text-orange-500" />
                  ผูกบริการเสริมสำหรับบริการหลักนี้
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  เลือกบริการเสริมที่มีในระบบ และสามารถปรับแต่งราคาบวกเพิ่มแยกเฉพาะบริการนี้ได้
                </p>
              </div>

              {/* No Add-ons Checkbox */}
              <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noAddOns}
                  onChange={handleNoAddOnsToggle}
                  className="rounded text-orange-500 focus:ring-orange-500"
                />
                <span className="text-xs font-semibold text-gray-700">
                  ไม่เอาบริการเสริมสำหรับบริการนี้
                </span>
              </label>

              {/* Add-ons List with Extra Price inputs */}
              {!noAddOns && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {allAddOnServices.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">ยังไม่มีบริการเสริมในระบบ</p>
                  ) : (
                    allAddOnServices.map((addOn) => {
                      const binding = selectedAddOns.find((b) => b.addOnId === addOn.id);
                      const isSelected = !!binding;

                      return (
                        <div
                          key={addOn.id}
                          className={`
                            flex items-center justify-between p-3 rounded-xl border transition-all text-xs
                            ${
                              isSelected
                                ? "border-orange-200 bg-orange-50/40"
                                : "border-gray-100 bg-white"
                            }
                          `}
                        >
                          <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 pr-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleAddOnToggle(addOn.id, addOn.price)}
                              className="rounded text-orange-500 focus:ring-orange-500"
                            />
                            <div className="truncate">
                              <span className="font-medium text-gray-800">{addOn.name}</span>
                              <span className="text-gray-400 ml-1.5 text-[11px]">
                                (ราคามาตรฐาน ฿{addOn.price}/{addOn.unit})
                              </span>
                            </div>
                          </label>

                          {isSelected && (
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] text-gray-500">บวกเพิ่ม (บาท):</span>
                              <input
                                type="number"
                                min="0"
                                value={binding.extraPrice}
                                onChange={(e) =>
                                  handleExtraPriceChange(
                                    addOn.id,
                                    Number(e.target.value) || 0
                                  )
                                }
                                className="w-20 px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-right font-bold text-orange-600"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Summary Table of Selected Add-ons */}
              <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                <div className="text-xs font-semibold text-gray-700 mb-2">
                  ตารางสรุปบริการเสริมที่เลือก ({selectedAddOns.length} รายการ)
                </div>
                {selectedAddOns.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-1">
                    กรุณาเลือกบริการเสริมที่ต้องการ
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedAddOns.map((b) => {
                      const addOnObj = allAddOnServices.find((a) => a.id === b.addOnId);
                      return (
                        <div
                          key={b.addOnId}
                          className="flex justify-between items-center text-xs bg-white px-3 py-1.5 rounded-lg border border-gray-100"
                        >
                          <span className="text-gray-700 font-medium">
                            {addOnObj ? addOnObj.name : b.addOnId}
                          </span>
                          <span className="font-bold text-orange-600">
                            +฿{b.extraPrice.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Image Upload */}
          <div className="border-t border-gray-100 pt-5">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              รูปภาพบริการ (ถ้ามี)
            </label>
            <label className="block border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-orange-400 transition-colors cursor-pointer bg-gray-50/50">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
              {imageFile || imageUrl ? (
                <>
                  {imageFile ? (
                    <p className="text-xs text-gray-700 font-semibold">{imageFile.name}</p>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt="" className="mx-auto max-h-24 rounded-lg mb-1.5" />
                  )}
                  <p className="text-[11px] text-orange-500 mt-1 font-medium">คลิกเพื่อเปลี่ยนรูป</p>
                </>
              ) : (
                <>
                  <Upload size={24} className="mx-auto text-gray-400 mb-1.5" />
                  <p className="text-xs text-gray-600 font-medium">
                    คลิกเพื่ออัปโหลด หรือเลือกไฟล์
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    รองรับไฟล์ JPG, PNG, WEBP ขนาดไม่เกิน 5MB
                  </p>
                </>
              )}
            </label>
            {errors.image && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.image}
              </p>
            )}
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <div className="text-xs font-bold text-gray-800">เปิดให้บริการทันที</div>
              <div className="text-[11px] text-gray-500">
                หากปิดอยู่ ลูกค้าจะไม่สามารถเลือกบริการนี้ได้
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isActive ? "bg-orange-500" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl shadow-md shadow-orange-200 transition flex items-center gap-1.5"
            >
              {isUploading && <Loader2 size={14} className="animate-spin" />}
              {isUploading ? "กำลังอัปโหลดรูป..." : "บันทึกบริการ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
