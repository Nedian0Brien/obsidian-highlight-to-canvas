import type { DataAdapter } from "obsidian";
import type { HighlightIndexDocument } from "../index/highlightIndex";
import { exportHighlightIndex, importHighlightIndex } from "../index/highlightIndex";
import type { HighlightRecord } from "../types";

export const INDEX_EXPORT_PATH = ".obsidian/plugins/highlight-to-canvas/highlights-export.json";
export const INDEX_IMPORT_PATH = ".obsidian/plugins/highlight-to-canvas/highlights-import.json";

export interface RepairHighlightIndexResult {
  repaired: HighlightIndexDocument;
  removed: HighlightRecord[];
}

export async function repairHighlightIndex(
  index: HighlightIndexDocument,
  exists: (path: string) => Promise<boolean>
): Promise<RepairHighlightIndexResult> {
  const kept: HighlightRecord[] = [];
  const removed: HighlightRecord[] = [];

  for (const record of index.records) {
    const pdfExists = await exists(record.pdfPath);
    const canvasExists = await exists(record.canvasPath);
    if (pdfExists && canvasExists) {
      kept.push(record);
    } else {
      removed.push(record);
    }
  }

  return { repaired: { schemaVersion: 1, records: kept }, removed };
}

export async function exportIndex(adapter: DataAdapter, index: HighlightIndexDocument): Promise<string> {
  await adapter.write(INDEX_EXPORT_PATH, exportHighlightIndex(index));
  return INDEX_EXPORT_PATH;
}

export async function importIndex(adapter: DataAdapter): Promise<HighlightIndexDocument> {
  if (!(await adapter.exists(INDEX_IMPORT_PATH))) {
    throw new Error(`Import file not found: ${INDEX_IMPORT_PATH}`);
  }
  return importHighlightIndex(await adapter.read(INDEX_IMPORT_PATH));
}
