import { Check } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/utils/cn";

const STAGES = [
  "Image Validation",
  "Quality Check",
  "Preprocessing",
  "Feature Extraction",
  "CNN Analysis",
  "Swin Transformer Analysis",
  "Attention Fusion",
  "Prediction",
  "Explainability",
];

interface AnalysisProgressProps {
  active: boolean;
  done: boolean;
}

/**
 * The Django backend runs the entire pipeline synchronously in one
 * request/response (analysis.services.analysis_pipeline.analyze_mri) — it
 * does not stream real per-stage progress. Rather than fake a precise
 * progress bar tied to backend events that don't exist, this cycles
 * through the pipeline's real conceptual stages on a fixed visual
 * cadence while the request is in flight, and completes all of them the
 * moment the response actually arrives. The caption says so explicitly.
 */
export function AnalysisProgress({ active, done }: AnalysisProgressProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!active || done) return;
    const interval = window.setInterval(() => {
      setCurrent((prev) => Math.min(prev + 1, STAGES.length - 1));
    }, 750);
    return () => window.clearInterval(interval);
  }, [active, done]);

  useEffect(() => {
    if (done) setCurrent(STAGES.length - 1);
  }, [done]);

  return (
    <div className="flex flex-col gap-1">
      {STAGES.map((stage, i) => {
        const isComplete = done || i < current;
        const isCurrent = !done && i === current;
        return (
          <div key={stage} className="flex items-center gap-3 py-1.5">
            <span
              className={cn(
                "inline-flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] transition-colors duration-[var(--duration-fast)]",
                isComplete
                  ? "border-success bg-success text-white"
                  : isCurrent
                    ? "border-primary text-primary"
                    : "border-border-strong text-ink-subtle",
              )}
            >
              {isComplete ? <Check className="size-3" /> : isCurrent ? <span className="size-1.5 rounded-full bg-primary animate-pulse" /> : null}
            </span>
            <span className={cn("text-[13px]", isComplete || isCurrent ? "text-ink" : "text-ink-subtle")}>{stage}</span>
          </div>
        );
      })}
      <p className="mt-3 text-[11.5px] text-ink-subtle">
        Processed as a single request — stages above are illustrative of the pipeline, not a live per-stage feed.
      </p>
    </div>
  );
}
