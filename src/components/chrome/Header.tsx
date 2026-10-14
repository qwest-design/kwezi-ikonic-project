"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { motion, motionConditions } from "@/lib/motion";
import { siteStore, useSiteStore } from "@/lib/siteStore";
import { Button } from "@/components/ui/Button";

export const MENU_ID = "site-menu";
export const MENU_BUTTON_ID = "site-menu-button";

/**
 * Fixed header: wordmark left; Work, Start a project and the menu button right.
 * Slides away on scroll down and back on scroll up (always visible under reduced
 * motion). A 1px signal line along the bottom edge shows page scroll progress.
 */
export function Header() {
  const bar = useRef<HTMLElement>(null);
  const line = useRef<HTMLSpanElement>(null);
  const menuOpen = useSiteStore((s) => s.menuOpen);

  useEffect(() => {
    const el = bar.current;
    const progress = line.current;
    if (!el || !progress) return;

    const setProgress = gsap.quickSetter(progress, "scaleX");
    let hidden = false;
    const show = (visible: boolean) => {
      if (hidden === !visible) return;
      hidden = !visible;
      gsap.to(el, { yPercent: visible ? 0 : -100, duration: motion.ui.duration, ease: motion.ui.ease, overwrite: true });
    };

    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate(self) {
        setProgress(self.progress);
        // Solid backing once content can scroll underneath.
        el.toggleAttribute("data-scrolled", self.scroll() > 8);
        if (!window.matchMedia(motionConditions.full).matches) return show(true);
        if (siteStore.getState().menuOpen) return show(true);
        // Keyboard users tabbing into the header must be able to see it.
        if (el.contains(document.activeElement)) return show(true);
        if (self.scroll() < 120) return show(true);
        show(self.direction < 0);
      },
      onRefresh: (self) => setProgress(self.progress),
    });

    const onFocus = () => show(true);
    el.addEventListener("focusin", onFocus);

    return () => {
      st.kill();
      el.removeEventListener("focusin", onFocus);
    };
  }, []);

  return (
    <header
      ref={bar}
      className="fixed inset-x-0 top-0 z-40 transition-colors duration-(--duration-ui) will-change-transform data-[scrolled]:bg-ink/90"
      // Hidden from assistive tech and focus while the menu (which has its own controls) is open.
      inert={menuOpen}
    >
      <div className="flex items-center justify-between gap-s3 px-margin py-s2">
        <Link href="/" className="font-display-tight text-[1.75rem] leading-none" aria-label="Ikonic Designs, home">
          Ikonic<span className="text-signal">.</span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-s2 md:gap-s3">
          <Link href="/work" className="type-label hidden underline-offset-[6px] hover:underline sm:inline">
            Work
          </Link>
          <span className="hidden sm:block">
            <Button href="/contact">Start a project</Button>
          </span>
          <MenuButton />
        </nav>
      </div>
      <span
        ref={line}
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 block h-px origin-left bg-signal"
        style={{ transform: "scaleX(0)" }}
      />
    </header>
  );
}

function MenuButton() {
  const open = useSiteStore((s) => s.menuOpen);
  return (
    <Button
      id={MENU_BUTTON_ID}
      variant="secondary"
      aria-expanded={open}
      aria-controls={MENU_ID}
      onClick={() => siteStore.setState({ menuOpen: !open })}
    >
      Menu
    </Button>
  );
}
