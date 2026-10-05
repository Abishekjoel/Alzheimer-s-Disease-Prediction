import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/utils/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({ open, onClose, title, description, children, size = "md" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fade-in_var(--duration-base)_var(--ease-premium)]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        className={cn(
          "relative w-full rounded-[var(--radius-lg)] border border-border-strong bg-surface-elevated shadow-[var(--shadow-lg)]",
          "animate-[modal-in_var(--duration-base)_var(--ease-premium)]",
          sizeClasses[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 p-6 pb-4">
          <div>
            {title && (
              <h2 id="modal-title" className="text-lg font-semibold text-ink">
                {title}
              </h2>
            )}
            {description && <p className="mt-1 text-[13px] text-ink-muted">{description}</p>}
          </div>
          <IconButton icon={<X />} label="Close dialog" onClick={onClose} />
        </div>
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
