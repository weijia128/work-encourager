import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MuyuButton from "./MuyuButton";

describe("MuyuButton", () => {
  it("calls onTap and shows the merit flash", () => {
    const onTap = vi.fn();
    render(
      <MuyuButton merit={{ date: "2026-11-04", today: 1, total: 2 }} sound={false} onTap={onTap} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "敲木鱼" }));
    expect(onTap).toHaveBeenCalledOnce();
    expect(screen.getByText("功德 +1")).toBeTruthy();
  });
});
