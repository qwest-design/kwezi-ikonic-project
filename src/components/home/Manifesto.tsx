"use client";

import { useEffect, useRef } from "react";
import { gsap, SplitText } from "@/lib/gsap";
import { motionConditions } from "@/lib/motion";
import { useSealSection } from "@/components/three/useSealSection";
import { manifesto } from "@/content/home";

/**
 * 02 Manifesto. Each word scrubs from 20% to 100% opacity with scroll; the seal turns
 * edge-on across the section. Reduced motion: words stay at full opacity.
 */
export function Manifesto() {
  const ref = useRef<HTMLElement>(null);
  useSealSection(ref, {
    from: { x: 0.3, rotY: -0.35, scale: 0.9, mobile: { x: 0.2, y: 0.3, scale: 0.55 } },
    to: { x: 0.34, rotY: Math.PI / 2, rotX: 0.15, scale: 0.9, mobile: { x: 0.3, y: 0.3, scale: 0.6 } },
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add(motionConditions.full, () => {
      const splits = [...el.querySelectorAll<HTMLElement>("[data-manifesto-line]")].map((line) => {
        const split = SplitText.create(line, { type: "words", aria: "auto" });
        gsap.fromTo(
          split.words,
          { opacity: 0.2 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.1,
            scrollTrigger: { trigger: line, start: "top 85%", end: "bottom 45%", scrub: true },
          },
        );
        return split;
      });
      return () => splits.forEach((s) => s.revert());
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={ref} id="manifesto" aria-labelledby="home-manifesto-title" className="grid-site gap-y-s5 py-s7">
      <h2 id="home-manifesto-title" className="sr-only">
        Manifesto
      </h2>
      {manifesto.map((line, i) => (
        <p
          key={i}
          data-manifesto-line
          className={
            i === 0
              ? "col-span-full font-display-tight text-h2 md:col-span-10"
              : "col-span-full font-display-tight text-h3 md:col-span-9 md:col-start-2"
          }
        >
          {line}
        </p>
      ))}
    </section>
  );
}
