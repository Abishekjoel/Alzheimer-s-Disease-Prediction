import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
}

/**
 * Renders as a real table at md+ widths, and as stacked label/value cards
 * below md — tables don't "become readable" by shrinking, so this is a
 * genuinely different layout, not a squeezed table (see responsive
 * design requirements).
 */
export function DataTable<T>({ columns, rows, rowKey, onRowClick }: DataTableProps<T>) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface overflow-hidden">
      {/* Desktop/table view */}
      <table className="hidden w-full text-left md:table">
        <thead>
          <tr className="border-b border-border bg-surface-elevated/50">
            {columns.map((col) => (
              <th key={col.key} className={cn("px-4 py-3 text-[12px] font-medium uppercase tracking-wide text-ink-subtle", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              className={cn(
                "border-b border-border last:border-0 transition-colors duration-[var(--duration-fast)]",
                onRowClick && "cursor-pointer hover:bg-surface-elevated/60",
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn("px-4 py-3.5 text-[13px] text-ink", col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile/card view */}
      <div className="flex flex-col divide-y divide-border md:hidden">
        {rows.map((row) => (
          <div
            key={rowKey(row)}
            onClick={() => onRowClick?.(row)}
            className={cn("flex flex-col gap-2 p-4", onRowClick && "cursor-pointer active:bg-surface-elevated/60")}
          >
            {columns
              .filter((col) => !col.hideOnMobile)
              .map((col) => (
                <div key={col.key} className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-ink-subtle">{col.header}</span>
                  <span className="text-[13px] text-ink text-right">{col.render(row)}</span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
