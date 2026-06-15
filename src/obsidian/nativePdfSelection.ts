import type { Rect } from "../types";

export interface PageElementLike {
  dataset?: { pageNumber?: string };
  getAttribute: (name: string) => string | null;
}

export interface Size {
  width: number;
  height: number;
}

export interface NativeSelectionDraft {
  selectedText: string;
  pageNumber: number;
  pageEl: HTMLElement;
  rootEl: HTMLElement;
  selectionRect: DOMRect;
  clientRects: DOMRect[];
}

const NATIVE_PDF_ROOT_SELECTOR = ".pdf-viewer, .pdf-container, .pdf-embed, .workspace-leaf-content";
const NATIVE_PDF_PAGE_SELECTOR = "[data-page-number], .pdf-page, .page";

export function getNativePdfSelectionDraft(selection: Selection, currentFileExtension: string | null): NativeSelectionDraft | null {
  if (currentFileExtension !== "pdf" || selection.rangeCount === 0) return null;
  const selectedText = selection.toString().trim();
  if (!selectedText) return null;

  const range = selection.getRangeAt(0);
  const startElement = getElementFromNode(range.startContainer);
  const endElement = getElementFromNode(range.endContainer);
  const pageEl = startElement?.closest<HTMLElement>(NATIVE_PDF_PAGE_SELECTOR) ?? null;
  const endPageEl = endElement?.closest<HTMLElement>(NATIVE_PDF_PAGE_SELECTOR) ?? null;
  if (!pageEl || pageEl !== endPageEl || pageEl.closest(".highlight-to-canvas-reader")) return null;

  const pageNumber = getNativePdfPageNumber(pageEl);
  if (!pageNumber) return null;

  const rootEl = pageEl.closest<HTMLElement>(NATIVE_PDF_ROOT_SELECTOR) ?? pageEl;
  const clientRects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0);
  if (clientRects.length === 0) return null;

  return {
    selectedText,
    pageNumber,
    pageEl,
    rootEl,
    selectionRect: range.getBoundingClientRect(),
    clientRects
  };
}

export function getNativePdfPageNumber(pageEl: PageElementLike): number | null {
  const fromData = Number(pageEl.dataset?.pageNumber);
  if (Number.isInteger(fromData) && fromData > 0) return fromData;

  const ariaLabel = pageEl.getAttribute("aria-label") ?? pageEl.getAttribute("data-label") ?? "";
  const match = ariaLabel.match(/\bpage\s+(\d+)\b/i);
  if (!match) return null;
  const fromLabel = Number(match[1]);
  return Number.isInteger(fromLabel) && fromLabel > 0 ? fromLabel : null;
}

export function convertNativeRectToPdfRect(input: {
  viewportRect: Rect;
  pageViewportSize: Size;
  pdfPageSize: Size;
}): Rect {
  const scaleX = input.pdfPageSize.width / input.pageViewportSize.width;
  const scaleY = input.pdfPageSize.height / input.pageViewportSize.height;
  const x = input.viewportRect.x * scaleX;
  const width = input.viewportRect.width * scaleX;
  const height = input.viewportRect.height * scaleY;
  const y = input.pdfPageSize.height - (input.viewportRect.y * scaleY) - height;

  return {
    x: roundPdfNumber(x),
    y: roundPdfNumber(y),
    width: roundPdfNumber(width),
    height: roundPdfNumber(height)
  };
}

export function tightenHighlightRect(rect: Rect): Rect {
  const tightenedHeight = roundPdfNumber(rect.height * 0.6);
  const y = roundPdfNumber(rect.y + (rect.height - tightenedHeight) / 2);

  return {
    x: rect.x,
    y,
    width: rect.width,
    height: tightenedHeight
  };
}

function getElementFromNode(node: Node): Element | null {
  return node instanceof Element ? node : node.parentElement;
}

function roundPdfNumber(value: number): number {
  return Math.round(value * 1000) / 1000;
}
