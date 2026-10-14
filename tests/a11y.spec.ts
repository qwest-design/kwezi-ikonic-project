import { expect, test, type Page } from "@playwright/test";
import { skipIntro } from "./helpers";

const ROUTES = ["/", "/work", "/work/the-gardens", "/capabilities", "/studio", "/contact"];

/** Scroll the whole page so scroll-triggered content gets its chance to show. */
async function scrollThrough(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 600) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(600);
}

test.describe("reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  for (const route of ROUTES) {
    test(`${route}: all text ends up visible`, async ({ page }) => {
      await skipIntro(page);
      await page.goto(route);
      await scrollThrough(page);
      const hidden = await page.evaluate(() => {
        const out: string[] = [];
        for (const el of document.querySelectorAll<HTMLElement>("main h1, main h2, main h3, main p, main li, main a, main button")) {
          if (el.closest("[aria-hidden=true], .sr-only, [hidden], [data-out]")) continue;
          if (!el.textContent?.trim()) continue;
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height) continue;
          let node: HTMLElement | null = el;
          let opacity = 1;
          while (node) {
            const cs = getComputedStyle(node);
            opacity *= Number(cs.opacity);
            if (cs.visibility === "hidden") opacity = 0;
            node = node.parentElement;
          }
          if (opacity < 0.5) out.push(`${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 40)}" at ${opacity.toFixed(2)}`);
        }
        return out;
      });
      expect(hidden).toEqual([]);
    });
  }
});

test.describe("keyboard only", () => {
  for (const route of ROUTES) {
    test(`${route}: every tab stop is visible and shows focus`, async ({ page }) => {
      await skipIntro(page);
      await page.goto(route);
      await page.waitForTimeout(800);
      const problems: string[] = [];
      const seen = new Set<string>();
      for (let i = 0; i < 120; i++) {
        await page.keyboard.press("Tab");
        await page.waitForTimeout(250); // let smooth scrolling settle
        const info = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body) return null;
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          let opacity = 1;
          for (let n: HTMLElement | null = el; n; n = n.parentElement) opacity *= Number(getComputedStyle(n).opacity);
          // The ring can be on the element or, for stretched-link cards, on its ::after.
          const after = getComputedStyle(el, "::after");
          const drawn = (s: CSSStyleDeclaration) => (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== "none";
          const ring = drawn(cs) || drawn(after);
          const label = `${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 30)}"`;
          return {
            key: label + r.top + r.left,
            label,
            inView: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && r.width > 0 && r.height > 0,
            opacity,
            ring,
            ariaHidden: !!el.closest("[aria-hidden=true]"),
          };
        });
        if (!info) continue;
        if (seen.has(info.key)) break; // wrapped round
        seen.add(info.key);
        if (info.ariaHidden) problems.push(`${info.label}: focusable inside aria-hidden`);
        if (!info.inView) problems.push(`${info.label}: focused but off screen`);
        if (info.opacity < 0.5) problems.push(`${info.label}: focused but faded (${info.opacity.toFixed(2)})`);
        if (!info.ring) problems.push(`${info.label}: no visible focus ring`);
      }
      expect(seen.size).toBeGreaterThan(5);
      expect(problems).toEqual([]);
    });
  }
});
