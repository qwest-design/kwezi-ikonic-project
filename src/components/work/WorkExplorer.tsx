"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Flip, gsap, ScrollTrigger } from "@/lib/gsap";
import { motion, prefersReducedMotion } from "@/lib/motion";
import { DISCIPLINES, type CaseStudy, type Discipline } from "@/content/work";

type Filter = "All" | Discipline;
type View = "grid" | "list";

const FILTERS: Filter[] = ["All", ...DISCIPLINES];
const POINTER_QUERY = "(hover: hover) and (pointer: fine)";

const matches = (p: CaseStudy, f: Filter) => f === "All" || p.disciplines.includes(f);
const pad = (n: number) => String(n).padStart(2, "0");

const toggleClasses =
  "type-label min-h-11 rounded-full border px-s2 transition-[background-color,color,border-color] duration-(--duration-ui) " +
  "border-bone/25 text-bone/80 hover:border-bone hover:text-bone aria-pressed:border-bone aria-pressed:bg-bone aria-pressed:text-ink " +
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal";

/**
 * The /work index: discipline filters and a grid/list toggle.
 * Filtering keeps every project in the DOM and hides the ones that don't match, so
 * GSAP Flip can animate cards out, in and into their new places.
 * In list view, on pointer devices, the hovered row's image follows the cursor.
 * Reduced motion: filters and views swap with a 0.3s fade, and the image follows without lag.
 */
export function WorkExplorer({ projects }: { projects: CaseStudy[] }) {
  const [filter, setFilter] = useState<Filter>("All");
  const [view, setView] = useState<View>("grid");
  const container = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const viewChanged = useRef(false);

  const count = projects.filter((p) => matches(p, filter)).length;
  const items = () => gsap.utils.toArray<HTMLElement>("[data-flip-item]", container.current);

  const chooseFilter = (next: Filter) => {
    if (next === filter) return;
    flipState.current = Flip.getState(items());
    setFilter(next);
    // Keep the choice in the URL (?discipline=identity) so it can be shared and survives a reload.
    const url = new URL(location.href);
    if (next === "All") url.searchParams.delete("discipline");
    else url.searchParams.set("discipline", next.toLowerCase());
    history.replaceState(history.state, "", url.pathname + url.search + url.hash);
  };

  // Start from ?discipline= when the page is opened with one (no animation).
  useEffect(() => {
    const read = () => {
      const param = new URLSearchParams(location.search).get("discipline")?.toLowerCase();
      setFilter(FILTERS.find((f) => f.toLowerCase() === param) ?? "All");
      requestAnimationFrame(() => ScrollTrigger.refresh());
    };
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);

  const chooseView = (next: View) => {
    if (next === view) return;
    viewChanged.current = true;
    setView(next);
  };

  // Filter changed: animate from the captured layout to the new one.
  useLayoutEffect(() => {
    const state = flipState.current;
    if (!state) return;
    flipState.current = null;

    if (prefersReducedMotion()) {
      gsap.fromTo(items().filter((el) => !el.dataset.out), { opacity: 0 }, { opacity: 1, duration: motion.reduced.duration });
      ScrollTrigger.refresh();
      return;
    }

    const flip = Flip.from(state, {
      duration: 0.8,
      ease: "power3.inOut",
      absolute: true,
      prune: true,
      onEnter: (els) =>
        gsap.fromTo(els, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.6, delay: 0.2, ease: motion.entrance.ease }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.9, duration: 0.4, ease: "power2.in" }),
      onComplete: () => ScrollTrigger.refresh(),
    });
    return () => {
      flip.progress(1).kill();
    };
  }, [filter]);

  // View changed: a short fade-up of the new layout.
  useLayoutEffect(() => {
    if (!viewChanged.current || !container.current) return;
    viewChanged.current = false;
    const reduced = prefersReducedMotion();
    const tween = gsap.fromTo(
      container.current,
      { opacity: 0, y: reduced ? 0 : 24 },
      { opacity: 1, y: 0, duration: reduced ? motion.reduced.duration : motion.ui.duration * 1.5, ease: motion.ui.ease, clearProps: "transform" },
    );
    ScrollTrigger.refresh();
    return () => {
      tween.progress(1).kill();
    };
  }, [view]);

  return (
    <div className="flex flex-col gap-s5">
      <div className="grid-site gap-y-s3">
        <div role="group" aria-label="Filter by discipline" className="col-span-full flex flex-wrap gap-s1 md:col-span-9">
          {FILTERS.map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => chooseFilter(f)} className={toggleClasses}>
              {f}
              <sup className="ml-1 text-[0.8em] opacity-60">{projects.filter((p) => matches(p, f)).length}</sup>
            </button>
          ))}
        </div>
        <div role="group" aria-label="Layout" className="col-span-full flex gap-s1 md:col-span-3 md:justify-end">
          {(["grid", "list"] as const).map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => chooseView(v)} className={toggleClasses}>
              {v === "grid" ? "Grid" : "List"}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="sr-only">
          {`Showing ${count} ${count === 1 ? "project" : "projects"}${filter === "All" ? "" : ` in ${filter}`}.`}
        </p>
      </div>

      <div ref={container} className="px-margin">
        {view === "grid" ? <WorkGrid projects={projects} filter={filter} /> : <WorkList projects={projects} filter={filter} />}
      </div>
    </div>
  );
}

function WorkGrid({ projects, filter }: { projects: CaseStudy[]; filter: Filter }) {
  return (
    <ul className="relative grid grid-cols-1 gap-x-gutter gap-y-s5 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((p, i) => (
        <li key={p.slug} data-flip-id={p.slug} data-flip-item data-out={matches(p, filter) ? undefined : ""} className="data-out:hidden">
          <Link href={`/work/${p.slug}`} data-cursor="view" className="group flex flex-col gap-s2">
            <div data-ripple className="relative aspect-[4/5] overflow-hidden rounded-sm bg-graphite">
              <Image
                src={p.hero.src}
                alt={p.hero.alt}
                fill
                unoptimized
                priority={i < 3}
                sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 90vw"
                className="object-cover transition-[scale] duration-(--duration-ui) ease-expo-out group-hover:scale-[1.03]"
              />
            </div>
            <div className="flex items-baseline justify-between gap-s2">
              <h2 className="font-display-tight text-h3">{p.title}</h2>
              <span className="type-label text-mist">{p.year}</span>
            </div>
            <p className="type-label text-mist">{p.client}</p>
            <ul className="flex flex-wrap gap-s1" aria-label="Disciplines">
              {p.disciplines.map((d) => (
                <li key={d} className="type-label rounded-full border border-bone/20 px-s2 py-1 text-bone/80">
                  {d}
                </li>
              ))}
            </ul>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function WorkList({ projects, filter }: { projects: CaseStudy[]; filter: Filter }) {
  const preview = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const enabled = useRef(false);
  const move = useRef<{ x: gsap.QuickToFunc; y: gsap.QuickToFunc } | null>(null);

  useEffect(() => {
    const el = preview.current;
    if (!el) return;
    const mq = window.matchMedia(POINTER_QUERY);
    const setup = () => {
      enabled.current = mq.matches;
      const duration = prefersReducedMotion() ? 0 : 0.6;
      move.current = {
        x: gsap.quickTo(el, "x", { duration, ease: "power3.out" }),
        y: gsap.quickTo(el, "y", { duration, ease: "power3.out" }),
      };
    };
    setup();
    gsap.set(el, { xPercent: -50, yPercent: -50, autoAlpha: 0, scale: 0.8 });
    mq.addEventListener("change", setup);
    // The row under a still pointer changes as the page scrolls; hide rather than show the wrong image.
    const hide = () => setActive(null);
    window.addEventListener("scroll", hide, { passive: true });
    return () => {
      mq.removeEventListener("change", setup);
      window.removeEventListener("scroll", hide);
      gsap.killTweensOf(el);
    };
  }, []);

  useEffect(() => {
    const el = preview.current;
    if (!el || !enabled.current) return;
    const reduced = prefersReducedMotion();
    gsap.to(el, {
      autoAlpha: active ? 1 : 0,
      scale: reduced ? 1 : active ? 1 : 0.8,
      duration: reduced ? motion.reduced.duration : motion.ui.duration,
      ease: motion.ui.ease,
      overwrite: "auto",
    });
  }, [active]);

  const onPointerMove = (e: React.PointerEvent) => {
    if (!enabled.current || e.pointerType !== "mouse") return;
    move.current?.x(e.clientX);
    move.current?.y(e.clientY);
  };

  const firstMove = (e: React.PointerEvent, slug: string) => {
    if (!enabled.current || e.pointerType !== "mouse") return;
    // Jump into place on entering the list so the image doesn't fly in from the last spot.
    if (!active && preview.current) gsap.set(preview.current, { x: e.clientX, y: e.clientY });
    setActive(slug);
  };

  return (
    <>
      <ul className="group/list relative border-b border-bone/15" onPointerMove={onPointerMove} onPointerLeave={() => setActive(null)}>
        {projects.map((p, i) => (
          <li
            key={p.slug}
            data-flip-id={p.slug}
            data-flip-item
            data-out={matches(p, filter) ? undefined : ""}
            className="border-t border-bone/15 transition-opacity duration-(--duration-ui) data-out:hidden pointer-fine:group-hover/list:opacity-40 pointer-fine:hover:opacity-100!"
          >
            <Link
              href={`/work/${p.slug}`}
              data-cursor="view"
              onPointerEnter={(e) => firstMove(e, p.slug)}
              onFocus={() => setActive(null)}
              className="grid grid-cols-4 items-baseline gap-x-gutter gap-y-s1 py-s3 md:grid-cols-12"
            >
              <span className="type-label col-span-1 text-mist md:col-span-1">{pad(i + 1)}</span>
              <h2 className="col-span-3 font-display-tight text-h3 md:col-span-5">{p.title}</h2>
              <span className="type-label col-span-3 col-start-2 text-mist md:col-span-3 md:col-start-auto">{p.client}</span>
              <span className="type-label col-span-3 col-start-2 text-bone/80 md:col-span-2 md:col-start-auto">
                {p.disciplines.join(" · ")}
              </span>
              <span className="type-label col-span-3 col-start-2 text-mist md:col-span-1 md:col-start-auto md:text-right">{p.year}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div
        ref={preview}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-30 hidden aspect-[4/5] w-[min(22vw,320px)] overflow-hidden rounded-sm bg-graphite pointer-fine:block"
        style={{ visibility: "hidden" }}
      >
        {projects.map((p) => (
          <Image
            key={p.slug}
            src={p.hero.src}
            alt=""
            fill
            unoptimized
            sizes="320px"
            className="object-cover transition-opacity duration-(--duration-ui)"
            style={{ opacity: active === p.slug ? 1 : 0 }}
          />
        ))}
      </div>
    </>
  );
}
