import { Layers, SplitSquareVertical, Sigma } from "lucide-react";

import { ArchitectureDiagram } from "@/components/landing/ArchitectureDiagram";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Card } from "@/components/ui/Card";
import { useReveal } from "@/hooks/useReveal";

const STEPS = [
  {
    icon: SplitSquareVertical,
    title: "Two complementary representations",
    body: "A ResNet50 branch captures local texture and fine-grained structural detail; a Swin Transformer branch captures broader, windowed contextual relationships across the slice.",
  },
  {
    icon: Layers,
    title: "Cross-attention, not concatenation",
    body: "Both projected feature vectors are treated as a short sequence and refined through multi-head attention — each representation is informed by the other, not simply stacked.",
  },
  {
    icon: Sigma,
    title: "Per-channel learned gating",
    body: "A gate vector decides, per feature channel, how much to trust CNN evidence vs. Swin evidence for that specific image — more expressive than a single fixed weight.",
  },
];

export function ArchitectureSection() {
  const textRef = useReveal<HTMLDivElement>();

  return (
    <section id="technology" className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
      <SectionHeading
        eyebrow="Technology"
        title="One image. Multiple representations."
        description="Every uploaded MRI is processed by two independent neural pathways, then combined by the model's primary research contribution: an attention-based feature fusion mechanism."
        className="mb-16"
      />

      <div className="grid items-center gap-16 lg:grid-cols-[0.9fr_1fr]">
        <div ref={textRef} className="flex flex-col gap-5 order-2 lg:order-1">
          {STEPS.map((step) => (
            <Card key={step.title} padding="md" className="flex items-start gap-4">
              <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-primary-soft text-primary">
                <step.icon className="size-4.5" />
              </span>
              <div>
                <h3 className="text-[14px] font-semibold text-ink">{step.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{step.body}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="order-1 lg:order-2">
          <ArchitectureDiagram />
        </div>
      </div>
    </section>
  );
}
