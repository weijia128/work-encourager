import { describe, expect, it } from "vitest";
import { EMPTY_CALENDAR } from "./holidays";
import { halfYearChange, isTradingTime, monthToDateChange, yearToDateChange } from "./market";

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
  it("calculates trailing six-month change from the last close on or before the base date", () => {
    expect(
      halfYearChange(
        [
          { date: "2026-04-30", close: 900 },
          { date: "2026-05-01", close: 950 },
          { date: "2026-05-06", close: 1000 },
          { date: "2026-11-04", close: 1100 },
        ],
        new Date(2026, 10, 5),
      ),
    ).toBeCloseTo(1100 / 950 - 1);
  });
  it("clamps the six-month base date to the end of a shorter month", () => {
    expect(
      halfYearChange(
        [
          { date: "2026-02-27", close: 1000 },
          { date: "2026-03-02", close: 2000 },
          { date: "2026-08-31", close: 1200 },
        ],
        new Date(2026, 7, 31),
      ),
    ).toBeCloseTo(0.2);
  });
  it("returns null for half-year change without enough history", () => {
    expect(halfYearChange([{ date: "2026-10-30", close: 1000 }], new Date(2026, 10, 5))).toBeNull();
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
