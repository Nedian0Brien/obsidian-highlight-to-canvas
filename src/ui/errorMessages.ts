export function toFriendlyErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const lower = message.toLowerCase();

  if (lower.includes("eacces") || lower.includes("permission") || lower.includes("read-only") || lower.includes("readonly")) {
    return "The original PDF could not be saved because the file is read-only or permission was denied.";
  }
  if (lower.includes("locked") || lower.includes("busy") || lower.includes("ebusy")) {
    return "The original PDF appears to be locked by another app. Close the other app and try again.";
  }
  if (lower.includes("encrypted") || lower.includes("unsupported")) {
    return "This PDF structure is encrypted or unsupported, so the highlight could not be written.";
  }
  if (lower.includes("canvas")) {
    return "The PDF highlight was saved, but the Canvas node could not be created. Run index repair or try again.";
  }
  if (lower.includes("index")) {
    return "The PDF and Canvas were updated, but the source index could not be saved. Use index repair from settings.";
  }
  if (lower.includes("vault") || lower.includes("write")) {
    return "Obsidian could not write one of the required files. Check sync status and try again.";
  }

  return "Something went wrong while creating the highlight node.";
}
