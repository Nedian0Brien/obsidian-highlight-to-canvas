import { getDefaultCanvasPath } from "./canvasNodeWriter";
import { basename } from "../utils/path";

export type CanvasTargetKind = "default" | "recent";

export interface CanvasTargetOption {
  path: string;
  label: string;
  kind: CanvasTargetKind;
}

export function buildCanvasTargetOptions(pdfPath: string, recentTargets: string[]): CanvasTargetOption[] {
  const defaultPath = getDefaultCanvasPath(pdfPath);
  const options: CanvasTargetOption[] = [
    { path: defaultPath, label: basename(defaultPath), kind: "default" }
  ];

  for (const target of recentTargets) {
    if (target && target !== defaultPath && !options.some((option) => option.path === target)) {
      options.push({ path: target, label: basename(target), kind: "recent" });
    }
  }

  return options;
}

export function rememberCanvasTarget(existing: string[], selectedPath: string, limit = 5): string[] {
  return [selectedPath, ...existing.filter((path) => path !== selectedPath)].slice(0, limit);
}
