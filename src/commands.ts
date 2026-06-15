import { Notice, TFile } from "obsidian";
import { exportHighlightIndex } from "./index/highlightIndex";
import type PdfHighlightCanvasPlugin from "./main";
import { INDEX_PATH, readIndex } from "./obsidian/highlightIndexFileService";
import { exportIndex, importIndex, repairHighlightIndex } from "./obsidian/indexMaintenance";

export function registerPluginCommands(plugin: PdfHighlightCanvasPlugin): void {
  plugin.addCommand({
    id: "open-highlight-to-canvas-reader",
    name: "Open current PDF in Highlight to Canvas",
    checkCallback: (checking) => {
      const file = plugin.app.workspace.getActiveFile();
      const canRun = file instanceof TFile && file.extension === "pdf";
      if (checking) return canRun;
      if (!file || file.extension !== "pdf") {
        new Notice("Open a Vault PDF before running this command.");
        return false;
      }
      void plugin.openPdfReader(file);
      return true;
    }
  });

  plugin.addCommand({
    id: "reveal-target-canvas",
    name: "Reveal target Canvas for current PDF",
    callback: () => {
      new Notice("Target Canvas reveal is available after the first highlight node is created.");
    }
  });

  plugin.addCommand({
    id: "repair-highlight-index",
    name: "Repair highlight index for current PDF",
    callback: async () => {
      const index = await readIndex(plugin.app.vault.adapter);
      const result = await repairHighlightIndex(index, (path) => plugin.app.vault.adapter.exists(path));
      await plugin.app.vault.adapter.write(INDEX_PATH, exportHighlightIndex(result.repaired));
      new Notice(`Highlight index repair completed. Removed ${result.removed.length} stale records.`);
    }
  });

  plugin.addCommand({
    id: "export-highlight-index",
    name: "Export highlight index",
    callback: async () => {
      const index = await readIndex(plugin.app.vault.adapter);
      const path = await exportIndex(plugin.app.vault.adapter, index);
      new Notice(`Highlight index exported to ${path}`);
    }
  });

  plugin.addCommand({
    id: "import-highlight-index",
    name: "Import highlight index",
    callback: async () => {
      const imported = await importIndex(plugin.app.vault.adapter);
      await plugin.app.vault.adapter.write(INDEX_PATH, exportHighlightIndex(imported));
      new Notice(`Highlight index imported with ${imported.records.length} records.`);
    }
  });
}
