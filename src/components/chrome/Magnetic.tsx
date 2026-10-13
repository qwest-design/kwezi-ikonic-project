"use client";

import { useEffect } from "react";
import { gsap } from "@/lib/gsap";
import { motionConditions } from "@/lib/motion";

const MAX_SHIFT = 8;
const RADIUS = 60;

type Entry = { el: HTMLElement; x: (v: number) => void; y: (v: number) => void; dx: number; dy: number };

/**
 * Magnetic pull for every [data-magnetic] element (Button adds it by default):
 * within 60px of its edge the element shifts up to 8px towards the pointer.
 * Pointer devices only, off under reduced motion. One listener for the whole site.
 */
export function Magnetic() {
  useEffect(() => {
    const mql = window.matchMedia(`(hover: hover) and (pointer: fine) and ${motionConditions.full}`);
    const entries = new Map<HTMLElement, Entry>();
    let frame = 0;
    let px = -1e4;
    let py = -1e4;

    const entryFor = (el: HTMLElement) => {
      let e = entries.get(el);
      if (!e) {
        e = {
          el,
          x: gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" }),
          y: gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" }),
          dx: 0,
          dy: 0,
        };
        entries.set(el, e);
      }
      return e;
    };

    const update = () => {
      frame = 0;
      const live = new Set<HTMLElement>();
      document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
        live.add(el);
        const e = entryFor(el);
        const r = el.getBoundingClientRect();
        // Measure the resting box, not the shifted one.
        const left = r.left - (gsap.getProperty(el, "x") as number);
        const top = r.top - (gsap.getProperty(el, "y") as number);
        const cx = left + r.width / 2;
        const cy = top + r.height / 2;
        const outX = Math.max(left - px, 0, px - (left + r.width));
        const outY = Math.max(top - py, 0, py - (top + r.height));
        const edgeDist = Math.hypot(outX, outY);
        let tx = 0;
        let ty = 0;
        if (edgeDist < RADIUS) {
          const strength = 1 - edgeDist / RADIUS;
          const vx = px - cx;
          const vy = py - cy;
          const len = Math.hypot(vx, vy) || 1;
          const pull = Math.min(1, len / (Math.max(r.width, r.height) / 2 + RADIUS));
          tx = (vx / len) * MAX_SHIFT * strength * pull;
          ty = (vy / len) * MAX_SHIFT * strength * pull;
        }
        if (tx !== e.dx || ty !== e.dy) {
          e.dx = tx;
          e.dy = ty;
          e.x(tx);
          e.y(ty);
        }
      });
      // Forget elements that left the page.
      entries.forEach((_, el) => !live.has(el) && entries.delete(el));
    };

    const onMove = (ev: PointerEvent) => {
      if (!mql.matches || ev.pointerType === "touch") return;
      px = ev.clientX;
      py = ev.clientY;
      if (!frame) frame = requestAnimationFrame(update);
    };
    const reset = () => {
      px = py = -1e4;
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", reset);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", reset);
    };
  }, []);

  return null;
}
