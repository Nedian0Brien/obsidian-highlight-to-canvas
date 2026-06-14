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
});

