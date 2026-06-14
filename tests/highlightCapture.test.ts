import { describe, expect, it } from "vitest";
import { normalizeSelectionRects } from "../src/pdf/highlightCapture";

describe("highlightCapture", () => {
  it("converts viewport rects to PDF rects with supplied converter", () => {
    const result = normalizeSelectionRects({
      pageNumber: 3,
      pageBounds: { left: 100, top: 200 },
      scale: 2,
      clientRects: [{ left: 120, top: 240, right: 220, bottom: 260 }],
      convertToPdfPoint: (x, y) => [x / 2, y / 2]
    });

    expect(result.pageNumber).toBe(3);
    expect(result.viewportRects[0]).toEqual({ x: 20, y: 40, width: 100, height: 20, scale: 2 });
    expect(result.pdfRects[0]).toEqual({ x: 10, y: 20, width: 50, height: 10 });
  });

  it("rejects zero-size rectangles", () => {
    const result = normalizeSelectionRects({
      pageNumber: 1,
      pageBounds: { left: 0, top: 0 },
      scale: 1,
      clientRects: [{ left: 10, top: 10, right: 10, bottom: 10 }],
      convertToPdfPoint: (x, y) => [x, y]
    });

    expect(result.viewportRects).toHaveLength(0);
    expect(result.pdfRects).toHaveLength(0);
  });
});

