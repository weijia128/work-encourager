import { describe, expect, it } from "vitest";
import { fitWindowHeight, DEFAULT_WINDOW_HEIGHT, MIN_WINDOW_HEIGHT } from "./windowFit";

describe("fitWindowHeight", () => {
  it("uses the rounded-up content height when it fits on screen", () => {
    expect(fitWindowHeight(689.2, 1000)).toBe(690);
  });
  it("never shrinks below the minimum height", () => {
    expect(fitWindowHeight(0, 1000)).toBe(MIN_WINDOW_HEIGHT);
  });
  it("caps the height to the available screen height", () => {
    expect(fitWindowHeight(1200, 900)).toBe(900);
  });
  it("falls back to the default height when the screen size is unknown", () => {
    expect(fitWindowHeight(1200, 0)).toBe(DEFAULT_WINDOW_HEIGHT);
  });
});
