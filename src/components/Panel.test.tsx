import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Panel from "./Panel";
import { ServicesProvider } from "../services/ServicesContext";
import { createFakeMarketProvider, createFakePlatform } from "../test/fakes";
import { EMPTY_CALENDAR } from "../domain/holidays";
import type { Settings } from "../domain/settings";

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
  lastConfirmedMonth: "2026-11",
};

describe("Panel", () => {
  afterEach(() => cleanup());
  it("renders the snapshot and syncs the floored tray title", async () => {
    const platform = createFakePlatform();
    render(
      <ServicesProvider
        services={{
          kv: { get: async () => undefined, set: async () => undefined },
          market: createFakeMarketProvider(),
          platform,
          now: () => new Date(2026, 10, 4, 15),
        }}
      >
        <Panel
          settings={settings}
          calendar={EMPTY_CALENDAR}
          onOpenSettings={() => undefined}
          onSettingsChange={() => undefined}
        />
      </ServicesProvider>,
    );
    expect(screen.getByText("小叶，上班中")).toBeTruthy();
    expect(screen.getByText("¥600.0000")).toBeTruthy();
    expect(screen.getByText("本月进度").parentElement?.textContent).toContain("第 3/21 天");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(platform.calls.find((call) => call.method === "setTrayStatus")?.args[0]).toBe("💰 ¥600");
  });
});
