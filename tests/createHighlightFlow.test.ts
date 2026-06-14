import { describe, expect, it, vi } from "vitest";
import { createHighlightFlow } from "../src/highlights/createHighlightFlow";
import type { CapturedHighlight, CategoryPreset } from "../src/types";

const category: CategoryPreset = { id: "evidence", label: "Evidence", color: "#22c55e", defaultTags: ["evidence"] };
const captured: CapturedHighlight = {
  selectedText: "A useful sentence.",
  pageNumber: 4,
  pdfRects: [{ x: 1, y: 2, width: 3, height: 4 }],
  viewportRects: [{ x: 1, y: 2, width: 3, height: 4, scale: 1 }]
};

describe("createHighlightFlow", () => {
  it("writes PDF annotation before Canvas and index", async () => {
    const calls: string[] = [];
    const result = await createHighlightFlow({
      pdfPath: "Sources/paper.pdf",
      pdfMtime: 10,
      captured,
      category,
      tags: ["evidence"],
      writePdfAnnotation: vi.fn(async () => {
        calls.push("pdf");
        return { annotationFingerprint: "sha256:abc" };
      }),
      appendCanvasNode: vi.fn(async () => {
        calls.push("canvas");
        return { canvasPath: "Sources/paper.canvas", canvasNodeId: "node_1" };
      }),
      saveIndexRecord: vi.fn(async () => {
        calls.push("index");
      })
    });

    expect(calls).toEqual(["pdf", "canvas", "index"]);
    expect(result.canvasNodeId).toBe("node_1");
  });

  it("does not create Canvas node when PDF annotation fails", async () => {
    const appendCanvasNode = vi.fn();
    await expect(
      createHighlightFlow({
        pdfPath: "Sources/paper.pdf",
        pdfMtime: 10,
        captured,
        category,
        tags: [],
        writePdfAnnotation: vi.fn(async () => {
          throw new Error("write failed");
        }),
        appendCanvasNode,
        saveIndexRecord: vi.fn()
      })
    ).rejects.toThrow("write failed");

    expect(appendCanvasNode).not.toHaveBeenCalled();
  });
});

