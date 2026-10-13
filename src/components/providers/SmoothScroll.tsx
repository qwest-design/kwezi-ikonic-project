"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Lenis smooth scroll driven by the GSAP ticker so ScrollTrigger and Lenis
 * share one frame loop (no second requestAnimationFrame). Under prefers-reduced-motion
 * Lenis is not created at all, so scrolling is native and unsmoothed.
 */
let current: Lenis | null = null;

/** The live Lenis instance, or null under reduced motion. */
export function getLenis() {
  return current;
}

/** Jump to the top immediately, with or without Lenis. */
export function resetScroll() {
  if (current) current.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;

    const lenis = new Lenis({ autoRaf: false, anchors: true });
    current = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      current = null;
    };
  }, [reduced]);

  return <>{children}</>;
}
