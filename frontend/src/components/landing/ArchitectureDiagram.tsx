import { useEffect, useRef } from "react";

import { gsap, prefersReducedMotion } from "@/animations/gsap";

/**
 * The scroll-scrubbed version of the pipeline diagram (vs. the small
 * auto-looping one in the hero). Node positions and the connecting SVG
 * paths share the same 0-100 coordinate space (viewBox 0 0 100 100,
 * preserveAspectRatio="none") so HTML-positioned nodes and SVG lines stay
 * aligned at any container size without runtime measurement.
 */
export function ArchitectureDiagram() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const paths = pathRefs.current.filter(Boolean) as SVGPathElement[];
      paths.forEach((path) => {
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      });
      gsap.set(nodeRefs.current, { opacity: 0.25, scale: 0.92 });

      if (prefersReducedMotion()) {
        gsap.set(paths, { strokeDashoffset: 0 });
        gsap.set(nodeRefs.current, { opacity: 1, scale: 1 });
        return;
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          end: "bottom 40%",
          scrub: 0.6,
        },
      });

      // Stage 0: MRI node appears
      tl.to(nodeRefs.current[0], { opacity: 1, scale: 1, duration: 0.5 }, 0);
      // Stage 1: paths to CNN / Swin draw, branch nodes light up
      tl.to([paths[0], paths[1]], { strokeDashoffset: 0, duration: 1 }, 0.3);
      tl.to([nodeRefs.current[1], nodeRefs.current[2]], { opacity: 1, scale: 1, duration: 0.6 }, 0.7);
      // Stage 2: paths into fusion draw, fusion node lights up
      tl.to([paths[2], paths[3]], { strokeDashoffset: 0, duration: 1 }, 1.3);
      tl.to(nodeRefs.current[3], { opacity: 1, scale: 1, duration: 0.6 }, 1.8);
      // Stage 3: path to output, output lights up
      tl.to(paths[4], { strokeDashoffset: 0, duration: 0.8 }, 2.3);
      tl.to(nodeRefs.current[4], { opacity: 1, scale: 1, duration: 0.6 }, 2.7);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const setPathRef = (index: number) => (el: SVGPathElement | null) => {
    pathRefs.current[index] = el;
  };
  const setNodeRef = (index: number) => (el: HTMLDivElement | null) => {
    nodeRefs.current[index] = el;
  };

  return (
    <div ref={sectionRef} className="relative mx-auto aspect-[10/11] w-full max-w-lg sm:aspect-[10/9]">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path ref={setPathRef(0)} d="M50 12 C 50 22, 24 24, 20 33" stroke="#8B5CF6" strokeWidth="0.6" fill="none" />
        <path ref={setPathRef(1)} d="M50 12 C 50 22, 76 24, 80 33" stroke="#38BDF8" strokeWidth="0.6" fill="none" />
        <path ref={setPathRef(2)} d="M20 42 C 20 55, 42 60, 48 66" stroke="#8B5CF6" strokeWidth="0.6" fill="none" />
        <path ref={setPathRef(3)} d="M80 42 C 80 55, 58 60, 52 66" stroke="#38BDF8" strokeWidth="0.6" fill="none" />
        <path ref={setPathRef(4)} d="M50 72 L 50 86" stroke="#7C5CFF" strokeWidth="0.7" fill="none" />
      </svg>

      <DiagramNode ref={setNodeRef(0)} x={50} y={8} tone="neutral">
        MRI INPUT
      </DiagramNode>
      <DiagramNode ref={setNodeRef(1)} x={20} y={38} tone="primary" sub="ResNet50">
        CNN BRANCH
      </DiagramNode>
      <DiagramNode ref={setNodeRef(2)} x={80} y={38} tone="secondary" sub="Swin-T">
        SWIN BRANCH
      </DiagramNode>
      <DiagramNode ref={setNodeRef(3)} x={50} y={69} tone="primary" wide sub="Cross-Attention + Gating">
        ATTENTION FUSION
      </DiagramNode>
      <DiagramNode ref={setNodeRef(4)} x={50} y={93} tone="output" wide>
        CN · MCI · AD
      </DiagramNode>
    </div>
  );
}

interface DiagramNodeProps {
  x: number;
  y: number;
  tone: "neutral" | "primary" | "secondary" | "output";
  wide?: boolean;
  sub?: string;
  children: React.ReactNode;
}

const toneClasses: Record<DiagramNodeProps["tone"], string> = {
  neutral: "border-border-strong bg-surface-elevated text-ink",
  primary: "border-primary/40 bg-primary-soft text-primary",
  secondary: "border-secondary/40 bg-secondary-soft text-secondary",
  output: "border-success/40 bg-success-soft text-success",
};

const DiagramNode = ({ ref, x, y, tone, wide, sub, children }: DiagramNodeProps & { ref: (el: HTMLDivElement | null) => void }) => (
  <div
    ref={ref}
    className={`mono-tag absolute -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-md)] border px-3 py-2 text-center text-[10px] font-semibold shadow-[var(--shadow-md)] ${toneClasses[tone]} ${wide ? "w-40" : "w-28"}`}
    style={{ left: `${x}%`, top: `${y}%` }}
  >
    {children}
    {sub && <div className="mt-0.5 text-[9px] font-normal text-ink-subtle">{sub}</div>}
  </div>
);
