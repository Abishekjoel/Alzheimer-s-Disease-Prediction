import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "@/utils/cn";

/**
 * Used selectively — the floating nav bar, hero overlays, and modal
 * chrome — not as a default card treatment across the app. See design
 * direction: "glass should be used selectively."
 */
export const GlassPanel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "backdrop-blur-xl bg-surface/70 border border-border-strong/60",
        "shadow-[var(--shadow-lg)]",
        className,
      )}
      {...props}
    />
  ),
);
GlassPanel.displayName = "GlassPanel";
