import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from "react";

import { cn } from "@/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  iconLeft?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, iconLeft, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-ink-muted">
            {label}
          </label>
        )}
        <div className="relative">
          {iconLeft && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle [&>svg]:size-4">
              {iconLeft}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={errorId ?? hintId}
            className={cn(
              "w-full h-11 rounded-[var(--radius-md)] bg-surface border border-border-strong px-3.5 text-sm text-ink",
              "placeholder:text-ink-subtle transition-colors duration-[var(--duration-fast)]",
              "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
              error && "border-danger focus:border-danger focus:ring-danger/20",
              iconLeft && "pl-10",
              className,
            )}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-[12px] text-danger">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={hintId} className="text-[12px] text-ink-subtle">
            {hint}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
