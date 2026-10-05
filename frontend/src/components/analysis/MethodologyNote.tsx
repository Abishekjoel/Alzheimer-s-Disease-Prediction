import { ChevronDown, Info } from "lucide-react";
import { useState } from "react";

import { cn } from "@/utils/cn";

// Threshold values mirror ml/config.py's UNCERTAINTY_CONFIG (the backend's
// single source of truth). They are not fetched from the API because the
// API only returns the already-classified uncertainty_level, not the raw
// band edges — if those env-configurable defaults are ever changed on the
// backend, update the two numbers below to match.
const LOW_THRESHOLD = 0.15;
const HIGH_THRESHOLD = 0.35;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[12.5px] font-semibold text-ink">{title}</h3>
      <div className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{children}</div>
    </div>
  );
}

export function MethodologyNote() {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          <Info className="size-4 text-ink-subtle" />
          How the prediction and uncertainty are calculated
        </span>
        <ChevronDown className={cn("size-4 text-ink-muted transition-transform duration-[var(--duration-fast)]", open && "rotate-180")} />
      </button>

      {open && (
        <div className="flex flex-col gap-4 border-t border-border px-5 pb-5 pt-4">
          <Section title="Predicted class (CN / MCI / AD)">
            The MRI is passed through the CNN branch and the Swin Transformer branch, whose features are combined
            by attention-gated fusion into a single vector. A classifier head turns that vector into a probability
            for each of the three classes (softmax). The predicted class shown above is simply whichever class
            received the highest probability. Confidence is that probability, expressed as a percentage.
          </Section>

          <Section title="Model uncertainty — how it's measured">
            Uncertainty is estimated with <span className="text-ink">Monte Carlo Dropout</span>: the model runs
            several stochastic forward passes with dropout kept active (instead of the usual single deterministic
            pass), each producing a slightly different probability distribution. The <span className="text-ink">
            normalized entropy</span> of the averaged distribution becomes the uncertainty score, from 0 (all
            passes agree strongly on one class) to 1 (the passes disagree, or the averaged distribution is close
            to uniform across classes).
          </Section>

          <Section title="Uncertainty levels">
            <ul className="flex flex-col gap-1.5">
              <li className="flex items-center gap-2">
                <span className="size-1.5 shrink-0 rounded-full bg-success" />
                <span className="text-ink">LOW</span> — score ≤ {LOW_THRESHOLD.toFixed(2)}. The stochastic passes
                consistently agree; the model is internally confident.
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 shrink-0 rounded-full bg-warning" />
                <span className="text-ink">MEDIUM</span> — score between {LOW_THRESHOLD.toFixed(2)} and{" "}
                {HIGH_THRESHOLD.toFixed(2)}. Some disagreement between passes; treat the prediction with caution.
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 shrink-0 rounded-full bg-danger" />
                <span className="text-ink">HIGH</span> — score above {HIGH_THRESHOLD.toFixed(2)}. The passes
                disagree substantially, or the averaged distribution is close to uniform across the three classes.
              </li>
            </ul>
          </Section>

          <p className="rounded-[var(--radius-md)] border border-warning/30 bg-warning-soft px-3.5 py-2.5 text-[11.5px] leading-relaxed text-ink">
            <span className="font-semibold">Not a clinical severity scale.</span> CN / MCI / AD and the uncertainty
            level describe this model's own statistical behavior on this image — not a validated measure of
            disease severity and not a diagnosis. They must not be used, alone or together, to make or support a
            clinical decision. Only a qualified clinician can diagnose Alzheimer's disease.
          </p>
        </div>
      )}
    </div>
  );
}
