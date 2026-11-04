import { describe, it, expect } from "vitest";
import {
  computeSnapshot,
  STATUS_LABEL,
  type WorkSchedule,
} from "./earnings";
import { EMPTY_CALENDAR } from "./holidays";

const schedule: WorkSchedule = {
  monthlySalary: 21000,
  workStart: "09:00",
  workEnd: "18:00",
  lunch: { start: "12:00", end: "13:30" },
  restPolicy: { kind: "double" },
};

const at = (iso: string) => new Date(iso);
const snap = (iso: string, s: WorkSchedule = schedule) =>
  computeSnapshot(at(iso), s, EMPTY_CALENDAR);

describe("computeSnapshot", () => {
  it("working at 2026-11-04 15:00", () => {
    const s = snap("2026-11-04T15:00:00");
    expect(s.status).toBe("working");
    expect(s.dailyWage).toBe(1000);
    expect(s.hourlyWage).toBeCloseTo(133.33, 2);
    expect(s.todayEarned).toBe(600);
    expect(s.workedSeconds).toBe(16200);
    expect(s.dailySeconds).toBe(27000);
    expect(s.monthEarned).toBeCloseTo(2600, 6);
    expect(s.monthProgress).toBeCloseTo(0.12381, 5);
    expect(s.workdayIndex).toBe(3);
    expect(s.workdaysTotal).toBe(21);
    expect(s.countdown).toEqual({ kind: "toOffWork", seconds: 10800 });
  });

  it("lunch at 12:30", () => {
    const s = snap("2026-11-04T12:30:00");
    expect(s.status).toBe("lunch");
    expect(s.todayEarned).toBe(400);
    expect(s.countdown).toEqual({ kind: "toLunchEnd", seconds: 3600 });
  });

  it("beforeWork at 08:00", () => {
    const s = snap("2026-11-04T08:00:00");
    expect(s.status).toBe("beforeWork");
    expect(s.todayEarned).toBe(0);
    expect(s.countdown).toEqual({ kind: "toWork", seconds: 3600 });
    expect(s.monthEarned).toBeCloseTo(2000, 6);
  });

  it("afterWork at 19:00", () => {
    const s = snap("2026-11-04T19:00:00");
    expect(s.status).toBe("afterWork");
    expect(s.todayEarned).toBe(1000);
    expect(s.todayProgress).toBe(1);
    expect(s.countdown).toBeNull();
  });

  it("restDay on Saturday 2026-11-07 10:00", () => {
    const s = snap("2026-11-07T10:00:00");
    expect(s.status).toBe("restDay");
    expect(s.todayEarned).toBe(0);
    expect(s.monthEarned).toBe(5000);
    expect(s.workdayIndex).toBe(5);
  });

  it("last workday end gives monthProgress exactly 1", () => {
    const s = snap("2026-11-30T18:00:01");
    expect(s.status).toBe("afterWork");
    expect(s.monthProgress).toBe(1);
    expect(s.monthEarned).toBe(21000);
  });

  it("month rollover: 2026-12-01 08:59 has monthEarned 0 and December's total", () => {
    const s = snap("2026-12-01T08:59:00");
    expect(s.monthEarned).toBe(0);
    expect(s.workdaysTotal).toBe(23);
    expect(s.workdayIndex).toBe(1);
  });

  it("no lunch: lunch null gives 32400 effective seconds", () => {
    const s = snap("2026-11-04T15:00:00", { ...schedule, lunch: null });
    expect(s.dailySeconds).toBe(32400);
    expect(s.status).toBe("working");
  });

  it("todayEarned grows by perSecond per second", () => {
    const a = snap("2026-11-04T15:00:00");
    const b = snap("2026-11-04T15:00:01");
    expect(b.todayEarned - a.todayEarned).toBeCloseTo(a.perSecond, 10);
  });

  it("zero-workday month returns zero wages, not NaN", () => {
    const cal = new Map(
      Array.from({ length: 31 }, (_, i) => {
        const key = `2026-11-${String(i + 1).padStart(2, "0")}`;
        return [key, { date: key, name: "休", isOffDay: true }] as const;
      }),
    );
    const s = computeSnapshot(at("2026-11-04T15:00:00"), schedule, cal);
    expect(s.status).toBe("restDay");
    expect(s.dailyWage).toBe(0);
    expect(s.perSecond).toBe(0);
    expect(s.monthProgress).toBe(0);
    expect(Number.isNaN(s.todayEarned)).toBe(false);
  });
});

describe("STATUS_LABEL", () => {
  it("has the exact labels", () => {
    expect(STATUS_LABEL).toEqual({
      beforeWork: "还没上班",
      working: "上班中",
      lunch: "午休中",
      afterWork: "已下班",
      restDay: "今天休息",
    });
  });
});
