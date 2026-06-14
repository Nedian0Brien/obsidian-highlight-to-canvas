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
    text: `${input.category.label}\n\n${input.selectedText}\n\n${pdfName} · p.${input.pageNumber}`
  };

  return {
    canvas: {
      nodes: [...canvas.nodes, node],
      edges: [...canvas.edges]
    },
    node
  };
}

