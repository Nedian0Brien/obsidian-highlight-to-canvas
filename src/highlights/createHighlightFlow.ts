import type { CapturedHighlight, CategoryPreset, HighlightRecord } from "../types";
import { createId } from "../utils/id";

export interface CreateHighlightFlowInput {
  pdfPath: string;
  pdfMtime: number;
  captured: CapturedHighlight;
  category: CategoryPreset;
  tags: string[];
  writePdfAnnotation: () => Promise<{ annotationFingerprint: string }>;
  appendCanvasNode: () => Promise<{ canvasPath: string; canvasNodeId: string }>;
  saveIndexRecord: (record: HighlightRecord) => Promise<void>;
}

export interface CreateHighlightFlowResult {
  record: HighlightRecord;
  canvasPath: string;
  canvasNodeId: string;
}

export async function createHighlightFlow(input: CreateHighlightFlowInput): Promise<CreateHighlightFlowResult> {
  const annotation = await input.writePdfAnnotation();
  const canvas = await input.appendCanvasNode();
  const now = new Date().toISOString();

  const record: HighlightRecord = {
    id: createId("highlight"),
    schemaVersion: 1,
    pdfPath: input.pdfPath,
    pdfMtime: input.pdfMtime,
    pageNumber: input.captured.pageNumber,
    selectedText: input.captured.selectedText,
    pdfRects: input.captured.pdfRects,
    viewportRects: input.captured.viewportRects,
    annotationFingerprint: annotation.annotationFingerprint,
    canvasPath: canvas.canvasPath,
    canvasNodeId: canvas.canvasNodeId,
    categoryId: input.category.id,
    tags: input.tags,
    createdAt: now,
    updatedAt: now
  };

  await input.saveIndexRecord(record);
  return { record, canvasPath: canvas.canvasPath, canvasNodeId: canvas.canvasNodeId };
}

