import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({ eyebrow, title, description, align = "left", className }: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-col gap-4", align === "center" && "items-center text-center", className)}>
      {eyebrow && (
        <span className="mono-tag inline-flex w-fit items-center gap-2 rounded-full border border-border-strong bg-surface px-3 py-1 text-[11px] font-medium uppercase text-primary">
          <span className="size-1.5 rounded-full bg-primary" />
          {eyebrow}
        </span>
      )}
      <h2 className={cn("text-balance text-3xl font-semibold text-ink sm:text-4xl", align === "center" && "max-w-2xl")}>
        {title}
      </h2>
      {description && (
        <p className={cn("text-balance text-[15px] leading-relaxed text-ink-muted sm:text-base", align === "center" && "max-w-xl")}>
          {description}
        </p>
      )}
    </div>
  );
}
