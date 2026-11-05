import { describe, expect, it } from "vitest";
import { needsMonthPrompt } from "./monthPrompt";
import { EMPTY_CALENDAR } from "./holidays";
import type { Settings } from "./settings";
const base: Settings = {
  nickname: "小叶",
  monthlySalary: 21000,
  workStart: "09:00",
  workEnd: "18:00",
  lunch: { start: "12:00", end: "13:30" },
  restPolicy: { kind: "double" },
  watchlist: [],
  wishlist: [],
  autostart: false,
  alwaysOnTop: true,
  muyuSound: false,
  hideTodayEarned: false,
  hideProgressAmount: false,
  hideWorkDuration: false,
  lastConfirmedMonth: "2026-11",
};
describe("needsMonthPrompt", () => {
  it("checks first workday and confirmation month", () => {
    expect(needsMonthPrompt(new Date(2026, 11, 1, 8, 59), base, EMPTY_CALENDAR)).toBe(false);
    expect(needsMonthPrompt(new Date(2026, 11, 1, 9), base, EMPTY_CALENDAR)).toBe(true);
    expect(needsMonthPrompt(new Date(2026, 11, 15, 9), base, EMPTY_CALENDAR)).toBe(true);
    expect(
      needsMonthPrompt(
        new Date(2026, 10, 4, 9),
        { ...base, lastConfirmedMonth: "2026-11" },
        EMPTY_CALENDAR,
      ),
    ).toBe(false);
  });
});
