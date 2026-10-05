import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/Card";
import { cn } from "@/utils/cn";

interface MetricCardProps {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  hint?: string;
  tone?: "primary" | "secondary" | "success" | "warning" | "danger" | "muted";
  trend?: { direction: "up" | "down" | "flat"; label: string };
}

const toneClasses = {
  primary: "text-primary bg-primary-soft",
  secondary: "text-secondary bg-secondary-soft",
  success: "text-success bg-success-soft",
  warning: "text-warning bg-warning-soft",
  danger: "text-danger bg-danger-soft",
  muted: "text-ink-muted bg-surface-elevated",
};

export function MetricCard({ label, value, icon: Icon, hint, tone = "muted" }: MetricCardProps) {
  return (
    <Card interactive className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-ink-muted">{label}</span>
        {Icon && (
          <span className={cn("inline-flex size-8 items-center justify-center rounded-[var(--radius-sm)]", toneClasses[tone])}>
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <span className="mono-tag text-2xl font-semibold text-ink">{value}</span>
      {hint && <span className="text-[12px] text-ink-subtle">{hint}</span>}
    </Card>
  );
}
