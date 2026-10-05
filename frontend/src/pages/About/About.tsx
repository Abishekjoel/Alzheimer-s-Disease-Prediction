import { Brain, ExternalLink, FileText, Mail } from "lucide-react";

import { SectionHeading } from "@/components/common/SectionHeading";
import { Card } from "@/components/ui/Card";

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <SectionHeading
        eyebrow="About"
        title="A research platform for explainable neuroimaging."
        description="NeuroVista is the interface for a hybrid CNN + Swin Transformer research system that classifies brain MRI into CN / MCI / AD, built to make every prediction inspectable rather than opaque."
        className="mb-14"
      />

      <div className="prose-content flex flex-col gap-6 text-[14.5px] leading-relaxed text-ink-muted">
        <p>
          The backend is a Django + PyTorch research system: a ResNet50 branch and a Swin Transformer branch extract
          complementary representations from an MRI slice, which are combined by an attention-based gated fusion
          module before classification. Every prediction is paired with Grad-CAM and Swin attention visualizations,
          an uncertainty estimate, and the exact model version that produced it.
        </p>
        <p>
          This project is built for research and education. It has not undergone clinical validation and is not a
          certified medical device — see the{" "}
          <a href="/research" className="font-medium text-primary hover:text-primary-hover">
            methodology page
          </a>{" "}
          for the full architecture writeup and stated limitations.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        <Card className="flex flex-col items-center gap-2 text-center">
          <Brain className="size-5 text-primary" />
          <span className="text-[13px] font-medium text-ink">Architecture</span>
          <a href="/research" className="text-[12.5px] text-ink-muted hover:text-ink">
            Read the methodology
          </a>
        </Card>
        <Card className="flex flex-col items-center gap-2 text-center">
          <FileText className="size-5 text-primary" />
          <span className="text-[13px] font-medium text-ink">Documentation</span>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12.5px] text-ink-muted hover:text-ink">
            <ExternalLink className="size-3.5" /> Repository
          </a>
        </Card>
        <Card className="flex flex-col items-center gap-2 text-center">
          <Mail className="size-5 text-primary" />
          <span className="text-[13px] font-medium text-ink">Contact</span>
          <span className="text-[12.5px] text-ink-muted">research@neurovista.example</span>
        </Card>
      </div>
    </div>
  );
}
