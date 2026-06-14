export interface CanvasDocument {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export type CanvasNode = CanvasTextNode | CanvasFileNode | CanvasLinkNode | CanvasGroupNode;

export interface CanvasBaseNode {
  id: string;
  type: "text" | "file" | "link" | "group";
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

export interface CanvasTextNode extends CanvasBaseNode {
  type: "text";
  text: string;
}

export interface CanvasFileNode extends CanvasBaseNode {
  type: "file";
  file: string;
  subpath?: string;
}

export interface CanvasLinkNode extends CanvasBaseNode {
  type: "link";
  url: string;
}

export interface CanvasGroupNode extends CanvasBaseNode {
  type: "group";
  label?: string;
  background?: string;
  backgroundStyle?: "cover" | "ratio" | "repeat";
}

export interface CanvasEdge {
  id: string;
  fromNode: string;
  fromSide?: "top" | "right" | "bottom" | "left";
  fromEnd?: "none" | "arrow";
  toNode: string;
  toSide?: "top" | "right" | "bottom" | "left";
  toEnd?: "none" | "arrow";
  color?: string;
  label?: string;
}

