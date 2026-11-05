import { parseHHMM, toDateKey } from "./dates";
import type { HolidayCalendar } from "./holidays";
import type { Settings } from "./settings";
import { workdaysInMonth } from "./workdays";

export function needsMonthPrompt(
  now: Date,
  settings: Settings,
  calendar: HolidayCalendar,
): boolean {
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (settings.lastConfirmedMonth === month) return false;
  const first = workdaysInMonth(
    now.getFullYear(),
    now.getMonth() + 1,
    settings.restPolicy,
    calendar,
  )[0];
  if (!first) return false;
  const firstWork = new Date(`${first}T00:00:00`);
  firstWork.setMinutes(parseHHMM(settings.workStart));
  return now.getTime() >= firstWork.getTime();
}

export function monthKey(now: Date): string {
  return toDateKey(now).slice(0, 7);
}
