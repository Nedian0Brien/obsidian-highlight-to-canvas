import type { CategoryPreset } from "../types";

export interface HighlightPopoverInput {
  container: HTMLElement;
  selectedText: string;
  categories: CategoryPreset[];
  defaultCategoryId: string;
  onCreate: (category: CategoryPreset, tags: string[]) => void | Promise<void>;
  onCancel: () => void;
}

export class HighlightPopover {
  private readonly root: HTMLDivElement;

  constructor(private readonly input: HighlightPopoverInput) {
    this.root = document.createElement("div");
    this.root.className = "pdf-highlight-canvas-popover";
  }

  show(): void {
    const preview = document.createElement("div");
    preview.className = "pdf-highlight-canvas-popover-preview";
    preview.textContent = this.input.selectedText;

    const select = document.createElement("select");
    for (const category of this.input.categories) {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.label;
      option.selected = category.id === this.input.defaultCategoryId;
      select.appendChild(option);
    }

    const advanced = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "Advanced";
    const tagsInput = document.createElement("input");
    tagsInput.type = "text";
    tagsInput.placeholder = "tags separated by commas";
    advanced.append(summary, tagsInput);

    const createButton = document.createElement("button");
    createButton.textContent = "Create node";
    createButton.addEventListener("click", () => {
      const category = this.input.categories.find((item) => item.id === select.value) ?? this.input.categories[0];
      const tags = tagsInput.value.split(",").map((tag) => tag.trim()).filter(Boolean);
      void Promise.resolve(this.input.onCreate(category, tags)).finally(() => this.destroy());
    });

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.addEventListener("click", () => {
      this.input.onCancel();
      this.destroy();
    });

    this.root.append(preview, select, advanced, createButton, cancelButton);
    this.input.container.appendChild(this.root);
  }

  destroy(): void {
    this.root.remove();
  }
}

