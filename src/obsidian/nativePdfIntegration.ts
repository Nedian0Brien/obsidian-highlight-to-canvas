import { Notice, TFile } from "obsidian";
import { PDFDocument } from "pdf-lib";
import { buildCanvasTargetOptions, rememberCanvasTarget } from "../canvas/canvasTarget";
import { createHighlightFlow } from "../highlights/createHighlightFlow";
import type PdfHighlightCanvasPlugin from "../main";
import { appendCanvasNodeToVault } from "./canvasFileService";
import { saveRecord } from "./highlightIndexFileService";
import { toFriendlyErrorMessage } from "../ui/errorMessages";
import { HighlightPopover } from "../pdf/highlightPopover";
import { getPopoverPosition } from "../pdf/popoverPosition";
import { writeHighlightAnnotation } from "../pdf/pdfAnnotationWriter";
import type { CapturedHighlight, ViewportRect } from "../types";
import { convertNativeRectToPdfRect, getNativePdfSelectionDraft, type NativeSelectionDraft } from "./nativePdfSelection";

export function registerNativePdfSelectionPopover(plugin: PdfHighlightCanvasPlugin): void {
  let activePopover: HighlightPopover | null = null;

  const dismiss = () => {
    activePopover?.destroy();
    activePopover = null;
  };

  const handleSelectionComplete = (event: Event) => {
    const target = event.target;
    if (target instanceof Element && target.closest(".highlight-to-canvas-popover")) return;

    window.setTimeout(() => {
      const file = plugin.app.workspace.getActiveFile();
      if (!(file instanceof TFile) || file.extension !== "pdf") {
        dismiss();
        return;
      }

      const selection = window.getSelection();
      if (!selection) {
        dismiss();
        return;
      }

      const draft = getNativePdfSelectionDraft(selection, file.extension);
      if (!draft) {
        dismiss();
        return;
      }

      const rootRect = { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };
      const position = getPopoverPosition(
        {
          x: draft.selectionRect.left,
          y: draft.selectionRect.top,
          width: draft.selectionRect.width,
          height: draft.selectionRect.height
        },
        rootRect,
        { width: 320, height: 48 }
      );
      const targetOptions = buildCanvasTargetOptions(file.path, plugin.settings.recentCanvasTargets);
      const selectedTargetPath = targetOptions[0].path;

      dismiss();
      activePopover = new HighlightPopover({
        container: document.body,
        surface: "native",
        selectedText: draft.selectedText,
        categories: plugin.settings.categories,
        defaultCategoryId: plugin.settings.defaultCategoryId,
        position,
        targetOptions,
        selectedTargetPath,
        onCreate: async (category, tags, selectedCanvasPath, controls) => {
          try {
            const captured = await captureNativeHighlight(plugin, file, draft);
            await createHighlightFlow({
              pdfPath: file.path,
              pdfMtime: file.stat.mtime,
              captured,
              category,
              tags: tags.length ? tags : category.defaultTags,
              writePdfAnnotation: async () => {
                const pending = plugin.settings.pendingRecovery;
                if (
                  pending &&
                  pending.pdfPath === file.path &&
                  pending.selectedText === captured.selectedText &&
                  pending.targetCanvasPath === selectedCanvasPath
                ) {
                  controls.markCreating("writing-canvas");
                  return { annotationFingerprint: pending.annotationFingerprint };
                }

                controls.markCreating("writing-pdf");
                const original = await plugin.app.vault.readBinary(file);
                const result = await writeHighlightAnnotation(original, {
                  pageNumber: captured.pageNumber,
                  selectedText: captured.selectedText,
                  pdfRects: captured.pdfRects,
                  color: category.color
                });
                await plugin.app.vault.modifyBinary(file, result.bytes.buffer as ArrayBuffer);
                plugin.settings.pendingRecovery = {
                  pdfPath: file.path,
                  pdfMtime: file.stat.mtime,
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
                await plugin.saveSettings();
                return { annotationFingerprint: result.annotationFingerprint };
              },
              appendCanvasNode: async () => {
                controls.markCreating("writing-canvas");
                return appendCanvasNodeToVault({
                  vault: plugin.app.vault,
                  pdfFile: file,
                  selectedText: captured.selectedText,
                  pageNumber: captured.pageNumber,
                  category,
                  nodeWidth: plugin.settings.defaultNodeWidth,
                  pageZoneSpacing: plugin.settings.pageZoneSpacing,
                  nodeVerticalSpacing: plugin.settings.nodeVerticalSpacing,
                  targetCanvasPath: selectedCanvasPath
                });
              },
              saveIndexRecord: async (record) => {
                controls.markCreating("writing-index");
                await saveRecord(plugin.app.vault.adapter, record);
              }
            });
            plugin.settings.recentCanvasTargets = rememberCanvasTarget(plugin.settings.recentCanvasTargets, selectedCanvasPath);
            plugin.settings.pdfWritePolicyAccepted = true;
            plugin.settings.pendingRecovery = null;
            await plugin.saveSettings();
            controls.markSuccess(selectedCanvasPath);
            new Notice("Created Canvas node from PDF highlight.");
            window.getSelection()?.removeAllRanges();
          } catch (error) {
            const message = toFriendlyErrorMessage(error);
            plugin.settings.lastPdfWriteError = message;
            await plugin.saveSettings();
            controls.markError(message);
            new Notice(`Could not create highlight node: ${message}`);
          }
        },
        onCancel: () => {
          window.getSelection()?.removeAllRanges();
          dismiss();
        },
        onOpenCanvas: async (canvasPath) => {
          const canvasFile = plugin.app.vault.getAbstractFileByPath(canvasPath);
          if (canvasFile instanceof TFile) {
            await plugin.app.workspace.getLeaf(false).openFile(canvasFile);
          } else {
            new Notice("The target Canvas has not been created yet.");
          }
        }
      });
      activePopover.show();
    }, 0);
  };

  for (const eventName of ["mouseup", "touchend", "keyup"] as const) {
    plugin.registerDomEvent(document, eventName, handleSelectionComplete);
  }
  plugin.registerDomEvent(document, "selectionchange", () => {
    if (!window.getSelection()?.toString().trim()) dismiss();
  });
}

async function captureNativeHighlight(plugin: PdfHighlightCanvasPlugin, file: TFile, draft: NativeSelectionDraft): Promise<CapturedHighlight> {
  const original = await plugin.app.vault.readBinary(file);
  const pdfDoc = await PDFDocument.load(original);
  const page = pdfDoc.getPage(draft.pageNumber - 1);
  const pdfPageSize = page.getSize();
  const pageBounds = draft.pageEl.getBoundingClientRect();
  const pageViewportSize = { width: pageBounds.width, height: pageBounds.height };
  const viewportRects: ViewportRect[] = [];
  const pdfRects = [];

  for (const rect of draft.clientRects) {
    const viewportRect = {
      x: rect.left - pageBounds.left,
      y: rect.top - pageBounds.top,
      width: rect.width,
      height: rect.height,
      scale: pageViewportSize.width / pdfPageSize.width
    };
    viewportRects.push(viewportRect);
    pdfRects.push(convertNativeRectToPdfRect({ viewportRect, pageViewportSize, pdfPageSize }));
  }

  return {
    selectedText: draft.selectedText,
    pageNumber: draft.pageNumber,
    pdfRects,
    viewportRects
  };
}
