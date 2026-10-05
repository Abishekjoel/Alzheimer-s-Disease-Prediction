import type { ReactNode } from "react";

import { SectionHeading } from "@/components/common/SectionHeading";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <SectionHeading eyebrow={`Updated ${updated}`} title={title} className="mb-10" />
      <div className="flex flex-col gap-5 text-[13.5px] leading-relaxed text-ink-muted [&_h3]:mt-4 [&_h3]:text-[14px] [&_h3]:font-semibold [&_h3]:text-ink">
        {children}
      </div>
    </div>
  );
}
