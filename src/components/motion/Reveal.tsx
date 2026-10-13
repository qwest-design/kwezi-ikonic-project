"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap, SplitText } from "@/lib/gsap";
import { motion, motionConditions, REVEAL_START } from "@/lib/motion";
import { whenPageVisible } from "@/lib/siteStore";

type RevealProps = {
  as?: "div" | "p" | "h1" | "h2" | "h3" | "h4" | "span" | "li" | "blockquote";
  children: ReactNode;
  className?: string;
  id?: string;
  /** Seconds between lines. */
  stagger?: number;
  delay?: number;
  /** ScrollTrigger start. Defaults to the top of the element at 80% of the viewport. */
  start?: string;
};

/**
 * Splits text into masked lines and slides them up when scrolled into view.
 * Re-splits on resize and font load (SplitText autoSplit) without replaying once shown.
 * Reduced motion: a single 0.3s opacity fade, same trigger.
 * Text is server rendered, so it stays readable without JS.
 */
export function Reveal({
  as: Tag = "div",
  children,
  className,
  id,
  stagger = 0.08,
  delay = 0,
  start = REVEAL_START,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Every allowed tag is a block of text; type it as div so one ref fits all.
  const Comp = Tag as "div";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const mm = gsap.matchMedia();
    let cancelled = false;

    // Wait until no preloader or transition panel covers the page, so reveals
    // play where they can be seen (the hand-off from the preloader).
    whenPageVisible().then(() => {
      if (cancelled) return;
      mm.add(motionConditions, (ctx) => {
      const { reduced } = ctx.conditions as { full: boolean; reduced: boolean };

      if (reduced) {
        gsap.from(el, {
          opacity: 0,
          duration: motion.reduced.duration,
          ease: motion.reduced.ease,
          delay,
          scrollTrigger: { trigger: el, start, once: true },
        });
        return;
      }

      let revealed = false;
      const split = SplitText.create(el, {
        type: "lines",
        mask: "lines",
        linesClass: "reveal-line",
        aria: "auto",
        autoSplit: true,
        // Runs on first split and every re-split. Returning the tween lets SplitText
        // revert it before re-splitting, so lines never get stuck mid-animation.
        onSplit(self) {
          if (revealed) return;
          return gsap.from(self.lines, {
            yPercent: 110,
            duration: motion.entrance.duration,
            ease: motion.entrance.ease,
            stagger,
            delay,
            scrollTrigger: { trigger: el, start, once: true },
            onComplete: () => {
              revealed = true;
            },
          });
        },
      });

      return () => split.revert();
      });
    });

    return () => {
      cancelled = true;
      mm.revert();
    };
  }, [stagger, delay, start]);

  return (
    <Comp ref={ref} id={id} className={className}>
      {children}
    </Comp>
  );
}
