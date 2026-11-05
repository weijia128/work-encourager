import { describe, expect, it } from "vitest";
import { rolloverMerit, tapMerit, type Merit } from "./merit";

describe("merit", () => {
  const merit: Merit = { date: "2026-11-04", today: 2, total: 8 };
  it("increments both counters", () => {
    expect(tapMerit(merit, new Date(2026, 10, 4))).toEqual({
      date: "2026-11-04",
      today: 3,
      total: 9,
    });
  });
  it("rolls today's count on a new day", () => {
    expect(tapMerit(merit, new Date(2026, 10, 5))).toEqual({
      date: "2026-11-05",
      today: 1,
      total: 9,
    });
  });
  it("does not change same-day rollover or input", () => {
    expect(rolloverMerit(merit, new Date(2026, 10, 4))).toEqual(merit);
    expect(merit).toEqual({ date: "2026-11-04", today: 2, total: 8 });
  });
});
