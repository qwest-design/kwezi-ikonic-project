"use client";

import { useRef } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { useSealSection } from "@/components/three/useSealSection";
import { closing } from "@/content/home";

/** 07 Closing CTA. When the section's centre reaches the viewport centre, the seal stamps. */
export function Closing() {
  const ref = useRef<HTMLElement>(null);
  useSealSection(ref, {
    pose: { x: 0.26, rotY: 0, mobile: { x: 0, y: 0.26, scale: 0.6 } },
    stampAtCenter: true,
  });

  return (
    <section
      ref={ref}
      aria-labelledby="home-closing-title"
      className="grid-site min-h-svh content-center gap-y-s4 py-s7"
    >
      <Reveal as="h2" id="home-closing-title" className="col-span-full font-display-tight text-h1 [font-size:min(var(--text-h1-size),15svh)] md:col-span-8">
        {closing.headline.before}
        <span className="font-accent-italic">
          {closing.headline.accent}
          <span className="font-display-tight not-italic">{closing.headline.after}</span>
        </span>
      </Reveal>
      <p className="col-span-full max-w-[40ch] text-body text-mist md:col-span-5">{closing.sub}</p>
      <div className="col-span-full">
        <Button href={closing.cta.href}>{closing.cta.label}</Button>
      </div>
    </section>
  );
}
