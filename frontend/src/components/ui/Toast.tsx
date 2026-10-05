import { AlertCircle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { createPortal } from "react-dom";

import { cn } from "@/utils/cn";

export type ToastTone = "success" | "warning" | "danger" | "info";

export interface Toast {
  id: number;
  message: string;
  description?: string;
  tone: ToastTone;
}

const toneConfig: Record<ToastTone, { icon: typeof Info; className: string }> = {
  success: { icon: CheckCircle2, className: "text-success" },
  warning: { icon: AlertCircle, className: "text-warning" },
  danger: { icon: XCircle, className: "text-danger" },
  info: { icon: Info, className: "text-secondary" },
};

interface ToastViewportProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) return null;

  return createPortal(
    <div
      role="region"
      aria-live="polite"
      className="fixed top-4 right-4 z-[200] flex w-full max-w-sm flex-col gap-2"
    >
      {toasts.map((toast) => {
        const { icon: Icon, className } = toneConfig[toast.tone];
        return (
          <div
            key={toast.id}
            role="status"
            className="flex items-start gap-3 rounded-[var(--radius-md)] border border-border-strong bg-surface-elevated p-4 shadow-[var(--shadow-lg)] animate-[toast-in_var(--duration-base)_var(--ease-premium)]"
          >
            <Icon className={cn("size-5 shrink-0 mt-0.5", className)} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-ink">{toast.message}</p>
              {toast.description && <p className="mt-0.5 text-[12px] text-ink-muted">{toast.description}</p>}
            </div>
            <button
              aria-label="Dismiss notification"
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 text-ink-subtle hover:text-ink"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
