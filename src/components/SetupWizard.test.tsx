import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SetupWizard from "./SetupWizard";
import { ServicesProvider } from "../services/ServicesContext";
import { createMemoryStore } from "../services/kvStore";
import { createFakeMarketProvider, createFakePlatform } from "../test/fakes";

function renderWizard(onDone = vi.fn()) {
  const services = {
    kv: createMemoryStore(),
    market: createFakeMarketProvider(),
    platform: createFakePlatform(),
    now: () => new Date(2026, 10, 4, 15),
  };
  render(
    <ServicesProvider services={services}>
      <SetupWizard onDone={onDone} />
    </ServicesProvider>,
  );
  return onDone;
}

function fillBasics() {
  fireEvent.change(screen.getByLabelText("称呼"), { target: { value: "小叶" } });
  fireEvent.change(screen.getByLabelText("月薪"), { target: { value: "21000" } });
}

describe("SetupWizard", () => {
  afterEach(() => cleanup());
  it("fills valid form and calls onDone with parsed settings", () => {
    const done = renderWizard();
    fillBasics();
    fireEvent.click(screen.getByText("开始上班"));
    expect(done).toHaveBeenCalledWith(
      expect.objectContaining({
        nickname: "小叶",
        monthlySalary: 21000,
        lastConfirmedMonth: "2026-11",
      }),
    );
  });
  it("shows the work end validation error", () => {
    renderWizard();
    fillBasics();
    fireEvent.change(screen.getByLabelText("下班时间"), { target: { value: "08:00" } });
    fireEvent.click(screen.getByText("开始上班"));
    expect(screen.getByText("下班时间必须晚于上班时间")).toBeTruthy();
  });
  it("maps big week to the previous Monday", () => {
    const done = renderWizard();
    fillBasics();
    fireEvent.click(screen.getByLabelText("大小周"));
    fireEvent.click(screen.getByLabelText("本周是 大周（周六休）"));
    fireEvent.click(screen.getByText("开始上班"));
    expect(done.mock.calls[0][0].restPolicy).toEqual({
      kind: "bigSmall",
      smallWeekMonday: "2026-10-26",
    });
  });
  it("sets lunch to null when there is no lunch", () => {
    const done = renderWizard();
    fillBasics();
    fireEvent.click(screen.getByLabelText("没有午休"));
    fireEvent.click(screen.getByText("开始上班"));
    expect(done.mock.calls[0][0].lunch).toBeNull();
  });
  it("shows an empty wish name error inline", () => {
    renderWizard();
    fillBasics();
    fireEvent.click(screen.getByText("添加心愿"));
    fireEvent.click(screen.getByText("开始上班"));
    expect(screen.getByText("心愿名称不能为空")).toBeTruthy();
  });
});
