import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("PDF.js loading", () => {
  it("does not statically import pdfjs-dist from the reader view", () => {
    const source = readFileSync("src/pdf/pdfReaderView.ts", "utf8");

    expect(source).not.toContain('from "pdfjs-dist"');
    expect(source).not.toContain("from 'pdfjs-dist'");
    expect(source).toContain('from "./pdfJs"');
  });
});
