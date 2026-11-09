import { useEffect, type RefObject } from "react";
import { DEFAULT_WINDOW_HEIGHT, fitWindowHeight } from "../domain/windowFit";
import { useServices } from "../services/ServicesContext";

const SCREEN_MARGIN = 24;

/** Resizes the window to the element's height while mounted; restores the default after. */
export function useFitWindow(ref: RefObject<HTMLElement | null>, enabled = true) {
  const { platform } = useServices();
  useEffect(() => {
    if (!enabled) return undefined;
    const element = ref.current;
    if (!element) return undefined;
    let last = 0;
    const apply = () => {
      const available = window.screen.availHeight - SCREEN_MARGIN;
      const height = fitWindowHeight(element.offsetHeight, available);
      if (Math.abs(height - last) < 2) return;
      last = height;
      // A failed resize only leaves extra blank space; never break the panel over it.
      platform.setWindowHeight(height).catch(() => undefined);
    };
    apply();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(apply);
    observer?.observe(element);
    return () => {
      observer?.disconnect();
      platform.setWindowHeight(DEFAULT_WINDOW_HEIGHT).catch(() => undefined);
    };
  }, [enabled, platform, ref]);
}
