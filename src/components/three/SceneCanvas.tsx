"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { gsap } from "@/lib/gsap";
import { Environment } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Seal } from "./Seal";
import { StampRing, type StampRingHandle } from "./StampRing";
import { attachTiltInput } from "./tiltInput";
import { useSealStore } from "./sealStore";
import { CardRipples, SceneRenderer, useRippleOverlay } from "./CardRipples";

/**
 * The one persistent WebGL canvas: fixed, full viewport, behind content, never
 * takes pointer events. Loaded lazily by SceneLoader. Fades in only once the
 * environment map has loaded and the first frame is drawn.
 */
export default function SceneCanvas() {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [ringActive, setRingActive] = useState(false);
  // Switch Bloom on as the press starts, so it is warm before the ring appears.
  const stamping = useSealStore((s) => s.mode === "stamp");
  const bloomOn = stamping || ringActive;
  const ring = useRef<StampRingHandle>(null);
  const overlay = useRippleOverlay();
  const composerOn = bloomOn && !reduced;

  useEffect(() => (reduced ? undefined : attachTiltInput()), [reduced]);

  const onImpact = useCallback((at: THREE.Vector3, scale: number) => ring.current?.emit(at, scale), []);

  // Full motion: frames are driven from the GSAP ticker (see TickerDriver), the same
  // loop that runs Lenis and ScrollTrigger, so DOM-tracked planes never lag a frame.
  // Reduced motion: render on demand only, which gives one still frame once loaded.
  const frameloop = reduced ? "demand" : "never";

  return (
    <div
      aria-hidden="true"
      className="scene-layer pointer-events-none fixed inset-0 z-0 transition-opacity ease-out"
      style={{ opacity: visible ? 1 : 0, transitionDuration: reduced ? "0.3s" : "0.9s" }}
    >
      <Canvas
        frameloop={frameloop}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 6], fov: 32, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ pointerEvents: "none" }}
      >
        <Suspense fallback={null}>
          <Environment files="/hdri/studio_small_03_512.hdr" environmentIntensity={1} />
          <Seal reducedMotion={reduced} onImpact={onImpact} />
          <StampRing ref={ring} onActiveChange={setRingActive} />
          <Ready onReady={() => setVisible(true)} />
        </Suspense>
        {/* Bloom only runs while the stamp ring is alive, so idle frames skip post-processing. */}
        <TickerDriver active={!reduced} />
        <CardRipples overlay={overlay} />
        <SceneRenderer overlay={overlay} composerOn={composerOn} />
        <EffectComposer enabled={composerOn} multisampling={0}>
          <Bloom mipmapBlur luminanceThreshold={2} luminanceSmoothing={0.1} intensity={1} radius={0.45} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

/**
 * Advances R3F from gsap.ticker: one requestAnimationFrame loop for scroll, GSAP and
 * WebGL. Lenis registered its tick first, so scroll positions are current when the
 * scene reads DOM rects. The ticker stops with rAF when the tab is hidden.
 */
function TickerDriver({ active }: { active: boolean }) {
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    if (!active) return;
    const tick = (time: number) => advance(time * 1000);
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [active, advance]);
  return null;
}

/** Mounts only after everything in the Suspense boundary has loaded. */
function Ready({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    const id = requestAnimationFrame(() => onReady());
    return () => cancelAnimationFrame(id);
  }, [onReady]);
  return null;
}
