import { describe, expect, it } from "vitest";
import { buildCanvasTargetOptions, rememberCanvasTarget } from "../src/canvas/canvasTarget";

describe("canvasTarget", () => {
  it("shows the default PDF-specific Canvas first", () => {
    const options = buildCanvasTargetOptions("Sources/paper.pdf", ["Research.canvas"]);

    expect(options[0]).toEqual({ path: "Sources/paper.canvas", label: "paper.canvas", kind: "default" });
    expect(options[1]).toEqual({ path: "Research.canvas", label: "Research.canvas", kind: "recent" });
  });

  it("deduplicates and limits recent Canvas targets", () => {
    const remembered = rememberCanvasTarget(["A.canvas", "B.canvas", "A.canvas"], "C.canvas", 3);

    expect(remembered).toEqual(["C.canvas", "A.canvas", "B.canvas"]);
  });
});
