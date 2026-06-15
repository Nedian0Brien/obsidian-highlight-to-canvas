import { describe, expect, it } from "vitest";
import { TFile } from "obsidian";
import { buildPdfReaderViewState } from "../src/pdf/pdfReaderState";

describe("buildPdfReaderViewState", () => {
  it("passes the PDF file path through view state", () => {
    const file = Object.assign(Object.create(TFile.prototype), {
      path: "Sources/paper.pdf",
      extension: "pdf"
    }) as TFile;

    expect(buildPdfReaderViewState(file)).toEqual({
      type: "highlight-to-canvas-reader",
      active: true,
      state: {
        file: "Sources/paper.pdf"
      }
    });
  });
});
