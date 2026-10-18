"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { motionConditions } from "@/lib/motion";
import { Reveal } from "@/components/motion/Reveal";
import { getLenis } from "@/components/providers/SmoothScroll";
import { useSealSection } from "@/components/three/useSealSection";
import { selectedWork, type HomeProject } from "@/content/home";

const IMAGE_SPEED = 0.85;

/**
 * 04 Selected work. From 768px with motion allowed, vertical scroll drives a pinned
 * horizontal track and each image drifts at 0.85x inside its frame. On mobile or
 * with reduced motion it is a native swipe carousel with scroll snap and no pin.
 */
export function SelectedWork({ projects }: { projects: HomeProject[] }) {
  const ref = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);
  useSealSection(ref, { pose: { x: -0.36, y: 0.28, rotY: 0.5, scale: 0.5, mobile: { x: 0.28, y: 0.34, scale: 0.4 } } });

  useEffect(() => {
    const wrap = viewport.current;
    const list = track.current;
    if (!wrap || !list) return;
    const mm = gsap.matchMedia();

    mm.add(`${motionConditions.full} and (min-width: 768px)`, () => {
      wrap.dataset.pin = "on";
      const distance = () => list.scrollWidth - wrap.clientWidth;

      const move = gsap.to(list, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: wrap,
          start: "center center",
          end: () => `+=${distance()}`,
          pin: ref.current,
          pinSpacing: true,
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      // Images move at 0.85x of their card: drift the opposite way by 15% of the travel.
      gsap.utils.toArray<HTMLElement>("[data-work-card]", list).forEach((card) => {
        const img = card.querySelector<HTMLElement>("[data-work-image]");
        if (!img) return;
        const shift = () => (1 - IMAGE_SPEED) * (window.innerWidth + card.offsetWidth);
        gsap.fromTo(
          img,
          { x: () => -shift() / 2 },
          {
            x: () => shift() / 2,
            ease: "none",
            immediateRender: false,
            scrollTrigger: {
              trigger: card,
              containerAnimation: move,
              start: "left right",
              end: "right left",
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );
      });

      // Keyboard: bring a focused card into view by scrolling to its point on the track.
      const onFocus = (e: FocusEvent) => {
        const card = (e.target as Element).closest<HTMLElement>("[data-work-card]");
        const st = move.scrollTrigger;
        if (!card || !st) return;
        const progress = Math.min(1, Math.max(0, (card.offsetLeft - wrap.clientWidth / 4) / distance()));
        const y = st.start + progress * (st.end - st.start);
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(y, { immediate: true });
        else window.scrollTo(0, y);
        wrap.scrollLeft = 0; // the browser may try to scroll the clipped track itself
      };
      list.addEventListener("focusin", onFocus);

      return () => {
        list.removeEventListener("focusin", onFocus);
        delete wrap.dataset.pin;
      };
    });

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh, { once: true });
    return () => {
      window.removeEventListener("load", refresh);
      mm.revert();
    };
  }, []);

  return (
    <section ref={ref} aria-labelledby="home-work-title" className="relative py-s6">
      <div className="grid-site pb-s4">
        <Reveal as="h2" id="home-work-title" className="col-span-full font-display-tight text-h2 md:col-span-9">
          {selectedWork.title}
        </Reveal>
      </div>
      <div
        ref={viewport}
        className="snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-px-margin [scrollbar-width:none] data-[pin=on]:snap-none data-[pin=on]:overflow-hidden"
      >
        <ul ref={track} className="flex w-max gap-gutter px-margin will-change-transform">
          {projects.map((p) => (
            <li key={p.slug} data-work-card className="w-[78vw] shrink-0 snap-start md:w-[38vw] lg:w-[32vw]">
              <Link href={`/work/${p.slug}`} data-cursor="view" className="group flex flex-col gap-s2">
                <div data-ripple className="relative aspect-[4/5] overflow-hidden rounded-sm bg-graphite">
                  <div
                    data-work-image
                    className="absolute inset-y-0 will-change-transform"
                    style={{ width: "calc(115% + 15vw)", left: "calc(-7.5% - 7.5vw)" }}
                  >
                    <Image
                      src={p.image}
                      alt={p.imageAlt}
                      fill
                      sizes="(min-width: 768px) 45vw, 90vw"
                      className="object-cover transition-[scale] duration-(--duration-ui) ease-expo-out group-hover:scale-[1.03]"
                    />
                  </div>
                </div>
                <div className="flex items-baseline justify-between gap-s2">
                  <h3 className="font-display-tight text-h3">{p.name}</h3>
                  <span className="type-label text-mist">{p.client}</span>
                </div>
                <ul className="flex flex-wrap gap-s1" aria-label="Disciplines">
                  {p.tags.map((t) => (
                    <li key={t} className="type-label rounded-full border border-bone/20 px-s2 py-1 text-bone/80">
                      {t}
                    </li>
                  ))}
                </ul>
                <p className="text-body text-mist">{p.result}</p>
              </Link>
            </li>
          ))}
          <li data-work-card className="w-[78vw] shrink-0 snap-start md:w-[38vw] lg:w-[32vw]">
            <Link
              href={selectedWork.allLink.href}
              data-cursor="view"
              className="group flex aspect-[4/5] flex-col justify-end rounded-sm border border-bone/15 p-s3 transition-colors duration-(--duration-ui) hover:border-signal-bright"
            >
              <span className="font-display-tight text-h2">{selectedWork.allLink.label}</span>
              <span aria-hidden="true" className="type-label pt-s2 text-signal-bright">
                → /work
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
