import type { Page } from "@playwright/test";

/** Skip the first-visit preloader so pages are usable straight away. */
export async function skipIntro(page: Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("ikonic:intro", "1");
    } catch {}
  });
}

export const NOT_FOUND_TEXT = "isn’t iconic yet";
