"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { motionConditions } from "@/lib/motion";

/**
 * Site-wide data-speed parallax. Any element with data-speed="0.85" moves at that
 * rate relative to scroll (below 1 lags, above 1 leads). The offset is zero when the
 * element is centred in the viewport, so layout stays put at rest.
 * Off under 768px and under reduced motion (it is a scrub). Re-scans on route change.
 */
export function Parallax() {
  const pathname = usePathname();

  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add(`${motionConditions.full} and (min-width: 768px)`, () => {
      const elements = gsap.utils.toArray<HTMLElement>("[data-speed]");

      elements.forEach((el) => {
        const speed = Number.parseFloat(el.dataset.speed ?? "1");
        if (!Number.isFinite(speed) || speed === 1) return;

        const factor = 1 - speed;
        // Scroll distance while the element crosses the viewport.
        const travel = () => window.innerHeight + el.offsetHeight;

        gsap.fromTo(
          el,
          { y: () => (-factor * travel()) / 2 },
          {
            y: () => (factor * travel()) / 2,
            ease: "none",
            // Measure the trigger untransformed; otherwise the start offset skews the zero point.
            immediateRender: false,
            scrollTrigger: {
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );
      });

      ScrollTrigger.refresh();
    });

    // Late font swaps change line heights above the fold; re-measure once they settle.
    let alive = true;
    document.fonts.ready.then(() => alive && ScrollTrigger.refresh());

    return () => {
      alive = false;
      mm.revert();
    };
  }, [pathname]);

  return null;
}
