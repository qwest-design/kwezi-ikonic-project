"use client";

/**
 * Normalised tilt input in -1..1 for the seal. Desktop: pointer position.
 * Touch devices: device orientation when available without a prompt (Android),
 * or after requestTiltPermission() is called from a user gesture (iOS).
 * Otherwise the values stay at 0 and the seal only floats.
 */
export const tilt = { x: 0, y: 0 };

let detach: (() => void) | null = null;

function onPointer(e: PointerEvent) {
  if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
  tilt.x = (e.clientX / window.innerWidth) * 2 - 1;
  tilt.y = (e.clientY / window.innerHeight) * 2 - 1;
}

function onOrientation(e: DeviceOrientationEvent) {
  if (e.beta == null || e.gamma == null) return;
  // Phone held upright at roughly 45 degrees is the neutral pose.
  tilt.x = Math.max(-1, Math.min(1, e.gamma / 30));
  tilt.y = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
}

type OrientationCtor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

function needsPermission() {
  const ctor = (window as unknown as { DeviceOrientationEvent?: OrientationCtor }).DeviceOrientationEvent;
  return typeof ctor?.requestPermission === "function";
}

export function attachTiltInput() {
  if (detach) return detach;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  window.addEventListener("pointermove", onPointer, { passive: true });
  if (coarse && "DeviceOrientationEvent" in window && !needsPermission()) {
    window.addEventListener("deviceorientation", onOrientation, { passive: true });
  }
  detach = () => {
    window.removeEventListener("pointermove", onPointer);
    window.removeEventListener("deviceorientation", onOrientation);
    tilt.x = tilt.y = 0;
    detach = null;
  };
  return detach;
}

/** iOS only: call from a tap handler to ask for motion access. Resolves true if granted. */
export async function requestTiltPermission(): Promise<boolean> {
  if (!needsPermission()) return "DeviceOrientationEvent" in window;
  const ctor = DeviceOrientationEvent as OrientationCtor;
  const result = await ctor.requestPermission!().catch(() => "denied" as const);
  if (result === "granted") window.addEventListener("deviceorientation", onOrientation, { passive: true });
  return result === "granted";
}
