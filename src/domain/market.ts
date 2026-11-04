import { secondsSinceMidnight, toDateKey } from "./dates";
import { isTradingDay } from "./workdays";
import type { HolidayCalendar } from "./holidays";

export interface DailyClose { readonly date: string; readonly close: number }

export interface Quote {
  readonly secid: string;
  readonly change: number;
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

export function isTradingTime(now: Date, cal: HolidayCalendar): boolean {
  if (!isTradingDay(toDateKey(now), cal)) return false;
  const seconds = secondsSinceMidnight(now);
  const morning = seconds >= 9.5 * 3600 && seconds < 11.5 * 3600;
  const afternoon = seconds >= 13 * 3600 && seconds < 15 * 3600;
  return morning || afternoon;
}
