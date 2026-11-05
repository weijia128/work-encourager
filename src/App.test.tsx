import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { ServicesProvider } from "./services/ServicesContext";
import { createMemoryStore } from "./services/kvStore";
import { createFakeMarketProvider, createFakePlatform } from "./test/fakes";
import type { Settings } from "./domain/settings";

vi.mock("./services/holidayLoader", () => ({ loadCalendar: vi.fn(async () => new Map()) }));
const settings: Settings = {
  nickname: "小叶",
  monthlySalary: 21000,
  workStart: "09:00",
  workEnd: "18:00",
  lunch: { start: "12:00", end: "13:30" },
  restPolicy: { kind: "double" },
  watchlist: [],
  wishlist: [],
  autostart: false,
  alwaysOnTop: true,
  muyuSound: false,
  hideTodayEarned: false,
  hideProgressAmount: false,
  hideWorkDuration: false,
  lastConfirmedMonth: "2026-11",
};

describe("App settings flow", () => {
  afterEach(() => cleanup());
  it("re-applies always-on-top after saving settings", async () => {
    const kv = createMemoryStore();
    await kv.set("settings", settings);
    const platform = createFakePlatform();
    render(
      <ServicesProvider
        services={{
          kv,
          market: createFakeMarketProvider(),
          platform,
          now: () => new Date(2026, 10, 4, 15),
        }}
      >
        <App />
      </ServicesProvider>,
    );
    await waitFor(() => expect(screen.getByText("设置")).toBeTruthy());
    fireEvent.click(screen.getByText("设置"));
    fireEvent.click(screen.getByLabelText("面板置顶"));
    fireEvent.click(screen.getByText("保存"));
    await waitFor(() =>
      expect(
        platform.calls.some((call) => call.method === "setAlwaysOnTop" && call.args[0] === false),
      ).toBe(true),
    );
  });
});
