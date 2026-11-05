import { describe, expect, it, vi } from "vitest";
import { EMPTY_CALENDAR } from "../domain/holidays";
import { isWorkday } from "../domain/workdays";
import { createMemoryStore } from "./kvStore";
import { loadCalendar } from "./holidayLoader";

const day = { name: "元旦", date: "2027-01-01", isOffDay: true };

describe("loadCalendar", () => {
  it("uses bundled 2026 without fetching", async () => {
    const fetchJson = vi.fn();
    const calendar = await loadCalendar([2026], createMemoryStore(), fetchJson);
    expect(calendar.get("2026-10-01")?.isOffDay).toBe(true);
    expect(fetchJson).not.toHaveBeenCalled();
  });

  it("fetches 2027 from jsdelivr and caches it", async () => {
    const kv = createMemoryStore();
    const fetchJson = vi.fn().mockResolvedValue({ year: 2027, days: [day] });
    const calendar = await loadCalendar([2027], kv, fetchJson);
    expect(calendar.get("2027-01-01")).toEqual(day);
    expect(fetchJson).toHaveBeenCalledWith(
      "https://cdn.jsdelivr.net/gh/NateScarlet/holiday-cn@master/2027.json",
    );
    await expect(kv.get("holidays:2027")).resolves.toEqual({ year: 2027, days: [day] });
  });

  it("uses cached year on second call without fetching", async () => {
    const kv = createMemoryStore();
    await kv.set("holidays:2027", { year: 2027, days: [day] });
    const fetchJson = vi.fn();
    const calendar = await loadCalendar([2027], kv, fetchJson);
    expect(calendar.get("2027-01-01")?.name).toBe("元旦");
    expect(fetchJson).not.toHaveBeenCalled();
  });

  it("falls back to empty calendar when fetch fails", async () => {
    const fetchJson = vi.fn().mockRejectedValue(new Error("offline"));
    const calendar = await loadCalendar([2027], createMemoryStore(), fetchJson);
    expect(calendar).toEqual(EMPTY_CALENDAR);
    expect(isWorkday("2027-01-04", { kind: "double" }, calendar)).toBe(true);
  });
});
