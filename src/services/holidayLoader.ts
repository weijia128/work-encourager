import bundled2026 from "../data/holidays/2026.json";
import { buildCalendar, parseHolidayCn, type HolidayCalendar, type HolidayDay } from "../domain/holidays";
import type { KeyValueStore } from "./kvStore";

const URL_BASE = "https://cdn.jsdelivr.net/gh/NateScarlet/holiday-cn@master";

async function loadYear(year: number, kv: KeyValueStore, fetchJson: (url: string) => Promise<unknown>): Promise<HolidayDay[]> {
  if (year === 2026) return parseHolidayCn(bundled2026);
  const cacheKey = `holidays:${year}`;
  try {
    const cached = await kv.get<unknown>(cacheKey);
    if (cached !== undefined) return parseHolidayCn(cached);
  } catch {
    // Invalid cache is treated as missing and refreshed.
  }
  try {
    const data = await fetchJson(`${URL_BASE}/${year}.json`);
    const days = parseHolidayCn(data);
    await kv.set(cacheKey, data);
    return days;
  } catch {
    return [];
  }
}

export async function loadCalendar(years: readonly number[], kv: KeyValueStore, fetchJson: (url: string) => Promise<unknown>): Promise<HolidayCalendar> {
  const days: HolidayDay[] = [];
  for (const year of years) days.push(...await loadYear(year, kv, fetchJson));
  return buildCalendar(days);
}
