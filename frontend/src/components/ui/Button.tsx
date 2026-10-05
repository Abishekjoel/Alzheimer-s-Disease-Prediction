import { Loader2 } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white shadow-glow-primary hover:bg-primary-hover active:scale-[0.98] disabled:shadow-none",
  secondary: "bg-surface-elevated text-ink border border-border-strong hover:border-primary/40 hover:bg-surface-overlay",
  outline: "bg-transparent text-ink border border-border-strong hover:border-primary/50 hover:bg-surface/60",
  ghost: "bg-transparent text-ink-muted hover:text-ink hover:bg-surface-elevated",
  danger: "bg-danger text-white hover:brightness-110 active:scale-[0.98]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-[var(--radius-sm)]",
  md: "h-10 px-4 text-sm gap-2 rounded-[var(--radius-md)]",
  lg: "h-12 px-6 text-[15px] gap-2 rounded-[var(--radius-md)]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", loading, iconLeft, iconRight, disabled, children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium whitespace-nowrap",
          "transition-all duration-[var(--duration-fast)] ease-[var(--ease-premium)]",
          "disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none",
          "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          iconLeft && <span className="inline-flex shrink-0 [&>svg]:size-4">{iconLeft}</span>
        )}
        {children && <span>{children}</span>}
        {!loading && iconRight && <span className="inline-flex shrink-0 [&>svg]:size-4">{iconRight}</span>}
      </button>
    );
  },
);
Button.displayName = "Button";
