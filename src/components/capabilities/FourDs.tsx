"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { motionConditions } from "@/lib/motion";
import { sealActions, type SealPose } from "@/components/three/sealStore";

type Step = { name: string; line: string };

/** The line runs from 10% to 90% of the viewport width, so the seal travels x -0.4 to 0.4. */
const FROM: SealPose = { x: -0.4, y: 0, rotY: 0, scale: 0.34, mobile: { x: -0.4, y: 0, scale: 0.22 } };
const TO: SealPose = { x: 0.4, y: 0, rotY: Math.PI * 2, scale: 0.34, mobile: { x: 0.4, y: 0, scale: 0.22 } };

/**
 * The Four Ds process band. With motion allowed the section is four screens tall and
 * its inner panel sticks: scrolling moves the seal along a horizontal line through
 * Diagnose, Define, Design and Deploy, lighting each step as it passes.
 * Reduced motion: a plain four-column band; the seal stays still.
 */
export function FourDs({ title, steps }: { title: string; steps: Step[] }) {
  const ref = useRef<HTMLElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const el = ref.current;
    if (!el || !fill.current) return;
    const mm = gsap.matchMedia();

    mm.add(motionConditions.full, () => {
      el.dataset.scroll = "on";
      const last = steps.length - 1;
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        animation: gsap.fromTo(fill.current, { scaleX: 0 }, { scaleX: 1, ease: "none" }),
        onToggle: (self) => {
          if (self.isActive) sealActions.setTravelPath(FROM, TO);
          else sealActions.setPose(self.direction > 0 ? TO : FROM);
          sealActions.setTravelActive(self.isActive);
        },
        onUpdate: (self) => {
          sealActions.setTravel(self.progress);
          // Light a step once the seal reaches its node (nodes sit at 0, 1/3, 2/3, 1).
          setActive(Math.min(last, Math.floor(self.progress * last + 0.04)));
        },
      });
      ScrollTrigger.refresh();
      return () => {
        st.kill();
        delete el.dataset.scroll;
        sealActions.setTravelActive(false);
        setActive(-1);
      };
    });
    return () => mm.revert();
  }, [steps.length]);

  return (
    <section ref={ref} aria-labelledby="four-ds-title" className="relative data-[scroll=on]:h-[400svh]">
      {/* When sticky, the line sits exactly at mid-screen, where the seal travels (pose y 0). */}
      <div className="relative flex flex-col gap-s6 py-s7 in-data-[scroll=on]:sticky in-data-[scroll=on]:top-0 in-data-[scroll=on]:h-svh in-data-[scroll=on]:py-0">
        <div className="grid-site in-data-[scroll=on]:absolute in-data-[scroll=on]:inset-x-0 in-data-[scroll=on]:top-[18svh]">
          <h2 id="four-ds-title" className="col-span-full font-display-tight text-h2">
            {title}
          </h2>
        </div>
        <div className="relative px-[10vw] in-data-[scroll=on]:absolute in-data-[scroll=on]:inset-x-0 in-data-[scroll=on]:top-1/2">
          <div className="relative h-px bg-bone/20" aria-hidden="true">
            <span ref={fill} className="absolute inset-0 origin-left bg-signal" style={{ transform: "scaleX(0)" }} />
          </div>
          <ol className="grid grid-cols-1 gap-s4 pt-s4 sm:grid-cols-2 md:absolute md:inset-x-[10vw] md:top-0 md:block md:pt-0">
            {steps.map((s, i) => {
              const lit = active === -1 || i <= active;
              return (
                <li
                  key={s.name}
                  className="flex flex-col gap-s1 transition-opacity duration-(--duration-ui) md:absolute md:w-[18vw] md:-translate-x-1/2"
                  style={{ left: `${(i / (steps.length - 1)) * 100}%`, opacity: lit ? 1 : 0.35 }}
                >
                  <span aria-hidden="true" className="hidden h-s1 w-s1 -translate-y-1/2 self-center rounded-full bg-signal md:block" />
                  <span className="type-label text-signal md:pt-s3 md:text-center">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display-tight text-h3 md:text-center">{s.name}</h3>
                  <p className="text-body text-mist md:text-center">{s.line}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
