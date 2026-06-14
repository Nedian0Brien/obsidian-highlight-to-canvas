export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewportRect extends Rect {
  scale: number;
}

export interface CategoryPreset {
  id: string;
  label: string;
  color: string;
  defaultTags: string[];
}

export type DefaultCanvasStrategy = "pdf-specific";

export interface PdfHighlightCanvasSettings {
  useReaderForVaultPdfs: boolean;
  defaultZoom: "fit-width";
  sourceEmphasisDurationMs: number;
  sourceEmphasisStyle: "outline-fill";
  defaultCanvasStrategy: DefaultCanvasStrategy;
  allowCanvasOverride: boolean;
  defaultNodeWidth: number;
  pageZoneSpacing: number;
  nodeVerticalSpacing: number;
  defaultCategoryId: string;
  categories: CategoryPreset[];
  lastPdfWriteError: string | null;
}

export interface HighlightRecord {
  id: string;
  schemaVersion: 1;
  pdfPath: string;
  pdfMtime: number;
  pageNumber: number;
  selectedText: string;
  pdfRects: Rect[];
  viewportRects: ViewportRect[];
  annotationFingerprint: string;
  canvasPath: string;
  canvasNodeId: string;
  categoryId: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CapturedHighlight {
  selectedText: string;
  pageNumber: number;
  pdfRects: Rect[];
  viewportRects: ViewportRect[];
}

