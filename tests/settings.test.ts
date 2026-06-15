import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, normalizeSettings } from "../src/settings";

describe("settings", () => {
  it("provides the approved default reader and canvas settings", () => {
    expect(DEFAULT_SETTINGS.useReaderForVaultPdfs).toBe(true);
    expect(DEFAULT_SETTINGS.defaultCanvasStrategy).toBe("pdf-specific");
    expect(DEFAULT_SETTINGS.defaultNodeWidth).toBe(420);
    expect(DEFAULT_SETTINGS.pageZoneSpacing).toBe(720);
    expect(DEFAULT_SETTINGS.sourceEmphasisDurationMs).toBe(1600);
  });

  it("normalizes partial saved data without losing category presets", () => {
    const settings = normalizeSettings({
      useReaderForVaultPdfs: false,
      categories: [{ id: "custom", label: "Custom", color: "#00ff00", defaultTags: ["x"] }]
    });

    expect(settings.useReaderForVaultPdfs).toBe(false);
    expect(settings.categories).toHaveLength(1);
    expect(settings.categories[0].id).toBe("custom");
    expect(settings.defaultCategoryId).toBe("custom");
  });

  it("normalizes commercial UX settings for recent targets and spacing", () => {
    const settings = normalizeSettings({
      recentCanvasTargets: ["A.canvas", "B.canvas"],
      pageZoneSpacing: 900,
      nodeVerticalSpacing: 220,
      pdfWritePolicyAccepted: true
    });

    expect(settings.recentCanvasTargets).toEqual(["A.canvas", "B.canvas"]);
    expect(settings.pageZoneSpacing).toBe(900);
    expect(settings.nodeVerticalSpacing).toBe(220);
    expect(settings.pdfWritePolicyAccepted).toBe(true);
  });

  it("preserves pending recovery state after a partial write failure", () => {
    const settings = normalizeSettings({
      pendingRecovery: {
        pdfPath: "Sources/paper.pdf",
        pdfMtime: 123,
        pageNumber: 4,
        selectedText: "Recover this highlight.",
        pdfRects: [{ x: 1, y: 2, width: 3, height: 4 }],
        viewportRects: [{ x: 1, y: 2, width: 3, height: 4, scale: 1 }],
        annotationFingerprint: "sha256:abc",
        targetCanvasPath: "Sources/paper.canvas",
        categoryId: "evidence",
        tags: ["evidence"],
        createdAt: "2026-06-15T00:00:00.000Z"
      }
    });

    expect(settings.pendingRecovery?.targetCanvasPath).toBe("Sources/paper.canvas");
    expect(settings.pendingRecovery?.annotationFingerprint).toBe("sha256:abc");
  });
});
