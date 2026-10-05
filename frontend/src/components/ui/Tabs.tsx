import { useRef, useState, type ReactNode } from "react";

import { cn } from "@/utils/cn";

export interface TabItem {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Tabs({ items, value, onChange, className }: TabsProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={listRef}
      role="tablist"
      className={cn(
        "relative inline-flex items-center gap-1 rounded-[var(--radius-md)] border border-border bg-surface p-1",
        className,
      )}
      onMouseLeave={() => setHovered(null)}
    >
      {items.map((item) => {
        const isActive = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.value)}
            onMouseEnter={() => setHovered(item.value)}
            className={cn(
              "relative z-10 inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-sm)] px-3.5 h-8 text-[13px] font-medium",
              "transition-colors duration-[var(--duration-fast)]",
              isActive ? "text-ink-inverse" : "text-ink-muted hover:text-ink",
            )}
          >
            {item.icon && <span className="[&>svg]:size-3.5">{item.icon}</span>}
            {item.label}
            {isActive && (
              <span
                className="absolute inset-0 -z-10 rounded-[var(--radius-sm)] bg-primary shadow-[var(--shadow-glow-primary)]"
                style={{ animation: "tab-pop 200ms var(--ease-premium)" }}
              />
            )}
            {!isActive && hovered === item.value && (
              <span className="absolute inset-0 -z-10 rounded-[var(--radius-sm)] bg-surface-elevated" />
            )}
          </button>
        );
      })}
    </div>
  );
}
