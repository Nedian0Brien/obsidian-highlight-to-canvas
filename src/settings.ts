import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import { exportHighlightIndex } from "./index/highlightIndex";
import type PdfHighlightCanvasPlugin from "./main";
import { INDEX_PATH, readIndex } from "./obsidian/highlightIndexFileService";
import { exportIndex, importIndex, repairHighlightIndex } from "./obsidian/indexMaintenance";
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
  recentCanvasTargets: [],
  pdfWritePolicyAccepted: false,
  pendingRecovery: null,
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
    recentCanvasTargets: Array.isArray(raw?.recentCanvasTargets) ? raw.recentCanvasTargets.slice(0, 5) : [],
    pendingRecovery: raw?.pendingRecovery ?? null,
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

    containerEl.createEl("h3", { text: "Reader" });
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

    containerEl.createEl("h3", { text: "Canvas" });
    new Setting(containerEl)
      .setName("Default target strategy")
      .setDesc("New highlights go to a PDF-specific Canvas by default. Recent Canvas targets can be chosen from the popover.");

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
      .setName("Page zone spacing")
      .setDesc("Horizontal Canvas spacing between generated page zones.")
      .addText((text) =>
        text
          .setValue(String(this.plugin.settings.pageZoneSpacing))
          .onChange(async (value) => {
            const parsed = Number.parseInt(value, 10);
            if (Number.isFinite(parsed) && parsed >= 480) {
              this.plugin.settings.pageZoneSpacing = parsed;
              await this.plugin.saveSettings();
            }
          })
      );

    new Setting(containerEl)
      .setName("Node vertical spacing")
      .setDesc("Vertical spacing between generated nodes in the same page zone.")
      .addText((text) =>
        text
          .setValue(String(this.plugin.settings.nodeVerticalSpacing))
          .onChange(async (value) => {
            const parsed = Number.parseInt(value, 10);
            if (Number.isFinite(parsed) && parsed >= 120) {
              this.plugin.settings.nodeVerticalSpacing = parsed;
              await this.plugin.saveSettings();
            }
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

    containerEl.createEl("h3", { text: "Categories" });
    new Setting(containerEl)
      .setName("Default category")
      .setDesc("Category selected first in the highlight popover.")
      .addDropdown((dropdown) => {
        for (const category of this.plugin.settings.categories) {
          dropdown.addOption(category.id, category.label);
        }
        dropdown
          .setValue(this.plugin.settings.defaultCategoryId)
          .onChange(async (value) => {
            this.plugin.settings.defaultCategoryId = value;
            await this.plugin.saveSettings();
          });
      });

    this.plugin.settings.categories.forEach((category, index) => {
      new Setting(containerEl)
        .setName(`Category: ${category.label}`)
        .setDesc("Edit label, color, and default tags.")
        .addText((text) =>
          text
            .setPlaceholder("Label")
            .setValue(category.label)
            .onChange(async (value) => {
              this.plugin.settings.categories[index].label = value.trim() || category.label;
              await this.plugin.saveSettings();
            })
        )
        .addColorPicker((picker) =>
          picker
            .setValue(category.color)
            .onChange(async (value) => {
              this.plugin.settings.categories[index].color = value;
              await this.plugin.saveSettings();
            })
        )
        .addText((text) =>
          text
            .setPlaceholder("tag, tag")
            .setValue(category.defaultTags.join(", "))
            .onChange(async (value) => {
              this.plugin.settings.categories[index].defaultTags = value.split(",").map((tag) => tag.trim()).filter(Boolean);
              await this.plugin.saveSettings();
            })
        );
    });

    containerEl.createEl("h3", { text: "PDF Writing" });
    new Setting(containerEl)
      .setName("Original PDF write policy")
      .setDesc("This plugin writes real highlight annotations directly to the original PDF before creating a Canvas node.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.pdfWritePolicyAccepted)
          .onChange(async (value) => {
            this.plugin.settings.pdfWritePolicyAccepted = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Pending recovery")
      .setDesc(this.plugin.settings.pendingRecovery
        ? `Pending Canvas/index retry for ${this.plugin.settings.pendingRecovery.pdfPath}`
        : "No partial PDF highlight write is waiting for recovery.")
      .addButton((button) =>
        button
          .setButtonText("Clear")
          .onClick(async () => {
            this.plugin.settings.pendingRecovery = null;
            await this.plugin.saveSettings();
            this.display();
          })
      );

    new Setting(containerEl)
      .setName("Last PDF write error")
      .setDesc(this.plugin.settings.lastPdfWriteError ?? "No PDF write error recorded.")
      .addButton((button) =>
        button
          .setButtonText("Reset")
          .onClick(async () => {
            this.plugin.settings.lastPdfWriteError = null;
            await this.plugin.saveSettings();
            this.display();
          })
      );

    containerEl.createEl("h3", { text: "Index Management" });
    new Setting(containerEl)
      .setName("Repair index")
      .setDesc("Remove highlight records whose PDF or Canvas files no longer exist.")
      .addButton((button) =>
        button
          .setButtonText("Repair")
          .onClick(async () => {
            const index = await readIndex(this.plugin.app.vault.adapter);
            const result = await repairHighlightIndex(index, (path) => this.plugin.app.vault.adapter.exists(path));
            await this.plugin.app.vault.adapter.write(INDEX_PATH, exportHighlightIndex(result.repaired));
            new Notice(`Highlight index repair completed. Removed ${result.removed.length} stale records.`);
          })
      );

    new Setting(containerEl)
      .setName("Export index")
      .setDesc("Write a copy of the highlight index into the plugin folder.")
      .addButton((button) =>
        button
          .setButtonText("Export")
          .onClick(async () => {
            const path = await exportIndex(this.plugin.app.vault.adapter, await readIndex(this.plugin.app.vault.adapter));
            new Notice(`Highlight index exported to ${path}`);
          })
      );

    new Setting(containerEl)
      .setName("Import index")
      .setDesc("Import highlights from highlights-import.json in the plugin folder.")
      .addButton((button) =>
        button
          .setButtonText("Import")
          .onClick(async () => {
            const imported = await importIndex(this.plugin.app.vault.adapter);
            await this.plugin.app.vault.adapter.write(INDEX_PATH, exportHighlightIndex(imported));
            new Notice(`Highlight index imported with ${imported.records.length} records.`);
          })
      );
  }
}
