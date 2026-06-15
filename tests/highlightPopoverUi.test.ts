import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("highlight pill UI", () => {
  it("uses five color swatches and an icon create action instead of options/open canvas controls", () => {
    const source = readFileSync("src/pdf/highlightPopover.ts", "utf8");

    expect(source).toContain("highlight-to-canvas-color-button");
    expect(source).toContain("aria-label\", \"Create highlight node\"");
    expect(source).not.toContain("document.createElement(\"select\")");
    expect(source).not.toContain("Options");
    expect(source).not.toContain("Open Canvas");
    expect(source).not.toContain("Create node");
  });
});
