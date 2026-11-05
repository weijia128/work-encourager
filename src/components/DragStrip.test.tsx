import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DragStrip } from "./DragStrip";

describe("DragStrip", () => {
  afterEach(() => cleanup());
  it("renders a hidden-from-a11y strip that Tauri treats as a drag region", () => {
    const { container } = render(<DragStrip />);
    const strip = container.querySelector(".drag-strip");
    expect(strip).not.toBeNull();
    expect(strip?.hasAttribute("data-tauri-drag-region")).toBe(true);
    expect(strip?.getAttribute("aria-hidden")).toBe("true");
  });
});
