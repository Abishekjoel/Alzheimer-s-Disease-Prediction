import { Check } from "lucide-react";
import { forwardRef, type InputHTMLAttributes, useId } from "react";

import { cn } from "@/utils/cn";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({ className, label, id, ...props }, ref) => {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;
  return (
    <label htmlFor={checkboxId} className="inline-flex items-center gap-2 cursor-pointer select-none">
      <span className="relative inline-flex size-[18px] shrink-0 items-center justify-center">
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className={cn(
            "peer size-[18px] appearance-none rounded-[5px] border border-border-strong bg-surface",
            "checked:bg-primary checked:border-primary transition-colors duration-[var(--duration-fast)]",
            "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
            className,
          )}
          {...props}
        />
        <Check className="pointer-events-none absolute size-3 text-white opacity-0 peer-checked:opacity-100" />
      </span>
      {label && <span className="text-[13px] text-ink-muted">{label}</span>}
    </label>
  );
});
Checkbox.displayName = "Checkbox";
