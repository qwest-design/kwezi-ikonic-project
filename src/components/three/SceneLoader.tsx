"use client";

import { Component, useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";

const SceneCanvas = dynamic(() => import("./SceneCanvas"), { ssr: false, loading: () => null });

/**
 * Defers all 3D (three, R3F, drei, postprocessing and the HDRI) until the page has
 * loaded, fonts have swapped and the browser is idle, so hero text paints first
 * and the 3D bundle never competes with LCP. Renders nothing until then.
 */
export function SceneLoader() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supportsWebGL()) return;
    let cancelled = false;
    const idle = (cb: () => void) => {
      if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(cb, { timeout: 1500 });
      else setTimeout(cb, 200);
    };

    const start = () =>
      document.fonts.ready.then(() =>
        requestAnimationFrame(() => requestAnimationFrame(() => idle(() => !cancelled && setReady(true)))),
      );

    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", start);
    };
  }, []);

  if (!ready) return null;
  return (
    <SceneBoundary>
      <SceneCanvas />
    </SceneBoundary>
  );
}

/**
 * WebGL with a real GPU. Software renderers (SwiftShader, llvmpipe: no GPU, a GPU
 * the browser has blocklisted, or headless test machines such as PageSpeed) draw
 * every frame on the CPU, which freezes the page, so they get the site without 3D.
 */
function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return false;
    // ?3d=force skips the software check, for testing the scene on machines without a GPU.
    if (new URLSearchParams(location.search).get("3d") === "force") return true;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return !/swiftshader|llvmpipe|softpipe|software/i.test(renderer);
  } catch {
    return false;
  }
}

/** No WebGL or a GPU failure: drop the scene silently; the page works without it. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
