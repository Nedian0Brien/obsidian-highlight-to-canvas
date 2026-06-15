import { describe, expect, it, vi } from "vitest";
import { TFile } from "obsidian";
import { HIGHLIGHT_TO_CANVAS_SELECTION_EVENTS } from "../src/pdf/selectionEvents";
import { addPdfFileMenuEntry } from "../src/obsidian/pdfEntryPoints";

class FakeMenuItem {
  title = "";
  icon = "";
  onClickHandler: (() => void) | null = null;

  setTitle(title: string): this {
    this.title = title;
    return this;
  }

  setIcon(icon: string): this {
    this.icon = icon;
    return this;
  }

  onClick(handler: () => void): this {
    this.onClickHandler = handler;
    return this;
  }
}

class FakeMenu {
  item: FakeMenuItem | null = null;

  addItem(callback: (item: FakeMenuItem) => unknown): this {
    this.item = new FakeMenuItem();
    callback(this.item);
    return this;
  }
}

describe("PDF entry points", () => {
  it("adds a file-menu action that opens a PDF in Highlight to Canvas", () => {
    const menu = new FakeMenu();
    const file = makeFile("Sources/paper.pdf", "pdf");
    const openPdfReader = vi.fn();

    addPdfFileMenuEntry(menu, file, openPdfReader);

    expect(menu.item?.title).toBe("Open in Highlight to Canvas");
    expect(menu.item?.icon).toBe("highlighter");

    menu.item?.onClickHandler?.();
    expect(openPdfReader).toHaveBeenCalledWith(file);
  });

  it("does not add the file-menu action for non-PDF files", () => {
    const menu = new FakeMenu();
    const file = makeFile("Notes/example.md", "md");

    addPdfFileMenuEntry(menu, file, vi.fn());

    expect(menu.item).toBeNull();
  });

  it("listens for mouse, touch, and keyboard selection completion", () => {
    expect(HIGHLIGHT_TO_CANVAS_SELECTION_EVENTS).toEqual(["mouseup", "touchend", "keyup"]);
  });

  it("keeps the reader popover as a single reusable instance", () => {
    const source = require("node:fs").readFileSync("src/pdf/pdfReaderView.ts", "utf8");

    expect(source).toContain("activePopover");
    expect(source).toContain("this.activePopover?.destroy()");
  });
});

function makeFile(path: string, extension: string): TFile {
  return Object.assign(Object.create(TFile.prototype), {
    path,
    extension,
    basename: path.split("/").pop()?.replace(/\.[^.]+$/, "") ?? path,
    stat: { mtime: 0 }
  }) as TFile;
}
