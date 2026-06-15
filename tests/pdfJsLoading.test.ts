import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("PDF.js loading", () => {
  it("does not statically import pdfjs-dist from the reader view", () => {
    const source = readFileSync("src/pdf/pdfReaderView.ts", "utf8");

    expect(source).not.toContain('from "pdfjs-dist"');
    expect(source).not.toContain("from 'pdfjs-dist'");
    expect(source).toContain('from "./pdfJs"');
  });

  it("uses Obsidian's PDF.js loader instead of bundling a separate runtime loader", () => {
    const source = readFileSync("src/pdf/pdfJs.ts", "utf8");

    expect(source).toContain('loadPdfJs as loadObsidianPdfJs');
    expect(source).toContain('from "obsidian"');
    expect(source).not.toContain('return import("pdfjs-dist")');
  });
});
