"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { motion, prefersReducedMotion } from "@/lib/motion";
import { siteStore, useSiteStore } from "@/lib/siteStore";
import { nav } from "@/content/nav";
import { Button } from "@/components/ui/Button";
import { getLenis } from "@/components/providers/SmoothScroll";
import { MENU_BUTTON_ID, MENU_ID } from "./Header";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Full-screen menu. Opens with a clip-path wipe from the bottom, lists pages at hero
 * size with their index, shows a preview image behind the hovered or focused name.
 * Escape closes it; focus is trapped inside while open and returned to the menu
 * button on close. Reduced motion: 0.3s fade.
 */
export function Menu() {
  const open = useSiteStore((s) => s.menuOpen);
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState<number | null>(null);

  // Built ahead of time while the browser is idle (and at the latest on open), then kept:
  // building it on the tap cost ~100ms of the tap's first paint (INP). While closed it is
  // clipped away and inert, so nothing in it can be focused or read.
  if (open && !mounted) setMounted(true);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (mounted) return;
    const build = () => setMounted(true);
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(build, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(build, 2000);
    return () => window.clearTimeout(id);
  }, [mounted]);

  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const reduced = prefersReducedMotion();
    const items = el.querySelectorAll("[data-menu-item]");
    const lenis = getLenis();

    if (open) {
      wasOpen.current = true;
      // Locking scroll re-lays out the whole page, so it waits until the panel covers
      // the screen; doing it on the tap held the tap's first paint (INP) for ~130ms.
      const lockScroll = () => {
        lenis?.stop();
        document.documentElement.style.overflow = "hidden";
      };
      const tl = gsap.timeline({ paused: true });
      if (reduced) {
        tl.set(el, { clipPath: "none" })
          .fromTo(el, { opacity: 0 }, { opacity: 1, duration: motion.reduced.duration })
          .call(lockScroll);
      } else {
        // Mask rows only while they slide in, so focus outlines are not clipped later.
        const rows = el.querySelectorAll<HTMLElement>("[data-menu-row]");
        gsap.set(rows, { overflow: "hidden" });
        tl.eventCallback("onComplete", () => gsap.set(rows, { overflow: "visible" }));
        tl.call(lockScroll, undefined, motion.entrance.duration);
        tl.fromTo(
          el,
          { clipPath: "inset(100% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: motion.entrance.duration, ease: motion.transition.ease },
        ).from(
          items,
          { yPercent: 110, duration: motion.entrance.duration, ease: motion.entrance.ease, stagger: 0.05 },
          0.25,
        );
      }
      // Let the tap paint first, then start the wipe and move focus in.
      let timer = 0;
      const frame = requestAnimationFrame(() => {
        timer = window.setTimeout(() => {
          tl.play();
          el.querySelector<HTMLElement>("[data-menu-first]")?.focus({ preventScroll: true });
        });
      });
      return () => {
        cancelAnimationFrame(frame);
        clearTimeout(timer);
        tl.kill();
        lockScroll();
      };
    }

    if (!wasOpen.current) return;
    wasOpen.current = false;
    const finish = () => {
      setActive(null);
      // A page transition keeps scrolling paused until its panel lifts.
      if (!siteStore.getState().transitioning) lenis?.start();
      document.documentElement.style.overflow = "";
    };

    // Under a page transition the panel already covers everything: close instantly.
    if (siteStore.getState().transitioning) {
      finish();
      return;
    }

    document.getElementById(MENU_BUTTON_ID)?.focus({ preventScroll: true });
    const tween = reduced
      ? gsap.to(el, { opacity: 0, duration: motion.reduced.duration, onComplete: finish })
      : gsap.to(el, {
          clipPath: "inset(0% 0% 100% 0%)",
          duration: 0.6,
          ease: motion.transition.ease,
          onComplete: finish,
        });
    return () => {
      tween.kill();
    };
  }, [open, mounted]);

  // Escape closes, Tab cycles inside the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        siteStore.setState({ menuOpen: false });
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const focusables = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (!panel.current.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!mounted) return null;

  const close = () => siteStore.setState({ menuOpen: false });

  return (
    <div
      ref={panel}
      id={MENU_ID}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      inert={!open}
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-graphite"
      style={{ clipPath: "inset(100% 0% 0% 0%)" }}
    >
      {/* Preview images sit behind the list */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {nav.map((item, i) => (
          <div
            key={item.href}
            className="absolute top-1/2 right-[8vw] aspect-[4/3] w-[min(44vw,640px)] -translate-y-1/2 transition-[opacity,scale] duration-(--duration-ui) ease-expo-out max-md:hidden"
            style={{ opacity: active === i ? 0.9 : 0, scale: active === i ? "1" : "1.06" }}
          >
            <Image src={item.preview} alt="" fill sizes="44vw" unoptimized className="object-cover" />
          </div>
        ))}
      </div>

      <div className="relative flex items-center justify-between gap-s3 px-margin py-s2">
        <Link
          href="/"
          onClick={pathname === "/" ? close : undefined}
          className="font-display-tight text-[1.75rem] leading-none"
          aria-label="Ikonic Designs, home"
        >
          Ikonic<span className="text-signal">.</span>
        </Link>
        <Button variant="secondary" onClick={close}>
          Close
        </Button>
      </div>

      <nav aria-label="Main" className="relative grid-site flex-1 content-center py-s5">
        <ol className="col-span-full flex flex-col">
          {nav.map((item, i) => (
            <li key={item.href} data-menu-row>
              <div data-menu-item>
                <Link
                  href={item.href}
                  data-menu-first={i === 0 ? "" : undefined}
                  aria-current={pathname === item.href ? "page" : undefined}
                  onClick={pathname === item.href ? close : undefined}
                  onPointerEnter={() => setActive(i)}
                  onPointerLeave={() => setActive((a) => (a === i ? null : a))}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive((a) => (a === i ? null : a))}
                  className="group inline-flex items-start gap-s2 py-[0.04em] font-display-tight leading-[0.92] text-bone outline-offset-8 [font-size:min(var(--text-hero-size),15svh,15vw)] aria-[current=page]:text-mist"
                >
                  <span className="type-label pt-[0.6em] text-mist group-hover:text-signal">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{item.label}</span>
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
