"use client";

import { createStore } from "@/lib/createStore";

/**
 * Seal state. The 3D loop reads sealStore.getState() every frame, so updates
 * never re-render the scene.
 */
export type SealMode = "idle" | "travel" | "stamp";

/**
 * Where the seal sits. x and y are fractions of the viewport from its centre
 * (0.25 = a quarter of the width to the right); rotations in radians.
 * `mobile` overrides apply under 768px; without one, x is pulled towards centre.
 */
export type SealPose = {
  x?: number;
  y?: number;
  rotX?: number;
  rotY?: number;
  scale?: number;
  mobile?: Omit<SealPose, "mobile">;
};

type SealState = {
  mode: SealMode;
  /** Mode to return to when a stamp finishes. */
  resumeMode: Exclude<SealMode, "stamp">;
  /** Resting pose for the idle state. */
  pose: SealPose;
  /** Travel interpolates from -> to by `travel` (0..1). */
  from: SealPose;
  to: SealPose;
  travel: number;
  /** Increments on every stamp request; the scene watches it. */
  stampId: number;
};

export const DEFAULT_POSE: SealPose = {};
const SPIN: SealPose = { rotY: Math.PI * 2 };

export const sealStore = createStore<SealState>({
  mode: "idle",
  resumeMode: "idle",
  pose: DEFAULT_POSE,
  from: DEFAULT_POSE,
  to: SPIN,
  travel: 0,
  stampId: 0,
});
export const useSealStore = sealStore.useStore;
const { getState: get, setState: set } = sealStore;

export const sealActions = {
  setPose(pose: SealPose) {
    set({ pose });
  },
  setTravelPath(from: SealPose, to: SealPose) {
    set({ from, to });
  },
  setTravel(progress: number) {
    set({ travel: Math.min(1, Math.max(0, progress)) });
  },
  /** Enter or leave the travel state (e.g. from a ScrollTrigger toggle). */
  setTravelActive(active: boolean) {
    const next = active ? "travel" : "idle";
    if (get().mode === "stamp") set({ resumeMode: next });
    else set({ mode: next, resumeMode: next });
  },
  stamp() {
    const { mode, stampId } = get();
    if (mode === "stamp") return;
    set({ mode: "stamp", resumeMode: mode, stampId: stampId + 1 });
  },
  /** Called by the scene when the stamp animation has settled. */
  endStamp() {
    const { mode, resumeMode } = get();
    if (mode === "stamp") set({ mode: resumeMode });
  },
  /** Back to a centred idle seal (e.g. when a page's sections unmount). */
  reset() {
    set({ mode: "idle", resumeMode: "idle", pose: DEFAULT_POSE, from: DEFAULT_POSE, to: SPIN, travel: 0 });
  },
};

/** Resolve a pose for the current breakpoint, with defaults filled in. */
export function resolvePose(pose: SealPose, mobile: boolean) {
  const base = { x: 0, y: 0, rotX: 0, rotY: 0, scale: 1, ...pose };
  if (!mobile) return base;
  return { ...base, x: base.x * 0.3, ...pose.mobile };
}
