"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { gsap } from "@/lib/gsap";
import { siteStore } from "@/lib/siteStore";

/**
 * Liquid hover for [data-ripple] frames (work cards), drawn in the persistent canvas.
 * On hover, the frame's <img> is redrawn on a plane that tracks the frame's DOM rect
 * each frame and ripples out from the cursor (displacement + noise texture). Strength
 * eases in over 0.4s and out over 0.6s; at zero the DOM image is shown again, so the
 * hand-off is seamless. Pointer devices with motion allowed only; the CSS 1.03 scale
 * remains the fallback everywhere else (see globals.css).
 */

const ENABLE_QUERY = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

const vertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const fragment = /* glsl */ `
uniform sampler2D uTexture;
uniform sampler2D uNoise;
uniform vec2 uUvScale;
uniform vec2 uUvOffset;
uniform vec2 uMouse;
uniform float uAspect;
uniform float uStrength;
uniform float uTime;
varying vec2 vUv;

void main() {
  vec2 p = vUv;
  vec2 toMouse = (p - uMouse) * vec2(uAspect, 1.0);
  float d = length(toMouse);

  // Rings travelling out from the cursor, fading with distance
  float ring = sin(d * 32.0 - uTime * 7.0) * exp(-d * 3.5);
  vec2 dir = toMouse / max(d, 1e-4);

  // Slow liquid noise, strongest near the cursor
  vec2 n = texture2D(uNoise, p * 1.4 + vec2(uTime * 0.04, -uTime * 0.03)).rg - 0.5;
  float falloff = smoothstep(0.75, 0.0, d);

  vec2 disp = (dir * ring * 0.018 + n * 0.05 * falloff) * uStrength;
  disp.x /= uAspect;

  vec2 uv = (p + disp) * uUvScale + uUvOffset;
  // Slight chromatic split that follows the displacement
  float r = texture2D(uTexture, uv + disp * 0.35 * uUvScale).r;
  vec4 c = texture2D(uTexture, uv);
  float b = texture2D(uTexture, uv - disp * 0.35 * uUvScale).b;
  gl_FragColor = vec4(r, c.g, b, c.a);
  #include <colorspace_fragment>
}`;

/** 256px tiling value-noise texture, built once at runtime (no asset to download). */
function createNoiseTexture() {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  const grid = 8;
  const rand = Array.from({ length: (grid + 1) * (grid + 1) * 2 }, () => Math.random());
  const at = (x: number, y: number, c: number) => rand[((y % grid) * (grid + 1) + (x % grid)) * 2 + c];
  const smooth = (t: number) => t * t * (3 - 2 * t);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = (x / size) * grid;
      const gy = (y / size) * grid;
      const x0 = Math.floor(gx);
      const y0 = Math.floor(gy);
      const tx = smooth(gx - x0);
      const ty = smooth(gy - y0);
      for (let c = 0; c < 2; c++) {
        const top = at(x0, y0, c) * (1 - tx) + at(x0 + 1, y0, c) * tx;
        const bottom = at(x0, y0 + 1, c) * (1 - tx) + at(x0 + 1, y0 + 1, c) * tx;
        data[(y * size + x) * 4 + c] = Math.round((top * (1 - ty) + bottom * ty) * 255);
      }
      data[(y * size + x) * 4 + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

type Plane = {
  frame: HTMLElement;
  img: HTMLImageElement;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  strength: { value: number };
  hovering: boolean;
  ready: boolean;
};

export class RippleOverlay {
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
  planes = new Map<HTMLElement, Plane>();
  private geometry = new THREE.PlaneGeometry(1, 1);
  private noise = createNoiseTexture();
  private textures = new Map<string, Promise<THREE.Texture>>();
  private loader = new THREE.TextureLoader();

  get active() {
    return this.planes.size > 0;
  }

  private texture(src: string) {
    let t = this.textures.get(src);
    if (!t) {
      t = this.loader.loadAsync(src).then((tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        return tex;
      });
      this.textures.set(src, t);
    }
    return t;
  }

  enter(frame: HTMLElement, x: number, y: number) {
    const img = frame.querySelector("img");
    if (!img) return;
    let plane = this.planes.get(frame);
    if (!plane) {
      const material = new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
        uniforms: {
          uTexture: { value: null },
          uNoise: { value: this.noise },
          uUvScale: { value: new THREE.Vector2(1, 1) },
          uUvOffset: { value: new THREE.Vector2() },
          uMouse: { value: new THREE.Vector2(0.5, 0.5) },
          uAspect: { value: 1 },
          uStrength: { value: 0 },
          uTime: { value: 0 },
        },
      });
      const mesh = new THREE.Mesh(this.geometry, material);
      mesh.visible = false;
      this.scene.add(mesh);
      plane = { frame, img, mesh, strength: material.uniforms.uStrength, hovering: true, ready: false };
      this.planes.set(frame, plane);
      const p = plane;
      this.texture(img.currentSrc || img.src).then((tex) => {
        material.uniforms.uTexture.value = tex;
        p.ready = true;
      });
    }
    plane.hovering = true;
    this.move(frame, x, y);
    gsap.to(plane.strength, { value: 1, duration: 0.4, ease: "power2.out", overwrite: true });
  }

  move(frame: HTMLElement, x: number, y: number) {
    const plane = this.planes.get(frame);
    if (!plane) return;
    const r = frame.getBoundingClientRect();
    plane.mesh.material.uniforms.uMouse.value.set((x - r.left) / r.width, 1 - (y - r.top) / r.height);
  }

  leave(frame: HTMLElement) {
    const plane = this.planes.get(frame);
    if (!plane) return;
    plane.hovering = false;
    gsap.to(plane.strength, {
      value: 0,
      duration: 0.6,
      ease: "power2.inOut",
      overwrite: true,
      onComplete: () => this.remove(frame),
    });
  }

  remove(frame: HTMLElement) {
    const plane = this.planes.get(frame);
    if (!plane || plane.hovering) return;
    gsap.killTweensOf(plane.strength);
    delete frame.dataset.rippleLive;
    this.scene.remove(plane.mesh);
    plane.mesh.material.dispose();
    this.planes.delete(frame);
  }

  clear() {
    this.planes.forEach((p) => (p.hovering = false));
    [...this.planes.keys()].forEach((f) => this.remove(f));
  }

  /** Sync camera to the viewport and every plane to its frame's current rect. */
  update(width: number, height: number, time: number) {
    const cam = this.camera;
    if (cam.right !== width / 2 || cam.top !== height / 2) {
      cam.left = -width / 2;
      cam.right = width / 2;
      cam.top = height / 2;
      cam.bottom = -height / 2;
      cam.updateProjectionMatrix();
    }
    this.planes.forEach((p) => {
      if (!p.frame.isConnected) {
        p.hovering = false;
        this.remove(p.frame);
        return;
      }
      const f = p.frame.getBoundingClientRect();
      const i = p.img.getBoundingClientRect();
      const u = p.mesh.material.uniforms;
      const tex = u.uTexture.value as THREE.Texture | null;
      p.mesh.position.set(f.left + f.width / 2 - width / 2, height / 2 - (f.top + f.height / 2), 0);
      p.mesh.scale.set(f.width, f.height, 1);
      u.uAspect.value = f.width / f.height;
      u.uTime.value = time;

      // Map the frame onto the image the way CSS object-cover does inside the (wider,
      // parallaxed) image box, so the plane matches the DOM pixel for pixel.
      if (tex?.image) {
        const iw = (tex.image as HTMLImageElement).width;
        const ih = (tex.image as HTMLImageElement).height;
        const s = Math.max(i.width / iw, i.height / ih);
        const dw = iw * s;
        const dh = ih * s;
        u.uUvScale.value.set(f.width / dw, f.height / dh);
        u.uUvOffset.value.set(
          (f.left - i.left - (i.width - dw) / 2) / dw,
          1 - (f.top - i.top - (i.height - dh) / 2 + f.height) / dh,
        );
      }

      p.mesh.visible = p.ready;
      // Hide the DOM image only once the plane can draw in its place.
      if (p.ready && !p.frame.dataset.rippleLive) p.frame.dataset.rippleLive = "";
    });
  }

  dispose() {
    this.clear();
    this.geometry.dispose();
    this.noise.dispose();
    this.textures.forEach((t) => t.then((tex) => tex.dispose()));
  }
}

/** Wires pointer events to the overlay and keeps it in sync each frame. */
export function CardRipples({ overlay }: { overlay: RippleOverlay }) {
  const size = useThree((s) => s.size);

  useEffect(() => {
    const mql = window.matchMedia(ENABLE_QUERY);
    let enabled = mql.matches;
    const sync = () => {
      enabled = mql.matches;
      if (enabled) document.documentElement.dataset.rippleOn = "";
      else {
        delete document.documentElement.dataset.rippleOn;
        overlay.clear();
      }
    };
    sync();
    mql.addEventListener("change", sync);

    const frameOf = (t: EventTarget | null) => (t as Element | null)?.closest?.<HTMLElement>("[data-ripple]") ?? null;
    const onOver = (e: PointerEvent) => {
      if (!enabled || e.pointerType === "touch") return;
      const f = frameOf(e.target);
      if (f && !f.contains(e.relatedTarget as Node | null)) overlay.enter(f, e.clientX, e.clientY);
    };
    const onOut = (e: PointerEvent) => {
      const f = frameOf(e.target);
      if (f && !f.contains(e.relatedTarget as Node | null)) overlay.leave(f);
    };
    const onMove = (e: PointerEvent) => {
      const f = frameOf(e.target);
      if (f) overlay.move(f, e.clientX, e.clientY);
    };
    // A page transition lifts the canvas above everything: drop any live planes first.
    const unsub = siteStore.subscribe(() => siteStore.getState().transitioning && overlay.clear());

    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      mql.removeEventListener("change", sync);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      document.removeEventListener("pointermove", onMove);
      unsub();
      delete document.documentElement.dataset.rippleOn;
      overlay.clear();
    };
  }, [overlay]);

  useEffect(() => () => overlay.dispose(), [overlay]);

  useFrame((state) => {
    if (overlay.active) overlay.update(size.width, size.height, state.clock.elapsedTime);
  });

  return null;
}

/**
 * Takes over rendering (priority 2): the main scene (unless the Bloom composer is
 * drawing it), then the ripple overlay on top with its own orthographic camera.
 */
export function SceneRenderer({ overlay, composerOn }: { overlay: RippleOverlay; composerOn: boolean }) {
  useFrame(({ gl, scene, camera }) => {
    if (!composerOn) {
      gl.autoClear = true;
      gl.render(scene, camera);
    }
    if (overlay.active) {
      const autoClear = gl.autoClear;
      gl.autoClear = false;
      gl.clearDepth();
      gl.render(overlay.scene, overlay.camera);
      gl.autoClear = autoClear;
    }
  }, 2);
  return null;
}

export function useRippleOverlay() {
  return useMemo(() => new RippleOverlay(), []);
}
