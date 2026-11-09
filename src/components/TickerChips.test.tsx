import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TickerChips from "./TickerChips";
import { ServicesProvider } from "../services/ServicesContext";
import { createFakePlatform } from "../test/fakes";
import { createMemoryStore } from "../services/kvStore";

describe("TickerChips", () => {
  afterEach(() => cleanup());
  it("renders colored changes and removes an item", () => {
    const onChange = vi.fn();
    const onRefresh = vi.fn();
    render(
      <TickerChips
        watchlist={[
          { secid: "1", name: "上涨" },
          { secid: "2", name: "下跌" },
        ]}
        quotes={{
          "1": {
            secid: "1",
            name: "上涨",
            change: 0.018,
            yearChange: 0.12,
            dayChange: 0.006,
            asOf: "2026-11-04",
            stale: false,
          },
          "2": {
            secid: "2",
            name: "下跌",
            change: -0.021,
            yearChange: -0.08,
            dayChange: -0.007,
            asOf: "2026-11-04",
            stale: false,
          },
        }}
        refreshing={false}
        onRefresh={onRefresh}
        onChange={onChange}
      />,
    );
    const heading = screen.getByText("反者道之动 · 贪嗔");
    expect(heading.title).toBe("反者道之动，弱者道之用 ——《道德经》");
    expect(screen.queryByText("关注行情")).toBeNull();
    expect(screen.getByText("上涨 +0.60%").className).toContain("up");
    expect(screen.getByText("上涨 +0.60%").title).toContain("本日涨跌幅");
    expect(screen.getByText("上涨 +0.60%").title).toContain("数据截至 2026-11-04");
    expect(screen.getByText("下跌 -0.70%").className).toContain("down");
    fireEvent.click(screen.getByRole("button", { name: "本月" }));
    expect(screen.getByRole("button", { name: "本月" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("上涨 +1.80%").title).toContain("本月涨跌幅");
    expect(screen.getByText("下跌 -2.10%").className).toContain("down");
    fireEvent.click(screen.getByRole("button", { name: "今年" }));
    expect(screen.getByText("上涨 +12.00%")).toBeTruthy();
    expect(screen.getByText("下跌 -8.00%")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "刷新行情" }));
    expect(onRefresh).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "移除上涨" }));
    expect(onChange).toHaveBeenCalledWith([{ secid: "2", name: "下跌" }]);
  });
  it("ignores duplicate additions", () => {
    const onChange = vi.fn();
    const services = {
      kv: createMemoryStore(),
      market: { fetchDailyCloses: vi.fn(async () => []), search: vi.fn(async () => []) },
      platform: createFakePlatform(),
      now: () => new Date(2026, 10, 4),
    };
    render(
      <ServicesProvider services={services}>
        <TickerChips
          watchlist={[{ secid: "1", name: "上涨" }]}
          quotes={{}}
          refreshing={false}
          onRefresh={() => undefined}
          onChange={onChange}
        />
      </ServicesProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "添加关注品种" }));
    fireEvent.change(screen.getByRole("textbox", { name: "搜索品种" }), {
      target: { value: "上涨" },
    });
  });
});
