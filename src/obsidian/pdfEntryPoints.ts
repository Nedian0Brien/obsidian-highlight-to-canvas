import { TAbstractFile, TFile } from "obsidian";

interface MenuItemLike {
  setTitle(title: string): this;
  setIcon(icon: string): this;
  onClick(callback: () => void): this;
}

interface MenuLike {
  addItem(callback: (item: MenuItemLike) => unknown): unknown;
}

export function addPdfFileMenuEntry(
  menu: MenuLike,
  file: TAbstractFile,
  openPdfReader: (file: TFile) => void
): void {
  if (!(file instanceof TFile) || file.extension !== "pdf") return;

  menu.addItem((item) => {
    item
      .setTitle("Open in Highlight to Canvas")
      .setIcon("highlighter")
      .onClick(() => openPdfReader(file));
  });
}
