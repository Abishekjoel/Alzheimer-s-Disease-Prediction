import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { IconButton } from "@/components/ui/IconButton";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  side?: "left" | "right";
}

export function Drawer({ open, onClose, title, children, side = "left" }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex md:hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fade-in_var(--duration-base)_var(--ease-premium)]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex h-full w-[82%] max-w-xs flex-col bg-surface-elevated border-border-strong animate-[drawer-in_var(--duration-base)_var(--ease-premium)]"
        style={{ [side === "left" ? "borderRight" : "borderLeft"]: "1px solid var(--border-strong)" }}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          {title && <span className="text-sm font-semibold text-ink">{title}</span>}
          <IconButton icon={<X />} label="Close menu" onClick={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto p-2">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
