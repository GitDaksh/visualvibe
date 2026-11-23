"use client";

import { useSyncExternalStore } from "react";

/** Subscribes to a CSS media query. Returns false during server rendering. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Phones in portrait: the call room goes full-bleed with overlaid controls. */
export const PHONE_QUERY = "(max-width: 639px)";
/** Where the side panel docks next to the stage instead of floating over it. */
export const DOCK_PANEL_QUERY = "(min-width: 1024px)";
export const COARSE_POINTER_QUERY = "(pointer: coarse)";
