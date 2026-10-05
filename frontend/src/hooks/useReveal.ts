import { useEffect, useRef } from "react";

import { gsap } from "@/animations/gsap";
import { fadeUpReveal, staggerReveal } from "@/animations/reveal";

/** Attach to a single element: fades/lifts it in once it scrolls into view. */
export function useReveal<T extends HTMLElement>(opts: { delay?: number; y?: number } = {}) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      fadeUpReveal(ref.current, { ...opts, scrollTrigger: true });
    });
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}

/** Attach to a container: reveals its direct children with a stagger as
 * the container scrolls into view. */
export function useStaggerReveal<T extends HTMLElement>(opts: { stagger?: number; y?: number } = {}) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      staggerReveal(Array.from(ref.current!.children), { trigger: ref.current, ...opts });
    });
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}
