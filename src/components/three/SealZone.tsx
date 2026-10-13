"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useSealSection } from "./useSealSection";
import { sealActions, type SealPose } from "./sealStore";

/** Seal pose for when the seal should be out of the way (parked below the fold). */
export const SEAL_PARKED: SealPose = { x: 0.1, y: -0.95, scale: 0.3 };

/**
 * Wraps server-rendered content in a block that sets the seal's pose while it spans
 * the viewport centre (see useSealSection). Lets server components choreograph the seal.
 * `initial` applies the pose on load too, for a first zone that may not reach the centre.
 */
export function SealZone({ pose, initial = false, className, children }: { pose: SealPose; initial?: boolean; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useSealSection(ref, { pose });
  useEffect(() => {
    if (initial) sealActions.setPose(pose);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
