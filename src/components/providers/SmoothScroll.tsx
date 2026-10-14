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

/** Space left above anchor targets for the fixed header: html's scroll-padding-top (globals.css). */
function headerOffset() {
  return Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
}

/**
 * Scroll to the element a hash points at (#manifesto), through Lenis when it is
 * running (smooth) or natively otherwise, leaving room for the fixed header.
 * Returns false when the page has no such element.
 */
export function scrollToHash(hash: string, { immediate = false } = {}) {
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  const el = id ? document.getElementById(id) : null;
  if (!el) return false;
  if (current) {
    // Lenis already subtracts scroll-padding-top (and the target's scroll-margin-top).
    current.scrollTo(el, { immediate, force: true });
  } else {
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - headerOffset(), behavior: "auto" });
  }
  // Move focus for keyboard and screen reader users without a second jump.
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
  return true;
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

    const lenis = new Lenis({ autoRaf: false });
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
