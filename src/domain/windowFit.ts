/** Matches the initial height in src-tauri/tauri.conf.json. */
export const DEFAULT_WINDOW_HEIGHT = 760;
export const MIN_WINDOW_HEIGHT = 480;

/**
 * Window height that shows the whole panel without trailing blank space,
 * kept within the screen so long content scrolls instead of overflowing.
 */
export function fitWindowHeight(contentHeight: number, availableHeight: number): number {
  const cap = availableHeight > 0 ? availableHeight : DEFAULT_WINDOW_HEIGHT;
  const wanted = Math.ceil(contentHeight);
  return Math.min(Math.max(wanted, MIN_WINDOW_HEIGHT), Math.max(cap, MIN_WINDOW_HEIGHT));
}
