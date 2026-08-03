"use client";

import { Check } from "lucide-react";

const STEPS = [
  { number: 1, label: "ข้อมูลพื้นฐาน" },
  { number: 2, label: "วิธีคิดราคา" },
  { number: 3, label: "ตัวเลือกสินค้า" },
  { number: 4, label: "ไฟล์" },
  { number: 5, label: "บริการเสริม" },
  { number: 6, label: "Preview" },
];

interface StepIndicatorProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  completedSteps: number[];
}

export default function StepIndicator({
  currentStep,
  onStepClick,
  completedSteps,
}: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Desktop: horizontal stepper */}
      <div className="hidden sm:flex items-center justify-center gap-0">
        {STEPS.map((step, i) => {
          const isCompleted = completedSteps.includes(step.number);
          const isCurrent = currentStep === step.number;
          const isClickable = isCompleted && onStepClick;

          return (
            <div key={step.number} className="flex items-center">
              {/* Step circle */}
              <button
                onClick={() => isClickable && onStepClick(step.number)}
                disabled={!isClickable}
                className={`flex flex-col items-center gap-1.5 group ${
                  isClickable ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                    isCompleted
                      ? "bg-orange-500 text-white shadow-md shadow-orange-200 group-hover:bg-orange-600"
                      : isCurrent
                      ? "bg-white border-2 border-orange-500 text-orange-500 shadow-sm"
                      : "bg-gray-100 border-2 border-gray-200 text-gray-400"
                  }`}
                >
                  {isCompleted ? (
                    <Check size={16} strokeWidth={2.5} />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={`text-xs font-medium whitespace-nowrap transition-colors ${
                    isCurrent
                      ? "text-orange-600"
                      : isCompleted
                      ? "text-gray-600"
                      : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </button>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div
                  className={`w-12 lg:w-16 h-0.5 mb-5 mx-1 transition-all duration-300 ${
                    completedSteps.includes(step.number)
                      ? "bg-orange-400"
                      : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: compact progress */}
      <div className="sm:hidden flex items-center gap-3 px-1">
        <div className="flex gap-1.5">
          {STEPS.map((step) => {
            const isCompleted = completedSteps.includes(step.number);
            const isCurrent = currentStep === step.number;
            return (
              <div
                key={step.number}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isCompleted
                    ? "bg-orange-500 w-4"
                    : isCurrent
                    ? "bg-orange-300 w-6"
                    : "bg-gray-200 w-4"
                }`}
              />
            );
          })}
        </div>
        <span className="text-xs text-gray-500 font-medium">
          {currentStep} / {STEPS.length} — {STEPS[currentStep - 1]?.label}
        </span>
      </div>
    </div>
  );
}
