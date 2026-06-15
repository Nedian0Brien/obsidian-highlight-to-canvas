import { Notice, TFile } from "obsidian";
import type PdfHighlightCanvasPlugin from "../main";

export async function openCanvasToRight(plugin: PdfHighlightCanvasPlugin, canvasPath: string): Promise<void> {
  const file = plugin.app.vault.getAbstractFileByPath(canvasPath);
  if (!(file instanceof TFile)) {
    new Notice("The target Canvas has not been created yet.");
    return;
  }

  const leaf = plugin.app.workspace.getLeaf("split", "vertical");
  await leaf.openFile(file);
}
