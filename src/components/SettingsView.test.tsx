import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SettingsView from "./SettingsView";
import { ServicesProvider } from "../services/ServicesContext";
import { createMemoryStore } from "../services/kvStore";
import { createFakeMarketProvider, createFakePlatform } from "../test/fakes";
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
  hideTodayEarned: false,
  hideProgressAmount: false,
  hideWorkDuration: false,
  lastConfirmedMonth: "2026-11",
};
function renderView(onSave = vi.fn(), onCancel = vi.fn()) {
  render(
    <ServicesProvider
      services={{
        kv: createMemoryStore(),
        market: createFakeMarketProvider(),
        platform: createFakePlatform(),
        now: () => new Date(2026, 10, 4, 15),
      }}
    >
      <SettingsView settings={settings} onSave={onSave} onCancel={onCancel} />
    </ServicesProvider>,
  );
  return { onSave, onCancel };
}
describe("SettingsView", () => {
  afterEach(() => cleanup());
  it("prefills current values and uses 保存", () => {
    renderView();
    expect((screen.getByLabelText("月薪") as HTMLInputElement).value).toBe("21000");
    expect(screen.getByText("隐藏今日收入详情")).toBeTruthy();
    expect(screen.getByText("保存")).toBeTruthy();
  });
  it("saves an updated salary while preserving the confirmed month", () => {
    const { onSave } = renderView();
    fireEvent.change(screen.getByLabelText("月薪"), { target: { value: "24000" } });
    fireEvent.click(screen.getByText("保存"));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ monthlySalary: 24000, lastConfirmedMonth: "2026-11" }),
    );
  });
  it("cancels back to the panel", () => {
    const { onCancel } = renderView();
    fireEvent.click(screen.getByText("取消"));
    expect(onCancel).toHaveBeenCalled();
  });
});
