"use client";

import { useRef } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { useSealSection } from "@/components/three/useSealSection";
import { hero } from "@/content/home";

/** 01 Hero. Headline is server rendered and is the LCP element; the seal idles right of centre. */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  useSealSection(ref, { pose: { x: 0.3, rotY: -0.35, scale: 0.9, mobile: { x: 0.2, y: 0.3, scale: 0.55 } } });

  return (
    <section
      ref={ref}
      aria-labelledby="home-hero-title"
      className="grid-site relative min-h-svh content-end gap-y-s4 pt-s7 pb-s5"
    >
      <Reveal as="h1" id="home-hero-title" className="col-span-full font-display-tight text-hero [font-size:min(var(--text-hero-size),19svh)] md:col-span-11">
        {hero.headline.before}
        {/* Punctuation sits inside the accent span so it never wraps onto its own line. */}
        <span className="font-accent-italic">
          {hero.headline.accent}
          <span className="font-display-tight not-italic">{hero.headline.after}</span>
        </span>
      </Reveal>
      <Reveal as="p" delay={0.15} className="col-span-full max-w-[46ch] text-body text-bone/85 md:col-span-6">
        {hero.sub}
      </Reveal>
      <div className="col-span-full flex flex-wrap items-center gap-s2">
        <Button href={hero.primary.href}>{hero.primary.label}</Button>
        <Button href={hero.secondary.href} variant="secondary">
          {hero.secondary.label}
        </Button>
      </div>
      <a href="#manifesto" className="col-span-full flex items-center gap-s2 justify-self-start type-label text-mist md:col-start-10 md:col-end-13 md:justify-self-end hover:text-bone focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal">
        <span aria-hidden="true" className="relative block h-s4 w-px overflow-hidden bg-graphite">
          <span className="scroll-cue-line absolute inset-0 block bg-signal" />
        </span>
        {hero.scrollCue}
      </a>
    </section>
  );
}
