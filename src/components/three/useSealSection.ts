"use client";

import { useEffect, type RefObject } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { DEFAULT_POSE, sealActions, type SealPose } from "./sealStore";

export type SealSectionConfig =
  /** Hold a resting pose while the section is in the middle of the viewport. */
  | { pose: SealPose; from?: never; to?: never; stampAtCenter?: boolean }
  /** Scrub from one pose to another across the section (the travel state). */
  | { from: SealPose; to: SealPose; pose?: never; stampAtCenter?: boolean };

/**
 * Ties the seal to a page section. The section is "active" while it spans the
 * viewport centre. Pose sections set the idle pose; travel sections scrub between
 * two poses with scroll. stampAtCenter fires the stamp when the section's centre
 * reaches the viewport centre (scrolling down). Resets the seal on unmount.
 * Under reduced motion the seal ignores all of this and stays still.
 */
export function useSealSection(ref: RefObject<HTMLElement | null>, config: SealSectionConfig) {
  const { pose, from, to, stampAtCenter } = config;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const triggers: ScrollTrigger[] = [];

    if (from && to) {
      triggers.push(
        ScrollTrigger.create({
          trigger: el,
          start: "top center",
          end: "bottom center",
          onUpdate: (self) => sealActions.setTravel(self.progress),
          onToggle: (self) => {
            if (self.isActive) sealActions.setTravelPath(from, to);
            else sealActions.setPose(self.direction > 0 ? to : from);
            sealActions.setTravelActive(self.isActive);
          },
        }),
      );
    } else if (pose) {
      triggers.push(
        ScrollTrigger.create({
          trigger: el,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => self.isActive && sealActions.setPose(pose),
        }),
      );
    }

    if (stampAtCenter) {
      triggers.push(
        ScrollTrigger.create({ trigger: el, start: "center center", onEnter: () => sealActions.stamp() }),
      );
    }

    return () => {
      triggers.forEach((t) => t.kill());
      sealActions.reset();
    };
    // Poses are static per section; stringify so inline objects don't re-run this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, JSON.stringify(config)]);
}

/** Styleguide helper: spin the seal while scrolling through an element. */
export function useSealTravel(ref: RefObject<HTMLElement | null>) {
  useSealSection(ref, { from: DEFAULT_POSE, to: { rotY: Math.PI * 2 } });
}
