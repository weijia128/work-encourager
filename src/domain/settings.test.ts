import { describe, expect, it } from "vitest";
import { DEFAULT_WATCHLIST, defaultSettingsDraft, settingsSchema, type Settings } from "./settings";

const valid: Settings = {
  nickname: "小叶",
  monthlySalary: 21000,
  workStart: "09:00",
  workEnd: "18:00",
  lunch: { start: "12:00", end: "13:00" },
  restPolicy: { kind: "double" },
  watchlist: DEFAULT_WATCHLIST,
  wishlist: [{ name: "新耳机", price: 999 }],
  autostart: false,
  alwaysOnTop: true,
  muyuSound: false,
  lastConfirmedMonth: null,
};

describe("settingsSchema", () => {
  it("accepts a valid settings object", () => {
    expect(settingsSchema.parse(valid)).toEqual(valid);
    expect(defaultSettingsDraft().watchlist).toEqual(DEFAULT_WATCHLIST);
  });

  it.each([
    ["empty nickname", { nickname: "" }, "称呼不能为空"],
    ["nickname too long", { nickname: "一二三四五六七八九十 一二" }, "称呼不能超过12个字符"],
    ["salary non-positive", { monthlySalary: 0 }, "月薪必须大于0"],
    ["salary non-finite", { monthlySalary: Number.NaN }, "月薪必须是有限数字"],
    ["overnight", { workEnd: "08:00" }, "下班时间必须晚于上班时间"],
    ["lunch outside", { lunch: { start: "08:00", end: "09:00" } }, "午休必须在工作时间内"],
    ["lunch reversed", { lunch: { start: "13:00", end: "12:00" } }, "午休结束时间必须晚于开始时间"],
    ["duplicate watchlist", { watchlist: [{ secid: "1.000300", name: "沪深300" }, { secid: "1.000300", name: "重复" }] }, "关注品种不能重复"],
    ["bad wish price", { wishlist: [{ name: "x", price: 0 }] }, "心愿价格必须大于0"],
  ])("rejects %s with Chinese message", (_name, patch, message) => {
    const result = settingsSchema.safeParse({ ...valid, ...patch });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toContain(message);
  });
});
