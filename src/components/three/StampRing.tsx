"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export type StampRingHandle = { emit: (at: THREE.Vector3, scale: number) => void };

const DURATION = 0.9;
// HDR colour (> 1) so only the ring crosses the Bloom threshold. Signal blue.
const RING_COLOR = new THREE.Color("#003ce5").multiplyScalar(8);

/** A ring of light that expands and fades from the seal's edge on impact. */
export const StampRing = forwardRef<StampRingHandle, { onActiveChange: (active: boolean) => void }>(
  function StampRing({ onActiveChange }, ref) {
    const mesh = useRef<THREE.Mesh>(null);
    const t = useRef(-1);
    const baseScale = useRef(1);
    const geometry = useMemo(() => new THREE.RingGeometry(0.98, 1.05, 128), []);
    const material = useMemo(
      () =>
        new THREE.MeshBasicMaterial({
          color: RING_COLOR,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          toneMapped: false,
        }),
      [],
    );

    useImperativeHandle(ref, () => ({
      emit(at, scale) {
        mesh.current?.position.copy(at);
        baseScale.current = scale;
        t.current = 0;
        onActiveChange(true);
      },
    }));

    useFrame((_, delta) => {
      const m = mesh.current;
      if (!m || t.current < 0) return;
      t.current += Math.min(delta, 0.1);
      const p = Math.min(1, t.current / DURATION);
      const expo = p === 1 ? 1 : 1 - Math.pow(2, -10 * p); // expo.out
      m.scale.setScalar(baseScale.current * (1 + expo * 1.2));
      material.opacity = 1 - p;
      m.visible = p < 1;
      if (p === 1) {
        t.current = -1;
        onActiveChange(false);
      }
    });

    return <mesh ref={mesh} geometry={geometry} material={material} visible={false} />;
  },
);
