import { describe, expect, it } from "vitest";
import { addHighlightRecord, createEmptyHighlightIndex, findByCanvasNodeId, importHighlightIndex, type HighlightIndexDocument } from "../src/index/highlightIndex";

const record = {
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

describe("highlightIndex", () => {
  it("adds and finds records by canvas node id", () => {
    const index = addHighlightRecord(createEmptyHighlightIndex(), record);
    expect(findByCanvasNodeId(index, "node_1")?.pdfPath).toBe("Sources/paper.pdf");
  });

  it("imports valid JSON and rejects malformed data", () => {
    const imported = importHighlightIndex(JSON.stringify({ schemaVersion: 1, records: [record] }));
    expect((imported as HighlightIndexDocument).records).toHaveLength(1);
    expect(() => importHighlightIndex("{")).toThrow("Invalid highlight index JSON");
    expect(() => importHighlightIndex(JSON.stringify({ records: "bad" }))).toThrow("Invalid highlight index structure");
  });
});

