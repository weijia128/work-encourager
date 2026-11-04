import { describe, it, expect } from "vitest";
import {
  isWorkday,
  workdaysInMonth,
  isTradingDay,
  type RestPolicy,
} from "./workdays";
import { buildCalendar, EMPTY_CALENDAR } from "./holidays";
import {
  toDateKey,
  parseDateKey,
  parseHHMM,
  secondsSinceMidnight,
  mondayOf,
} from "./dates";

const double: RestPolicy = { kind: "double" };
const single: RestPolicy = { kind: "single" };
const bigSmall: RestPolicy = { kind: "bigSmall", smallWeekMonday: "2026-11-02" };

describe("dates", () => {
  it("toDateKey formats local date", () => {
    expect(toDateKey(new Date(2026, 10, 4, 15, 30))).toBe("2026-11-04");
  });
  it("parseDateKey returns local midnight", () => {
    const d = parseDateKey("2026-11-04");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(10);
    expect(d.getDate()).toBe(4);
    expect(d.getHours()).toBe(0);
  });
  it("parseHHMM parses minutes since midnight", () => {
    expect(parseHHMM("09:30")).toBe(570);
    expect(parseHHMM("00:00")).toBe(0);
  });
  it("parseHHMM throws on bad format", () => {
    expect(() => parseHHMM("9:30")).toThrow();
    expect(() => parseHHMM("25:00")).toThrow();
    expect(() => parseHHMM("12:60")).toThrow();
    expect(() => parseHHMM("abc")).toThrow();
  });
  it("secondsSinceMidnight", () => {
    expect(secondsSinceMidnight(new Date(2026, 10, 4, 1, 2, 3))).toBe(3723);
  });
  it("mondayOf gives that week's Monday", () => {
    expect(mondayOf("2026-11-04")).toBe("2026-11-02");
    expect(mondayOf("2026-11-08")).toBe("2026-11-02");
    expect(mondayOf("2026-11-02")).toBe("2026-11-02");
  });
});

describe("isWorkday", () => {
  it("double: Mon–Fri work, Sat/Sun rest", () => {
    expect(isWorkday("2026-11-06", double, EMPTY_CALENDAR)).toBe(true);
    expect(isWorkday("2026-11-07", double, EMPTY_CALENDAR)).toBe(false);
    expect(isWorkday("2026-11-08", double, EMPTY_CALENDAR)).toBe(false);
  });

  it("single: Saturday works, Sunday rests", () => {
    expect(isWorkday("2026-11-07", single, EMPTY_CALENDAR)).toBe(true);
    expect(isWorkday("2026-11-08", single, EMPTY_CALENDAR)).toBe(false);
  });

  it("bigSmall: Saturday works only in small weeks, alternating", () => {
    expect(isWorkday("2026-11-07", bigSmall, EMPTY_CALENDAR)).toBe(true);
    expect(isWorkday("2026-11-14", bigSmall, EMPTY_CALENDAR)).toBe(false);
    expect(isWorkday("2026-11-21", bigSmall, EMPTY_CALENDAR)).toBe(true);
    // Plan example said "10-31 true (two weeks before)"; 10-31 is one week
    // before the 11-07 small Saturday, so the even-weeks rule gives false.
    // Two weeks before is 10-24, which works.
    expect(isWorkday("2026-10-31", bigSmall, EMPTY_CALENDAR)).toBe(false);
    expect(isWorkday("2026-10-24", bigSmall, EMPTY_CALENDAR)).toBe(true);
  });

  it("calendar off-day overrides policy", () => {
    const cal = buildCalendar([
      { name: "调休", date: "2026-11-06", isOffDay: true },
    ]);
    expect(isWorkday("2026-11-06", double, cal)).toBe(false);
  });

  it("calendar 补班 day overrides policy", () => {
    const cal = buildCalendar([
      { name: "补班", date: "2026-11-08", isOffDay: false },
    ]);
    expect(isWorkday("2026-11-08", single, cal)).toBe(true);
  });
});

describe("workdaysInMonth", () => {
  it("workdaysInMonth(2026, 11, double, EMPTY) has 21 days, first 2026-11-02, last 2026-11-30", () => {
    const days = workdaysInMonth(2026, 11, double, EMPTY_CALENDAR);
    expect(days).toHaveLength(21);
    expect(days[0]).toBe("2026-11-02");
    expect(days[days.length - 1]).toBe("2026-11-30");
  });
});

describe("isTradingDay", () => {
  it("is true on a plain weekday", () => {
    expect(isTradingDay("2026-11-04", EMPTY_CALENDAR)).toBe(true);
  });
  it("is false on a 补班 Saturday", () => {
    const cal = buildCalendar([
      { name: "补班", date: "2026-11-07", isOffDay: false },
    ]);
    expect(isTradingDay("2026-11-07", cal)).toBe(false);
  });
  it("is false on a statutory off-day weekday", () => {
    const cal = buildCalendar([
      { name: "节假日", date: "2026-11-04", isOffDay: true },
    ]);
    expect(isTradingDay("2026-11-04", cal)).toBe(false);
  });
});
