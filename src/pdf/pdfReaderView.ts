import { FileView, Notice, TFile, WorkspaceLeaf } from "obsidian";
import * as pdfjsLib from "pdfjs-dist";
import { createHighlightFlow } from "../highlights/createHighlightFlow";
import type PdfHighlightCanvasPlugin from "../main";
import { appendCanvasNodeToVault } from "../obsidian/canvasFileService";
import { saveRecord } from "../obsidian/highlightIndexFileService";
import { buildCapturedHighlight, normalizeSelectionRects } from "./highlightCapture";
import { HighlightPopover } from "./highlightPopover";
import { writeHighlightAnnotation } from "./pdfAnnotationWriter";

export const PDF_READER_VIEW_TYPE = "pdf-highlight-canvas-reader";

interface RenderedPage {
  pageNumber: number;
  viewport: {
    transform: number[];
    scale: number;
    width: number;
    height: number;
    convertToPdfPoint: (x: number, y: number) => [number, number];
  };
  container: HTMLElement;
}

export class PdfReaderView extends FileView {
  private currentFile: TFile | null = null;
  private readonly pages = new Map<number, RenderedPage>();
  private pageContainer: HTMLDivElement | null = null;
  private selectionListener: (() => void) | null = null;

  constructor(leaf: WorkspaceLeaf, private readonly plugin: PdfHighlightCanvasPlugin) {
    super(leaf);
  }

  getViewType(): string {
    return PDF_READER_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.currentFile?.basename ?? "PDF Highlight Reader";
  }

  canAcceptExtension(extension: string): boolean {
    return extension === "pdf";
  }

  async setFile(file: TFile): Promise<void> {
    this.currentFile = file;
    await this.renderPdf();
  }

  async onLoadFile(file: TFile): Promise<void> {
    await this.setFile(file);
  }

  async onUnloadFile(): Promise<void> {
    this.currentFile = null;
    this.pages.clear();
    this.pageContainer?.empty();
  }

  async onOpen(): Promise<void> {
    this.containerEl.empty();
    this.containerEl.addClass("pdf-highlight-canvas-reader");
    this.pageContainer = this.containerEl.createDiv({ cls: "pdf-highlight-canvas-pages" });
  }

  async onClose(): Promise<void> {
    if (this.selectionListener && this.pageContainer) {
      this.pageContainer.removeEventListener("mouseup", this.selectionListener);
    }
    this.pages.clear();
  }

  async emphasizeSource(pageNumber: number, rects: { x: number; y: number; width: number; height: number }[]): Promise<void> {
    const page = this.pages.get(pageNumber);
    if (!page) return;
    page.container.scrollIntoView({ block: "center" });

    for (const rect of rects) {
      const overlay = page.container.createDiv({ cls: "pdf-highlight-canvas-emphasis" });
      overlay.style.left = `${rect.x}px`;
      overlay.style.top = `${rect.y}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
      window.setTimeout(() => overlay.remove(), this.plugin.settings.sourceEmphasisDurationMs);
    }
  }

  private async renderPdf(): Promise<void> {
    if (!this.currentFile || !this.pageContainer) return;
    this.pageContainer.empty();
    this.pages.clear();

    const bytes = await this.app.vault.readBinary(this.currentFile);
    const documentTask = pdfjsLib.getDocument({ data: bytes });
    const pdf = await documentTask.promise;

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.4 });
      const pageEl = this.pageContainer.createDiv({ cls: "pdf-highlight-canvas-page" });
      pageEl.dataset.pageNumber = String(pageNumber);
      pageEl.style.width = `${viewport.width}px`;
      pageEl.style.height = `${viewport.height}px`;

      const canvas = pageEl.createEl("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not create PDF canvas context");
      await page.render({ canvasContext: context, viewport }).promise;

      const textLayer = pageEl.createDiv({ cls: "pdf-highlight-canvas-text-layer" });
      const textContent = await page.getTextContent();
      let hasText = false;
      for (const item of textContent.items) {
        const textItem = item as { str?: string; transform?: number[]; width?: number };
        if (!textItem.str?.trim() || !Array.isArray(textItem.transform)) continue;
        hasText = true;
        const transform = pdfjsLib.Util.transform(viewport.transform, textItem.transform);
        const fontHeight = Math.abs(transform[3]);
        const span = textLayer.createSpan();
        span.textContent = textItem.str;
        span.dataset.pageNumber = String(pageNumber);
        span.style.left = `${transform[4]}px`;
        span.style.top = `${transform[5] - fontHeight}px`;
        span.style.fontSize = `${fontHeight}px`;
        span.style.height = `${fontHeight}px`;
        span.style.transformOrigin = "0 0";
        span.style.whiteSpace = "pre";
      }

      if (!hasText) {
        textLayer.createDiv({
          cls: "pdf-highlight-canvas-no-text",
          text: "This PDF does not expose selectable text."
        });
      }

      this.pages.set(pageNumber, {
        pageNumber,
        viewport: {
          transform: viewport.transform,
          scale: viewport.scale,
          width: viewport.width,
          height: viewport.height,
          convertToPdfPoint: (x, y) => {
            const [pdfX, pdfY] = viewport.convertToPdfPoint(x, y);
            return [Number(pdfX), Number(pdfY)];
          }
        },
        container: pageEl
      });
    }

    if (this.selectionListener) {
      this.pageContainer.removeEventListener("mouseup", this.selectionListener);
    }
    this.selectionListener = () => this.handleSelection();
    this.pageContainer.addEventListener("mouseup", this.selectionListener);
  }

  private handleSelection(): void {
    const selection = window.getSelection();
    const selectedText = selection?.toString() ?? "";
    if (!selection || !selectedText.trim() || selection.rangeCount === 0 || !this.pageContainer || !this.currentFile) return;

    const range = selection.getRangeAt(0);
    const startElement = range.startContainer instanceof Element ? range.startContainer : range.startContainer.parentElement;
    const endElement = range.endContainer instanceof Element ? range.endContainer : range.endContainer.parentElement;
    const pageEl = startElement?.closest<HTMLElement>(".pdf-highlight-canvas-page");
    const endPageEl = endElement?.closest<HTMLElement>(".pdf-highlight-canvas-page");
    const pageNumber = Number(pageEl?.dataset.pageNumber);
    const page = this.pages.get(pageNumber);
    if (!page || !pageEl || pageEl !== endPageEl) {
      new Notice("Select text from a single rendered PDF page.");
      return;
    }

    const pageBounds = pageEl.getBoundingClientRect();
    const rects = normalizeSelectionRects({
      pageNumber,
      pageBounds: { left: pageBounds.left, top: pageBounds.top },
      scale: page.viewport.scale,
      clientRects: Array.from(range.getClientRects()),
      convertToPdfPoint: page.viewport.convertToPdfPoint
    });
    const captured = buildCapturedHighlight(selectedText, rects);

    new HighlightPopover({
      container: this.containerEl,
      selectedText: captured.selectedText,
      categories: this.plugin.settings.categories,
      defaultCategoryId: this.plugin.settings.defaultCategoryId,
      onCreate: async (category, tags) => {
        if (!this.currentFile) return;
        try {
          await createHighlightFlow({
            pdfPath: this.currentFile.path,
            pdfMtime: this.currentFile.stat.mtime,
            captured,
            category,
            tags: tags.length ? tags : category.defaultTags,
            writePdfAnnotation: async () => {
              const original = await this.app.vault.readBinary(this.currentFile!);
              const result = await writeHighlightAnnotation(original, {
                pageNumber: captured.pageNumber,
                selectedText: captured.selectedText,
                pdfRects: captured.pdfRects,
                color: category.color
              });
              await this.app.vault.modifyBinary(this.currentFile!, result.bytes.buffer as ArrayBuffer);
              return { annotationFingerprint: result.annotationFingerprint };
            },
            appendCanvasNode: async () =>
              appendCanvasNodeToVault({
                vault: this.app.vault,
                pdfFile: this.currentFile!,
                selectedText: captured.selectedText,
                pageNumber: captured.pageNumber,
                category,
                nodeWidth: this.plugin.settings.defaultNodeWidth,
                pageZoneSpacing: this.plugin.settings.pageZoneSpacing,
                nodeVerticalSpacing: this.plugin.settings.nodeVerticalSpacing
              }),
            saveIndexRecord: async (record) => saveRecord(this.app.vault.adapter, record)
          });
          new Notice("Created Canvas node from PDF highlight.");
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.plugin.settings.lastPdfWriteError = message;
          await this.plugin.saveSettings();
          new Notice(`Could not create highlight node: ${message}`);
        } finally {
          window.getSelection()?.removeAllRanges();
        }
      },
      onCancel: () => selection.removeAllRanges()
    }).show();
  }
}
