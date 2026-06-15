import { describe, expect, it } from "vitest";
import { convertNativeRectToPdfRect, getNativePdfPageNumber } from "../src/obsidian/nativePdfSelection";

describe("native PDF selection helpers", () => {
  it("reads the PDF.js page number from a native page element", () => {
    expect(getNativePdfPageNumber({ dataset: { pageNumber: "12" }, getAttribute: () => null })).toBe(12);
  });

  it("falls back to aria labels when native page data is absent", () => {
    expect(getNativePdfPageNumber({ dataset: {}, getAttribute: () => "Page 7" })).toBe(7);
  });

  it("converts viewport rectangles into bottom-left PDF coordinates", () => {
    expect(
      convertNativeRectToPdfRect({
        viewportRect: { x: 100, y: 50, width: 200, height: 20 },
        pageViewportSize: { width: 1000, height: 2000 },
        pdfPageSize: { width: 500, height: 1000 }
      })
    ).toEqual({ x: 50, y: 965, width: 100, height: 10 });
  });
});
