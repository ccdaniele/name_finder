"use client";

import type { WizardStep } from "@/lib/types";

interface StepIndicatorProps {
  currentStep: WizardStep;
}

const STEPS: { key: WizardStep; label: string }[] = [
  { key: "input", label: "Input" },
  { key: "summary", label: "Summary" },
  { key: "interview", label: "Interview" },
  { key: "generation", label: "Generate" },
  { key: "results", label: "Results" },
];

const STEP_ORDER: WizardStep[] = ["input", "summary", "interview", "generation", "results"];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <div className="flex items-center justify-center gap-2 py-6">
      {STEPS.map((step, index) => {
        const isActive = index === currentIndex;
        const isComplete = index < currentIndex;

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : isComplete
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] opacity-60"
                      : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                }`}
              >
                {isComplete ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`text-xs mt-1.5 ${
                  isActive
                    ? "text-[var(--foreground)] font-medium"
                    : "text-[var(--muted-foreground)]"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`w-12 h-px mx-2 mt-[-16px] ${
                  index < currentIndex
                    ? "bg-[var(--primary)] opacity-60"
                    : "bg-[var(--border)]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
