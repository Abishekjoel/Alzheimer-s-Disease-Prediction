import { ChevronDown } from "lucide-react";
import { forwardRef, type SelectHTMLAttributes, useId } from "react";

import { cn } from "@/utils/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, id, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-[13px] font-medium text-ink-muted">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "w-full h-11 appearance-none rounded-[var(--radius-md)] bg-surface border border-border-strong pl-3.5 pr-9 text-sm text-ink",
              "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
              "transition-colors duration-[var(--duration-fast)]",
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
        </div>
      </div>
    );
  },
);
Select.displayName = "Select";
