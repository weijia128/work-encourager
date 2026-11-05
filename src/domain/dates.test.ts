import { describe, expect, it } from "vitest";
import { formatClock } from "./dates";

describe("formatClock", () => {
  it("formats local date, weekday and seconds", () => {
    expect(formatClock(new Date(2026, 10, 4, 15, 5, 8))).toBe("2026-11-04 三 15:05:08");
  });
});
