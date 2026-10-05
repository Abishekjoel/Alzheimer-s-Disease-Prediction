import { Check } from "lucide-react";

import { cn } from "@/utils/cn";

export interface Step {
  label: string;
}

export function Stepper({ steps, current }: { steps: Step[]; current: number }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-4">
      {steps.map((step, i) => {
        const index = i + 1;
        const isComplete = index < current;
        const isCurrent = index === current;
        return (
          <li key={step.label} className="flex flex-1 items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-[12.5px] font-semibold transition-colors duration-[var(--duration-fast)]",
                  isComplete
                    ? "border-success bg-success text-white"
                    : isCurrent
                      ? "border-primary bg-primary text-white"
                      : "border-border-strong text-ink-subtle",
                )}
              >
                {isComplete ? <Check className="size-4" /> : index}
              </span>
              <span className={cn("hidden text-[13px] font-medium sm:inline", isCurrent ? "text-ink" : "text-ink-subtle")}>
                {step.label}
              </span>
            </div>
            {index < steps.length && <span className={cn("h-px flex-1", isComplete ? "bg-success" : "bg-border-strong")} />}
          </li>
        );
      })}
    </ol>
  );
}
