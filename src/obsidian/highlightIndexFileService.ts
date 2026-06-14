import type { DataAdapter } from "obsidian";
import { addHighlightRecord, createEmptyHighlightIndex, exportHighlightIndex, importHighlightIndex } from "../index/highlightIndex";
import type { HighlightRecord } from "../types";

export const INDEX_PATH = ".obsidian/plugins/pdf-highlight-canvas/highlights.json";

export async function readIndex(adapter: DataAdapter) {
  if (!(await adapter.exists(INDEX_PATH))) {
    return createEmptyHighlightIndex();
  }
  return importHighlightIndex(await adapter.read(INDEX_PATH));
}

export async function saveRecord(adapter: DataAdapter, record: HighlightRecord): Promise<void> {
  const current = await readIndex(adapter);
  const next = addHighlightRecord(current, record);
  await adapter.write(INDEX_PATH, exportHighlightIndex(next));
}

