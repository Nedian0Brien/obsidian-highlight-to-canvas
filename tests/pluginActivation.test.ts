import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("plugin activation", () => {
  it("does not try to register the built-in PDF file extension", () => {
    const source = readFileSync("src/main.ts", "utf8");

    expect(source).not.toContain("registerExtensions");
  });
});
