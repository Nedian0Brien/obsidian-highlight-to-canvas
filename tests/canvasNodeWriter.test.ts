import { describe, expect, it } from "vitest";
import { appendHighlightNode, createEmptyCanvas, getDefaultCanvasPath } from "../src/canvas/canvasNodeWriter";
import type { CategoryPreset } from "../src/types";

const category: CategoryPreset = {
  id: "core-claim",
  label: "Core claim",
  color: "#f59e0b",
  defaultTags: ["claim"]
};

describe("canvasNodeWriter", () => {
  it("creates a PDF-specific canvas path beside the PDF", () => {
    expect(getDefaultCanvasPath("Sources/paper-name.pdf")).toBe("Sources/paper-name.canvas");
    expect(getDefaultCanvasPath("paper-name.pdf")).toBe("paper-name.canvas");
  });

  it("appends a readable text node with category color and source line", () => {
    const canvas = createEmptyCanvas();
    const result = appendHighlightNode(canvas, {
      pdfPath: "Sources/paper-name.pdf",
      pageNumber: 12,
      selectedText: "The highlighted sentence.",
      category,
      nodeWidth: 420,
      pageZoneSpacing: 720,
      nodeVerticalSpacing: 180
    });

    expect(result.node.text).toContain("Core claim");
    expect(result.node.text).toContain("The highlighted sentence.");
    expect(result.node.text).toContain("paper-name.pdf · p.12");
    expect(result.node.color).toBe("#f59e0b");
    expect(result.canvas.nodes).toHaveLength(1);
  });

  it("places page nodes in deterministic page zones", () => {
    const canvas = createEmptyCanvas();
    const first = appendHighlightNode(canvas, {
      pdfPath: "paper.pdf",
      pageNumber: 1,
      selectedText: "First",
      category,
      nodeWidth: 420,
      pageZoneSpacing: 720,
      nodeVerticalSpacing: 180
    });
    const second = appendHighlightNode(first.canvas, {
      pdfPath: "paper.pdf",
      pageNumber: 2,
      selectedText: "Second",
      category,
      nodeWidth: 420,
      pageZoneSpacing: 720,
      nodeVerticalSpacing: 180
    });

    expect(first.node.x).toBe(0);
    expect(second.node.x).toBe(720);
    expect(second.node.y).toBe(0);
  });
});

