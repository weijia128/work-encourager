import fixtureKline from "./__fixtures__/kline-000300.json";
import fixtureSearch from "./__fixtures__/search-hs300.json";
import { describe, expect, it } from "vitest";
import { createEastmoneyProvider, parseKline, parseSearch } from "./eastmoney";

describe("eastmoney provider", () => {
  it("parses daily closes", () => {
    const closes = parseKline(fixtureKline);
    expect(closes.length).toBeGreaterThan(0);
    expect(closes.every((bar) => Number.isFinite(bar.close))).toBe(true);
    expect(closes.every((bar, i) => i === 0 || bar.date > closes[i - 1].date)).toBe(true);
  });
  it("rejects malformed kline responses", () => {
    expect(() => parseKline({ data: null })).toThrow();
  });
  it("parses only mainland markets from search", () => {
    const instruments = parseSearch(fixtureSearch);
    expect(instruments.some((item) => item.secid === "1.000300")).toBe(true);
    expect(
      instruments.every((item) => item.secid.startsWith("0.") || item.secid.startsWith("1.")),
    ).toBe(true);
  });
  it("builds endpoint URLs", async () => {
    const urls: string[] = [];
    const provider = createEastmoneyProvider(async (url) => {
      urls.push(url);
      return url.includes("stock/kline") ? fixtureKline : fixtureSearch;
    });
    await provider.fetchDailyCloses("1.000300");
    await provider.search("沪深300");
    expect(urls[0]).toContain("secid=1.000300");
    expect(urls[0]).toContain("lmt=300");
    expect(urls[1]).toContain("input=%E6%B2%AA%E6%B7%B1300");
  });
});
