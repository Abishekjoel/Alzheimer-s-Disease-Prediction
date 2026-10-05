import { ArrowRight, FlaskConical, ScanLine } from "lucide-react";
import { Link } from "react-router-dom";

import { ProbabilityBar } from "@/components/charts/ProbabilityBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/common/SectionHeading";
import { useReveal } from "@/hooks/useReveal";

const SAMPLE_PROBABILITIES = { CN: 0.1, MCI: 0.82, AD: 0.08 };

export function DemoSection() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
      <SectionHeading
        eyebrow="Try it"
        title="See the interface, before you upload anything."
        description="A walkthrough of the results screen using illustrative sample data."
        align="center"
        className="mb-14 mx-auto"
      />

      <div ref={ref}>
        <Card padding="none" className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-surface-elevated/50 px-6 py-4">
            <div className="flex items-center gap-2">
              <ScanLine className="size-4 text-primary" />
              <span className="text-[13px] font-semibold text-ink">MRI Analysis</span>
            </div>
            <Badge tone="primary" icon={<FlaskConical />}>
              Interactive Demo
            </Badge>
          </div>

          <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-2">
            <div className="flex flex-col items-center justify-center gap-4 rounded-[var(--radius-lg)] border border-border bg-bg p-6">
              <div className="relative flex size-40 items-center justify-center rounded-full border border-border-strong bg-surface-elevated">
                <div className="absolute inset-3 rounded-full border border-dashed border-primary/30" />
                <ScanLine className="size-8 text-ink-subtle" />
              </div>
              <span className="mono-tag text-[11px] text-ink-subtle">sample_scan_014.jpg</span>
            </div>

            <div className="flex flex-col justify-center gap-6">
              <div>
                <span className="text-[12px] font-medium uppercase tracking-wide text-ink-subtle">Model output</span>
                <div className="mt-1 flex items-baseline gap-3">
                  <span className="text-3xl font-semibold text-warning">MCI</span>
                  <span className="mono-tag text-sm text-ink-muted">82% confidence</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <ProbabilityBar label="CN" value={SAMPLE_PROBABILITIES.CN} tone="success" />
                <ProbabilityBar label="MCI" value={SAMPLE_PROBABILITIES.MCI} tone="warning" highlighted />
                <ProbabilityBar label="AD" value={SAMPLE_PROBABILITIES.AD} tone="danger" />
              </div>

              <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2.5">
                <span className="size-2 rounded-full bg-warning" />
                <span className="text-[12.5px] text-ink-muted">Model uncertainty: <span className="text-ink font-medium">Moderate</span></span>
              </div>
            </div>
          </div>

          <div className="border-t border-border bg-surface-elevated/40 px-6 py-4">
            <p className="text-[12px] leading-relaxed text-ink-subtle">
              Illustrative sample only — not a real prediction. Model confidence reflects statistical output, not a
              clinical probability.
            </p>
          </div>
        </Card>

        <div className="mt-8 flex justify-center">
          <Link to="/app/analyze">
            <Button size="lg" iconRight={<ArrowRight />}>
              Run a real analysis
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
