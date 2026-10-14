"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { motion, prefersReducedMotion } from "@/lib/motion";
import { siteStore } from "@/lib/siteStore";
import { getLenis, resetScroll, scrollToHash } from "@/components/providers/SmoothScroll";

const HALF = motion.transition.duration / 2; // 0.6s cover + 0.6s reveal = 1.2s

/**
 * Route transitions for internal links. A bone panel wipes up over the old page,
 * the route changes underneath, scroll resets to the top, ScrollTrigger refreshes,
 * then the panel wipes away upwards. The 3D seal is lifted above the panel for the
 * duration, so it stays on screen. Reduced motion: a 0.3s fade each way.
 * Back/forward navigation skips the panel but still resets and refreshes.
 */
export function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  const pending = useRef<{ href: string; resolve: () => void } | null>(null);
  const first = useRef(true);

  // Hand the panel's resting position (off-screen below) over to GSAP.
  useEffect(() => {
    if (panel.current) gsap.set(panel.current, { y: 0, yPercent: 100, autoAlpha: 0 });
  }, []);

  // Intercept internal link clicks before Next's <Link> handles them.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!a || a.target === "_blank" || a.hasAttribute("download") || a.dataset.transition === "off") return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname) {
        // Same page with a hash: scroll there ourselves (smoothly, below the header).
        if (url.hash && url.hash !== "#" && document.getElementById(decodeURIComponent(url.hash.slice(1)))) {
          e.preventDefault();
          if (siteStore.getState().menuOpen) siteStore.setState({ menuOpen: false });
          history.pushState(history.state, "", url.pathname + url.search + url.hash);
          scrollToHash(url.hash);
        }
        return; // otherwise the menu's "current page" link: nothing to do
      }
      if (siteStore.getState().transitioning) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      navigate(url.pathname + url.search + url.hash);
    };

    const navigate = (href: string) => {
      const el = panel.current;
      if (!el) return router.push(href);
      const reduced = prefersReducedMotion();
      siteStore.setState({ transitioning: true });
      document.documentElement.dataset.transition = "on";
      // No scrolling while covered: leftover wheel momentum would land on the new page.
      getLenis()?.stop();

      const cover = reduced
        ? gsap.fromTo(el, { yPercent: 0, autoAlpha: 0 }, { autoAlpha: 1, duration: motion.reduced.duration })
        : gsap.fromTo(el, { yPercent: 100, autoAlpha: 1 }, { yPercent: 0, duration: HALF, ease: motion.transition.ease });

      cover.then(() => {
        siteStore.setState({ menuOpen: false });
        new Promise<void>((resolve) => {
          pending.current = { href, resolve };
          router.push(href, { scroll: false });
          // Never leave the panel stuck if the route fails to change.
          setTimeout(resolve, 5000);
        }).then(() => {
          const reveal = reduced
            ? gsap.to(el, { opacity: 0, duration: motion.reduced.duration })
            : gsap.to(el, { yPercent: -100, duration: HALF, ease: motion.transition.ease });
          // Content can start its entrances as the panel lifts.
          siteStore.setState({ transitioning: false });
          reveal.then(() => {
            // Scroll resumes once the panel has gone, so trackpad momentum can't carry over.
            getLenis()?.start();
            delete document.documentElement.dataset.transition;
            gsap.set(el, { yPercent: 100, autoAlpha: 0 });
          });
        });
      });
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  // New route rendered: reset scroll, re-measure triggers, release the panel.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      // Landed directly on a URL with a hash: pins and spacers shift layout after load,
      // so re-measure and jump once everything has settled.
      if (location.hash) {
        const settle = () => {
          ScrollTrigger.refresh();
          scrollToHash(location.hash, { immediate: true });
        };
        const go = () => setTimeout(settle, 300);
        if (document.readyState === "complete") go();
        else window.addEventListener("load", go, { once: true });
      }
      return;
    }
    resetScroll();
    // Let the new page's effects create their triggers first.
    const id = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      // Arrived on a link with a hash (/capabilities#identity): jump to it under the panel.
      if (location.hash) scrollToHash(location.hash, { immediate: true });
      pending.current?.resolve();
      pending.current = null;
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <div
      ref={panel}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] bg-bone will-change-transform"
      style={{ transform: "translateY(100%)", visibility: "hidden" }}
    />
  );
}
