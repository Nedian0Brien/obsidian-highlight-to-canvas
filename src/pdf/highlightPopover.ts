import type { CategoryPreset } from "../types";
import type { CanvasTargetOption } from "../canvas/canvasTarget";
import type { PopoverPosition } from "./popoverPosition";
import { createInitialPopoverState, markCreating, markError, markSuccess, type PopoverState } from "./popoverState";

export interface HighlightPopoverInput {
  container: HTMLElement;
  selectedText: string;
  categories: CategoryPreset[];
  defaultCategoryId: string;
  position: PopoverPosition;
  targetOptions: CanvasTargetOption[];
  selectedTargetPath: string;
  onCreate: (category: CategoryPreset, tags: string[], targetCanvasPath: string, controls: HighlightPopoverControls) => void | Promise<void>;
  onCancel: () => void;
  onOpenCanvas: (canvasPath: string) => void | Promise<void>;
}

export interface HighlightPopoverControls {
  markCreating: (step: "writing-pdf" | "writing-canvas" | "writing-index") => void;
  markSuccess: (canvasPath: string) => void;
  markError: (message: string) => void;
}

export class HighlightPopover {
  private readonly root: HTMLDivElement;
  private readonly previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  private state: PopoverState = createInitialPopoverState();
  private statusEl: HTMLDivElement | null = null;
  private createButton: HTMLButtonElement | null = null;
  private openCanvasButton: HTMLButtonElement | null = null;

  constructor(private readonly input: HighlightPopoverInput) {
    this.root = document.createElement("div");
    this.root.className = "highlight-to-canvas-popover";
    this.root.setAttribute("role", "dialog");
    this.root.setAttribute("aria-label", "Create Canvas node from PDF highlight");
    this.root.style.left = `${input.position.left}px`;
    this.root.style.top = `${input.position.top}px`;
    this.root.dataset.placement = input.position.placement;
  }

  show(): void {
    const header = document.createElement("div");
    header.className = "highlight-to-canvas-popover-header";
    const title = document.createElement("div");
    title.className = "highlight-to-canvas-popover-title";
    title.textContent = "Create highlight node";
    const policy = document.createElement("div");
    policy.className = "highlight-to-canvas-popover-policy";
    policy.textContent = "Writes a real highlight annotation to the original PDF.";
    header.append(title, policy);

    const preview = document.createElement("div");
    preview.className = "highlight-to-canvas-popover-preview";
    preview.textContent = this.input.selectedText;

    const categoryLabel = document.createElement("label");
    categoryLabel.className = "highlight-to-canvas-field-label";
    categoryLabel.textContent = "Category";
    const select = document.createElement("select");
    select.setAttribute("aria-label", "Highlight category");
    const swatch = document.createElement("span");
    swatch.className = "highlight-to-canvas-category-swatch";
    for (const category of this.input.categories) {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.label;
      option.selected = category.id === this.input.defaultCategoryId;
      select.appendChild(option);
    }
    const updateSwatch = () => {
      const category = this.input.categories.find((item) => item.id === select.value) ?? this.input.categories[0];
      swatch.style.backgroundColor = category.color;
    };
    select.addEventListener("change", updateSwatch);
    updateSwatch();

    const categoryRow = document.createElement("div");
    categoryRow.className = "highlight-to-canvas-category-row";
    categoryRow.append(swatch, select);

    const targetLabel = document.createElement("label");
    targetLabel.className = "highlight-to-canvas-field-label";
    targetLabel.textContent = "Target Canvas";
    const targetSelect = document.createElement("select");
    targetSelect.setAttribute("aria-label", "Target Canvas");
    for (const option of this.input.targetOptions) {
      const optionEl = document.createElement("option");
      optionEl.value = option.path;
      optionEl.textContent = option.kind === "default" ? `${option.label} (default)` : option.label;
      optionEl.selected = option.path === this.input.selectedTargetPath;
      targetSelect.appendChild(optionEl);
    }

    const advanced = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "Advanced";
    const tagsInput = document.createElement("input");
    tagsInput.type = "text";
    tagsInput.placeholder = "tags separated by commas";
    tagsInput.setAttribute("aria-label", "Tags separated by commas");
    advanced.append(summary, tagsInput);

    const createButton = document.createElement("button");
    this.createButton = createButton;
    createButton.type = "button";
    createButton.textContent = "Create node";
    createButton.addEventListener("click", () => {
      const category = this.input.categories.find((item) => item.id === select.value) ?? this.input.categories[0];
      const tags = tagsInput.value.split(",").map((tag) => tag.trim()).filter(Boolean);
      void Promise.resolve(this.input.onCreate(category, tags, targetSelect.value, this.controls()));
    });

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";
    cancelButton.addEventListener("click", () => {
      this.input.onCancel();
      this.destroy();
    });

    const openCanvasButton = document.createElement("button");
    this.openCanvasButton = openCanvasButton;
    openCanvasButton.type = "button";
    openCanvasButton.textContent = "Open Canvas";
    openCanvasButton.hidden = true;
    openCanvasButton.addEventListener("click", () => {
      if (this.state.canvasPath) void this.input.onOpenCanvas(this.state.canvasPath);
    });

    this.statusEl = document.createElement("div");
    this.statusEl.className = "highlight-to-canvas-popover-status";
    this.statusEl.textContent = "Ready";

    this.root.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        this.input.onCancel();
        this.destroy();
      }
      if (event.key === "Enter" && this.state.canSubmit && document.activeElement !== tagsInput) {
        event.preventDefault();
        createButton.click();
      }
    });

    this.root.append(header, preview, categoryLabel, categoryRow, targetLabel, targetSelect, advanced, this.statusEl, createButton, openCanvasButton, cancelButton);
    this.input.container.appendChild(this.root);
    select.focus();
  }

  destroy(): void {
    this.root.remove();
    this.previousFocus?.focus();
  }

  private controls(): HighlightPopoverControls {
    return {
      markCreating: (step) => this.updateState(markCreating(this.state, step)),
      markSuccess: (canvasPath) => this.updateState(markSuccess(this.state, canvasPath)),
      markError: (message) => this.updateState(markError(this.state, message))
    };
  }

  private updateState(state: PopoverState): void {
    this.state = state;
    if (this.statusEl) {
      this.statusEl.textContent = state.message ?? "Ready";
      this.statusEl.dataset.status = state.status;
    }
    if (this.createButton) {
      this.createButton.disabled = !state.canSubmit;
      this.createButton.textContent = state.canRetry ? "Retry" : state.status === "creating" ? "Creating..." : "Create node";
    }
    if (this.openCanvasButton) {
      this.openCanvasButton.hidden = state.status !== "success";
    }
  }
}
