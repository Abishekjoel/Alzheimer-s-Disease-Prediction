import { Layers, ScanEye, ShieldCheck, SplitSquareVertical } from "lucide-react";

import { useStaggerReveal } from "@/hooks/useReveal";

const ITEMS = [
  { icon: Layers, title: "Hybrid Architecture", detail: "CNN + Swin Transformer" },
  { icon: ScanEye, title: "Explainable AI", detail: "Grad-CAM + Attention" },
  { icon: SplitSquareVertical, title: "Three-Class Classification", detail: "CN / MCI / AD" },
  { icon: ShieldCheck, title: "Research Evaluation", detail: "Ablation + Metrics" },
];

export function TrustStrip() {
  const ref = useStaggerReveal<HTMLDivElement>({ stagger: 0.08 });

  return (
    <section className="border-y border-border bg-bg-elevated">
      <div ref={ref} className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-none sm:grid-cols-4">
        {ITEMS.map((item) => (
          <div key={item.title} className="flex flex-col gap-2 px-6 py-8 sm:border-l sm:border-border sm:first:border-l-0">
            <item.icon className="size-5 text-primary" />
            <span className="text-[13px] font-semibold text-ink">{item.title}</span>
            <span className="mono-tag text-[12px] text-ink-subtle">{item.detail}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
