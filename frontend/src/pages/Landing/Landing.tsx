import { ArchitectureSection } from "@/components/landing/ArchitectureSection";
import { CTASection } from "@/components/landing/CTASection";
import { DemoSection } from "@/components/landing/DemoSection";
import { ExplainabilitySection } from "@/components/landing/ExplainabilitySection";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ResearchSection } from "@/components/landing/ResearchSection";
import { ResponsibleAISection } from "@/components/landing/ResponsibleAISection";
import { TrustStrip } from "@/components/landing/TrustStrip";

export default function Landing() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <ArchitectureSection />
      <ExplainabilitySection />
      <HowItWorks />
      <DemoSection />
      <ResearchSection />
      <FeatureGrid />
      <ResponsibleAISection />
      <CTASection />
    </>
  );
}
