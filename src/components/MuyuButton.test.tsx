import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import MuyuButton from "./MuyuButton";

describe("MuyuButton", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("calls onTap and shows the merit flash", () => {
    const onTap = vi.fn();
    render(
      <MuyuButton merit={{ date: "2026-11-04", today: 1, total: 2 }} sound={false} onTap={onTap} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "敲木鱼" }));
    expect(onTap).toHaveBeenCalledOnce();
    expect(screen.getByText("功德 +1")).toBeTruthy();
  });

  it("reuses one audio context and plays every rapid tap", () => {
    const start = vi.fn();
    const context = {
      state: "running",
      currentTime: 1,
      destination: {},
      createOscillator: vi.fn(() => ({
        frequency: { value: 0 },
        type: "sine",
        connect: vi.fn(),
        start,
        stop: vi.fn(),
      })),
      createGain: vi.fn(() => ({
        gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
      })),
    };
    const AudioContextMock = vi.fn(function MockAudioContext() {
      return context;
    });
    vi.stubGlobal("AudioContext", AudioContextMock);
    render(
      <MuyuButton
        compact
        merit={{ date: "2026-11-04", today: 0, total: 0 }}
        sound
        onTap={() => undefined}
      />,
    );
    const button = screen.getByRole("button", { name: "敲木鱼" });
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    expect(AudioContextMock).toHaveBeenCalledOnce();
    expect(context.createOscillator).toHaveBeenCalledTimes(3);
    expect(start).toHaveBeenCalledTimes(3);
  });

  it.each([false, true])("replays feedback for every rapid tap (compact=%s)", (compact) => {
    render(
      <MuyuButton
        compact={compact}
        merit={{ date: "2026-11-04", today: 0, total: 0 }}
        sound={false}
        onTap={() => undefined}
      />,
    );
    const button = screen.getByRole("button", { name: "敲木鱼" });
    fireEvent.click(button);
    const first = screen.getByText("功德 +1");
    fireEvent.click(button);
    const second = screen.getByText("功德 +1");
    fireEvent.click(button);
    const third = screen.getByText("功德 +1");
    expect(second).not.toBe(first);
    expect(third).not.toBe(second);
  });
});
