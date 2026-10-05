import { useId, useState, type ReactNode } from "react";

import { cn } from "@/utils/cn";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom";
}

export function Tooltip({ content, children, side = "top" }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      <span
        role="tooltip"
        id={id}
        className={cn(
          "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-[var(--radius-sm)] border border-border-strong bg-surface-overlay px-2.5 py-1.5 text-[12px] text-ink shadow-[var(--shadow-md)]",
          "transition-all duration-[var(--duration-fast)] ease-[var(--ease-premium)]",
          side === "top" ? "bottom-full mb-2" : "top-full mt-2",
          open ? "opacity-100 translate-y-0" : "opacity-0 pointer-events-none translate-y-1",
        )}
      >
        {content}
      </span>
    </span>
  );
}
