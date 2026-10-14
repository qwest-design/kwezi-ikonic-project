"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { motionConditions } from "@/lib/motion";
import { Button } from "@/components/ui/Button";
import { useSealSection } from "@/components/three/useSealSection";
import { capabilities } from "@/content/home";

/**
 * 03 What we do. Pinned; the four cards stack as you scroll, each earlier card
 * scaling to 0.94 and dimming. Reduced motion: a plain vertical list, no pin.
 */
export function WhatWeDo() {
  const ref = useRef<HTMLElement>(null);
  const stack = useRef<HTMLDivElement>(null);
  useSealSection(ref, { pose: { x: 0.34, rotY: Math.PI / 2, rotX: 0.15, scale: 0.9, mobile: { x: 0.3, y: 0.3, scale: 0.6 } } });

  useEffect(() => {
    const el = stack.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add(motionConditions.full, () => {
      el.dataset.stack = "on";
      const cards = gsap.utils.toArray<HTMLElement>("[data-card]", el);
      const dims = gsap.utils.toArray<HTMLElement>("[data-card-dim]", el);
      gsap.set(cards.slice(1), { yPercent: 105 });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: () => `+=${(cards.length - 1) * window.innerHeight}`,
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
      cards.slice(1).forEach((card, i) => {
        tl.to(card, { yPercent: 0, duration: 1 }, i)
          .to(cards[i], { scale: 0.94, duration: 1 }, i)
          .to(dims[i], { opacity: 0.55, duration: 1 }, i);
      });

      return () => {
        delete el.dataset.stack;
      };
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={ref} aria-labelledby="home-what-title" className="relative">
      <div className="grid-site pt-s6 pb-s4">
        <h2 id="home-what-title" className="col-span-full type-label text-mist">
          {capabilities.title}
        </h2>
      </div>
      <div
        ref={stack}
        className="flex flex-col gap-gutter px-margin data-[stack=on]:grid data-[stack=on]:h-svh data-[stack=on]:items-center data-[stack=on]:gap-0 data-[stack=on]:overflow-hidden data-[stack=on]:py-s5"
      >
        {capabilities.cards.map((card) => (
          <article
            key={card.index}
            data-card
            aria-labelledby={`cap-${card.index}`}
            className="relative flex min-h-[60svh] origin-top flex-col justify-between overflow-hidden rounded-sm border border-bone/10 bg-graphite p-s3 will-change-transform md:p-s5 in-data-[stack=on]:[grid-area:1/1] in-data-[stack=on]:h-full"
          >
            <div className="flex items-start justify-between gap-s3">
              <span className="font-mono text-h3 text-signal">{card.index}</span>
              <h3 id={`cap-${card.index}`} className="font-display-tight text-h2">
                {/* The link's ::after covers the whole card, so the card is the click target. */}
                <Link
                  href={`/capabilities#${card.title.toLowerCase()}`}
                  data-cursor="view"
                  className="after:absolute after:inset-0 after:z-10 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-4 focus-visible:after:outline-signal"
                >
                  {card.title}
                </Link>
              </h3>
            </div>
            <div className="flex max-w-[34ch] flex-col gap-s2">
              <p className="font-accent-italic text-h3">{card.tagline}</p>
              <p className="text-body text-mist">{card.promise}</p>
            </div>
            <span data-card-dim aria-hidden="true" className="pointer-events-none absolute inset-0 bg-ink opacity-0" />
          </article>
        ))}
      </div>
      <div className="grid-site py-s5">
        <div className="col-span-full">
          <Button href={capabilities.link.href} variant="ghost">
            {capabilities.link.label}
          </Button>
        </div>
      </div>
    </section>
  );
}
