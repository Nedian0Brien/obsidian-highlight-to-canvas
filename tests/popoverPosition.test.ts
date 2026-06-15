import { describe, expect, it } from "vitest";
import { getPopoverPosition } from "../src/pdf/popoverPosition";

describe("getPopoverPosition", () => {
  it("positions the popover below the selected text when space is available", () => {
    const position = getPopoverPosition(
      { x: 100, y: 100, width: 80, height: 20 },
      { x: 0, y: 0, width: 600, height: 500 },
      { width: 320, height: 220 }
    );

    expect(position).toEqual({ left: 100, top: 128, placement: "below" });
  });

  it("moves the popover above when the selection is near the bottom edge", () => {
    const position = getPopoverPosition(
      { x: 100, y: 430, width: 80, height: 20 },
      { x: 0, y: 0, width: 600, height: 500 },
      { width: 320, height: 220 }
    );

    expect(position).toEqual({ left: 100, top: 202, placement: "above" });
  });

  it("clamps horizontal position inside the reader container", () => {
    const position = getPopoverPosition(
      { x: 540, y: 100, width: 40, height: 20 },
      { x: 0, y: 0, width: 600, height: 500 },
      { width: 320, height: 220 }
    );

    expect(position.left).toBe(272);
  });
});
