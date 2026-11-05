import { z } from "zod";
import { toDateKey } from "./dates";

export interface HolidayDay {
  date: string;
  name: string;
  isOffDay: boolean;
}

export type HolidayCalendar = ReadonlyMap<string, HolidayDay>;

const holidayCnSchema = z.object({
  year: z.number(),
  days: z.array(
    z.object({
      name: z.string(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      isOffDay: z.boolean(),
    }),
  ),
});

export function parseHolidayCn(json: unknown): HolidayDay[] {
  const parsed = holidayCnSchema.parse(json);
  return parsed.days.map((d) => ({
    date: d.date,
    name: d.name,
    isOffDay: d.isOffDay,
  }));
}

export function buildCalendar(days: readonly HolidayDay[]): HolidayCalendar {
  const map = new Map<string, HolidayDay>();
  for (const day of days) {
    map.set(day.date, day);
  }
  return map;
}

export function nextHoliday(
  now: Date,
  calendar: HolidayCalendar,
): { name: string; date: string; days: number } | null {
  const today = toDateKey(now);
  const next = Array.from(calendar.values())
    .filter((day) => day.isOffDay && day.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const start = new Date(`${today}T00:00:00`);
  const fallbackDate = `${now.getFullYear() + 1}-01-01`;
  const target = new Date(`${next?.date ?? fallbackDate}T00:00:00`);
  return {
    name: next?.name ?? "元旦",
    date: next?.date ?? fallbackDate,
    days: Math.round((target.getTime() - start.getTime()) / 86_400_000),
  };
}

export const EMPTY_CALENDAR: HolidayCalendar = new Map();
