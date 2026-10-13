"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { motion, prefersReducedMotion } from "@/lib/motion";
import { siteStore } from "@/lib/siteStore";

export const INTRO_KEY = "ikonic:intro";
const MIN_MS = 800;
const MAX_MS = 2500;

/**
 * Inline script for <head>: marks repeat visits before first paint so the
 * preloader never flashes. Keep in sync with INTRO_KEY.
 */
export const introScript = `try{if(sessionStorage.getItem("${INTRO_KEY}"))document.documentElement.dataset.intro="done"}catch(e){}`;

/** Things the counter waits for. Each resolves once; progress = resolved / total. */
function trackAssets(onProgress: (p: number) => void) {
  const tasks: Promise<unknown>[] = [document.fonts.ready];

  tasks.push(
    document.readyState === "complete"
      ? Promise.resolve()
      : new Promise((r) => window.addEventListener("load", r, { once: true })),
  );

  document.querySelectorAll("img").forEach((img) => {
    if (img.complete) return;
    tasks.push(
      new Promise((r) => {
        img.addEventListener("load", r, { once: true });
        img.addEventListener("error", r, { once: true });
      }),
    );
  });

  let done = 0;
  onProgress(0);
  tasks.forEach((t) =>
    t.then(() => {
      done += 1;
      onProgress(done / tasks.length);
    }),
  );
}

/**
 * First-visit preloader (once per tab session). A mono counter 000 to 100 bottom-left
 * follows real loading (fonts, window load, images), lasts at least 0.8s and at most
 * 2.5s, then slides away and hands off to the page's reveals via siteStore.introDone.
 */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const el = root.current;
    const num = counter.current;

    if (document.documentElement.dataset.intro === "done" || !el || !num) {
      siteStore.setState({ introDone: true });
      setGone(true);
      return;
    }

    const reduced = prefersReducedMotion();
    const start = performance.now();
    let target = 0;
    let shown = 0;
    let finished = false;
    trackAssets((p) => (target = p));

    const render = (v: number) => {
      num.textContent = String(Math.round(v)).padStart(3, "0");
    };

    const finish = () => {
      finished = true;
      gsap.ticker.remove(tick);
      render(100);
      try {
        sessionStorage.setItem(INTRO_KEY, "1");
      } catch {}

      const tl = gsap.timeline({ onComplete: () => setGone(true) });
      if (reduced) {
        tl.to(num, { opacity: 0, duration: motion.reduced.duration });
      } else {
        tl.to(num, { yPercent: 110, duration: 0.6, ease: "power3.in" });
      }
      // Reveals set their hidden state now, while the panel still covers them.
      tl.add(() => siteStore.setState({ introDone: true }));
      tl.to(el, { opacity: 0, duration: reduced ? motion.reduced.duration : 0.5, ease: "power2.out" });
    };

    const tick = () => {
      if (finished) return;
      const elapsed = performance.now() - start;
      const goal = elapsed >= MAX_MS ? 100 : target * 100;
      // Never faster than MIN_MS from 0 to 100, and ease towards the real progress.
      const timeCap = (elapsed / MIN_MS) * 100;
      shown += (Math.min(goal, timeCap) - shown) * 0.18;
      if (Math.min(goal, timeCap) >= 100 && shown > 99.5) return finish();
      render(shown);
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
    };
  }, []);

  if (gone) return null;

  return (
    <div ref={root} className="preloader fixed inset-0 z-[90] bg-ink" role="status" aria-live="off" aria-label="Loading">
      <div className="absolute bottom-margin left-margin overflow-hidden">
        <span ref={counter} className="block font-mono text-h3 tabular-nums leading-none text-bone" aria-hidden="true">
          000
        </span>
      </div>
    </div>
  );
}
