"use client";

import { useSyncExternalStore } from "react";

/**
 * Minimal external store with a zustand-like surface (getState, setState, subscribe,
 * plus a selector hook). Animation loops read getState() without re-rendering React.
 */
export function createStore<T extends object>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();

  const store = {
    getState: () => state,
    setState(partial: Partial<T>) {
      state = { ...state, ...partial };
      listeners.forEach((l) => l());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };

  function useStore<U>(selector: (s: T) => U): U {
    return useSyncExternalStore(
      store.subscribe,
      () => selector(state),
      () => selector(initial),
    );
  }

  return { ...store, useStore };
}
