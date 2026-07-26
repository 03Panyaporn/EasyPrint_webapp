"use client";

import { useState, useEffect } from "react";
import { MainService, AddOnService, AddOnPriceBinding } from "./types";
import { X, Upload, Layers, AlertCircle } from "lucide-react";

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
  const [paperSizes, setPaperSizes] = useState<string[]>(["A4"]);
  const [customPaperSize, setCustomPaperSize] = useState("");
  const [colors, setColors] = useState<string[]>(["ขาวดำ"]);
  const [price, setPrice] = useState<number | "">(0);
  const [unit, setUnit] = useState("แผ่น");
  const [estimatedTime, setEstimatedTime] = useState("5 นาที");
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState("");

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
      setPaperSizes(editingMainService.paperSizes || ["A4"]);
      setCustomPaperSize(editingMainService.customPaperSize || "");
      setColors(editingMainService.colors || ["ขาวดำ"]);
      setPrice(editingMainService.price);
      setUnit(editingMainService.unit || "แผ่น");
      setEstimatedTime(editingMainService.estimatedTime || "5 นาที");
      setIsActive(editingMainService.isActive);
      setImageUrl(editingMainService.imageUrl || "");
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
      setSelectedAddOns([]);
    } else {
      // Reset form
      setServiceType(defaultType);
      setName("");
      setDescription("");
      setPaperSizes(["A4"]);
      setCustomPaperSize("");
      setColors(["ขาวดำ"]);
      setPrice(0);
      setUnit(defaultType === "main" ? "แผ่น" : "เล่ม");
      setEstimatedTime("5 นาที");
      setIsActive(true);
      setImageUrl("");
      setSelectedAddOns([]);
      setNoAddOns(false);
    }
    setErrors({});
  }, [editingMainService, editingAddOnService, defaultType, isOpen]);

  if (!isOpen) return null;

  const isEditing = !!(editingMainService || editingAddOnService);

  const handleServiceTypeChange = (type: "main" | "addon") => {
    if (isEditing) return; // ห้ามเปลี่ยนประเภทระหว่างแก้ไข ไม่งั้นจะบันทึกเป็นรายการใหม่แทนการแก้ไขของเดิม
    setServiceType(type);
    setUnit(type === "main" ? "แผ่น" : "เล่ม");
  };

  const handlePaperSizeChange = (size: string) => {
    if (paperSizes.includes(size)) {
      if (paperSizes.length === 1) return; // Must select at least 1
      setPaperSizes(paperSizes.filter((s) => s !== size));
    } else {
      setPaperSizes([...paperSizes, size]);
    }
  };

  const handleColorChange = (color: string) => {
    if (colors.includes(color)) {
      if (colors.length === 1) return; // Must select at least 1
      setColors(colors.filter((c) => c !== color));
    } else {
      setColors([...colors, color]);
    }
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
    if (price === "" || Number(price) < 0) errs.price = "กรุณากรอกราคาที่ถูกต้อง";

    if (serviceType === "main") {
      if (paperSizes.length === 0) errs.paperSizes = "กรุณาเลือกขนาดกระดาษอย่างน้อย 1 รายการ";
      if (paperSizes.includes("กำหนดเอง") && !customPaperSize.trim()) {
        errs.customPaperSize = "กรุณากรอกขนาดกระดาษแบบกำหนดเอง";
      }
      if (colors.length === 0) errs.colors = "กรุณาเลือกรูปแบบสีอย่างน้อย 1 รายการ";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (serviceType === "main") {
      const newMain: MainService = {
        id: editingMainService ? editingMainService.id : `main-${Date.now()}`,
        name: name.trim(),
        description: description.trim() || undefined,
        paperSizes,
        customPaperSize: paperSizes.includes("กำหนดเอง") ? customPaperSize.trim() : undefined,
        colors,
        price: Number(price),
        unit,
        estimatedTime,
        availableAddOns: noAddOns ? [] : selectedAddOns,
        imageUrl: imageUrl || undefined,
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

          {/* FIELDS FOR MAIN SERVICE ONLY */}
          {serviceType === "main" && (
            <>
              {/* Paper Sizes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  ขนาดกระดาษที่รองรับ <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {["A4", "A3", "A5", "กำหนดเอง"].map((size) => {
                    const selected = paperSizes.includes(size);
                    return (
                      <label
                        key={size}
                        className={`
                          flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border cursor-pointer transition-all
                          ${
                            selected
                              ? "border-orange-500 bg-orange-50 text-orange-600 font-semibold"
                              : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          }
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => handlePaperSizeChange(size)}
                          className="rounded text-orange-500 focus:ring-orange-500"
                        />
                        <span>{size}</span>
                      </label>
                    );
                  })}
                </div>
                {paperSizes.includes("กำหนดเอง") && (
                  <div className="mt-2.5">
                    <input
                      type="text"
                      placeholder="ระบุขนาด เช่น B5, A2, 8x10 นิ้ว"
                      value={customPaperSize}
                      onChange={(e) => setCustomPaperSize(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
                    />
                    {errors.customPaperSize && (
                      <p className="text-xs text-red-500 mt-1">{errors.customPaperSize}</p>
                    )}
                  </div>
                )}
                {errors.paperSizes && (
                  <p className="text-xs text-red-500 mt-1">{errors.paperSizes}</p>
                )}
              </div>

              {/* Colors */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  รูปแบบสีที่รองรับ <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  {["ขาวดำ", "สี"].map((color) => {
                    const selected = colors.includes(color);
                    return (
                      <label
                        key={color}
                        className={`
                          flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border cursor-pointer transition-all
                          ${
                            selected
                              ? "border-orange-500 bg-orange-50 text-orange-600 font-semibold"
                              : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          }
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => handleColorChange(color)}
                          className="rounded text-orange-500 focus:ring-orange-500"
                        />
                        <span>{color}</span>
                      </label>
                    );
                  })}
                </div>
                {errors.colors && (
                  <p className="text-xs text-red-500 mt-1">{errors.colors}</p>
                )}
              </div>
            </>
          )}

          {/* Price & Unit Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Image Upload (Mock) */}
          <div className="border-t border-gray-100 pt-5">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              รูปภาพบริการ (ถ้ามี)
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-orange-400 transition-colors cursor-pointer bg-gray-50/50">
              <Upload size={24} className="mx-auto text-gray-400 mb-1.5" />
              <p className="text-xs text-gray-600 font-medium">
                คลิกเพื่ออัปโหลด หรือลากวางไฟล์ที่นี่
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 2MB
              </p>
            </div>
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
              className="px-5 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-md shadow-orange-200 transition"
            >
              บันทึกบริการ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
