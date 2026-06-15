import type { SaveStatus } from "../types";

export interface ReaderToolbarInput {
  fileName: string;
  pageLabel: string;
  zoomLabel: string;
  targetCanvasPath: string;
  saveStatus: SaveStatus;
  onFitWidth: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onResetZoom: () => void;
}

export class ReaderToolbar {
  private readonly root = document.createElement("div");
  private readonly fileNameEl = document.createElement("div");
  private readonly pageEl = document.createElement("span");
  private readonly zoomEl = document.createElement("span");
  private readonly targetEl = document.createElement("span");
  private readonly statusEl = document.createElement("span");

  constructor(private input: ReaderToolbarInput) {
    this.root.className = "pdf-highlight-canvas-toolbar";
    this.fileNameEl.className = "pdf-highlight-canvas-toolbar-title";
    const meta = document.createElement("div");
    meta.className = "pdf-highlight-canvas-toolbar-meta";
    meta.append(this.pageEl, this.zoomEl, this.targetEl, this.statusEl);

    const actions = document.createElement("div");
    actions.className = "pdf-highlight-canvas-toolbar-actions";
    actions.append(
      this.button("Fit", "Fit width", () => this.input.onFitWidth()),
      this.button("-", "Zoom out", () => this.input.onZoomOut()),
      this.button("+", "Zoom in", () => this.input.onZoomIn()),
      this.button("100%", "Reset zoom", () => this.input.onResetZoom())
    );

    this.root.append(this.fileNameEl, meta, actions);
    this.update(input);
  }

  get element(): HTMLElement {
    return this.root;
  }

  update(input: ReaderToolbarInput): void {
    this.input = input;
    this.fileNameEl.textContent = input.fileName || "PDF Highlight Reader";
    this.pageEl.textContent = input.pageLabel;
    this.zoomEl.textContent = input.zoomLabel;
    this.targetEl.textContent = input.targetCanvasPath ? `Canvas: ${input.targetCanvasPath}` : "Canvas: default";
    this.statusEl.textContent = statusText(input.saveStatus);
    this.statusEl.dataset.status = input.saveStatus;
  }

  private button(text: string, label: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pdf-highlight-canvas-toolbar-button";
    button.textContent = text;
    button.setAttribute("aria-label", label);
    button.addEventListener("click", onClick);
    return button;
  }
}

function statusText(status: SaveStatus): string {
  if (status === "loading") return "Loading";
  if (status === "writing-pdf") return "Saving PDF";
  if (status === "writing-canvas") return "Creating Canvas";
  if (status === "writing-index") return "Recording link";
  if (status === "success") return "Saved";
  if (status === "error") return "Needs attention";
  return "Ready";
}
