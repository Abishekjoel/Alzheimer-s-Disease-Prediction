import { useEffect, useRef } from "react";

import { gsap, prefersReducedMotion } from "@/animations/gsap";
import { cn } from "@/utils/cn";

const STAGES = [
  { key: "input", label: "MRI INPUT" },
  { key: "cnn", label: "CNN FEATURES" },
  { key: "swin", label: "SWIN FEATURES" },
  { key: "fusion", label: "ATTENTION FUSION" },
  { key: "output", label: "MODEL OUTPUT" },
];

/**
 * The hero's signature visual: a compact, auto-playing loop of the
 * pipeline's conceptual stages (MRI -> CNN/Swin branches -> attention
 * fusion -> output), built from UI primitives (grid, nodes, scan line,
 * particles) rather than a stock brain photo. Purely illustrative of the
 * *architecture*, not a literal progress bar for any real request.
 */
export function ArchitecturePreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);
  const cnnPathRef = useRef<SVGPathElement>(null);
  const swinPathRef = useRef<SVGPathElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.to(scanRef.current, {
        y: "220%",
        duration: 3.2,
        repeat: -1,
        ease: "sine.inOut",
        yoyo: true,
      });

      [cnnPathRef.current, swinPathRef.current].forEach((path) => {
        if (!path) return;
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        gsap.to(path, {
          strokeDashoffset: 0,
          duration: 1.8,
          repeat: -1,
          repeatDelay: 1.4,
          ease: "power2.inOut",
        });
      });

      const timeline = gsap.timeline({ repeat: -1, repeatDelay: 0.6 });
      nodeRefs.current.forEach((node, i) => {
        if (!node) return;
        timeline.fromTo(
          node,
          { opacity: 0.35, scale: 0.94 },
          { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" },
          i * 0.55,
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-[var(--radius-xl)] border border-border-strong bg-surface/60 p-6 shadow-[var(--shadow-lg)] backdrop-blur"
    >
      <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      {/* Scanning MRI slice */}
      <div className="relative mx-auto mb-6 h-28 w-28 overflow-hidden rounded-[var(--radius-md)] border border-border-strong bg-bg">
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-30">
          {Array.from({ length: 36 }).map((_, i) => (
            <div key={i} className="border border-primary/10" />
          ))}
        </div>
        <div
          ref={scanRef}
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary to-transparent shadow-[0_0_12px_2px_rgba(56,189,248,0.6)]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
      </div>

      {/* Branch diagram */}
      <svg viewBox="0 0 400 160" className="absolute inset-x-6 top-28 h-32 w-[calc(100%-3rem)]" fill="none">
        <path ref={cnnPathRef} d="M200 0 C 200 40, 90 40, 90 80" stroke="#8B5CF6" strokeWidth="2" />
        <path ref={swinPathRef} d="M200 0 C 200 40, 310 40, 310 80" stroke="#38BDF8" strokeWidth="2" />
        <path d="M90 80 C 90 120, 190 110, 200 130" stroke="var(--border-strong)" strokeWidth="1.5" />
        <path d="M310 80 C 310 120, 210 110, 200 130" stroke="var(--border-strong)" strokeWidth="1.5" />
      </svg>

      <div className="relative mt-24 grid grid-cols-3 items-end gap-2 text-center">
        <StageLabel label="CNN" tone="primary" />
        <div />
        <StageLabel label="SWIN" tone="secondary" />
      </div>

      <div className="relative mt-3 flex flex-col items-center gap-2">
        <div
          ref={(el) => {
            nodeRefs.current[3] = el;
          }}
          className="mono-tag rounded-full border border-primary/40 bg-primary-soft px-3 py-1 text-[11px] font-semibold text-primary"
        >
          ATTENTION FUSION
        </div>
        <div
          ref={(el) => {
            nodeRefs.current[4] = el;
          }}
          className="mono-tag rounded-[var(--radius-sm)] border border-border-strong bg-surface-elevated px-3 py-1.5 text-[11px] font-semibold text-ink"
        >
          MODEL OUTPUT
        </div>
      </div>
    </div>
  );
}

function StageLabel({ label, tone }: { label: string; tone: "primary" | "secondary" }) {
  return (
    <span
      className={cn(
        "mono-tag mx-auto inline-block rounded-full border px-2.5 py-1 text-[10px] font-semibold",
        tone === "primary" ? "border-primary/40 bg-primary-soft text-primary" : "border-secondary/40 bg-secondary-soft text-secondary",
      )}
    >
      {label}
    </span>
  );
}

export const HERO_STAGES = STAGES;
