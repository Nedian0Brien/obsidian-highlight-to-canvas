import { describe, expect, it } from "vitest";
import { addHighlightRecord, createEmptyHighlightIndex } from "../src/index/highlightIndex";
import { repairHighlightIndex } from "../src/obsidian/indexMaintenance";

const baseRecord = {
  id: "highlight_1",
  schemaVersion: 1 as const,
  pdfPath: "Sources/paper.pdf",
  pdfMtime: 1000,
  pageNumber: 2,
  selectedText: "A useful sentence.",
  pdfRects: [{ x: 10, y: 20, width: 30, height: 12 }],
  viewportRects: [{ x: 15, y: 25, width: 45, height: 18, scale: 1.5 }],
  annotationFingerprint: "sha256:abc",
  canvasPath: "Sources/paper.canvas",
  canvasNodeId: "node_1",
  categoryId: "evidence",
  tags: ["method"],
  createdAt: "2026-06-15T00:00:00.000Z",
  updatedAt: "2026-06-15T00:00:00.000Z"
};

describe("indexMaintenance", () => {
  it("keeps records whose PDF and Canvas files still exist", async () => {
    const index = addHighlightRecord(createEmptyHighlightIndex(), baseRecord);
    const result = await repairHighlightIndex(index, async () => true);

    expect(result.repaired.records).toHaveLength(1);
    expect(result.removed).toHaveLength(0);
  });

  it("removes records with missing PDF or Canvas files", async () => {
    const index = addHighlightRecord(createEmptyHighlightIndex(), baseRecord);
    const result = await repairHighlightIndex(index, async (path) => path !== "Sources/paper.canvas");

    expect(result.repaired.records).toHaveLength(0);
    expect(result.removed[0].canvasNodeId).toBe("node_1");
  });
});

