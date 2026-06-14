import type { HighlightRecord } from "../types";

export interface HighlightIndexDocument {
  schemaVersion: 1;
  records: HighlightRecord[];
}

export function createEmptyHighlightIndex(): HighlightIndexDocument {
  return { schemaVersion: 1, records: [] };
}

export function addHighlightRecord(index: HighlightIndexDocument, record: HighlightRecord): HighlightIndexDocument {
  const records = index.records.filter((existing) => existing.id !== record.id);
  return { schemaVersion: 1, records: [...records, record] };
}

export function findByCanvasNodeId(index: HighlightIndexDocument, canvasNodeId: string): HighlightRecord | undefined {
  return index.records.find((record) => record.canvasNodeId === canvasNodeId);
}

export function findByPdfPath(index: HighlightIndexDocument, pdfPath: string): HighlightRecord[] {
  return index.records.filter((record) => record.pdfPath === pdfPath);
}

export function exportHighlightIndex(index: HighlightIndexDocument): string {
  return `${JSON.stringify(index, null, 2)}\n`;
}

export function importHighlightIndex(raw: string): HighlightIndexDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid highlight index JSON");
  }

  if (!isHighlightIndexDocument(parsed)) {
    throw new Error("Invalid highlight index structure");
  }

  return parsed;
}

function isHighlightIndexDocument(value: unknown): value is HighlightIndexDocument {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<HighlightIndexDocument>;
  return candidate.schemaVersion === 1 && Array.isArray(candidate.records);
}

