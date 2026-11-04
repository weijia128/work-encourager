import { z } from "zod";

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

export const EMPTY_CALENDAR: HolidayCalendar = new Map();
