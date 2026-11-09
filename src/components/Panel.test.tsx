import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Panel from "./Panel";
import { ServicesProvider } from "../services/ServicesContext";
import { createFakeMarketProvider, createFakePlatform } from "../test/fakes";
import { buildCalendar, EMPTY_CALENDAR } from "../domain/holidays";
import type { Settings } from "../domain/settings";
import {
  COMPACT_WINDOW_HEIGHT,
  COMPACT_WINDOW_WIDTH,
  DEFAULT_WINDOW_HEIGHT,
  MIN_RESIZABLE_WINDOW_HEIGHT,
  MIN_RESIZABLE_WINDOW_WIDTH,
  MIN_WINDOW_HEIGHT,
} from "../domain/windowFit";

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
          calendar={buildCalendar([{ name: "元旦", date: "2027-01-01", isOffDay: true }])}
          onOpenSettings={() => undefined}
          onSettingsChange={() => undefined}
        />
      </ServicesProvider>,
    );
    expect(screen.getByText("上班鼓励器")).toBeTruthy();
    const header = screen.getByText("上班鼓励器").closest("header");
    expect(header?.hasAttribute("data-tauri-drag-region")).toBe(true);
    expect(screen.getByText("上班鼓励器").hasAttribute("data-tauri-drag-region")).toBe(true);
    expect(
      screen.getByRole("button", { name: "设置" }).hasAttribute("data-tauri-drag-region"),
    ).toBe(false);
    expect(screen.getByText("恒纪元 · 距元旦 58 天")).toBeTruthy();
    expect(screen.getByText("小叶，上班中")).toBeTruthy();
    expect(screen.getByText("¥600.0000")).toBeTruthy();
    expect(screen.queryByText(/本月已赚/)).toBeNull();
    expect(screen.getByText("本月进度").parentElement?.textContent).toContain("第 3/21 天");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(platform.calls.find((call) => call.method === "setTrayStatus")?.args[0]).toBe("¥600");
  });
  it("fits the window to the panel and restores the default height on unmount", async () => {
    const platform = createFakePlatform();
    const view = render(
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
    await new Promise((resolve) => setTimeout(resolve, 0));
    const heights = () =>
      platform.calls
        .filter((call) => call.method === "setWindowHeight")
        .map((call) => call.args[0]);
    expect(heights()).toEqual([MIN_WINDOW_HEIGHT]);
    view.unmount();
    expect(heights()).toEqual([MIN_WINDOW_HEIGHT, DEFAULT_WINDOW_HEIGHT]);
  });
  it("hides sensitive progress details without hiding percentages", () => {
    const first = new Date(2026, 10, 4, 15);
    const onSettingsChange = vi.fn();
    render(
      <ServicesProvider
        services={{
          kv: { get: async () => undefined, set: async () => undefined },
          market: createFakeMarketProvider(),
          platform: createFakePlatform(),
          now: () => first,
        }}
      >
        <Panel
          settings={{
            ...settings,
            hideTodayEarned: true,
            hideProgressAmount: true,
            hideWorkDuration: true,
          }}
          calendar={EMPTY_CALENDAR}
          liveNow={first}
          syncTray={false}
          onOpenSettings={() => undefined}
          onSettingsChange={onSettingsChange}
        />
      </ServicesProvider>,
    );
    expect(screen.getByText("¥••••••")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "显示今日已赚" }));
    expect(onSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({ hideTodayEarned: false }),
    );
    const progress = document.querySelector(".progress-section")?.textContent ?? "";
    expect(progress).not.toContain("¥");
    expect(progress).not.toContain(" h");
    expect(progress).toContain("60.0%");
    expect(progress).toContain("第 3/21 天");
  });
  it("switches to a floating compact window without exposing hidden income", async () => {
    const platform = createFakePlatform();
    const now = new Date(2026, 10, 4, 15);
    render(
      <ServicesProvider
        services={{
          kv: { get: async () => undefined, set: async () => undefined },
          market: createFakeMarketProvider(),
          platform,
          now: () => now,
        }}
      >
        <Panel
          settings={{ ...settings, alwaysOnTop: false, hideTodayEarned: true }}
          calendar={EMPTY_CALENDAR}
          liveNow={now}
          onOpenSettings={() => undefined}
          onSettingsChange={() => undefined}
        />
      </ServicesProvider>,
    );

    await waitFor(() => {
      const call = platform.calls.filter((entry) => entry.method === "setTrayStatus").slice(-1)[0];
      expect(call?.args).toEqual(["", "小叶，上班中", false]);
    });
    fireEvent.click(screen.getByRole("button", { name: "切换悬浮小窗" }));
    expect(screen.getByText("¥••••••")).toBeTruthy();
    await waitFor(() => {
      expect(
        platform.calls.some(
          (call) =>
            call.method === "setWindowSize" &&
            call.args[0] === COMPACT_WINDOW_WIDTH &&
            call.args[1] === COMPACT_WINDOW_HEIGHT,
        ),
      ).toBe(true);
    });
    expect(
      platform.calls.some(
        (call) =>
          call.method === "setMinSize" &&
          call.args[0] === COMPACT_WINDOW_WIDTH &&
          call.args[1] === COMPACT_WINDOW_HEIGHT,
      ),
    ).toBe(true);
    expect(
      platform.calls.some((call) => call.method === "setResizable" && call.args[0] === false),
    ).toBe(true);
    expect(
      platform.calls.some((call) => call.method === "setAlwaysOnTop" && call.args[0] === true),
    ).toBe(true);
    expect(
      platform.calls.some((call) => call.method === "setShadow" && call.args[0] === false),
    ).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "展开主窗口" }));
    expect(screen.getByText("设置")).toBeTruthy();
    await waitFor(() => {
      const call = platform.calls.filter((entry) => entry.method === "setAlwaysOnTop").slice(-1)[0];
      expect(call?.args).toEqual([false]);
      const shadow = platform.calls.filter((entry) => entry.method === "setShadow").slice(-1)[0];
      expect(shadow?.args).toEqual([true]);
      const minSize = platform.calls.filter((entry) => entry.method === "setMinSize").slice(-1)[0];
      expect(minSize?.args).toEqual([MIN_RESIZABLE_WINDOW_WIDTH, MIN_RESIZABLE_WINDOW_HEIGHT]);
      const resizable = platform.calls
        .filter((entry) => entry.method === "setResizable")
        .slice(-1)[0];
      expect(resizable?.args).toEqual([true]);
    });
  });
  it("uses the window controls in the panel header", () => {
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
          liveNow={new Date(2026, 10, 4, 15)}
          syncTray={false}
          onOpenSettings={() => undefined}
          onSettingsChange={() => undefined}
        />
      </ServicesProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "最小化窗口" }));
    fireEvent.click(screen.getByRole("button", { name: "切换最大化" }));
    fireEvent.click(screen.getByRole("button", { name: "关闭窗口" }));
    expect(platform.calls.map((call) => call.method)).toEqual(
      expect.arrayContaining(["minimizeWindow", "toggleMaximizeWindow", "closeWindow"]),
    );
  });
  it("rotates copy after one hour", () => {
    const platform = createFakePlatform();
    const first = new Date(2026, 10, 4, 15, 0, 0);
    const withWish = { ...settings, wishlist: [{ name: "新球拍", price: 100 }] };
    const view = render(
      <ServicesProvider
        services={{
          kv: { get: async () => undefined, set: async () => undefined },
          market: createFakeMarketProvider(),
          platform,
          now: () => first,
        }}
      >
        <Panel
          settings={withWish}
          calendar={EMPTY_CALENDAR}
          liveNow={first}
          syncTray={false}
          onOpenSettings={() => undefined}
          onSettingsChange={() => undefined}
        />
      </ServicesProvider>,
    );
    const firstCopy = screen.getByLabelText("TickerChips slot").previousElementSibling?.textContent;
    const later = new Date(first.getTime() + 3_600_000);
    view.rerender(
      <ServicesProvider
        services={{
          kv: { get: async () => undefined, set: async () => undefined },
          market: createFakeMarketProvider(),
          platform,
          now: () => later,
        }}
      >
        <Panel
          settings={withWish}
          calendar={EMPTY_CALENDAR}
          liveNow={later}
          syncTray={false}
          onOpenSettings={() => undefined}
          onSettingsChange={() => undefined}
        />
      </ServicesProvider>,
    );
    const laterCopy = screen.getByLabelText("TickerChips slot").previousElementSibling?.textContent;
    expect(laterCopy).not.toBe(firstCopy);
  });
});
