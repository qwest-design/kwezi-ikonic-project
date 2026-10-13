"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { motion, prefersReducedMotion } from "@/lib/motion";
import { Button } from "@/components/ui/Button";

const demos = [
  { key: "entrance", label: "Entrance", spec: "expo.out 0.9s" },
  { key: "transition", label: "Transition", spec: "power3.inOut 1.2s" },
  { key: "ui", label: "UI feedback", spec: "power3.out 0.4s" },
] as const;

export function MotionDemo() {
  const refs = useRef<Record<string, HTMLSpanElement | null>>({});

  function play(key: (typeof demos)[number]["key"]) {
    const el = refs.current[key];
    if (!el) return;
    const { ease, duration } = motion[key];
    if (prefersReducedMotion()) {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: motion.reduced.duration, ease: motion.reduced.ease });
      return;
    }
    const travel = (el.parentElement?.clientWidth ?? 0) - el.offsetWidth;
    gsap.fromTo(el, { x: 0 }, { x: travel, ease, duration, yoyo: true, repeat: 1, repeatDelay: 0.2 });
  }

  return (
    <ul className="flex flex-col gap-s3">
      {demos.map((d) => (
        <li key={d.key} className="grid grid-cols-[10rem_1fr] items-center gap-s3 max-md:grid-cols-1">
          <div className="flex flex-col gap-s1">
            <Button variant="secondary" onClick={() => play(d.key)} aria-label={`Play ${d.label} motion`}>
              {d.label}
            </Button>
            <span className="type-label text-mist">{d.spec}</span>
          </div>
          <div className="relative h-s4 rounded-full bg-graphite" aria-hidden="true">
            <span
              ref={(el) => {
                refs.current[d.key] = el;
              }}
              className="absolute top-0 left-0 block size-s4 rounded-full bg-signal will-change-transform"
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
