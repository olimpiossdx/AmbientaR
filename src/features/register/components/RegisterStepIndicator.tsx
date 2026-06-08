import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { TITULAR_STEP_COUNT } from "../types/register.types";
import type { RegisterStep } from "../types/register.types";

type RegisterStepIndicatorProps = {
  step: RegisterStep;
};

export function RegisterStepIndicator({ step }: RegisterStepIndicatorProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 mb-6">
      {Array.from({ length: TITULAR_STEP_COUNT }, (_, i) => i + 1).map((s) => (
        <div key={s} className="contents">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all shrink-0",
              step === s
                ? "bg-primary text-primary-foreground scale-110"
                : step > s
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {step > s ? <Check className="h-4 w-4" /> : s}
          </div>
          {s < TITULAR_STEP_COUNT && (
            <div
              className={cn(
                "h-0.5 w-4 sm:w-8 transition-all shrink",
                step > s ? "bg-primary" : "bg-muted",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
