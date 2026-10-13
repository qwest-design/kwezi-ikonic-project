"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { motionConditions } from "@/lib/motion";
import type { Stat } from "@/content/home";

// Grouped with a no-break space (South African style). Done by hand, not toLocaleString,
// so server and browser produce identical text and hydration matches.
const format = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");

/**
 * 05 Proof. Mono counters that count up once when they scroll into view.
 * Renders nothing when `stats` is empty. Final values are in the HTML, so
 * no-JS and reduced motion show the real numbers without counting.
 */
export function Proof({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add(motionConditions.full, () => {
      const nums = gsap.utils.toArray<HTMLElement>("[data-count]", el);
      nums.forEach((n) => {
        const target = Number(n.dataset.count);
        const obj = { v: 0 };
        n.textContent = format(0);
        ScrollTrigger.create({
          trigger: n,
          start: "top 85%",
          once: true,
          onEnter: () =>
            gsap.to(obj, { v: target, duration: 1.6, ease: "expo.out", onUpdate: () => (n.textContent = format(obj.v)) }),
        });
      });
      return () => nums.forEach((n) => (n.textContent = format(Number(n.dataset.count))));
    });
    return () => mm.revert();
  }, [stats]);

  if (!stats.length) return null;

  return (
    <section ref={ref} aria-label="Proof" className="grid-site py-s6">
      <dl className="col-span-full grid grid-cols-2 gap-x-gutter gap-y-s5 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col-reverse gap-s1 border-t border-bone/15 pt-s3">
            <dt className="type-label text-mist">{s.label}</dt>
            <dd className="font-mono text-h2 leading-none tabular-nums">
              <span className="sr-only">
                {s.prefix}
                {format(s.value)}
                {s.suffix}
              </span>
              <span aria-hidden="true">
                {s.prefix}
                <span data-count={s.value}>{format(s.value)}</span>
                {s.suffix}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
