# Ikonic Designs site

Rebuild of ikonicdesigns.co.za. Next.js (App Router, TypeScript), Tailwind CSS v4, React Three Fiber + drei + postprocessing, GSAP (ScrollTrigger, SplitText), Lenis.

## Run

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start   # production check
npm run lint
```

## Where things live

- `src/app/globals.css`: design tokens (colour, type, spacing, grid, motion) and Tailwind theme mapping
- `src/app/fonts.ts`: Inter Tight 600, Instrument Serif italic, Inter 400, JetBrains Mono via `next/font`
- `src/lib/motion.ts`: GSAP easing and duration tokens, reduced-motion helper
- `src/lib/gsap.ts`: registers ScrollTrigger and SplitText; import gsap from here
- `src/components/providers/SmoothScroll.tsx`: Lenis on the GSAP ticker, off under reduced motion
- `src/components/ui/Button.tsx`: primary, secondary and ghost buttons (Link when given href)
- `src/app/styleguide`: visual check of every token, type size, button state and motion curve (noindex)
- `src/content/work.ts`: case study list feeding /work/[slug]

## Motion

- `<Reveal as="h2">` splits text into masked lines and slides them up (expo.out 0.9s, stagger 0.08s) when its top reaches 80% of the viewport. It re-splits on resize without replaying and reverts on unmount.
- `data-speed="0.85"` on any element gives it parallax (below 1 lags, above 1 leads). It's off under 768px and with reduced motion. `src/components/motion/Parallax.tsx` is mounted once in the root layout.
- Reduced motion: no Lenis, no pins, scrubs or parallax, and 0.3s opacity fades. For new pins or scrubs, wrap them in `gsap.matchMedia()` with `motionConditions.full` from `src/lib/motion.ts`.

## 3D seal

- One fixed, full-viewport R3F canvas behind all pages (`src/components/three/SceneCanvas.tsx`). It's loaded by `SceneLoader` only after the page has loaded, fonts have swapped and the browser is idle. It fades in once the HDRI is ready.
- `Seal.tsx` holds the procedural seal: a ridged chrome ring, a glass core (MeshTransmissionMaterial) and a raised "I". To use the real model, export `/public/models/seal.glb` (Draco) and set `SEAL_MODEL_URL`. Meshes named `*glass*` get the glass material and the rest get chrome. The Draco decoder is self-hosted in `/public/draco`.
- State: `useSealSection(ref, { pose })` holds a resting pose while a section spans the viewport centre. `useSealSection(ref, { from, to })` scrubs between two poses (the travel state), and `stampAtCenter: true` fires the stamp. Poses are viewport fractions plus rotations, with optional `mobile` overrides (`sealStore.ts`).
- The canvas has no RAF of its own: `TickerDriver` advances it from `gsap.ticker`, so Lenis, GSAP and three.js share one loop. Under reduced motion it renders on demand only.
- **Card ripples** (`CardRipples.tsx`): put `data-ripple` on any element that wraps a single `<img>` (object-cover). On hover, a plane in a second, pixel-sized overlay scene tracks that element's DOM rect each frame and redraws the image through a displacement shader (rings from the cursor plus a noise texture). Strength eases in over 0.4s and out over 0.6s. The DOM image is hidden only once the WebGL copy is ready. It's enabled only for `(hover: hover) and (pointer: fine)` without reduced motion, which sets `html[data-ripple-on]`. Otherwise cards fall back to the 1.03 CSS scale.
- The HDRI is self-hosted: `/public/hdri/studio_small_03_1k.hdr` (Poly Haven, CC0).

## Site chrome

All of it is mounted once in `src/app/layout.tsx`; components live in `src/components/chrome`.
- **Preloader:** shown on the first visit per tab (sessionStorage `ikonic:intro`). An inline head script hides it before first paint on repeat visits. `<Reveal>` waits for it, and for page transitions, via `whenPageVisible()`.
- **Header:** hides on scroll down, has a 1px signal progress line, and gets a solid backing once scrolled.
- **Menu:** items come from `src/content/nav.ts`. Preview images in `/public/menu/*.svg` are placeholders.
- **Cursor:** add `data-cursor="view|drag|play"` to any element, plus `data-cursor-label` for custom text.
- **Magnetic:** `Button` adds `data-magnetic` automatically. Pass `magnetic={false}` to opt out.
- **Page transitions:** every internal link is intercepted. Add `data-transition="off"` to a link to skip it.

## Home page

`src/app/page.tsx` composes seven sections from `src/components/home`. All copy and data live in `src/content/home.ts`; anything marked PLACEHOLDER is waiting on real content. The Proof section renders only when `proof` has entries. The footer slot is `src/components/chrome/SiteFooter.tsx` (prompt 9).

## Work and case studies

- All case study content lives in `src/content/work.ts`; the Home page's selected work is derived from it. Anything containing `[TO SUPPLY]` is waiting on real copy, numbers or images. The Gardens and Door are the sample case studies; Project 03 to 05 keep the Home track at five cards.
- Placeholder images live in `/public/work/<slug>/` (hero, craft-1, craft-2, layer-back, layer-mid, layer-front). Replace the files or point `media()` at real ones.
- **/work** (`src/components/work/WorkExplorer.tsx`): discipline filters animate with GSAP Flip (all cards stay in the DOM; non-matching ones get `data-out` and are hidden). A Grid/List toggle; in list view on pointer devices the hovered row's image follows the cursor.
- **/work/[slug]**: Opener, Challenge, Idea, Craft (full-bleed images plus a three-layer spread at 0.6x, 0.85x and 1.15x via `data-speed`), Impact with the stamp beside the results, then Next project. With motion allowed the Next panel is two screens tall; scrolling through it navigates to the next case study via the normal page transition. It only fires after the visitor has scrolled into it.
- `SealZone` (`src/components/three/SealZone.tsx`) lets server components set the seal's pose for a block of content. `SEAL_PARKED` moves it out of the way.
- Smooth scroll is paused during page transitions so wheel momentum can't carry onto the next page.

## Token utilities

`bg-ink text-bone text-mist bg-graphite text-signal`, `text-hero text-h1 text-h2 text-h3 text-body`, `type-label` (13px uppercase +0.08em), `font-display-tight font-accent-italic font-mono`, spacing `p-s1`..`p-s7` (8, 16, 24, 40, 64, 104, 168), `grid-site` for the 12/4 column grid, `gap-gutter`, `px-margin`.
