import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/Button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; icon?: ReactNode };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface/50 px-6 py-16 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-surface-elevated text-ink-subtle">
        <Icon className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-ink">{title}</p>
        {description && <p className="max-w-sm text-[13px] text-ink-muted">{description}</p>}
      </div>
      {action && (
        <Button size="sm" onClick={action.onClick} iconLeft={action.icon} className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  );
}
