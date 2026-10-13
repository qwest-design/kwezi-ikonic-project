/**
 * Motion tokens. Keep in sync with the --ease-* and --duration-* vars in globals.css.
 * Rule: animate only transform and opacity.
 */
export const motion = {
  entrance: { ease: "expo.out", duration: 0.9 },
  transition: { ease: "power3.inOut", duration: 1.2 },
  ui: { ease: "power3.out", duration: 0.4 },
  /** Reduced motion: opacity fades only. */
  reduced: { ease: "none", duration: 0.3 },
} as const;

/** Where scroll-linked effects start: element top hits 80% of the viewport. */
export const REVEAL_START = "top 80%";

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * gsap.matchMedia() conditions. Put pins, scrubs and parallax under `full` only;
 * under `reduced` use opacity fades of motion.reduced.duration.
 *   const mm = gsap.matchMedia();
 *   mm.add(motionConditions, (ctx) => { const { full } = ctx.conditions!; ... });
 */
export const motionConditions = {
  full: "(prefers-reduced-motion: no-preference)",
  reduced: REDUCED_MOTION_QUERY,
} as const;

export const MOBILE_QUERY = "(max-width: 767px)";

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
