import { BookOpen, Database, GraduationCap, Stethoscope } from "lucide-react";

import { SectionHeading } from "@/components/common/SectionHeading";
import { useStaggerReveal } from "@/hooks/useReveal";

const POINTS = [
  {
    icon: GraduationCap,
    title: "Research & educational purpose",
    body: "This platform is built for research and education. It is not a certified medical device and has not undergone clinical validation.",
  },
  {
    icon: Stethoscope,
    title: "Not a clinical diagnosis",
    body: "Model output is a statistical prediction, not a medical diagnosis. It should never replace evaluation by a qualified professional.",
  },
  {
    icon: Database,
    title: "Performance depends on data",
    body: "Model performance is bounded by the quality, size, and distribution of its training dataset — and can vary across populations.",
  },
  {
    icon: BookOpen,
    title: "Generalization is not guaranteed",
    body: "A model trained on one dataset's distribution may not generalize well to scans acquired under different conditions or protocols.",
  },
];

export function ResponsibleAISection() {
  const ref = useStaggerReveal<HTMLDivElement>({ stagger: 0.08 });

  return (
    <section className="border-t border-border bg-bg-elevated">
      <div className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
        <SectionHeading
          eyebrow="Responsible AI"
          title="What this system is — and isn't."
          align="center"
          className="mb-14 mx-auto"
        />

        <div ref={ref} className="grid gap-5 sm:grid-cols-2">
          {POINTS.map((point) => (
            <div key={point.title} className="flex items-start gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-6">
              <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-warning-soft text-warning">
                <point.icon className="size-4.5" />
              </span>
              <div>
                <h3 className="text-[14px] font-semibold text-ink">{point.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{point.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
