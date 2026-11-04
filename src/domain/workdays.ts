import { parseDateKey, toDateKey, mondayOf } from "./dates";
import type { HolidayCalendar } from "./holidays";

export type RestPolicy =
  | { kind: "double" }
  | { kind: "single" }
  | { kind: "bigSmall"; smallWeekMonday: string };

const DAY_MS = 24 * 60 * 60 * 1000;

function policyWorkday(date: string, policy: RestPolicy): boolean {
  const dow = parseDateKey(date).getDay();
  if (dow === 0) return false;
  if (dow >= 1 && dow <= 5) return true;
  switch (policy.kind) {
    case "double":
      return false;
    case "single":
      return true;
    case "bigSmall": {
      const a = parseDateKey(mondayOf(date)).getTime();
      const b = parseDateKey(policy.smallWeekMonday).getTime();
      const weeks = Math.round((a - b) / (7 * DAY_MS));
      return Math.abs(weeks) % 2 === 0;
    }
  }
}

export function isWorkday(
  date: string,
  policy: RestPolicy,
  cal: HolidayCalendar,
): boolean {
  const entry = cal.get(date);
  if (entry) return !entry.isOffDay;
  return policyWorkday(date, policy);
}

export function workdaysInMonth(
  year: number,
  month: number,
  policy: RestPolicy,
  cal: HolidayCalendar,
): string[] {
  const result: string[] = [];
  const d = new Date(year, month - 1, 1);
  while (d.getMonth() === month - 1) {
    const key = toDateKey(d);
    if (isWorkday(key, policy, cal)) result.push(key);
    d.setDate(d.getDate() + 1);
  }
  return result;
}

export function isTradingDay(date: string, cal: HolidayCalendar): boolean {
  const dow = parseDateKey(date).getDay();
  if (dow === 0 || dow === 6) return false;
  const entry = cal.get(date);
  return !(entry && entry.isOffDay);
}
