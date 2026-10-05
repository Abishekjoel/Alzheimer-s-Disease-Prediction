import { Brain, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

const POINTS = [
  { icon: Workflow, text: "Hybrid CNN + Swin Transformer feature extraction" },
  { icon: Sparkles, text: "Attention-based fusion with Grad-CAM and Swin attention" },
  { icon: ShieldCheck, text: "Every prediction traceable to a versioned model" },
];

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-bg lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-bg-elevated p-10 lg:flex">
        <div className="absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_70%)]" />
        <div className="relative">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Brain className="size-4.5" />
            </span>
            <span className="text-[15px] font-semibold text-ink">NeuroVista</span>
          </Link>
        </div>

        <div className="relative flex flex-col gap-6">
          <p className="max-w-sm text-2xl font-semibold leading-tight text-ink text-balance">
            Explainable AI for Alzheimer's MRI research.
          </p>
          <div className="flex flex-col gap-4">
            {POINTS.map((point) => (
              <div key={point.text} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-border-strong bg-surface text-primary">
                  <point.icon className="size-4" />
                </span>
                <span className="text-[13px] leading-relaxed text-ink-muted">{point.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[12px] text-ink-subtle">
          Research and educational use only — not a substitute for professional medical diagnosis.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Brain className="size-4" />
            </span>
            <span className="text-[15px] font-semibold text-ink">NeuroVista</span>
          </Link>
          <h1 className="text-2xl font-semibold text-ink">{title}</h1>
          <p className="mt-1.5 text-[14px] text-ink-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
