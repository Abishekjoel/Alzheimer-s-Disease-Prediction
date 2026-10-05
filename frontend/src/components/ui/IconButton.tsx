import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/utils/cn";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  variant?: "default" | "ghost" | "filled";
  size?: "sm" | "md";
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, variant = "default", size = "md", className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        className={cn(
          "inline-flex items-center justify-center rounded-[var(--radius-sm)] shrink-0",
          "transition-colors duration-[var(--duration-fast)]",
          "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
          "disabled:opacity-40 disabled:pointer-events-none",
          size === "sm" ? "size-8 [&>svg]:size-4" : "size-10 [&>svg]:size-[18px]",
          variant === "default" && "text-ink-muted hover:text-ink hover:bg-surface-elevated",
          variant === "ghost" && "text-ink-muted hover:text-ink",
          variant === "filled" && "bg-surface-elevated text-ink hover:bg-surface-overlay border border-border",
          className,
        )}
        {...props}
      >
        {icon}
      </button>
    );
  },
);
IconButton.displayName = "IconButton";
