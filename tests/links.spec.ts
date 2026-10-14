import { expect, test, type Page } from "@playwright/test";
import { NOT_FOUND_TEXT, skipIntro } from "./helpers";

/**
 * Crawls every page reachable from the home page (plus the known routes), then:
 * - fails on any <a> with href="#", an empty href, or no href at all;
 * - requests every internal page and fails on anything but 200;
 * - checks every #anchor exists on its target page;
 * - clicks every link (each unique destination, from the page it was found on)
 *   and checks it lands on a real page;
 * - clicks every button on every page and fails on any uncaught error.
 */

type Found = { from: string; raw: string; url: URL };

const KNOWN = ["/", "/work", "/capabilities", "/studio", "/contact", "/styleguide"];

async function settle(page: Page) {
  await page.waitForLoadState("load");
  await page.waitForTimeout(600);
}

test("every link and button goes somewhere real", async ({ page, baseURL, request }) => {
  await skipIntro(page);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`${page.url()}: ${e.message}`));

  const problems: string[] = [];
  const queue = [...KNOWN];
  const seen = new Set<string>();
  const links: Found[] = [];

  // 1. Crawl.
  while (queue.length) {
    const path = queue.shift()!;
    if (seen.has(path)) continue;
    seen.add(path);
    await page.goto(path);
    await settle(page);

    const anchors = await page.$$eval("a", (as) => as.map((a) => a.getAttribute("href")));
    for (const raw of anchors) {
      if (raw === null) problems.push(`${path}: <a> without href`);
      else if (raw.trim() === "") problems.push(`${path}: empty href`);
      else if (raw.trim() === "#") problems.push(`${path}: href="#"`);
      if (!raw || raw.trim() === "#") continue;

      const url = new URL(raw, baseURL + path);
      if (url.protocol === "mailto:" || url.protocol === "tel:") {
        if (url.pathname.replace(/^\/+/, "").length < 3) problems.push(`${path}: empty ${url.protocol} link`);
        continue;
      }
      if (url.origin !== new URL(baseURL!).origin) continue; // external (social): checked for "#" above
      links.push({ from: path, raw, url });
      if (!seen.has(url.pathname)) queue.push(url.pathname);
    }
  }

  // 2. Every internal page answers 200.
  for (const path of seen) {
    const res = await request.get(path);
    if (res.status() !== 200) problems.push(`${path}: HTTP ${res.status()}`);
  }

  // 3. Every #anchor exists on its page.
  const anchors = new Map<string, Found>();
  for (const l of links) if (l.url.hash) anchors.set(l.url.pathname + l.url.hash, l);
  for (const [key, l] of anchors) {
    await page.goto(l.url.pathname);
    await settle(page);
    const id = decodeURIComponent(l.url.hash.slice(1));
    const exists = await page.evaluate((id) => !!document.getElementById(id), id);
    if (!exists) problems.push(`${l.from}: broken anchor ${key}`);
  }

  // 4. Click every unique link from the page it was found on.
  const unique = new Map<string, Found>();
  for (const l of links) if (!unique.has(l.raw)) unique.set(l.raw, l);
  for (const l of unique.values()) {
    await page.goto(l.from);
    await settle(page);
    const target = l.url.pathname + l.url.search;
    // A DOM click: pinned sections and the closed menu would block a pointer click.
    await page.locator(`a[href="${l.raw}"]`).first().evaluate((a: HTMLAnchorElement) => a.click());
    if (l.url.pathname !== l.from) await page.waitForURL((u) => u.pathname === l.url.pathname, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(400);
    const now = new URL(page.url());
    if (now.pathname + now.search !== target && !(l.url.pathname === l.from && now.pathname === l.from)) {
      problems.push(`${l.from}: clicking ${l.raw} went to ${now.pathname}${now.search}`);
    }
    if ((await page.locator("h1").first().textContent())?.includes(NOT_FOUND_TEXT)) problems.push(`${l.from}: ${l.raw} is a 404`);
  }

  // 5. Click every button on every page.
  for (const path of seen) {
    await page.goto(path);
    await settle(page);
    const count = await page.locator("button").count();
    for (let i = 0; i < count; i++) {
      if (new URL(page.url()).pathname !== path) {
        await page.goto(path);
        await settle(page);
      }
      const button = page.locator("button").nth(i);
      if (!(await button.count())) continue;
      await button.evaluate((b: HTMLButtonElement) => b.click()).catch(() => {});
      await page.waitForTimeout(250);
      await page.keyboard.press("Escape");
    }
    if ((await page.locator("h1").first().textContent())?.includes(NOT_FOUND_TEXT)) problems.push(`${path}: a button led to a 404`);
  }

  expect(problems, problems.join("\n")).toEqual([]);
  expect(errors, errors.join("\n")).toEqual([]);
});

test("unknown pages show the 404 page", async ({ page, request }) => {
  const res = await request.get("/no-such-page");
  expect(res.status()).toBe(404);
  await skipIntro(page);
  await page.goto("/no-such-page");
  await expect(page.locator("h1")).toContainText(NOT_FOUND_TEXT);
  await expect(page.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
});
