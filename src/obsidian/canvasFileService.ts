import { TFile, Vault } from "obsidian";
import { appendHighlightNode, createEmptyCanvas, getDefaultCanvasPath, parseCanvasJson, serializeCanvas } from "../canvas/canvasNodeWriter";
import type { CategoryPreset } from "../types";

export interface AppendCanvasNodeServiceInput {
  vault: Vault;
  pdfFile: TFile;
  selectedText: string;
  pageNumber: number;
  category: CategoryPreset;
  nodeWidth: number;
  pageZoneSpacing: number;
  nodeVerticalSpacing: number;
  targetCanvasPath?: string;
}

export async function appendCanvasNodeToVault(input: AppendCanvasNodeServiceInput): Promise<{ canvasPath: string; canvasNodeId: string }> {
  const canvasPath = input.targetCanvasPath ?? getDefaultCanvasPath(input.pdfFile.path);
  const existing = input.vault.getAbstractFileByPath(canvasPath);
  const canvas = existing instanceof TFile
    ? parseCanvasJson(await input.vault.read(existing))
    : createEmptyCanvas();

  const result = appendHighlightNode(canvas, {
    pdfPath: input.pdfFile.path,
    pageNumber: input.pageNumber,
    selectedText: input.selectedText,
    category: input.category,
    nodeWidth: input.nodeWidth,
    pageZoneSpacing: input.pageZoneSpacing,
    nodeVerticalSpacing: input.nodeVerticalSpacing
  });

  if (existing instanceof TFile) {
    await input.vault.modify(existing, serializeCanvas(result.canvas));
  } else {
    await input.vault.create(canvasPath, serializeCanvas(result.canvas));
  }

  return { canvasPath, canvasNodeId: result.node.id };
}

