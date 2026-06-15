import { FileView, Notice, TFile, WorkspaceLeaf } from "obsidian";
import * as pdfjsLib from "pdfjs-dist";
import { buildCanvasTargetOptions, rememberCanvasTarget } from "../canvas/canvasTarget";
import { createHighlightFlow } from "../highlights/createHighlightFlow";
import type PdfHighlightCanvasPlugin from "../main";
import { appendCanvasNodeToVault } from "../obsidian/canvasFileService";
import { saveRecord } from "../obsidian/highlightIndexFileService";
import type { SaveStatus } from "../types";
import { toFriendlyErrorMessage } from "../ui/errorMessages";
import { buildCapturedHighlight, normalizeSelectionRects } from "./highlightCapture";
import { HighlightPopover } from "./highlightPopover";
import { getPopoverPosition } from "./popoverPosition";
import { writeHighlightAnnotation } from "./pdfAnnotationWriter";
import { ReaderToolbar } from "./readerToolbar";

export const PDF_READER_VIEW_TYPE = "highlight-to-canvas-reader";

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
  private toolbar: ReaderToolbar | null = null;
  private pageContainer: HTMLDivElement | null = null;
  private statePanel: HTMLDivElement | null = null;
  private selectionListener: (() => void) | null = null;
  private scrollListener: (() => void) | null = null;
  private totalPages = 0;
  private activePage = 1;
  private zoomScale = 1.4;
  private saveStatus: SaveStatus = "idle";

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
    this.containerEl.addClass("highlight-to-canvas-reader");
    this.toolbar = new ReaderToolbar(this.toolbarInput());
    this.containerEl.appendChild(this.toolbar.element);
    this.statePanel = this.containerEl.createDiv({ cls: "highlight-to-canvas-state-panel" });
    this.pageContainer = this.containerEl.createDiv({ cls: "highlight-to-canvas-pages" });
  }

  async onClose(): Promise<void> {
    if (this.selectionListener && this.pageContainer) {
      this.pageContainer.removeEventListener("mouseup", this.selectionListener);
    }
    if (this.scrollListener && this.pageContainer) {
      this.pageContainer.removeEventListener("scroll", this.scrollListener);
    }
    this.pages.clear();
  }

  async emphasizeSource(pageNumber: number, rects: { x: number; y: number; width: number; height: number }[]): Promise<void> {
    const page = this.pages.get(pageNumber);
    if (!page) return;
    page.container.scrollIntoView({ block: "center" });

    for (const rect of rects) {
      const overlay = page.container.createDiv({ cls: "highlight-to-canvas-emphasis" });
      overlay.style.left = `${rect.x}px`;
      overlay.style.top = `${rect.y}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
      window.setTimeout(() => overlay.remove(), this.plugin.settings.sourceEmphasisDurationMs);
    }
  }

  private async renderPdf(): Promise<void> {
    if (!this.currentFile || !this.pageContainer) return;
    this.setSaveStatus("loading");
    this.showState("Loading PDF...", "Preparing pages and selectable text.");
    this.pageContainer.empty();
    this.pageContainer.hidden = true;
    this.pages.clear();
    this.totalPages = 0;
    this.activePage = 1;

    try {
      const bytes = await this.app.vault.readBinary(this.currentFile);
      const documentTask = pdfjsLib.getDocument({ data: bytes });
      const pdf = await documentTask.promise;
      this.totalPages = pdf.numPages;
      let textLayerPages = 0;

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: this.zoomScale });
        const pageEl = this.pageContainer.createDiv({ cls: "highlight-to-canvas-page" });
        pageEl.dataset.pageNumber = String(pageNumber);
        pageEl.style.width = `${viewport.width}px`;
        pageEl.style.height = `${viewport.height}px`;

        pageEl.createDiv({
          cls: "highlight-to-canvas-page-marker",
          text: `Page ${pageNumber}`
        });

        const canvas = pageEl.createEl("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Could not create PDF canvas context");
        await page.render({ canvasContext: context, viewport }).promise;

        const textLayer = pageEl.createDiv({ cls: "highlight-to-canvas-text-layer" });
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

        if (hasText) textLayerPages += 1;
        if (!hasText) {
          textLayer.createDiv({
            cls: "highlight-to-canvas-no-text",
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

      if (textLayerPages === 0) {
        this.showState("Selectable text not found", "Scanned or OCR-less PDFs are not supported yet.");
        this.setSaveStatus("error");
      } else {
        this.hideState();
        this.pageContainer.hidden = false;
        this.setSaveStatus("idle");
      }
    } catch (error) {
      this.showState("Could not render PDF", toFriendlyErrorMessage(error));
      this.setSaveStatus("error");
      return;
    }

    if (this.selectionListener) {
      this.pageContainer.removeEventListener("mouseup", this.selectionListener);
    }
    this.selectionListener = () => this.handleSelection();
    this.pageContainer.addEventListener("mouseup", this.selectionListener);
    if (this.scrollListener) {
      this.pageContainer.removeEventListener("scroll", this.scrollListener);
    }
    this.scrollListener = () => this.updateActivePageFromScroll();
    this.pageContainer.addEventListener("scroll", this.scrollListener);
    this.updateToolbar();
  }

  private handleSelection(): void {
    const selection = window.getSelection();
    const selectedText = selection?.toString() ?? "";
    if (!selection || !selectedText.trim() || selection.rangeCount === 0 || !this.pageContainer || !this.currentFile) return;

    const range = selection.getRangeAt(0);
    const startElement = range.startContainer instanceof Element ? range.startContainer : range.startContainer.parentElement;
    const endElement = range.endContainer instanceof Element ? range.endContainer : range.endContainer.parentElement;
    const pageEl = startElement?.closest<HTMLElement>(".highlight-to-canvas-page");
    const endPageEl = endElement?.closest<HTMLElement>(".highlight-to-canvas-page");
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

    const selectionRect = range.getBoundingClientRect();
    const rootRect = this.containerEl.getBoundingClientRect();
    const targetOptions = buildCanvasTargetOptions(this.currentFile.path, this.plugin.settings.recentCanvasTargets);
    const targetCanvasPath = targetOptions[0].path;
    const position = getPopoverPosition(
      {
        x: selectionRect.left - rootRect.left,
        y: selectionRect.top - rootRect.top,
        width: selectionRect.width,
        height: selectionRect.height
      },
      { x: 0, y: 0, width: rootRect.width, height: rootRect.height },
      { width: 360, height: 360 }
    );

    new HighlightPopover({
      container: this.containerEl,
      selectedText: captured.selectedText,
      categories: this.plugin.settings.categories,
      defaultCategoryId: this.plugin.settings.defaultCategoryId,
      position,
      targetOptions,
      selectedTargetPath: targetCanvasPath,
      onCreate: async (category, tags, selectedCanvasPath, controls) => {
        if (!this.currentFile) return;
        try {
          await createHighlightFlow({
            pdfPath: this.currentFile.path,
            pdfMtime: this.currentFile.stat.mtime,
            captured,
            category,
            tags: tags.length ? tags : category.defaultTags,
            writePdfAnnotation: async () => {
              const pending = this.plugin.settings.pendingRecovery;
              if (
                pending &&
                pending.pdfPath === this.currentFile!.path &&
                pending.selectedText === captured.selectedText &&
                pending.targetCanvasPath === selectedCanvasPath
              ) {
                controls.markCreating("writing-canvas");
                this.setSaveStatus("writing-canvas");
                return { annotationFingerprint: pending.annotationFingerprint };
              }

              controls.markCreating("writing-pdf");
              this.setSaveStatus("writing-pdf");
              const original = await this.app.vault.readBinary(this.currentFile!);
              const result = await writeHighlightAnnotation(original, {
                pageNumber: captured.pageNumber,
                selectedText: captured.selectedText,
                pdfRects: captured.pdfRects,
                color: category.color
              });
              await this.app.vault.modifyBinary(this.currentFile!, result.bytes.buffer as ArrayBuffer);
              this.plugin.settings.pendingRecovery = {
                pdfPath: this.currentFile!.path,
                pdfMtime: this.currentFile!.stat.mtime,
                pageNumber: captured.pageNumber,
                selectedText: captured.selectedText,
                pdfRects: captured.pdfRects,
                viewportRects: captured.viewportRects,
                annotationFingerprint: result.annotationFingerprint,
                targetCanvasPath: selectedCanvasPath,
                categoryId: category.id,
                tags: tags.length ? tags : category.defaultTags,
                createdAt: new Date().toISOString()
              };
              await this.plugin.saveSettings();
              return { annotationFingerprint: result.annotationFingerprint };
            },
            appendCanvasNode: async () => {
              controls.markCreating("writing-canvas");
              this.setSaveStatus("writing-canvas");
              return appendCanvasNodeToVault({
                vault: this.app.vault,
                pdfFile: this.currentFile!,
                selectedText: captured.selectedText,
                pageNumber: captured.pageNumber,
                category,
                nodeWidth: this.plugin.settings.defaultNodeWidth,
                pageZoneSpacing: this.plugin.settings.pageZoneSpacing,
                nodeVerticalSpacing: this.plugin.settings.nodeVerticalSpacing,
                targetCanvasPath: selectedCanvasPath
              });
            },
            saveIndexRecord: async (record) => {
              controls.markCreating("writing-index");
              this.setSaveStatus("writing-index");
              await saveRecord(this.app.vault.adapter, record);
            }
          });
          this.plugin.settings.recentCanvasTargets = rememberCanvasTarget(this.plugin.settings.recentCanvasTargets, selectedCanvasPath);
          this.plugin.settings.pdfWritePolicyAccepted = true;
          this.plugin.settings.pendingRecovery = null;
          await this.plugin.saveSettings();
          controls.markSuccess(selectedCanvasPath);
          this.setSaveStatus("success");
          new Notice("Created Canvas node from PDF highlight.");
        } catch (error) {
          const message = toFriendlyErrorMessage(error);
          this.plugin.settings.lastPdfWriteError = message;
          await this.plugin.saveSettings();
          controls.markError(message);
          this.setSaveStatus("error");
          new Notice(`Could not create highlight node: ${message}`);
        } finally {
          window.getSelection()?.removeAllRanges();
        }
      },
      onCancel: () => selection.removeAllRanges(),
      onOpenCanvas: async (canvasPath) => {
        const file = this.app.vault.getAbstractFileByPath(canvasPath);
        if (file instanceof TFile) {
          await this.app.workspace.getLeaf(false).openFile(file);
        } else {
          new Notice("The target Canvas has not been created yet.");
        }
      }
    }).show();
  }

  private toolbarInput() {
    return {
      fileName: this.currentFile?.basename ?? "PDF Highlight Reader",
      pageLabel: this.totalPages ? `Page ${this.activePage} / ${this.totalPages}` : "Page -",
      zoomLabel: `${Math.round(this.zoomScale * 100)}%`,
      targetCanvasPath: this.currentFile ? buildCanvasTargetOptions(this.currentFile.path, this.plugin.settings.recentCanvasTargets)[0].path : "",
      saveStatus: this.saveStatus,
      onFitWidth: () => this.setZoom(1.4),
      onZoomOut: () => this.setZoom(Math.max(0.8, this.zoomScale - 0.2)),
      onZoomIn: () => this.setZoom(Math.min(2.6, this.zoomScale + 0.2)),
      onResetZoom: () => this.setZoom(1)
    };
  }

  private setZoom(scale: number): void {
    this.zoomScale = Number(scale.toFixed(2));
    this.updateToolbar();
    void this.renderPdf();
  }

  private setSaveStatus(status: SaveStatus): void {
    this.saveStatus = status;
    this.updateToolbar();
  }

  private updateToolbar(): void {
    this.toolbar?.update(this.toolbarInput());
  }

  private showState(title: string, detail: string): void {
    if (!this.statePanel) return;
    this.statePanel.hidden = false;
    this.statePanel.empty();
    this.statePanel.createDiv({ cls: "highlight-to-canvas-state-title", text: title });
    this.statePanel.createDiv({ cls: "highlight-to-canvas-state-detail", text: detail });
  }

  private hideState(): void {
    if (!this.statePanel) return;
    this.statePanel.hidden = true;
    this.statePanel.empty();
  }

  private updateActivePageFromScroll(): void {
    if (!this.pageContainer) return;
    const containerTop = this.pageContainer.getBoundingClientRect().top;
    let nearestPage = this.activePage;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const page of this.pages.values()) {
      const distance = Math.abs(page.container.getBoundingClientRect().top - containerTop);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPage = page.pageNumber;
      }
    }
    if (nearestPage !== this.activePage) {
      this.activePage = nearestPage;
      this.updateToolbar();
    }
  }
}
