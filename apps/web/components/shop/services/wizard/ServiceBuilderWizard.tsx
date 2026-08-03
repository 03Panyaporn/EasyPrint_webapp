"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StepIndicator from "./StepIndicator";
import Step1BasicInfo, { type Step1Data } from "./Step1BasicInfo";
import Step2Pricing, { type Step2Data } from "./Step2Pricing";
import Step3Options, { type Step3Data } from "./Step3Options";
import Step4FileUpload, { type Step4Data } from "./Step4FileUpload";
import Step5AddOns, { type Step5Data } from "./Step5AddOns";
import Step6Preview from "./Step6Preview";
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
function toPricingModel(mode: Step2Data["pricingMode"]): PricingModel {
  if (mode === "quantity_tier") return "per_piece";
  return mode;
}

// per_page/per_piece: แถวแรกของ form.step3.colorTiers เป็น "ขาวดำ" เสมอ (ล็อกไว้ที่ Step3Options)
// ค่านั้นคือ basePrice ของบริการโดยตรง ไม่ใช่ ColorTier แถวหนึ่ง — ห้ามส่งไป backend เป็น colorTier ซ้ำกับ basePrice
function isColorMode(pricingMode: Step2Data["pricingMode"]): boolean {
  return pricingMode === "per_page" || pricingMode === "per_piece";
}

function buildServiceInput(form: WizardFormData): CreateMainServiceInput {
  const model = toPricingModel(form.step2.pricingMode);
  const colorMode = isColorMode(form.step2.pricingMode);
  const [baseColorTier, ...extraColorTiers] = form.step3.colorTiers;

  return {
    name: form.step1.name,
    description: form.step1.description || undefined,
    imageUrl: form.step1.imageUrl || undefined,
    isActive: form.step1.status === "active",
    pricingModel: model,
    basePrice:
      form.step2.pricingMode === "quantity_tier"
        ? (form.step2.quantityTiers[0]?.unitPrice ?? 0)
        : colorMode
          ? (baseColorTier?.pricePerUnit ?? 0)
          : (typeof form.step2.basePrice === "number" ? form.step2.basePrice : 0),
    unit: model === "per_page" ? "หน้า" : "ชิ้น",
    pageCountingMode: "by_file_page",
    colorTiers: colorMode ? extraColorTiers.map((t) => ({ label: t.label, pricePerUnit: t.pricePerUnit })) : [],
    quantityTiers: form.step2.quantityTiers.map((t) => ({
      minQty: t.minQty,
      maxQty: t.maxQty ?? null,
      unitPrice: t.unitPrice,
    })),
    minArea: typeof form.step2.minArea === "number" ? form.step2.minArea : undefined,
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
      })),
    })) as CreateMainServiceInput["options"],
    requiresFileUpload: form.step4.requiresFileUpload,
    allowedFileTypes: form.step4.allowedFileTypes as CreateMainServiceInput["allowedFileTypes"],
    addOns: form.step5.selectedAddOnIds.map((id) => ({ addOnId: id, extraPrice: 0 })),
  };
}

const INITIAL_FORM: WizardFormData = {
  step1: { name: "", description: "", imageUrl: "", status: "active" },
  step2: {
    pricingMode: "per_page",
    basePrice: 1,
    minArea: "",
    areaRoundingIncrement: 0.1,
    colorTiers: [],
    quantityTiers: [],
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
      status: service.isActive ? "active" : "inactive",
    },
    step2: {
      pricingMode,
      basePrice: service.basePrice,
      minArea: service.minArea ?? "",
      areaRoundingIncrement: service.areaRoundingIncrement ?? 0.1,
      colorTiers: service.colorTiers,
      quantityTiers: service.quantityTiers,
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
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [form, setForm] = useState<WizardFormData>(
    initialService ? formFromService(initialService) : INITIAL_FORM
  );
  const [step3IsFirstRender, setStep3IsFirstRender] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

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
    if (currentStep === 1) {
      router.push("/shop/services");
    } else {
      setCurrentStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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
          <StepIndicator
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={(s) => s <= Math.max(...completedSteps, 1) && goTo(s)}
          />
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
              onChange={(d) => {
                // Reset step3 options when pricing mode changes
                const modeChanged = d.pricingMode !== form.step2.pricingMode;
                setForm({
                  ...form,
                  step2: d,
                  step3: modeChanged ? { colorTiers: [], options: [] } : form.step3,
                });
                if (modeChanged) setStep3IsFirstRender(true);
              }}
              onNext={next}
              onBack={back}
            />
          )}

          {currentStep === 3 && (
            <Step3Options
              data={form.step3}
              pricingMode={form.step2.pricingMode}
              pricingModel={pricingModel}
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
