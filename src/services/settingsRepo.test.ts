import { describe, expect, it } from "vitest";
import { createMemoryStore } from "./kvStore";
import { loadSettings, saveSettings } from "./settingsRepo";
import type { Settings } from "../domain/settings";

const settings: Settings = {
  nickname: "小叶",
  monthlySalary: 21000,
  workStart: "09:00",
  workEnd: "18:00",
  lunch: { start: "12:00", end: "13:00" },
  restPolicy: { kind: "double" },
  watchlist: [{ secid: "1.000300", name: "沪深300" }],
  wishlist: [],
  autostart: false,
  alwaysOnTop: true,
  muyuSound: false,
  hideTodayEarned: false,
  hideProgressAmount: false,
  hideWorkDuration: false,
  lastConfirmedMonth: null,
};

describe("settingsRepo", () => {
  it("returns null for corrupted stored data", async () => {
    const kv = createMemoryStore();
    await kv.set("settings", { nickname: "", monthlySalary: -1 });
    await expect(loadSettings(kv)).resolves.toBeNull();
  });

  it("round-trips settings", async () => {
    const kv = createMemoryStore();
    await saveSettings(kv, settings);
    await expect(loadSettings(kv)).resolves.toEqual(settings);
  });

  it("rejects invalid settings with a Chinese message", async () => {
    const kv = createMemoryStore();
    await expect(saveSettings(kv, { ...settings, workEnd: "08:00" })).rejects.toThrow(
      "下班时间必须晚于上班时间",
    );
  });
});
