import { Eye, ScanLine, UploadCloud, ListChecks } from "lucide-react";

import { SectionHeading } from "@/components/common/SectionHeading";
import { useStaggerReveal } from "@/hooks/useReveal";

const STEPS = [
  { number: "01", icon: UploadCloud, title: "Upload", body: "Validate the image and assess quality before anything runs." },
  { number: "02", icon: ScanLine, title: "Analyze", body: "Extract complementary representations using CNN and Swin Transformer, then fuse them." },
  { number: "03", icon: Eye, title: "Understand", body: "Inspect Grad-CAM and Swin attention visualizations for that specific prediction." },
  { number: "04", icon: ListChecks, title: "Review", body: "Explore model output, uncertainty, model version, and analysis history." },
];

export function HowItWorks() {
  const ref = useStaggerReveal<HTMLDivElement>({ stagger: 0.1 });

  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
      <SectionHeading eyebrow="Workflow" title="How it works" align="center" className="mb-16 mx-auto" />

      <div ref={ref} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <div key={step.number} className="relative flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-6">
            <span className="mono-tag text-[13px] font-semibold text-ink-subtle">{step.number}</span>
            <span className="inline-flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary">
              <step.icon className="size-5" />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold text-ink">{step.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{step.body}</p>
            </div>
            {i < STEPS.length - 1 && (
              <div className="absolute top-1/2 -right-3 hidden h-px w-6 bg-border-strong lg:block" aria-hidden />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
