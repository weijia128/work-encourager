import { describe, it, expect } from "vitest";
import { parseHolidayCn, buildCalendar, EMPTY_CALENDAR } from "./holidays";
import bundled2026 from "../data/holidays/2026.json";

describe("parseHolidayCn", () => {
  it("parses a valid holiday-cn payload", () => {
    const days = parseHolidayCn({
      year: 2026,
      days: [{ name: "元旦", date: "2026-01-01", isOffDay: true }],
    });
    expect(days).toEqual([{ name: "元旦", date: "2026-01-01", isOffDay: true }]);
  });

  it("throws on missing days array", () => {
    expect(() => parseHolidayCn({ year: 2026 })).toThrow();
  });
});

describe("buildCalendar", () => {
  it("indexes days by date", () => {
    const cal = buildCalendar([{ name: "元旦", date: "2026-01-01", isOffDay: true }]);
    expect(cal.get("2026-01-01")?.isOffDay).toBe(true);
    expect(cal.has("2026-01-02")).toBe(false);
  });

  it("EMPTY_CALENDAR is empty", () => {
    expect(EMPTY_CALENDAR.size).toBe(0);
  });
});

describe("bundled 2026.json", () => {
  it("parses and 2026-10-01 is an off-day", () => {
    const cal = buildCalendar(parseHolidayCn(bundled2026));
    expect(cal.get("2026-10-01")?.isOffDay).toBe(true);
  });
});
