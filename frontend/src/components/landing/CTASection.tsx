import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { useReveal } from "@/hooks/useReveal";

export function CTASection() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
      <div
        ref={ref}
        className="relative overflow-hidden rounded-[var(--radius-xl)] border border-border-strong bg-surface p-10 text-center sm:p-16"
      >
        <div
          className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full opacity-40 blur-[100px]"
          style={{ background: "radial-gradient(circle, rgba(124,92,255,0.4), transparent 70%)" }}
          aria-hidden
        />
        <div className="relative">
          <h2 className="text-balance text-3xl font-semibold text-ink sm:text-4xl">
            From image to insight, with the reasoning made visible.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-balance text-[15px] text-ink-muted">
            Explore how hybrid neural representations interpret brain MRI — explainable, versioned, and built for
            research.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/app/analyze">
              <Button size="lg" iconRight={<ArrowRight />}>
                Analyze an MRI
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline">
                Create an account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
