import { Plugin, TFile } from "obsidian";
import { registerPluginCommands } from "./commands";
import { addPdfFileMenuEntry } from "./obsidian/pdfEntryPoints";
import { PdfReaderView, PDF_READER_VIEW_TYPE } from "./pdf/pdfReaderView";
import { DEFAULT_SETTINGS, normalizeSettings, PdfHighlightCanvasSettingTab } from "./settings";
import type { PdfHighlightCanvasSettings } from "./types";

export default class PdfHighlightCanvasPlugin extends Plugin {
  settings: PdfHighlightCanvasSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.registerView(PDF_READER_VIEW_TYPE, (leaf) => new PdfReaderView(leaf, this));
    if (this.settings.useReaderForVaultPdfs) {
      this.registerExtensions(["pdf"], PDF_READER_VIEW_TYPE);
    }
    this.addSettingTab(new PdfHighlightCanvasSettingTab(this.app, this));
    registerPluginCommands(this);
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        addPdfFileMenuEntry(menu, file, (pdfFile) => {
          void this.openPdfReader(pdfFile);
        });
      })
    );
  }

  async loadSettings(): Promise<void> {
    this.settings = normalizeSettings(await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  async openPdfReader(file: TFile): Promise<void> {
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.setViewState({ type: PDF_READER_VIEW_TYPE, active: true });
    const view = leaf.view;
    if (view instanceof PdfReaderView) {
      await view.setFile(file);
    }
  }
}
