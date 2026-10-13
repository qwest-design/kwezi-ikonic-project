"use client";

import { createStore } from "./createStore";

type SiteState = {
  /** Preloader has finished (or was skipped on a repeat visit). */
  introDone: boolean;
  /** A page transition panel is covering the screen. */
  transitioning: boolean;
  menuOpen: boolean;
};

export const siteStore = createStore<SiteState>({ introDone: false, transitioning: false, menuOpen: false });
export const useSiteStore = siteStore.useStore;

/** Resolves once nothing covers the page: intro finished and no transition running. */
export function whenPageVisible(): Promise<void> {
  const ready = () => {
    const s = siteStore.getState();
    return s.introDone && !s.transitioning;
  };
  if (ready()) return Promise.resolve();
  return new Promise((resolve) => {
    const unsubscribe = siteStore.subscribe(() => {
      if (!ready()) return;
      unsubscribe();
      resolve();
    });
  });
}
