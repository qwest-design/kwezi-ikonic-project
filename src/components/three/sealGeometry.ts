import * as THREE from "three";

/** Seal dimensions in world units. */
export const SEAL = {
  radius: 1,
  depth: 0.28,
  /** Radius of the glass core inside the chrome ring. */
  coreRadius: 0.8,
  /** Glass face sits this far below the rim on each side. */
  coreInset: 0.04,
  ridges: 120,
  ridgeDepth: 0.012,
} as const;

/**
 * Chrome ring: a lathed profile with bevels, then fine radial ridges (coin reeding)
 * cut into the outer edge. Built around Y, then turned so the face points down +Z.
 */
export function createSealBodyGeometry(): THREE.BufferGeometry {
  const h = SEAL.depth / 2;
  const r = SEAL.radius;
  const c = SEAL.coreRadius;
  const rim = h - 0.0; // rim face height
  const inner = h - SEAL.coreInset;

  // Profile (radius, height), walked as a closed loop.
  const pts: [number, number][] = [
    [c, -inner],
    [c, inner],
    [c + 0.02, rim - 0.005],
    [c + 0.04, rim],
    [r - 0.06, rim],
    [r - 0.025, rim - 0.008],
    [r - 0.006, rim - 0.03],
    [r, rim - 0.06],
    [r, -(rim - 0.06)],
    [r - 0.006, -(rim - 0.03)],
    [r - 0.025, -(rim - 0.008)],
    [r - 0.06, -rim],
    [c + 0.04, -rim],
    [c + 0.02, -(rim - 0.005)],
    [c, -inner],
  ];

  const segments = SEAL.ridges * 4;
  const geo = new THREE.LatheGeometry(
    pts.map(([x, y]) => new THREE.Vector2(x, y)),
    segments,
  );

  // Reeding: pull edge vertices inward on a square-ish wave around the circumference.
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const radial = Math.hypot(v.x, v.z);
    if (radial < r - 0.007) continue;
    const angle = Math.atan2(v.z, v.x);
    const wave = Math.cos(angle * SEAL.ridges);
    const groove = SEAL.ridgeDepth * (0.5 - 0.5 * Math.sign(wave) * Math.min(1, Math.abs(wave) * 3));
    const k = (radial - groove) / radial;
    pos.setXYZ(i, v.x * k, v.y, v.z * k);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  geo.rotateX(Math.PI / 2);
  return geo;
}

/** Glass core that fills the ring, recessed below the rim on both faces. */
export function createSealCoreGeometry(): THREE.BufferGeometry {
  const depth = SEAL.depth - SEAL.coreInset * 2;
  const geo = new THREE.CylinderGeometry(SEAL.coreRadius + 0.002, SEAL.coreRadius + 0.002, depth, 96, 1);
  geo.rotateX(Math.PI / 2);
  return geo;
}
