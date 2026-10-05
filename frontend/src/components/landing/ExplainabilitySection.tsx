import { ExplainabilityShowcase } from "@/components/landing/ExplainabilityShowcase";
import { SectionHeading } from "@/components/common/SectionHeading";
import { useReveal } from "@/hooks/useReveal";

export function ExplainabilitySection() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section id="explainability" className="border-t border-border bg-bg-elevated">
      <div className="mx-auto max-w-4xl px-6 py-24 sm:py-32">
        <SectionHeading
          eyebrow="Explainability"
          title="The reasoning is visible, not a black box."
          description="Grad-CAM highlights where the CNN branch's evidence concentrated. Swin attention shows which regions the transformer branch weighted most heavily. Neither is fabricated after the fact — both are extracted from real gradients and real attention weights computed during that prediction."
          align="center"
          className="mb-14"
        />
        <div ref={ref}>
          <ExplainabilityShowcase />
        </div>
      </div>
    </section>
  );
}
