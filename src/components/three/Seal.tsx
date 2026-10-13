"use client";

import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { MeshTransmissionMaterial, RoundedBox, useGLTF } from "@react-three/drei";
import { createSealBodyGeometry, createSealCoreGeometry, SEAL } from "./sealGeometry";
import { resolvePose, sealActions, sealStore } from "./sealStore";
import { tilt } from "./tiltInput";

/**
 * Set to "/models/seal.glb" once the Draco-compressed logomark exists. Meshes whose
 * name contains "glass" get the transmission material; everything else gets chrome.
 * The procedural seal stays as the loading and error fallback.
 */
export const SEAL_MODEL_URL: string | null = null;

const DEG = Math.PI / 180;
const MAX_TILT = 12 * DEG;
const DROP = 0.6;
const SQUASH = 0.04;

type SealProps = {
  reducedMotion: boolean;
  /** Called at the moment of impact, with the seal's world position. */
  onImpact: (position: THREE.Vector3, scale: number) => void;
};

export function Seal({ reducedMotion, onImpact }: SealProps) {
  const group = useRef<THREE.Group>(null);
  // Keep the seal within ~70% of the viewport width on narrow screens.
  const viewport = useThree((s) => s.viewport);
  const isMobile = useThree((s) => s.size.width < 768);
  const fit = Math.min(1, (viewport.width * 0.7) / (SEAL.radius * 2));
  const squashGroup = useRef<THREE.Group>(null);

  // Motion state lives in refs: nothing here re-renders React.
  const sim = useRef({
    rotX: 0,
    rotY: 0,
    scale: 1,
    pos: new THREE.Vector3(),
    // Stamp spring along -Z (into the page).
    z: 0,
    vz: 0,
    stampId: sealStore.getState().stampId,
    phase: "none" as "none" | "press" | "hold" | "release",
    phaseTime: 0,
    squashTime: -1,
  });

  // Reduced motion shows a still seal: acknowledge stamp requests without animating.
  useEffect(() => {
    if (!reducedMotion) return;
    const settle = () => {
      if (sealStore.getState().mode === "stamp") sealActions.endStamp();
    };
    settle();
    return sealStore.subscribe(settle);
  }, [reducedMotion]);

  useFrame((state, rawDelta) => {
    const g = group.current;
    const sq = squashGroup.current;
    if (!g || !sq || reducedMotion) return;

    const delta = Math.min(rawDelta, 0.1); // no jumps after a stall (tab switch, GC)
    const t = state.clock.elapsedTime;
    const s = sim.current;
    const { mode, resumeMode, travel, stampId, pose, from, to } = sealStore.getState();
    const damp = THREE.MathUtils.damp;
    const lerp = THREE.MathUtils.lerp;

    // Target pose: the idle pose, or a blend along the travel path
    const traveling = mode === "travel" || (mode === "stamp" && resumeMode === "travel");
    const a = resolvePose(traveling ? from : pose, isMobile);
    const b = traveling ? resolvePose(to, isMobile) : a;
    const p = traveling ? travel : 0;
    const float = Math.sin(t * 0.9) * 0.08 * (traveling ? 0.5 : 1);
    const tiltAmount = traveling ? 0.5 : 1;

    const tx = lerp(a.x, b.x, p) * viewport.width;
    const ty = lerp(a.y, b.y, p) * viewport.height + float;
    let trX = lerp(a.rotX, b.rotX, p) + tilt.y * MAX_TILT * tiltAmount;
    let trY = lerp(a.rotY, b.rotY, p) + tilt.x * MAX_TILT * tiltAmount + Math.sin(t * 0.35) * 0.06;
    const tScale = lerp(a.scale, b.scale, p) * fit;
    const lambda = traveling ? 8 : 3.5;

    // Stamp sequence: press (spring to -DROP), short hold, release (spring home)
    if (stampId !== s.stampId && mode === "stamp") {
      s.stampId = stampId;
      s.phase = "press";
      s.phaseTime = 0;
    }
    if (s.phase !== "none") {
      // Face the camera squarely while stamping
      trX = 0;
      trY = Math.round(trY / (Math.PI * 2)) * Math.PI * 2;
      s.phaseTime += delta;
      const target = s.phase === "press" || s.phase === "hold" ? -DROP : 0;
      const k = s.phase === "press" ? 320 : 120;
      const c = s.phase === "press" ? 26 : 14;
      // Fixed 1/120s substeps keep the spring stable at any frame rate.
      const steps = Math.ceil(delta * 120);
      const h = delta / steps;
      for (let i = 0; i < steps; i++) {
        s.vz += (k * (target - s.z) - c * s.vz) * h;
        s.z += s.vz * h;
      }

      if (s.phase === "press" && s.z <= -DROP * 0.96) {
        s.phase = "hold";
        s.phaseTime = 0;
        s.squashTime = 0;
        onImpact(g.getWorldPosition(new THREE.Vector3()), s.scale);
      } else if (s.phase === "hold" && s.phaseTime > 0.14) {
        s.phase = "release";
      } else if (s.phase === "release" && Math.abs(s.z) < 0.002 && Math.abs(s.vz) < 0.02) {
        s.phase = "none";
        s.z = 0;
        s.vz = 0;
        sealActions.endStamp();
      }
    }

    // Squash on impact: flatten along the impact axis, spread slightly, then recover
    if (s.squashTime >= 0) {
      s.squashTime += delta;
      const k = Math.max(0, 1 - s.squashTime / 0.28);
      const env = Math.sin(Math.min(1, s.squashTime / 0.06) * Math.PI * 0.5) * k * k;
      sq.scale.set(1 + SQUASH * 0.5 * env, 1 + SQUASH * 0.5 * env, 1 - SQUASH * env);
      if (k === 0) s.squashTime = -1;
    }

    s.pos.x = damp(s.pos.x, tx, lambda, delta);
    s.pos.y = damp(s.pos.y, ty, lambda, delta);
    s.rotX = damp(s.rotX, trX, lambda, delta);
    s.rotY = damp(s.rotY, trY, lambda, delta);
    s.scale = damp(s.scale, tScale, lambda, delta);

    g.position.set(s.pos.x, s.pos.y, s.z);
    g.rotation.set(s.rotX, s.rotY, 0);
    g.scale.setScalar(s.scale);
  });

  return (
    <group ref={group} scale={reducedMotion ? fit : undefined} rotation={reducedMotion ? [-0.12, 0.32, 0] : [0, 0, 0]}>
      <group ref={squashGroup}>
        {SEAL_MODEL_URL ? (
          <ModelBoundary fallback={<ProceduralSeal />}>
            <Suspense fallback={<ProceduralSeal />}>
              <GltfSeal url={SEAL_MODEL_URL} />
            </Suspense>
          </ModelBoundary>
        ) : (
          <ProceduralSeal />
        )}
      </group>
    </group>
  );
}

function ChromeMaterial() {
  return <meshStandardMaterial color="#ffffff" metalness={1} roughness={0.15} />;
}

function GlassMaterial() {
  return (
    <MeshTransmissionMaterial
      thickness={0.4}
      chromaticAberration={0.05}
      samples={4}
      resolution={512}
      roughness={0.05}
      ior={1.4}
      anisotropicBlur={0}
      distortion={0}
      temporalDistortion={0}
      backside={false}
      color="#ffffff"
    />
  );
}

/** Procedural placeholder: ridged chrome ring, glass core, raised "I" on both faces. */
export function ProceduralSeal() {
  const body = useMemo(() => createSealBodyGeometry(), []);
  const core = useMemo(() => createSealCoreGeometry(), []);
  useEffect(
    () => () => {
      body.dispose();
      core.dispose();
    },
    [body, core],
  );

  const face = SEAL.depth / 2 - SEAL.coreInset;
  const letter = { w: 0.16, h: 0.66, d: 0.09 };

  return (
    <group>
      <mesh geometry={body}>
        <ChromeMaterial />
      </mesh>
      <mesh geometry={core}>
        <GlassMaterial />
      </mesh>
      {[1, -1].map((side) => (
        <RoundedBox
          key={side}
          args={[letter.w, letter.h, letter.d]}
          radius={0.02}
          smoothness={3}
          position={[0, 0, side * (face + letter.d / 2 - 0.01)]}
        >
          <ChromeMaterial />
        </RoundedBox>
      ))}
    </group>
  );
}

function GltfSeal({ url }: { url: string }) {
  const { scene } = useGLTF(url, "/draco/");
  const model = useMemo(() => scene.clone(true), [scene]);
  const chrome = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#ffffff", metalness: 1, roughness: 0.15 }),
    [],
  );
  const glassMeshes = useMemo(() => {
    const found: THREE.Mesh[] = [];
    model.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      if (o.name.toLowerCase().includes("glass")) found.push(o);
      else o.material = chrome;
    });
    found.forEach((m) => (m.visible = false));
    return found;
  }, [model, chrome]);

  return (
    <group>
      <primitive object={model} />
      {glassMeshes.map((m) => (
        <mesh
          key={m.uuid}
          geometry={m.geometry}
          position={m.getWorldPosition(new THREE.Vector3())}
          quaternion={m.getWorldQuaternion(new THREE.Quaternion())}
          scale={m.getWorldScale(new THREE.Vector3())}
        >
          <GlassMaterial />
        </mesh>
      ))}
    </group>
  );
}

class ModelBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
