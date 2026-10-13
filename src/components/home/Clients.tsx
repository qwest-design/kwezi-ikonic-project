"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { motionConditions } from "@/lib/motion";
import { Reveal } from "@/components/motion/Reveal";
import { getLenis } from "@/components/providers/SmoothScroll";
import { useSealSection } from "@/components/three/useSealSection";
import { clients, type Client } from "@/content/home";

const BASE_SPEED = 40; // px per second at rest

/**
 * 06 Clients. Two rows of greyscale logos drift in opposite directions; scroll
 * velocity (from Lenis) speeds them up. Hover crossfades a logo to full colour.
 * Reduced motion: rows stay still. Rows pause while off screen.
 */
export function Clients() {
  const ref = useRef<HTMLElement>(null);
  useSealSection(ref, { pose: { x: -0.34, rotY: -0.5, scale: 0.6, mobile: { x: -0.25, y: 0.32, scale: 0.45 } } });

  const half = Math.ceil(clients.logos.length / 2);
  const rows = [clients.logos.slice(0, half), clients.logos.slice(half)];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add(motionConditions.full, () => {
      const tracks = gsap.utils.toArray<HTMLElement>("[data-marquee]", el);
      const state = tracks.map((t, i) => ({ el: t, x: 0, dir: i % 2 === 0 ? -1 : 1, set: gsap.quickSetter(t, "x", "px") }));
      let visible = false;
      let boost = 0;
      const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
      io.observe(el);

      const tick = (_: number, deltaMs: number) => {
        if (!visible) return;
        const dt = Math.min(deltaMs, 100) / 1000;
        const velocity = Math.abs(getLenis()?.velocity ?? 0);
        boost += (Math.min(velocity * 0.12, 8) - boost) * Math.min(1, dt * 6);
        const speed = BASE_SPEED * (1 + boost);
        state.forEach((s) => {
          const loop = s.el.scrollWidth / 2; // content is duplicated once
          s.x += s.dir * speed * dt;
          if (s.x <= -loop) s.x += loop;
          if (s.x > 0) s.x -= loop;
          s.set(s.x);
        });
      };
      gsap.ticker.add(tick);
      return () => {
        gsap.ticker.remove(tick);
        io.disconnect();
        tracks.forEach((t) => gsap.set(t, { x: 0 }));
      };
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={ref} aria-labelledby="home-clients-title" className="py-s6">
      <div className="grid-site pb-s5">
        <Reveal as="h2" id="home-clients-title" className="col-span-full font-display-tight text-h2 md:col-span-9">
          {clients.title}
        </Reveal>
      </div>
      <div className="flex flex-col gap-s3 overflow-hidden">
        {rows.map((row, i) => (
          <div key={i} data-marquee className="flex w-max will-change-transform">
            <LogoList logos={row} />
            <LogoList logos={row} duplicate />
          </div>
        ))}
      </div>
    </section>
  );
}

function LogoList({ logos, duplicate = false }: { logos: Client[]; duplicate?: boolean }) {
  return (
    <ul className="flex shrink-0" aria-hidden={duplicate || undefined} aria-label={duplicate ? undefined : "Clients"}>
      {logos.map((c) => (
        <li key={c.name} className="group relative mx-s4 h-s5 w-[200px] shrink-0 md:mx-s5 md:w-[240px]">
          {/* Grey layer is a static filter; hover only crossfades opacity. */}
          <Image src={c.logo} alt={duplicate ? "" : c.name} fill unoptimized className="object-contain opacity-70 grayscale" />
          <Image
            src={c.logo}
            alt=""
            aria-hidden="true"
            fill
            unoptimized
            className="object-contain opacity-0 transition-opacity duration-(--duration-ui) group-hover:opacity-100"
          />
        </li>
      ))}
    </ul>
  );
}
