"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StepIndicator from "./StepIndicator";
import TemplatePicker from "./TemplatePicker";
import Step1BasicInfo, { type Step1Data } from "./Step1BasicInfo";
import Step2Pricing, { type Step2Data, type PricingMode } from "./Step2Pricing";
import Step3Options, { type Step3Data } from "./Step3Options";
import Step4FileUpload, { type Step4Data } from "./Step4FileUpload";
import Step5AddOns, { type Step5Data } from "./Step5AddOns";
import Step6Preview from "./Step6Preview";
import type { ServiceTemplate } from "./serviceTemplates";
import type { AddOnService, PricingModel } from "../types";
import {
  createMainService,
  updateMainService,
} from "@/lib/api/services";
import type { MainService } from "../types";
import type { CreateMainServiceInput } from "@easyprint/shared";

export interface WizardFormData {
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
  step5: Step5Data;
}

// Map wizard pricingMode → backend pricingModel
// คืนค่า null ได้เฉพาะตอนร้านค้ายังไม่เลือกอะไรเลยในฟอร์มเปล่าเริ่มต้น — ไปไม่ถึง Step 3/บันทึกจริงได้
// เพราะ Step2Pricing บังคับเลือกก่อนกด "ถัดไป" เสมอแล้ว (ดู validate() ใน Step2Pricing.tsx)
function toPricingModel(mode: Step2Data["pricingMode"]): PricingModel | null {
  if (!mode) return null;
  if (mode === "quantity_tier") return "per_piece";
  return mode;
}

// per_page/per_piece/per_sqm: แถวแรกของ form.step3.colorTiers เป็น "ขาวดำ" เสมอ (ล็อกไว้ที่ Step3Options)
// ค่านั้นคือ basePrice ของบริการโดยตรง ไม่ใช่ ColorTier แถวหนึ่ง — ห้ามส่งไป backend เป็น colorTier ซ้ำกับ basePrice
function isColorMode(pricingMode: Step2Data["pricingMode"]): boolean {
  return pricingMode === "per_page" || pricingMode === "per_piece" || pricingMode === "per_sqm";
}

function buildServiceInput(form: WizardFormData): CreateMainServiceInput {
  const model = toPricingModel(form.step2.pricingMode);
  if (!model) {
    // ไปไม่ถึงจุดนี้ได้จริงถ้า Step2Pricing บังคับเลือกไว้ก่อนกด "ถัดไป" แล้ว — กันเหนียวไว้เผื่อ flow ผิดพลาด
    throw new Error("กรุณาเลือกวิธีคิดราคาก่อนบันทึกบริการ");
  }
  const colorMode = isColorMode(form.step2.pricingMode);
  const [baseColorTier, ...extraColorTiers] = form.step3.colorTiers;

  return {
    name: form.step1.name,
    description: form.step1.description || undefined,
    imageUrl: form.step1.imageUrl || undefined,
    isActive: form.step1.status === "active",
    estimatedTime: form.step1.estimatedTime || undefined,
    pricingModel: model,
    basePrice:
      form.step2.pricingMode === "quantity_tier"
        ? (form.step2.quantityTiers[0]?.unitPrice ?? 0)
        : colorMode
          ? (baseColorTier?.pricePerUnit ?? 0)
          : (typeof form.step2.basePrice === "number" ? form.step2.basePrice : 0),
    // per_page/per_sqm: หน่วยผูกกับวิธีคำนวณจริงตายตัว — เลือกเองไม่ได้ ส่วน per_piece/quantity_tier ให้ร้านเลือกหน่วยเองที่ Step2 (ดู Step2Pricing.tsx)
    unit: model === "per_page" ? "หน้า" : model === "per_sqm" ? "แผ่น" : form.step2.unit,
    pageCountingMode: form.step2.pageCountingMode,
    colorTiers: colorMode ? extraColorTiers.map((t) => ({ label: t.label, pricePerUnit: t.pricePerUnit })) : [],
    quantityTiers: form.step2.quantityTiers.map((t) => ({
      minQty: t.minQty,
      maxQty: t.maxQty ?? null,
      unitPrice: t.unitPrice,
    })),
    minArea: typeof form.step2.minArea === "number" ? form.step2.minArea : null, // null = ไม่มีขั้นต่ำ (ล้างค่าเดิมตอนแก้ไข)
    areaRoundingIncrement:
      typeof form.step2.areaRoundingIncrement === "number" ? form.step2.areaRoundingIncrement : 0.1,
    options: form.step3.options.map((opt) => ({
      name: opt.name,
      type: opt.type,
      priceCategory: opt.priceCategory,
      values: opt.values.map((v) => ({
        name: v.name,
        extraPrice: v.extraPrice,
        priceScope: v.priceScope,
        // ต้องส่งไปด้วยเสมอ — ไม่งั้น backend ตั้งเป็น false ทุกค่า แล้วตัวเลือก "2 ด้าน" จะไม่ถูกนับเป็นแผ่นตอนคิดราคาจริง
        isDuplex: v.isDuplex ?? false,
      })),
    })) as CreateMainServiceInput["options"],
    requiresFileUpload: form.step4.requiresFileUpload,
    allowedFileTypes: form.step4.allowedFileTypes as CreateMainServiceInput["allowedFileTypes"],
    // ราคาบริการเสริมคิดจาก addon_services.price ของตัวบริการเสริมเอง (cart.ts) — extraPrice ตรงนี้ไม่ถูกใช้คิดราคาแล้ว
    addOns: form.step5.selectedAddOnIds.map((id) => ({ addOnId: id, extraPrice: 0 })),
  };
}

const INITIAL_FORM: WizardFormData = {
  step1: { name: "", description: "", imageUrl: "", status: "active", estimatedTime: "" },
  step2: {
    pricingMode: null,
    basePrice: 1,
    minArea: "",
    areaRoundingIncrement: 0.1,
    colorTiers: [],
    quantityTiers: [],
    pageCountingMode: "by_file_page",
    unit: "ชิ้น",
  },
  step3: { colorTiers: [], options: [] },
  step4: { requiresFileUpload: true, allowedFileTypes: ["pdf", "jpg", "png"] },
  step5: { selectedAddOnIds: [] },
};

function formFromService(service: MainService): WizardFormData {
  const pricingMode: Step2Data["pricingMode"] =
    service.pricingModel === "per_piece" && service.quantityTiers.length > 0
      ? "quantity_tier"
      : (service.pricingModel as Step2Data["pricingMode"]);

  // ต้องเติม "ขาวดำ" กลับเข้าไปเป็นแถวแรกเสมอ เพราะ backend เก็บมันไว้ที่ basePrice ไม่ใช่ colorTiers
  const step3ColorTiers = isColorMode(pricingMode)
    ? [{ label: "ขาวดำ", pricePerUnit: service.basePrice }, ...service.colorTiers]
    : service.colorTiers;

  return {
    step1: {
      name: service.name,
      description: service.description ?? "",
      imageUrl: service.imageUrl ?? "",
      status: service.isActive ? "active" : "draft",
      estimatedTime: (service.estimatedTime as Step1Data["estimatedTime"]) ?? "",
    },
    step2: {
      pricingMode,
      basePrice: service.basePrice,
      minArea: service.minArea ?? "",
      areaRoundingIncrement: service.areaRoundingIncrement ?? 0.1,
      colorTiers: service.colorTiers,
      quantityTiers: service.quantityTiers,
      pageCountingMode: service.pageCountingMode,
      unit: (service.unit as Step2Data["unit"]) || "ชิ้น",
    },
    step3: { colorTiers: step3ColorTiers, options: service.options },
    step4: {
      requiresFileUpload: service.requiresFileUpload,
      allowedFileTypes: service.allowedFileTypes,
    },
    step5: { selectedAddOnIds: service.availableAddOns.map((a) => a.addOnId) },
  };
}

interface ServiceBuilderWizardProps {
  mode: "create" | "edit";
  initialService?: MainService;
  availableAddOns: AddOnService[];
  shopId: string;
  onSuccess?: (service: MainService) => void;
}

export default function ServiceBuilderWizard({
  mode,
  initialService,
  availableAddOns,
  shopId,
  onSuccess,
}: ServiceBuilderWizardProps) {
  const router = useRouter();
  // create: เริ่มที่ step 0 (เลือกประเภทบริการ — TemplatePicker) ก่อนเข้า step 1 เสมอ
  // edit: ไม่มี step 0 (แก้บริการเดิม ไม่ต้องเลือก template ใหม่) เริ่มที่ step 1 ตามเดิม
  const [currentStep, setCurrentStep] = useState(mode === "create" ? 0 : 1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [form, setForm] = useState<WizardFormData>(
    initialService ? formFromService(initialService) : INITIAL_FORM
  );
  const [step3IsFirstRender, setStep3IsFirstRender] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  // ชื่อ template ที่เลือกไว้ใน TemplatePicker (step 0) — null = ยังไม่เลือก/เลือก "กำหนดเอง"/แก้บริการเดิม
  // ใช้แสดง banner "ตั้งค่าเริ่มต้นจากเทมเพลตแล้ว" ใน Step2Pricing/Step3Options — เคลียร์ทิ้งเมื่อเปลี่ยนวิธีคิดราคา
  // (ข้อมูลที่ prefill มาจาก template เดิมไม่ตรงกับโหมดใหม่อีกต่อไป)
  const [templateLabel, setTemplateLabel] = useState<string | null>(null);

  const markCompleted = (step: number) => {
    setCompletedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
  };

  const goTo = (step: number) => {
    markCompleted(currentStep);
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const next = () => goTo(currentStep + 1);
  const back = () => {
    if (currentStep === 0) {
      router.push("/shop/services");
      return;
    }
    if (currentStep === 1) {
      // create: ย้อนกลับจาก step 1 ไปหน้าเลือกประเภทบริการ (step 0) แทนที่จะออกจาก wizard ไปเลย
      // edit: ไม่มี step 0 ให้ย้อนกลับไป ออกจาก wizard ตามพฤติกรรมเดิม
      if (mode === "create") {
        setCurrentStep(0);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        router.push("/shop/services");
      }
      return;
    }
    setCurrentStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // เลือก Service Template ใน Step1 — seed ค่าเริ่มต้นให้ Step2/Step3 เท่านั้น ไม่ล็อก logic ใดๆ ร้านแก้ไขต่อได้ทั้งหมด
  const handleSelectTemplate = (tpl: ServiceTemplate) => {
    setForm({
      ...form,
      step2: {
        ...form.step2,
        pricingMode: tpl.pricingMode,
        basePrice: "",
        minArea: "",
        areaRoundingIncrement: 0.1,
        quantityTiers: tpl.quantityTiers.map((t) => ({ ...t })),
      },
      step3: {
        colorTiers: tpl.colorTiers.map((t) => ({ ...t })),
        options: tpl.options.map((o) => ({ ...o, values: o.values.map((v) => ({ ...v })) })),
      },
    });
    // ไม่ต้อง setStep3IsFirstRender(false) ที่นี่แล้ว (เดิมมีไว้กัน auto-populate ทับข้อมูล template)
    // เพราะเงื่อนไข auto-populate ใน Step3Options (data.options.length === 0) กันตัวเองอยู่แล้วถ้ามาจาก template
    // และปล่อยให้ isInitialRender ยังเป็น true ต่อไปจนกว่า Step3Options เองจะเรียก onInitialRenderDone()
    // ตอน mount ครั้งแรกจริงๆ — จำเป็นเพื่อให้ logic "พับทุกหัวข้อไว้ก่อนตอนเพิ่งเข้า Step3" (Phase 2 ของแผน
    // Option B) ทำงานได้ ไม่งั้น Step3Options เห็น isInitialRender=false ไปแล้วตั้งแต่ยังไม่ทัน mount เลย
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError("");
    try {
      const input = buildServiceInput(form);
      let saved: MainService;
      if (mode === "edit" && initialService) {
        const res = await updateMainService(shopId, initialService.id, input);
        saved = res.service;
      } else {
        const res = await createMainService(shopId, input);
        saved = res.service;
      }
      onSuccess?.(saved);
      router.push("/shop/services?success=1");
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setIsSaving(false);
    }
  };

  const pricingModel = toPricingModel(form.step2.pricingMode);

  return (
    <div className="min-h-screen bg-gray-50/60">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-base font-bold text-gray-900">
              {mode === "create" ? "เพิ่มบริการใหม่" : `แก้ไขบริการ: ${form.step1.name}`}
            </h1>
            <button
              onClick={() => router.push("/shop/services")}
              className="text-xs text-gray-400 hover:text-gray-600 transition"
            >
              ออกโดยไม่บันทึก ✕
            </button>
          </div>
          {/* ซ่อน indicator ตอนอยู่หน้าเลือกประเภทบริการ (step 0) — เป็นหน้าเกริ่นก่อนเข้า 6 ขั้นตอนจริง ไม่นับรวมใน progress */}
          {currentStep > 0 && (
            <StepIndicator
              currentStep={currentStep}
              completedSteps={completedSteps}
              onStepClick={(s) => s <= Math.max(...completedSteps, 1) && goTo(s)}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
          {saveError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
              {saveError}
            </div>
          )}

          {currentStep === 0 && mode === "create" && (
            <TemplatePicker
              onSelect={(tpl) => {
                handleSelectTemplate(tpl);
                // "กำหนดเอง" (BLANK_TEMPLATE) ไม่ได้ prefill อะไรจริง — ไม่ต้องโชว์ banner "ตั้งค่าจากเทมเพลตแล้ว"
                setTemplateLabel(tpl.id === "blank" ? null : tpl.label);
                goTo(1);
              }}
              onBack={back}
            />
          )}

          {currentStep === 1 && (
            <Step1BasicInfo
              data={form.step1}
              onChange={(d) => setForm({ ...form, step1: d })}
              onNext={next}
              onBack={back}
            />
          )}

          {currentStep === 2 && (
            <Step2Pricing
              data={form.step2}
              fromTemplate={templateLabel}
              hasDataToReset={
                form.step3.options.length > 0 ||
                form.step3.colorTiers.length > 0 ||
                form.step2.quantityTiers.length > 0
              }
              onChange={(d) => {
                // Reset step3 options when pricing mode changes
                const modeChanged = d.pricingMode !== form.step2.pricingMode;
                setForm({
                  ...form,
                  // เปลี่ยนวิธีคิดราคาแล้วต้องล้าง quantityTiers เดิมด้วยเสมอ ไม่งั้นถ้าร้านเคยตั้งไว้ตอนเลือก
                  // "per_piece"/"ตามจำนวน" แล้วเปลี่ยนไปโหมดอื่น ค่าที่เหลือค้างจะโดน backend ปฏิเสธตอนบันทึกจริง
                  // (refineQuantityTiersOnlyForPerPiece ใน packages/shared/schemas/service.ts อนุญาตแค่ per_piece เท่านั้น)
                  step2: modeChanged ? { ...d, quantityTiers: [] } : d,
                  step3: modeChanged ? { colorTiers: [], options: [] } : form.step3,
                });
                if (modeChanged) {
                  setStep3IsFirstRender(true);
                  // ข้อมูลจาก template เดิมไม่ตรงกับวิธีคิดราคาใหม่อีกต่อไป — เอา banner ออก
                  setTemplateLabel(null);
                }
              }}
              onNext={next}
              onBack={back}
            />
          )}

          {currentStep === 3 && (
            <Step3Options
              data={form.step3}
              // การันตีไม่เป็น null แล้ว ณ จุดนี้เสมอ เพราะ Step2Pricing บังคับเลือกก่อนกด "ถัดไป" มาถึง Step 3 ได้
              pricingMode={form.step2.pricingMode as PricingMode}
              pricingModel={pricingModel as PricingModel}
              pageCountingMode={form.step2.pageCountingMode}
              fromTemplate={templateLabel}
              onChange={(d) => setForm({ ...form, step3: d })}
              onNext={next}
              onBack={back}
              isInitialRender={step3IsFirstRender}
              onInitialRenderDone={() => setStep3IsFirstRender(false)}
            />
          )}

          {currentStep === 4 && (
            <Step4FileUpload
              data={form.step4}
              onChange={(d) => setForm({ ...form, step4: d })}
              onNext={next}
              onBack={back}
            />
          )}

          {currentStep === 5 && (
            <Step5AddOns
              data={form.step5}
              availableAddOns={availableAddOns}
              onChange={(d) => setForm({ ...form, step5: d })}
              onNext={next}
              onBack={back}
            />
          )}

          {currentStep === 6 && (
            <Step6Preview
              data={form}
              availableAddOns={availableAddOns}
              onSave={handleSave}
              onBack={back}
              isSaving={isSaving}
            />
          )}
        </div>
      </div>
    </div>
  );
}
