import { useEffect, useRef } from "react";

import { gsap, prefersReducedMotion } from "@/animations/gsap";
import { formatPercent } from "@/utils/format";
import { cn } from "@/utils/cn";

interface ProbabilityBarProps {
  label: string;
  value: number;
  tone?: "success" | "warning" | "danger" | "primary";
  highlighted?: boolean;
}

const toneClasses: Record<NonNullable<ProbabilityBarProps["tone"]>, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  primary: "bg-primary",
};

export function ProbabilityBar({ label, value, tone = "primary", highlighted }: ProbabilityBarProps) {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fillRef.current) return;
    const pct = `${Math.max(0, Math.min(1, value)) * 100}%`;
    if (prefersReducedMotion()) {
      gsap.set(fillRef.current, { width: pct });
      return;
    }
    gsap.fromTo(fillRef.current, { width: "0%" }, { width: pct, duration: 1, ease: "expo.out" });
  }, [value]);

  return (
    <div className="flex items-center gap-3">
      <span className={cn("w-12 shrink-0 text-[12.5px] font-medium", highlighted ? "text-ink" : "text-ink-muted")}>
        {label}
      </span>
      <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-surface-elevated">
        <div ref={fillRef} className={cn("absolute inset-y-0 left-0 rounded-full", toneClasses[tone])} style={{ width: 0 }} />
      </div>
      <span className="mono-tag w-12 shrink-0 text-right text-[12.5px] text-ink-muted">{formatPercent(value)}</span>
    </div>
  );
}
