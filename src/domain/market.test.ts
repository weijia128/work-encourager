import { describe, expect, it } from "vitest";
import { EMPTY_CALENDAR } from "./holidays";
import { isTradingTime, monthToDateChange, yearToDateChange } from "./market";

describe("market math", () => {
  const closes = [
    { date: "2026-10-30", close: 1000 },
    { date: "2026-11-04", close: 1018 },
  ];

  it("calculates month to date change", () => {
    expect(monthToDateChange(closes, new Date(2026, 10, 4))).toBeCloseTo(0.018);
  });
  it("calculates year to date change from the previous year's last close", () => {
    expect(
      yearToDateChange(
        [
          { date: "2025-12-31", close: 1000 },
          { date: "2026-11-04", close: 1120 },
        ],
        new Date(2026, 10, 4),
      ),
    ).toBeCloseTo(0.12);
  });
  it("returns zero before a current-month bar and null without a base", () => {
    expect(monthToDateChange([{ date: "2026-10-30", close: 1000 }], new Date(2026, 10, 1))).toBe(0);
    expect(
      monthToDateChange([{ date: "2026-11-04", close: 1018 }], new Date(2026, 10, 4)),
    ).toBeNull();
  });
  it("recognizes exchange sessions", () => {
    expect(isTradingTime(new Date("2026-11-04T10:00:00"), EMPTY_CALENDAR)).toBe(true);
    expect(isTradingTime(new Date("2026-11-04T12:00:00"), EMPTY_CALENDAR)).toBe(false);
    expect(isTradingTime(new Date("2026-11-04T15:01:00"), EMPTY_CALENDAR)).toBe(false);
    expect(isTradingTime(new Date("2026-11-07T10:00:00"), EMPTY_CALENDAR)).toBe(false);
  });
});
