"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { motion, motionConditions } from "@/lib/motion";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Belief statements, one per scroll step. With motion allowed the section is a
 * screen per belief and its inner panel sticks; each step swaps the statement
 * (out up, in from below). Reduced motion: all four in a plain list.
 */
export function Beliefs({ title, beliefs }: { title: string; beliefs: string[] }) {
  const ref = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add(motionConditions.full, () => {
      // Switch layout in the DOM first, so the trigger measures the tall section.
      el.dataset.scroll = "on";
      el.style.height = `${beliefs.length * 100}svh`;
      const items = gsap.utils.toArray<HTMLElement>("[data-belief]", el);
      gsap.set(items, { opacity: (i: number) => (i === 0 ? 1 : 0) });
      let shown = 0;

      const show = (next: number) => {
        if (next === shown) return;
        const down = next > shown;
        gsap.to(items[shown], { yPercent: down ? -30 : 30, opacity: 0, duration: 0.5, ease: "power2.in", overwrite: true });
        gsap.fromTo(
          items[next],
          { yPercent: down ? 30 : -30, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: motion.entrance.duration, ease: motion.entrance.ease, delay: 0.2, overwrite: true },
        );
        shown = next;
        setIndex(next);
      };

      const st = ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => show(Math.min(beliefs.length - 1, Math.floor(self.progress * beliefs.length))),
      });
      ScrollTrigger.refresh();
      return () => {
        st.kill();
        delete el.dataset.scroll;
        el.style.height = "";
        gsap.set(items, { clearProps: "all" });
        setIndex(0);
      };
    });
    return () => mm.revert();
  }, [beliefs.length]);

  return (
    <section ref={ref} aria-labelledby="beliefs-title" className="group/beliefs relative border-t border-bone/15">
      <div className="flex flex-col gap-s5 py-s7 in-data-[scroll=on]:sticky in-data-[scroll=on]:top-0 in-data-[scroll=on]:h-svh in-data-[scroll=on]:justify-center in-data-[scroll=on]:py-0">
        <div className="grid-site">
          <h2 id="beliefs-title" className="type-label col-span-2 text-mist">
            {title}
          </h2>
          <p aria-hidden="true" className="type-label col-span-2 hidden text-right text-mist in-data-[scroll=on]:block md:col-start-11">
            <span className="text-signal-bright">{pad(index + 1)}</span> / {pad(beliefs.length)}
          </p>
        </div>
        <ol className="grid-site relative gap-y-s5 in-data-[scroll=on]:min-h-[50svh]">
          {beliefs.map((b, i) => (
            <li
              key={b}
              data-belief
              aria-current={i === index ? "step" : undefined}
              className="col-span-full flex gap-s3 font-display-tight text-h2 md:col-span-10 in-data-[scroll=on]:absolute in-data-[scroll=on]:inset-x-margin in-data-[scroll=on]:top-0"
            >
              <span className="type-label shrink-0 pt-s2 text-signal-bright">{pad(i + 1)}</span>
              <span>{b}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
