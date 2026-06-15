import { TFile } from "obsidian";

export const PDF_READER_VIEW_TYPE = "highlight-to-canvas-reader";

export interface PdfReaderViewState {
  type: typeof PDF_READER_VIEW_TYPE;
  active: true;
  state: {
    file: string;
  };
}

export function buildPdfReaderViewState(file: TFile): PdfReaderViewState {
  return {
    type: PDF_READER_VIEW_TYPE,
    active: true,
    state: {
      file: file.path
    }
  };
}
