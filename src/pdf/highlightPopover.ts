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
  surface?: "reader" | "native";
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
  private statusEl: HTMLSpanElement | null = null;
  private createButton: HTMLButtonElement | null = null;
  private openCanvasButton: HTMLButtonElement | null = null;
  private destroyed = false;

  constructor(private readonly input: HighlightPopoverInput) {
    this.root = document.createElement("div");
    this.root.className = "highlight-to-canvas-popover";
    this.root.setAttribute("role", "dialog");
    this.root.setAttribute("aria-label", "Create Canvas node from PDF highlight");
    this.root.style.left = `${input.position.left}px`;
    this.root.style.top = `${input.position.top}px`;
    this.root.dataset.placement = input.position.placement;
    this.root.dataset.surface = input.surface ?? "reader";
  }

  show(): void {
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

    const targetSelect = document.createElement("select");
    targetSelect.setAttribute("aria-label", "Target Canvas");
    targetSelect.className = "highlight-to-canvas-popover-target";
    for (const option of this.input.targetOptions) {
      const optionEl = document.createElement("option");
      optionEl.value = option.path;
      optionEl.textContent = option.kind === "default" ? `${option.label} (default)` : option.label;
      optionEl.selected = option.path === this.input.selectedTargetPath;
      targetSelect.appendChild(optionEl);
    }

    const tagsInput = document.createElement("input");
    tagsInput.type = "text";
    tagsInput.placeholder = "tags separated by commas";
    tagsInput.setAttribute("aria-label", "Tags separated by commas");
    tagsInput.className = "highlight-to-canvas-popover-tags";

    const createButton = document.createElement("button");
    this.createButton = createButton;
    createButton.type = "button";
    createButton.className = "highlight-to-canvas-popover-primary";
    createButton.textContent = "Create node";
    createButton.addEventListener("click", () => {
      const category = this.input.categories.find((item) => item.id === select.value) ?? this.input.categories[0];
      const tags = tagsInput.value.split(",").map((tag) => tag.trim()).filter(Boolean);
      void Promise.resolve(this.input.onCreate(category, tags, targetSelect.value, this.controls()));
    });

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "highlight-to-canvas-popover-close";
    cancelButton.setAttribute("aria-label", "Dismiss highlight action");
    cancelButton.textContent = "×";
    cancelButton.addEventListener("click", () => {
      this.input.onCancel();
      this.destroy();
    });

    const openCanvasButton = document.createElement("button");
    this.openCanvasButton = openCanvasButton;
    openCanvasButton.type = "button";
    openCanvasButton.className = "highlight-to-canvas-popover-secondary";
    openCanvasButton.textContent = "Open Canvas";
    openCanvasButton.hidden = true;
    openCanvasButton.addEventListener("click", () => {
      if (this.state.canvasPath) void this.input.onOpenCanvas(this.state.canvasPath);
    });

    const details = document.createElement("details");
    details.className = "highlight-to-canvas-popover-details";
    const summary = document.createElement("summary");
    summary.textContent = "Options";
    details.append(summary, targetSelect, tagsInput);

    this.statusEl = document.createElement("span");
    this.statusEl.className = "highlight-to-canvas-popover-status";
    this.statusEl.textContent = "";

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
    this.root.addEventListener("mousedown", (event) => {
      if (event.target instanceof Element && event.target.closest("button")) {
        event.preventDefault();
      }
    });

    this.root.append(swatch, select, createButton, openCanvasButton, details, this.statusEl, cancelButton);
    this.input.container.appendChild(this.root);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
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
      this.statusEl.textContent = state.status === "idle" ? "" : state.message ?? "";
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
