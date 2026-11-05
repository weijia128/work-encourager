import { describe, expect, it } from "vitest";
import { computeSnapshot, type WorkSchedule } from "./earnings";
import { EMPTY_CALENDAR } from "./holidays";
import { buildCopyCandidates, formatDuration, pickCopy, type CopyContext } from "./copywriter";
import { ITEMS } from "../data/items";

const schedule: WorkSchedule = {
  monthlySalary: 21000,
  workStart: "09:00",
  workEnd: "18:00",
  lunch: { start: "12:00", end: "13:30" },
  restPolicy: { kind: "double" },
};

const contextAt = (iso: string, extra: Partial<CopyContext> = {}): CopyContext => ({
  snapshot: computeSnapshot(new Date(iso), schedule, EMPTY_CALENDAR),
  nickname: "小叶",
  wishlist: [],
  quotes: [],
  lunchStart: "12:00",
  now: new Date(iso),
  ...extra,
});

describe("formatDuration", () => {
  it("formats minute boundaries", () => {
    expect(formatDuration(59)).toBe("不到 1 分钟");
    expect(formatDuration(60)).toBe("1 分钟");
    expect(formatDuration(3660)).toBe("1 小时 1 分钟");
  });
});

describe("buildCopyCandidates", () => {
  it("includes the reachable cheapest item and duration", () => {
    const lines = buildCopyCandidates(contextAt("2026-11-04T15:00:00"));
    expect(lines).toContain("小叶，再过 1 小时 30 分钟，一次短途旅行 就赚回来了");
  });

  it("skips an item that cannot be reached before off-work", () => {
    const lines = buildCopyCandidates(contextAt("2026-11-04T17:40:00"));
    expect(lines.some((line) => line.includes("就赚回来了"))).toBe(false);
  });

  it("uses the configured lunch start and final thirty-minute lines", () => {
    const lunchSoon = buildCopyCandidates(contextAt("2026-11-04T11:45:00"));
    expect(lunchSoon).toContain("小叶，坚持住，还有 15 分钟开饭");
    const customLunch = buildCopyCandidates(
      contextAt("2026-11-04T11:10:00", {
        lunchStart: "11:30",
      }),
    );
    expect(customLunch).toContain("小叶，坚持住，还有 20 分钟开饭");
    const afterLunch = buildCopyCandidates(
      contextAt("2026-11-04T11:45:00", {
        lunchStart: "11:30",
      }),
    );
    expect(afterLunch.some((line) => line.includes("开饭"))).toBe(false);
    const noLunch = buildCopyCandidates(
      contextAt("2026-11-04T11:10:00", {
        lunchStart: null,
      }),
    );
    expect(noLunch.some((line) => line.includes("开饭"))).toBe(false);
    const finalMinutes = buildCopyCandidates(contextAt("2026-11-04T17:40:00"));
    expect(finalMinutes).toContain("小叶，最后 20 分钟，每一秒都是纯赚");
  });

  it("formats wishes to one decimal place", () => {
    const lines = buildCopyCandidates(
      contextAt("2026-11-04T15:00:00", {
        wishlist: [{ name: "新书", price: 1000 }],
      }),
    );
    expect(lines).toContain("小叶，本月已经赚出 2.6 个 新书");
  });

  it("beats only non-stale quotes below month progress", () => {
    const lines = buildCopyCandidates(
      contextAt("2026-11-04T15:00:00", {
        quotes: [
          { name: "沪深300", secid: "1.000300", change: 0.1, asOf: "2026-11-04", stale: false },
          { name: "科创50", secid: "1.000688", change: 0.1, asOf: "2026-11-04", stale: true },
          { name: "黄金ETF", secid: "1.518880", change: 0.9, asOf: "2026-11-04", stale: false },
        ],
      }),
    );
    expect(lines).toContain("小叶，本月上班又跑赢了沪深300 ✌️");
    expect(lines.some((line) => line.includes("科创50"))).toBe(false);
    expect(lines.some((line) => line.includes("黄金ETF"))).toBe(false);
  });

  it("provides a status candidate for every status", () => {
    ["08:00:00", "12:30:00", "15:00:00", "19:00:00"].forEach((time) => {
      expect(buildCopyCandidates(contextAt(`2026-11-04T${time}`)).length).toBeGreaterThan(0);
    });
    expect(buildCopyCandidates(contextAt("2026-11-07T10:00:00")).length).toBeGreaterThan(0);
  });
});

describe("ITEMS", () => {
  it("is sorted by ascending price", () => {
    expect(ITEMS.every((item, index) => index === 0 || ITEMS[index - 1].price <= item.price)).toBe(
      true,
    );
  });
});

describe("pickCopy", () => {
  it("rotates deterministically every thirty seconds", () => {
    const firstContext = contextAt("2026-11-04T15:00:00");
    const first = pickCopy(firstContext);
    expect(pickCopy(firstContext)).toBe(first);
    const nextContext = contextAt("2026-11-04T15:00:30");
    const nextCandidates = buildCopyCandidates(nextContext);
    const index = Math.floor(nextContext.now.getTime() / 1000 / 30) % nextCandidates.length;
    expect(pickCopy(nextContext)).toBe(nextCandidates[index]);
  });
});
