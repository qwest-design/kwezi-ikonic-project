"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { motion, motionConditions } from "@/lib/motion";

const LABELS: Record<string, string> = { view: "View", drag: "Drag", play: "Play" };
const SIZE = 72;
const DOT = 8;
const FINE_POINTER = "(hover: hover) and (pointer: fine)";

/**
 * Custom cursor for mouse and trackpad only, never on touch or under reduced motion.
 * An 8px signal dot follows the pointer (gsap.quickTo); over [data-cursor="view|drag|play"]
 * it grows to a 72px circle with the label. data-cursor-label overrides the text.
 * The native cursor stays visible over text fields.
 */
export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const mql = window.matchMedia(`${FINE_POINTER} and ${motionConditions.full}`);
    const update = () => setEnabled(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const el = root.current;
    const text = label.current;
    if (!enabled || !el || !text) return;

    document.documentElement.dataset.customCursor = "";
    gsap.set(el, { xPercent: -50, yPercent: -50, scale: DOT / SIZE, opacity: 0 });
    const toX = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3.out" });
    const toY = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3.out" });
    let current: string | null = null;
    let visible = false;

    const setMode = (mode: string | null, custom?: string) => {
      if (mode === current) return;
      current = mode;
      const big = mode !== null;
      text.textContent = big ? (custom ?? LABELS[mode] ?? mode) : "";
      gsap.to(el, { scale: big ? 1 : DOT / SIZE, duration: motion.ui.duration, ease: motion.entrance.ease, overwrite: "auto" });
      gsap.to(text, { opacity: big ? 1 : 0, duration: motion.ui.duration * 0.75 });
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (!visible) {
        visible = true;
        gsap.set(el, { x: e.clientX, y: e.clientY });
        gsap.to(el, { opacity: 1, duration: motion.ui.duration });
      }
      toX(e.clientX);
      toY(e.clientY);
      const target = (e.target as Element | null)?.closest<HTMLElement>("[data-cursor]");
      setMode(target?.dataset.cursor ?? null, target?.dataset.cursorLabel);
    };
    const onLeave = () => {
      visible = false;
      gsap.to(el, { opacity: 0, duration: motion.ui.duration });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      delete document.documentElement.dataset.customCursor;
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[100] flex items-center justify-center rounded-full bg-signal will-change-transform"
      style={{ width: SIZE, height: SIZE, opacity: 0 }}
    >
      <span ref={label} className="type-label text-on-signal opacity-0" />
    </div>
  );
}
