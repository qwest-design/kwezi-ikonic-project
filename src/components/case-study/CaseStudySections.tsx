import Image from "next/image";
import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";
import type { CaseStudy, Media } from "@/content/work";

/** Small numbered section heading: "01 / The challenge". */
export function SectionLabel({ index, children, id }: { index: string; children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="type-label text-mist">
      <span className="text-signal-bright">{index}</span> / {children}
    </h2>
  );
}

/**
 * A full-bleed image that drifts at `speed` inside its frame. The image is taller
 * than the frame so the global data-speed parallax never shows an edge.
 */
export function BleedImage({ media, speed = 0.85, priority = false, className = "" }: { media: Media; speed?: number; priority?: boolean; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-graphite ${className}`}>
      <div data-speed={speed} className="absolute inset-x-0 -top-[20%] -bottom-[20%] will-change-transform">
        <Image src={media.src} alt={media.alt} fill priority={priority} sizes="100vw" className="object-cover" />
      </div>
    </div>
  );
}

export function Challenge({ project }: { project: CaseStudy }) {
  return (
    <section aria-labelledby="case-challenge" className="grid-site gap-y-s3 py-s7">
      <div className="col-span-full md:col-span-3">
        <SectionLabel index="01" id="case-challenge">The challenge</SectionLabel>
      </div>
      <Reveal as="p" className="col-span-full max-w-[34ch] font-display-tight text-h3 md:col-span-8 md:col-start-5">
        {project.challenge}
      </Reveal>
    </section>
  );
}

export function Idea({ project }: { project: CaseStudy }) {
  return (
    <section aria-labelledby="case-idea" className="grid-site gap-y-s4 py-s7">
      <div className="col-span-full">
        <SectionLabel index="02" id="case-idea">The idea</SectionLabel>
      </div>
      <Reveal as="p" className="col-span-full font-accent-italic text-h2 md:col-span-11">
        {project.idea.line}
      </Reveal>
      <Reveal as="p" className="col-span-full max-w-[52ch] text-body text-mist md:col-span-5 md:col-start-7">
        {project.idea.body}
      </Reveal>
    </section>
  );
}

/**
 * Full-bleed images and a three-layer parallax spread. Layers move at 0.6x, 0.85x and
 * 1.15x of scroll (data-speed, desktop with motion only), so the back layer lags and
 * the front one leads. On mobile and reduced motion the collage simply sits still.
 */
export function Craft({ project }: { project: CaseStudy }) {
  const { lead, spread, close, caption } = project.craft;
  return (
    <section aria-labelledby="case-craft" className="flex flex-col gap-s6 py-s7">
      <div className="grid-site">
        <div className="col-span-full">
          <SectionLabel index="03" id="case-craft">The craft</SectionLabel>
        </div>
      </div>

      <BleedImage media={lead} className="aspect-[4/5] md:aspect-[16/9]" />

      <figure className="px-margin md:my-s6">
        <div className="relative aspect-[3/4] md:aspect-[16/11]">
          <SpreadLayer media={spread.back} speed={0.6} className="top-[4%] left-0 w-[78%] md:w-[60%]" aspect="aspect-[16/10]" />
          <SpreadLayer media={spread.mid} speed={0.85} className="top-[34%] right-0 w-[52%] md:top-[14%] md:w-[30%]" aspect="aspect-[4/5]" />
          <SpreadLayer media={spread.front} speed={1.15} className="bottom-[2%] left-[12%] w-[44%] md:bottom-[6%] md:left-[44%] md:w-[20%]" aspect="aspect-square" />
        </div>
        {caption && <figcaption className="type-label pt-s3 text-mist">{caption}</figcaption>}
      </figure>

      <BleedImage media={close} className="aspect-[4/5] md:aspect-[16/10]" />
    </section>
  );
}

function SpreadLayer({ media, speed, className, aspect }: { media: Media; speed: number; className: string; aspect: string }) {
  return (
    <div data-speed={speed} className={`absolute will-change-transform ${className}`}>
      <div className={`relative overflow-hidden rounded-sm bg-graphite ${aspect}`}>
        <Image src={media.src} alt={media.alt} fill sizes="(min-width: 768px) 60vw, 80vw" className="object-cover" />
      </div>
    </div>
  );
}
