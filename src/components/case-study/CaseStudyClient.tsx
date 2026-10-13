"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { motionConditions } from "@/lib/motion";
import { siteStore } from "@/lib/siteStore";
import { Reveal } from "@/components/motion/Reveal";
import { useSealSection } from "@/components/three/useSealSection";
import { SEAL_PARKED } from "@/components/three/SealZone";
import type { CaseStudy } from "@/content/work";
import { BleedImage, SectionLabel } from "./CaseStudySections";

/** Opener: huge project name, client, year, disciplines, then the hero image. */
export function Opener({ project }: { project: CaseStudy }) {
  const ref = useRef<HTMLElement>(null);
  useSealSection(ref, { pose: { x: 0.34, y: 0.26, rotY: -0.5, scale: 0.5, mobile: { x: 0.3, y: 0.34, scale: 0.36 } } });

  const meta = [
    { term: "Client", value: project.client },
    { term: "Year", value: project.year },
    { term: "Disciplines", value: project.disciplines.join(", ") },
  ];

  return (
    <section ref={ref} aria-labelledby="case-title" className="flex flex-col gap-s5 pt-s7">
      <div className="grid-site gap-y-s4 pt-s5">
        <p className="type-label col-span-full text-mist">Case study</p>
        <Reveal as="h1" id="case-title" start="top bottom" className="col-span-full font-display-tight text-hero break-words">
          {project.title}
        </Reveal>
        <dl className="col-span-full grid grid-cols-1 gap-s3 border-t border-bone/15 pt-s3 sm:grid-cols-3 md:col-span-9">
          {meta.map((m) => (
            <div key={m.term} className="flex flex-col gap-s1">
              <dt className="type-label text-mist">{m.term}</dt>
              <dd className="text-body">{m.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <BleedImage media={project.hero} priority className="aspect-[4/5] md:aspect-[16/9]" />
    </section>
  );
}

/**
 * The impact (2 to 4 results in large mono numerals, optional quote) with the stamp
 * beside it: the seal rests in the right-hand column and stamps when that column's
 * centre reaches the middle of the viewport. On mobile the column follows the results.
 */
export function Impact({ project }: { project: CaseStudy }) {
  const stamp = useRef<HTMLDivElement>(null);
  useSealSection(stamp, { pose: { x: 0.3, y: 0, rotY: 0, scale: 0.7, mobile: { x: 0, y: 0, scale: 0.6 } }, stampAtCenter: true });

  return (
    <section aria-labelledby="case-impact" className="grid-site gap-y-s5 py-s7">
      <div className="col-span-full flex flex-col gap-s5 md:col-span-7">
        <SectionLabel index="04" id="case-impact">The impact</SectionLabel>
        <dl className="flex flex-col">
          {project.impact.map((r) => (
            <div key={r.label} className="flex flex-col gap-s1 border-t border-bone/15 py-s3">
              <dt className="type-label order-2 text-mist">{r.label}</dt>
              <dd className="order-1 font-mono text-[clamp(3.5rem,1.6rem+8vw,9rem)] leading-none tracking-[-0.04em] tabular-nums">
                {r.value}
              </dd>
            </div>
          ))}
        </dl>
        {project.quote && (
          <figure className="flex flex-col gap-s3 border-t border-bone/15 pt-s4">
            <blockquote className="font-accent-italic text-h3">“{project.quote.text}”</blockquote>
            <figcaption className="type-label text-mist">
              {project.quote.name}, {project.quote.role}
            </figcaption>
          </figure>
        )}
      </div>
      <div
        ref={stamp}
        aria-labelledby="case-stamp"
        role="group"
        className="col-span-full flex min-h-[70svh] flex-col justify-between md:col-span-4 md:col-start-9 md:min-h-0"
      >
        <SectionLabel index="05" id="case-stamp">The stamp</SectionLabel>
        <p className="type-label text-bone/80">
          Stamped Ikonic<span className="text-mist"> · {project.year}</span>
        </p>
      </div>
    </section>
  );
}

/**
 * Next project panel. With motion allowed it is two screens tall with a sticky inner
 * panel: scrolling through it fills a progress line and brings the next project's
 * image up, and reaching the end clicks the link, so the page transition plays.
 * It only fires after the visitor has scrolled into the panel (not on a restored
 * scroll position). Reduced motion: a plain one-screen panel; the link is the way on.
 */
export function NextProject({ next, index, total }: { next: CaseStudy; index: number; total: number }) {
  const ref = useRef<HTMLElement>(null);
  const link = useRef<HTMLAnchorElement>(null);
  const image = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  useSealSection(ref, { pose: SEAL_PARKED });

  useEffect(() => {
    const el = ref.current;
    if (!el || !image.current || !bar.current) return;
    const mm = gsap.matchMedia();

    mm.add(motionConditions.full, () => {
      el.dataset.scroll = "on";
      let armed = false;
      let fired = false;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          onUpdate: (self) => {
            if (self.progress < 0.9) armed = true;
            if (armed && !fired && self.progress > 0.985 && self.direction > 0 && !siteStore.getState().transitioning) {
              fired = true;
              link.current?.click();
            }
          },
        },
      });
      tl.fromTo(image.current, { opacity: 0.25, scale: 1.15 }, { opacity: 0.7, scale: 1, ease: "none" }, 0).fromTo(
        bar.current,
        { scaleX: 0 },
        { scaleX: 1, ease: "none" },
        0,
      );
      return () => {
        delete el.dataset.scroll;
      };
    });
    return () => mm.revert();
  }, [next.slug]);

  return (
    <section ref={ref} aria-labelledby="case-next" className="relative h-svh data-[scroll=on]:h-[200svh]">
      <div className="sticky top-0 flex h-svh flex-col justify-between overflow-hidden py-s6">
        <div ref={image} aria-hidden="true" className="absolute inset-0 opacity-40 will-change-transform">
          <Image src={next.hero.src} alt="" fill unoptimized sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-ink/50" />
        </div>
        <div className="grid-site relative">
          <h2 id="case-next" className="type-label col-span-2 text-bone">
            Next project
          </h2>
          <p className="type-label col-span-2 text-right text-mist md:col-span-2 md:col-start-11">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </p>
        </div>
        <div className="grid-site relative gap-y-s3">
          <Link
            ref={link}
            href={`/work/${next.slug}`}
            data-cursor="view"
            className="col-span-full font-display-tight text-hero break-words focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-signal"
          >
            {next.title}
          </Link>
          <p className="type-label col-span-full text-bone/80">{next.disciplines.join(" · ")}</p>
          <div className="col-span-full hidden items-center gap-s2 pt-s2 in-data-[scroll=on]:flex">
            <span className="type-label shrink-0 text-mist">Keep scrolling</span>
            <span className="relative h-px flex-1 bg-bone/20">
              <span ref={bar} className="absolute inset-0 origin-left bg-signal" style={{ transform: "scaleX(0)" }} />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
