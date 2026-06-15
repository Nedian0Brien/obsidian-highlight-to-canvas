import { setIcon } from "obsidian";
import type { CategoryPreset } from "../types";
import type { PopoverPosition } from "./popoverPosition";
import { createInitialPopoverState, markCreating, markError, markSuccess, type PopoverState } from "./popoverState";

export interface HighlightPopoverInput {
  container: HTMLElement;
  selectedText: string;
  categories: CategoryPreset[];
  defaultCategoryId: string;
  position: PopoverPosition;
  selectedTargetPath: string;
  surface?: "reader" | "native";
  onCreate: (category: CategoryPreset, tags: string[], targetCanvasPath: string, controls: HighlightPopoverControls) => void | Promise<void>;
  onCancel: () => void;
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
    let selectedCategory = this.input.categories.find((item) => item.id === this.input.defaultCategoryId) ?? this.input.categories[0];
    const colorGroup = document.createElement("div");
    colorGroup.className = "highlight-to-canvas-color-group";
    colorGroup.setAttribute("role", "radiogroup");
    colorGroup.setAttribute("aria-label", "Highlight color");
    const colorButtons: HTMLButtonElement[] = [];

    for (const category of this.input.categories.slice(0, 5)) {
      const colorButton = document.createElement("button");
      colorButton.type = "button";
      colorButton.className = "highlight-to-canvas-color-button";
      colorButton.setAttribute("role", "radio");
      colorButton.setAttribute("aria-label", category.label);
      colorButton.title = category.label;
      colorButton.style.backgroundColor = category.color;
      const setSelectedCategory = () => {
        selectedCategory = category;
        for (const button of colorButtons) {
          button.dataset.selected = String(button === colorButton);
          button.setAttribute("aria-checked", String(button === colorButton));
        }
      };
      colorButton.addEventListener("click", setSelectedCategory);
      colorButtons.push(colorButton);
      colorGroup.appendChild(colorButton);
      if (category.id === selectedCategory.id) setSelectedCategory();
    }

    const createButton = document.createElement("button");
    this.createButton = createButton;
    createButton.type = "button";
    createButton.className = "highlight-to-canvas-popover-primary";
    createButton.setAttribute("aria-label", "Create highlight node");
    createButton.title = "Create highlight node";
    setIcon(createButton, "plus");
    createButton.addEventListener("click", () => {
      void Promise.resolve(this.input.onCreate(selectedCategory, [], this.input.selectedTargetPath, this.controls()));
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

    this.statusEl = document.createElement("span");
    this.statusEl.className = "highlight-to-canvas-popover-status";
    this.statusEl.textContent = "";

    this.root.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        this.input.onCancel();
        this.destroy();
      }
      if (event.key === "Enter" && this.state.canSubmit) {
        event.preventDefault();
        createButton.click();
      }
    });
    this.root.addEventListener("mousedown", (event) => {
      if (event.target instanceof Element && event.target.closest("button")) {
        event.preventDefault();
      }
    });

    this.root.append(colorGroup, createButton, this.statusEl, cancelButton);
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
      this.createButton.setAttribute("aria-busy", String(state.status === "creating"));
      this.createButton.title = state.canRetry ? "Retry" : state.status === "creating" ? "Creating..." : "Create highlight node";
    }
  }
}
