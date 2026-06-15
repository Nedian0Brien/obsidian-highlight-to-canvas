import type { CanvasDocument, CanvasTextNode } from "./canvasTypes";
import type { CategoryPreset } from "../types";
import { basename, dirname, joinVaultPath, stripExtension } from "../utils/path";
import { createId } from "../utils/id";

export interface AppendHighlightNodeInput {
  pdfPath: string;
  pageNumber: number;
  selectedText: string;
  category: CategoryPreset;
  nodeWidth: number;
  pageZoneSpacing: number;
  nodeVerticalSpacing: number;
}

export interface AppendHighlightNodeResult {
  canvas: CanvasDocument;
  node: CanvasTextNode;
}

export interface FormatCanvasNodeTextInput {
  categoryLabel: string;
  selectedText: string;
  pdfName: string;
  pageNumber: number;
  maxLength?: number;
}

const DEFAULT_NODE_HEIGHT = 180;

export function createEmptyCanvas(): CanvasDocument {
  return { nodes: [], edges: [] };
}

export function parseCanvasJson(raw: string): CanvasDocument {
  const parsed = JSON.parse(raw) as Partial<CanvasDocument>;
  return {
    nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
    edges: Array.isArray(parsed.edges) ? parsed.edges : []
  };
}

export function serializeCanvas(canvas: CanvasDocument): string {
  return `${JSON.stringify(canvas, null, 2)}\n`;
}

export function getDefaultCanvasPath(pdfPath: string): string {
  const directory = dirname(pdfPath);
  const pdfBase = stripExtension(basename(pdfPath));
  return joinVaultPath(directory, `${pdfBase}.canvas`);
}

export function appendHighlightNode(canvas: CanvasDocument, input: AppendHighlightNodeInput): AppendHighlightNodeResult {
  const x = (input.pageNumber - 1) * input.pageZoneSpacing;
  const existingOnPage = canvas.nodes.filter((node) => node.x === x).length;
  const y = existingOnPage * input.nodeVerticalSpacing;
  const pdfName = basename(input.pdfPath);

  const node: CanvasTextNode = {
    id: createId("highlight_node"),
    type: "text",
    x,
    y,
    width: input.nodeWidth,
    height: DEFAULT_NODE_HEIGHT,
    color: input.category.color,
    text: formatCanvasNodeText({
      categoryLabel: input.category.label,
      selectedText: input.selectedText,
      pdfName,
      pageNumber: input.pageNumber
    })
  };

  return {
    canvas: {
      nodes: [...canvas.nodes, node],
      edges: [...canvas.edges]
    },
    node
  };
}

export function formatCanvasNodeText(input: FormatCanvasNodeTextInput): string {
  const maxLength = input.maxLength ?? 700;
  const normalizedText = input.selectedText.replace(/\s+/g, " ").trim();
  const body = normalizedText.length > maxLength
    ? `${normalizedText.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`
    : normalizedText;

  return `${input.categoryLabel}\n\n${body}\n\n${input.pdfName} · p.${input.pageNumber}`;
}
