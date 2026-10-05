import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

export type BadgeTone = "primary" | "secondary" | "success" | "warning" | "danger" | "muted";

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  dot?: boolean;
}

const toneClasses: Record<BadgeTone, string> = {
  primary: "bg-primary-soft text-primary border-primary/25",
  secondary: "bg-secondary-soft text-secondary border-secondary/25",
  success: "bg-success-soft text-success border-success/25",
  warning: "bg-warning-soft text-warning border-warning/25",
  danger: "bg-danger-soft text-danger border-danger/25",
  muted: "bg-surface-elevated text-ink-muted border-border-strong",
};

const dotClasses: Record<BadgeTone, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  muted: "bg-ink-subtle",
};

export function Badge({ tone = "muted", children, icon, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium leading-none",
        toneClasses[tone],
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dotClasses[tone])} aria-hidden />}
      {icon && <span className="[&>svg]:size-3.5 inline-flex">{icon}</span>}
      {children}
    </span>
  );
}
