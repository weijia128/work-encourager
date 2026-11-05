import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EMPTY_CALENDAR } from "../domain/holidays";
import { ServicesProvider, type Services } from "../services/ServicesContext";
import { createFakePlatform } from "../test/fakes";
import { createMemoryStore } from "../services/kvStore";
import { useMarket } from "./useMarket";

function setup(fetchDailyCloses: Services["market"]["fetchDailyCloses"]) {
  const services: Services = {
    kv: createMemoryStore(),
    market: { fetchDailyCloses, search: vi.fn(async () => []) },
    platform: createFakePlatform(),
    now: () => new Date(2026, 10, 4, 10),
  };
  return {
    services,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ServicesProvider services={services}>{children}</ServicesProvider>
    ),
  };
}

describe("useMarket", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });
  it("fetches watched instruments on mount", async () => {
    const fetch = vi.fn(async () => [
      { date: "2025-12-31", close: 80 },
      { date: "2026-10-30", close: 100 },
      { date: "2026-11-04", close: 102 },
    ]);
    const { wrapper } = setup(fetch);
    const { result } = renderHook(
      () => useMarket([{ secid: "1.000300", name: "沪深300" }], EMPTY_CALENDAR),
      { wrapper },
    );
    await waitFor(() => expect(result.current.quotes["1.000300"].change).toBeCloseTo(0.02));
    expect(result.current.quotes["1.000300"].yearChange).toBeCloseTo(0.275);
    expect(result.current.quotes["1.000300"].halfYearChange).toBeCloseTo(0.275);
    expect(fetch).toHaveBeenCalledWith("1.000300");
  });
  it("keeps cached values and marks them stale after a failed refresh", async () => {
    const kv = createMemoryStore();
    await kv.set("quotes", {
      "1.000300": {
        secid: "1.000300",
        name: "沪深300",
        change: 0.02,
        asOf: "2026-11-03",
        stale: false,
      },
    });
    const fetch = vi.fn(async () => {
      throw new Error("offline");
    });
    const services: Services = {
      kv,
      market: { fetchDailyCloses: fetch, search: vi.fn(async () => []) },
      platform: createFakePlatform(),
      now: () => new Date(2026, 10, 4, 10),
    };
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ServicesProvider services={services}>{children}</ServicesProvider>
    );
    const { result } = renderHook(
      () => useMarket([{ secid: "1.000300", name: "沪深300" }], EMPTY_CALENDAR),
      { wrapper },
    );
    await waitFor(() => expect(result.current.quotes["1.000300"]?.stale).toBe(true));
    expect(result.current.quotes["1.000300"].change).toBe(0.02);
  });
  it("polls during trading time", async () => {
    const fetch = vi.fn(async () => [
      { date: "2026-10-30", close: 100 },
      { date: "2026-11-04", close: 101 },
    ]);
    const { wrapper } = setup(fetch);
    const { unmount } = renderHook(
      () => useMarket([{ secid: "1.000300", name: "沪深300" }], EMPTY_CALENDAR),
      { wrapper },
    );
    await waitFor(() => expect(fetch.mock.calls.length).toBeGreaterThanOrEqual(1));
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "setTimeout", "clearTimeout"] });
    act(() => {
      vi.advanceTimersByTime(180_000);
    });
    expect(fetch.mock.calls.length).toBeGreaterThan(1);
    unmount();
    vi.useRealTimers();
  });
});
