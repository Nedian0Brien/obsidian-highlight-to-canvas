import { createHash } from "crypto";
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFString
} from "pdf-lib";
import type { Rect } from "../types";

export interface WriteHighlightAnnotationInput {
  pageNumber: number;
  selectedText: string;
  pdfRects: Rect[];
  color: string;
}

export interface WriteHighlightAnnotationResult {
  bytes: Uint8Array;
  annotationFingerprint: string;
}

export async function writeHighlightAnnotation(
  pdfBytes: Uint8Array | ArrayBuffer,
  input: WriteHighlightAnnotationInput
): Promise<WriteHighlightAnnotationResult> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pageIndex = input.pageNumber - 1;
  if (pageIndex < 0 || pageIndex >= pdfDoc.getPageCount()) {
    throw new Error(`PDF page ${input.pageNumber} does not exist`);
  }
  if (input.pdfRects.length === 0) {
    throw new Error("Cannot write a highlight annotation without rectangles");
  }

  const page = pdfDoc.getPage(pageIndex);
  const context = pdfDoc.context;
  const color = parseHexColor(input.color);
  const rectBounds = unionRects(input.pdfRects);
  const quadPoints = rectsToQuadPoints(input.pdfRects);

  const annotation = context.obj({
    Type: PDFName.of("Annot"),
    Subtype: PDFName.of("Highlight"),
    Rect: [rectBounds.x, rectBounds.y, rectBounds.x + rectBounds.width, rectBounds.y + rectBounds.height],
    QuadPoints: quadPoints,
    C: color,
    Contents: PDFHexString.fromText(input.selectedText),
    T: PDFString.of("PDF Highlight Canvas"),
    F: 4
  }) as PDFDict;

  const annotationRef = context.register(annotation);
  const existingAnnots = page.node.lookup(PDFName.of("Annots"));
  let annots: PDFArray;
  if (existingAnnots instanceof PDFArray) {
    annots = existingAnnots;
  } else {
    annots = context.obj([]) as PDFArray;
    page.node.set(PDFName.of("Annots"), annots);
  }
  annots.push(annotationRef);

  const bytes = await pdfDoc.save();
  return {
    bytes,
    annotationFingerprint: createAnnotationFingerprint(input)
  };
}

function unionRects(rects: Rect[]): Rect {
  const minX = Math.min(...rects.map((rect) => rect.x));
  const minY = Math.min(...rects.map((rect) => rect.y));
  const maxX = Math.max(...rects.map((rect) => rect.x + rect.width));
  const maxY = Math.max(...rects.map((rect) => rect.y + rect.height));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function rectsToQuadPoints(rects: Rect[]): PDFNumber[] {
  return rects.flatMap((rect) => [
    PDFNumber.of(rect.x),
    PDFNumber.of(rect.y + rect.height),
    PDFNumber.of(rect.x + rect.width),
    PDFNumber.of(rect.y + rect.height),
    PDFNumber.of(rect.x),
    PDFNumber.of(rect.y),
    PDFNumber.of(rect.x + rect.width),
    PDFNumber.of(rect.y)
  ]);
}

function parseHexColor(hex: string): number[] {
  const normalized = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return [1, 0.86, 0.25];
  }
  return [
    Number.parseInt(normalized.slice(0, 2), 16) / 255,
    Number.parseInt(normalized.slice(2, 4), 16) / 255,
    Number.parseInt(normalized.slice(4, 6), 16) / 255
  ];
}

function createAnnotationFingerprint(input: WriteHighlightAnnotationInput): string {
  const hash = createHash("sha256");
  hash.update(JSON.stringify({
    pageNumber: input.pageNumber,
    selectedText: input.selectedText,
    pdfRects: input.pdfRects,
    color: input.color
  }));
  return `sha256:${hash.digest("hex")}`;
}

