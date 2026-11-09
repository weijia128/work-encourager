import { secondsSinceMidnight, toDateKey } from "./dates";
import { isTradingDay } from "./workdays";
import type { HolidayCalendar } from "./holidays";

export interface DailyClose {
  readonly date: string;
  readonly close: number;
}

export interface Quote {
  readonly secid: string;
  readonly change: number;
  readonly yearChange?: number;
  readonly dayChange?: number;
  readonly asOf: string;
  readonly stale: boolean;
}

export function monthToDateChange(closes: readonly DailyClose[], now: Date): number | null {
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const beforeMonth = closes.filter((bar) => bar.date < monthStart);
  const currentMonth = closes.filter((bar) => bar.date >= monthStart && bar.date <= toDateKey(now));
  const base = beforeMonth[beforeMonth.length - 1];
  const latest = currentMonth[currentMonth.length - 1];
  if (!base) return null;
  if (!latest) return 0;
  return latest.close / base.close - 1;
}

export function yearToDateChange(closes: readonly DailyClose[], now: Date): number | null {
  const yearStart = `${now.getFullYear()}-01-01`;
  const beforeYear = closes.filter((bar) => bar.date < yearStart);
  const currentYear = closes.filter((bar) => bar.date >= yearStart && bar.date <= toDateKey(now));
  const base = beforeYear[beforeYear.length - 1];
  const latest = currentYear[currentYear.length - 1];
  if (!base) return null;
  if (!latest) return 0;
  return latest.close / base.close - 1;
}

/** Latest available session's change from the previous session's close. */
export function dayChange(closes: readonly DailyClose[], now: Date): number | null {
  const available = closes.filter((bar) => bar.date <= toDateKey(now));
  if (available.length < 2) return null;
  const base = available[available.length - 2];
  const latest = available[available.length - 1];
  return latest.close / base.close - 1;
}

export function isTradingTime(now: Date, cal: HolidayCalendar): boolean {
  if (!isTradingDay(toDateKey(now), cal)) return false;
  const seconds = secondsSinceMidnight(now);
  const morning = seconds >= 9.5 * 3600 && seconds < 11.5 * 3600;
  const afternoon = seconds >= 13 * 3600 && seconds < 15 * 3600;
  return morning || afternoon;
}
