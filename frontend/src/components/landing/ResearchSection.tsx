import { FlaskConical } from "lucide-react";

import { SectionHeading } from "@/components/common/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { useStaggerReveal } from "@/hooks/useReveal";

const EXPERIMENTS = [
  { label: "CNN Only", tone: "muted" as const },
  { label: "Swin Only", tone: "muted" as const },
  { label: "CNN + Swin (Concat)", tone: "muted" as const },
  { label: "CNN + Swin (Weighted)", tone: "muted" as const },
  { label: "Proposed Hybrid (Attention Fusion)", tone: "primary" as const },
];

const METRIC_COLUMNS = ["Accuracy", "Precision", "Recall", "F1", "ROC-AUC"];

export function ResearchSection() {
  const ref = useStaggerReveal<HTMLTableSectionElement>({ stagger: 0.06 });

  return (
    <section className="border-t border-border bg-bg-elevated">
      <div className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
        <SectionHeading
          eyebrow="Research"
          title="Built for experimentation."
          description="Every architecture variant runs through the same training, evaluation, and ablation framework. Figures populate automatically once real experiments are registered — nothing here is estimated or invented."
          align="center"
          className="mb-14 mx-auto"
        />

        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-border bg-surface-elevated/50">
                <th className="px-5 py-3 text-[12px] font-medium uppercase tracking-wide text-ink-subtle">Configuration</th>
                {METRIC_COLUMNS.map((col) => (
                  <th key={col} className="px-5 py-3 text-[12px] font-medium uppercase tracking-wide text-ink-subtle">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody ref={ref}>
              {EXPERIMENTS.map((exp) => (
                <tr key={exp.label} className="border-b border-border bg-surface last:border-0">
                  <td className="px-5 py-3.5 text-[13px] text-ink">
                    <div className="flex items-center gap-2">
                      {exp.tone === "primary" && <FlaskConical className="size-3.5 text-primary" />}
                      {exp.label}
                      {exp.tone === "primary" && <Badge tone="primary">Proposed</Badge>}
                    </div>
                  </td>
                  {METRIC_COLUMNS.map((col) => (
                    <td key={col} className="mono-tag px-5 py-3.5 text-[13px] text-ink-subtle">
                      —
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-center text-[12px] text-ink-subtle">
          Run <code className="mono-tag">python manage.py run_ablation</code> to populate this table with real results.
        </p>
      </div>
    </section>
  );
}
