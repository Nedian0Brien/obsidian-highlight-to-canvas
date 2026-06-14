import type { CapturedHighlight, Rect, ViewportRect } from "../types";

export interface ClientRectLike {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface NormalizeSelectionRectsInput {
  pageNumber: number;
  pageBounds: { left: number; top: number };
  scale: number;
  clientRects: ClientRectLike[];
  convertToPdfPoint: (x: number, y: number) => [number, number];
}

export interface NormalizedSelectionRects {
  pageNumber: number;
  pdfRects: Rect[];
  viewportRects: ViewportRect[];
}

export function normalizeSelectionRects(input: NormalizeSelectionRectsInput): NormalizedSelectionRects {
  const viewportRects: ViewportRect[] = [];
  const pdfRects: Rect[] = [];

  for (const rect of input.clientRects) {
    const width = rect.right - rect.left;
    const height = rect.bottom - rect.top;
    if (width <= 0 || height <= 0) continue;

    const x = rect.left - input.pageBounds.left;
    const y = rect.top - input.pageBounds.top;
    const [pdfX1, pdfY1] = input.convertToPdfPoint(x, y);
    const [pdfX2, pdfY2] = input.convertToPdfPoint(x + width, y + height);

    viewportRects.push({ x, y, width, height, scale: input.scale });
    pdfRects.push({
      x: Math.min(pdfX1, pdfX2),
      y: Math.min(pdfY1, pdfY2),
      width: Math.abs(pdfX2 - pdfX1),
      height: Math.abs(pdfY2 - pdfY1)
    });
  }

  return { pageNumber: input.pageNumber, pdfRects, viewportRects };
}

export function buildCapturedHighlight(selectedText: string, rects: NormalizedSelectionRects): CapturedHighlight {
  const trimmed = selectedText.trim();
  if (!trimmed) {
    throw new Error("Cannot create a highlight from empty selection");
  }
  if (rects.pdfRects.length === 0) {
    throw new Error("Cannot create a highlight without selection rectangles");
  }
  return {
    selectedText: trimmed,
    pageNumber: rects.pageNumber,
    pdfRects: rects.pdfRects,
    viewportRects: rects.viewportRects
  };
}

