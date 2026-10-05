import { Eye, GitBranch, Layers, ShieldQuestion, Sigma, TestTubeDiagonal } from "lucide-react";

import { SectionHeading } from "@/components/common/SectionHeading";
import { Card } from "@/components/ui/Card";
import { useStaggerReveal } from "@/hooks/useReveal";

const FEATURES = [
  {
    icon: Layers,
    title: "Hybrid Intelligence",
    body: "CNN captures local visual patterns while Swin Transformer captures broader contextual relationships.",
  },
  {
    icon: Sigma,
    title: "Attention-Based Fusion",
    body: "The model learns how much importance to assign to each complementary representation, per channel.",
  },
  {
    icon: Eye,
    title: "Explainable Predictions",
    body: "Grad-CAM and attention visualization help inspect which regions influenced the model's output.",
  },
  {
    icon: ShieldQuestion,
    title: "Uncertainty Awareness",
    body: "The system exposes model uncertainty rather than presenting every prediction as absolute.",
  },
  {
    icon: TestTubeDiagonal,
    title: "Research Evaluation",
    body: "Compare architectures using reproducible evaluation metrics and ablation experiments.",
  },
  {
    icon: GitBranch,
    title: "Model Versioning",
    body: "Every analysis is associated with the exact model version that produced it, permanently.",
  },
];

export function FeatureGrid() {
  const ref = useStaggerReveal<HTMLDivElement>({ stagger: 0.07 });

  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
      <SectionHeading eyebrow="Capabilities" title="Everything a research pipeline needs" align="center" className="mb-16 mx-auto" />

      <div ref={ref} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <Card key={feature.title} interactive className="flex flex-col gap-4">
            <span className="inline-flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary">
              <feature.icon className="size-5" />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold text-ink">{feature.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{feature.body}</p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
