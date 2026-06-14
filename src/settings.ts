import { App, PluginSettingTab, Setting } from "obsidian";
import type PdfHighlightCanvasPlugin from "./main";
import type { CategoryPreset, PdfHighlightCanvasSettings } from "./types";

export const DEFAULT_CATEGORIES: CategoryPreset[] = [
  { id: "core-claim", label: "Core claim", color: "#f59e0b", defaultTags: ["claim"] },
  { id: "evidence", label: "Evidence", color: "#22c55e", defaultTags: ["evidence"] },
  { id: "question", label: "Question", color: "#38bdf8", defaultTags: ["question"] },
  { id: "quote", label: "Quote", color: "#a78bfa", defaultTags: ["quote"] },
  { id: "counterpoint", label: "Counterpoint", color: "#f43f5e", defaultTags: ["counterpoint"] }
];

export const DEFAULT_SETTINGS: PdfHighlightCanvasSettings = {
  useReaderForVaultPdfs: true,
  defaultZoom: "fit-width",
  sourceEmphasisDurationMs: 1600,
  sourceEmphasisStyle: "outline-fill",
  defaultCanvasStrategy: "pdf-specific",
  allowCanvasOverride: true,
  defaultNodeWidth: 420,
  pageZoneSpacing: 720,
  nodeVerticalSpacing: 180,
  defaultCategoryId: "core-claim",
  categories: DEFAULT_CATEGORIES,
  lastPdfWriteError: null
};

export function normalizeSettings(raw: Partial<PdfHighlightCanvasSettings> | null | undefined): PdfHighlightCanvasSettings {
  const categories = raw?.categories?.length ? raw.categories : DEFAULT_CATEGORIES;
  const defaultCategoryId = raw?.defaultCategoryId && categories.some((category) => category.id === raw.defaultCategoryId)
    ? raw.defaultCategoryId
    : categories[0].id;

  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    categories,
    defaultCategoryId,
    defaultZoom: "fit-width",
    sourceEmphasisStyle: "outline-fill",
    defaultCanvasStrategy: "pdf-specific"
  };
}

export class PdfHighlightCanvasSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: PdfHighlightCanvasPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Use PDF Highlight Reader for Vault PDFs")
      .setDesc("Open Vault PDF files in the plugin reader so highlights can become Canvas nodes.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.useReaderForVaultPdfs)
          .onChange(async (value) => {
            this.plugin.settings.useReaderForVaultPdfs = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Source emphasis duration")
      .setDesc("Milliseconds for the temporary visual emphasis when returning to a PDF highlight.")
      .addText((text) =>
        text
          .setValue(String(this.plugin.settings.sourceEmphasisDurationMs))
          .onChange(async (value) => {
            const parsed = Number.parseInt(value, 10);
            if (Number.isFinite(parsed) && parsed >= 300) {
              this.plugin.settings.sourceEmphasisDurationMs = parsed;
              await this.plugin.saveSettings();
            }
          })
      );

    new Setting(containerEl)
      .setName("Default node width")
      .setDesc("Width in Canvas pixels for new highlight nodes.")
      .addText((text) =>
        text
          .setValue(String(this.plugin.settings.defaultNodeWidth))
          .onChange(async (value) => {
            const parsed = Number.parseInt(value, 10);
            if (Number.isFinite(parsed) && parsed >= 240) {
              this.plugin.settings.defaultNodeWidth = parsed;
              await this.plugin.saveSettings();
            }
          })
      );

    new Setting(containerEl)
      .setName("Last PDF write error")
      .setDesc(this.plugin.settings.lastPdfWriteError ?? "No PDF write error recorded.");
  }
}

