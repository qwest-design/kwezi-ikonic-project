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

## Capabilities, Studio and Contact

- Copy for all three pages lives in `src/content/pages.ts`; `[TO SUPPLY]` marks what's still needed. Social profile URLs live in `src/content/social.ts` (empty = hidden).
- **/capabilities:** one section per discipline (anchors `#strategy`, `#identity`, `#digital`, `#motion`), then the Four Ds band (`src/components/capabilities/FourDs.tsx`): four screens tall, the seal travels along the line at mid-screen.
- **/studio:** beliefs step one per screen (`src/components/studio/Beliefs.tsx`), team grid (greyscale, colour on hover or focus), client wall.
- **/contact:** `src/components/contact/BriefForm.tsx` runs the four steps; schemas shared with the server are in `src/lib/brief.ts`. The server action `src/app/contact/actions.ts` validates again with zod, ignores honeypot submissions, allows 5 sends per IP per hour (in memory, per server instance), and sends with Resend.

### Email setup (Resend)

1. Create a Resend account and add the domain `ikonicdesigns.co.za` (region: Ireland, eu-west-1).
2. Add the DNS records Resend shows at your DNS host. They look like this; copy the exact values from Resend, especially the DKIM key:

| Type | Name | Value | Purpose |
| --- | --- | --- | --- |
| TXT | `resend._domainkey` | `p=MIGf...` (long key from Resend) | DKIM: proves mail is really from you |
| MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` (priority 10) | Bounce handling for SPF |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | SPF: authorises Resend to send |
| TXT | `_dmarc` | `v=DMARC1; p=none;` | DMARC (recommended; skip if you already have one) |

   These sit on the `send.` subdomain, so they don't touch your existing mailbox records.
3. When Resend shows the domain as Verified, create an API key and set `RESEND_API_KEY` and `CONTACT_TO` (see `.env.example`) in `.env.local` and in Vercel.

## Footer and links

- `src/components/chrome/SiteFooter.tsx` mirrors the live footer. **Its design is locked; only links may change.** The logo is a text stand-in until `Ikonic_000.png` is added to `/public/brand` and `FOOTER_LOGO` is set.
- Social URLs: `src/content/social.ts`. Empty means the network isn't shown anywhere.
- Anchor links (`#manifesto`, `/capabilities#identity`) scroll through Lenis and stop below the fixed header. The gap is html's `scroll-padding-top` in `globals.css`; change it there only.
- /work filters are kept in the URL as `?discipline=identity`.
- Client logos link to their case study when `caseStudy` is set on the client in `src/content/home.ts`.

## Tests

`npm run test:e2e` builds the site and runs Playwright against the production server:
- `tests/links.spec.ts` crawls every page and fails on `href="#"`, empty or missing hrefs, any non-200 page, broken anchors, links that don't land where they point, and errors from clicking any button. It also checks the 404 page.
- `tests/contact.spec.ts` fills in the brief and checks the email the server built (recipient, reply-to, subject, every answer). The test server runs with `CONTACT_TRANSPORT=test`, which records emails instead of sending them and enables `/api/test-outbox`. Never set it in production.

First run on a new machine: `npx playwright install chromium`.

## Token utilities

`bg-ink text-bone text-mist bg-graphite text-signal`, `text-hero text-h1 text-h2 text-h3 text-body`, `type-label` (13px uppercase +0.08em), `font-display-tight font-accent-italic font-mono`, spacing `p-s1`..`p-s7` (8, 16, 24, 40, 64, 104, 168), `grid-site` for the 12/4 column grid, `gap-gutter`, `px-margin`.
