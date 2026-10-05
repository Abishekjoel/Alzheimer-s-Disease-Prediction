import { AlertTriangle, RotateCw, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/Button";

interface ErrorStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  onRetry?: () => void;
}

/**
 * Generic, user-safe error surface — never renders raw exception text or
 * a stack trace (see project rule against exposing internal errors).
 * Callers pass a short, human description instead.
 */
export function ErrorState({
  icon: Icon = AlertTriangle,
  title = "Something went wrong",
  description = "We couldn't complete that request. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-danger/25 bg-danger-soft px-6 py-14 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-surface text-danger">
        <Icon className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="max-w-sm text-[13px] text-ink-muted">{description}</p>
      </div>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry} iconLeft={<RotateCw />} className="mt-2">
          Try again
        </Button>
      )}
    </div>
  );
}
