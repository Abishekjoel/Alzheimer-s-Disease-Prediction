import { EASE_GSAP, gsap, prefersReducedMotion, ScrollTrigger } from "@/animations/gsap";

/**
 * Fades + lifts an element into place, either immediately (for
 * above-the-fold hero content) or triggered by scroll. Respects
 * prefers-reduced-motion by snapping straight to the end state.
 */
export function fadeUpReveal(
  target: gsap.TweenTarget,
  opts: { delay?: number; y?: number; duration?: number; scrollTrigger?: boolean; trigger?: Element | null } = {},
) {
  const { delay = 0, y = 28, duration = 0.9, scrollTrigger = false, trigger } = opts;

  if (prefersReducedMotion()) {
    gsap.set(target, { opacity: 1, y: 0 });
    return;
  }

  gsap.fromTo(
    target,
    { opacity: 0, y },
    {
      opacity: 1,
      y: 0,
      duration,
      delay,
      ease: EASE_GSAP,
      scrollTrigger: scrollTrigger
        ? { trigger: trigger ?? (target as Element), start: "top 85%", toggleActions: "play none none none" }
        : undefined,
    },
  );
}

/**
 * Staggered reveal for card grids / lists — each child fades up slightly
 * after the previous one, communicating grouping rather than a flat
 * simultaneous appearance.
 */
export function staggerReveal(
  targets: gsap.TweenTarget,
  opts: { trigger?: Element | null; stagger?: number; y?: number } = {},
) {
  const { trigger, stagger = 0.08, y = 24 } = opts;

  if (prefersReducedMotion()) {
    gsap.set(targets, { opacity: 1, y: 0 });
    return;
  }

  gsap.fromTo(
    targets,
    { opacity: 0, y },
    {
      opacity: 1,
      y: 0,
      duration: 0.7,
      stagger,
      ease: EASE_GSAP,
      scrollTrigger: {
        trigger: trigger ?? (Array.isArray(targets) ? (targets[0] as Element) : (targets as Element)),
        start: "top 85%",
        toggleActions: "play none none none",
      },
    },
  );
}

export { ScrollTrigger };
