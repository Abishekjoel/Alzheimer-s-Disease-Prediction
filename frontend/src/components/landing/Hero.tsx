import { ArrowRight, Compass, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import { ArchitecturePreview } from "@/components/landing/ArchitecturePreview";
import { Button } from "@/components/ui/Button";
import { gsap, prefersReducedMotion } from "@/animations/gsap";
import { useMagnetic } from "@/hooks/useMagnetic";

export function Hero() {
  const rootRef = useRef<HTMLDivElement>(null);
  const magneticRef = useMagnetic<HTMLAnchorElement>(0.25);

  useEffect(() => {
    if (!rootRef.current) return;
    const ctx = gsap.context(() => {
      if (prefersReducedMotion()) {
        gsap.set("[data-hero-el]", { opacity: 1, y: 0 });
        return;
      }
      gsap
        .timeline({ defaults: { ease: "expo.out" } })
        .fromTo("[data-hero-el]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.1 })
        .fromTo("[data-hero-visual]", { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 1.1 }, "-=0.6");
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="relative overflow-hidden pt-40 pb-24 sm:pt-48 sm:pb-32">
      <div className="absolute inset-0 bg-grid opacity-50 [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" />
      <div
        className="absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full opacity-40 blur-[120px]"
        style={{ background: "radial-gradient(circle, rgba(124,92,255,0.35), transparent 70%)" }}
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-6 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <span
            data-hero-el
            className="mono-tag inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface px-3 py-1.5 text-[11px] font-medium uppercase text-primary"
          >
            <Sparkles className="size-3.5" />
            AI-Powered Neuroimaging
          </span>

          <h1 data-hero-el className="mt-6 text-balance text-4xl font-semibold leading-[1.08] text-ink sm:text-6xl">
            See beyond the image.
          </h1>

          <p data-hero-el className="mt-5 max-w-lg text-balance text-[16px] leading-relaxed text-ink-muted sm:text-lg">
            An explainable hybrid deep-learning platform for Alzheimer's MRI research — CNN and Swin
            Transformer representations, fused with learned attention, with the reasoning made visible.
          </p>

          <div data-hero-el className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/app/analyze" ref={magneticRef}>
              <Button size="lg" iconRight={<ArrowRight />}>
                Analyze an MRI
              </Button>
            </Link>
            <a href="#technology">
              <Button size="lg" variant="outline" iconLeft={<Compass />}>
                Explore the technology
              </Button>
            </a>
          </div>

          <p data-hero-el className="mt-6 text-[12.5px] text-ink-subtle">
            Research &amp; educational use only — not a substitute for professional medical diagnosis.
          </p>
        </div>

        <div data-hero-visual>
          <ArchitecturePreview />
        </div>
      </div>
    </section>
  );
}
