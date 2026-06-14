# PDF Highlight to Canvas Obsidian Plugin Design

Date: 2026-06-15
Status: Draft pending written-spec review

## Summary

This plugin helps a user read a PDF inside Obsidian, highlight selected text in real time, and create connected Canvas-ready text nodes from those highlights.

The MVP focuses on the PDF-first workflow:

1. The user opens a Vault PDF in a plugin-provided PDF reader.
2. The user selects text in a text-layer PDF.
3. A compact popover lets the user confirm node creation, choose a category, choose a target Canvas, and optionally expand advanced fields.
4. The plugin writes a real highlight annotation into the original PDF file.
5. Only after PDF annotation succeeds, the plugin appends a text node to an Obsidian `.canvas` file.
6. The plugin stores source-location metadata in a plugin-owned JSON index so a Canvas node can return to the exact PDF page and highlight area with a temporary visual emphasis effect.

The MVP does not build a custom infinite canvas. It writes to Obsidian's existing JSON Canvas `.canvas` files and leaves arrow relationships to Obsidian Canvas manual editing.

## Goals

- Provide an Obsidian-native reading workflow for Vault PDFs.
- Let the user create Canvas text nodes from PDF highlights without leaving the reading flow.
- Store highlights as real PDF annotations in the original PDF file.
- Keep Canvas nodes clean: compact category label, highlighted text, and a source line.
- Preserve precise source recovery: page, selection rectangles, scroll position, and temporary highlight emphasis.
- Organize generated Canvas nodes into page-based coordinate zones.
- Use a plugin-owned JSON index to connect PDF annotation data and Canvas node IDs.
- Include detailed settings for reader behavior, Canvas defaults, category presets, layout, emphasis, and index maintenance.

## Non-Goals

- OCR support for scanned PDFs.
- External PDFs outside the Vault.
- Automatic arrow creation between Canvas nodes.
- A plugin-owned infinite canvas editor.
- Page image or page snapshot nodes inside Canvas.
- Automatic extraction from PDFs that were already highlighted in other apps.
- Guaranteed extension of Obsidian's default PDF viewer in the MVP.

## User Workflow

### Open PDF

When the user opens a Vault PDF, the plugin opens it in the dedicated PDF reader view by default. A setting lets the user disable this automatic behavior and return to Obsidian's default PDF opening behavior.

The plugin also provides commands:

- Open current PDF in PDF Highlight Reader
- Open current PDF in Obsidian default viewer
- Reveal target Canvas for current PDF
- Repair highlight index for current PDF

### Select Text

The reader supports PDFs with a text layer. The user selects text directly in the rendered PDF.

If the PDF has no selectable text layer, the plugin shows a clear message that scanned/OCR-less PDFs are not supported by the MVP.

### Create Highlight Node

After text selection, a compact popover appears near the selection.

Default popover controls:

- Selected text preview
- Category preset selector
- Target Canvas selector
- Create node button
- Cancel button

Advanced popover controls:

- Tags
- Category color override
- Target Canvas override
- Node width
- Placement offset

The default state should be fast enough for repeated reading. Advanced controls remain collapsed unless the user needs them.

### Save Annotation and Canvas Node

When the user clicks Create node:

1. `HighlightCapture` normalizes selected text, page number, viewport rectangles, and PDF-space rectangles.
2. `PdfAnnotationWriter` writes a real highlight annotation to the original PDF.
3. If PDF writing fails, the plugin does not create a Canvas node.
4. If PDF writing succeeds, `CanvasNodeWriter` creates or updates the target Canvas file.
5. `HighlightIndex` records the relationship between the PDF source, PDF rectangles, Canvas file, Canvas node ID, category, tags, and annotation fingerprint.

### Return to Source

From a Canvas node or command, the user can return to the original PDF location.

The plugin opens the PDF reader, navigates to the page, scrolls near the stored selection rectangle, and temporarily emphasizes the highlight area with a visible overlay. The emphasis should be noticeable but brief, with duration controlled in settings.

## Architecture

### Module: PdfReaderView

Purpose:

- Render Vault PDFs in a plugin-owned Obsidian view.
- Manage the PDF.js document, page rendering, text layer, selection handling, popover placement, and source-return emphasis.

Depends on:

- Obsidian workspace/view APIs
- Vault file reads
- PDF.js rendering and text layer behavior
- Plugin settings

Public responsibilities:

- Open a `TFile` PDF.
- Navigate to a page.
- Highlight a stored PDF rectangle temporarily.
- Emit normalized text-selection events to `HighlightCapture`.

### Module: HighlightCapture

Purpose:

- Convert a browser text selection into stable highlight metadata.

Depends on:

- PDF.js viewport transforms
- DOM selection ranges in the reader view

Public responsibilities:

- Extract selected text.
- Identify page number.
- Convert selection rectangles from viewport coordinates to PDF coordinates.
- Store enough rectangle data for annotation writing and future source-return emphasis.
- Reject empty, whitespace-only, cross-document, or unsupported selections.

### Module: PdfAnnotationWriter

Purpose:

- Persist actual highlight annotations into the original PDF file.

Depends on:

- Vault binary file read/write APIs
- A PDF manipulation library capable of writing highlight annotations

Public responsibilities:

- Load the original PDF bytes.
- Add highlight annotation rectangles on the selected page.
- Preserve the original PDF as much as the chosen PDF writer allows.
- Write the modified bytes back to the same Vault file.
- Return a stable annotation fingerprint for index linking.

Failure is terminal for node creation. If annotation writing fails, Canvas node creation is skipped.

### Module: CanvasNodeWriter

Purpose:

- Create or update JSON Canvas files with generated text nodes.

Depends on:

- Obsidian Vault file APIs
- JSON Canvas file structure
- Plugin settings and category presets

Public responsibilities:

- Resolve the target Canvas.
- Create a default PDF-specific Canvas when needed.
- Parse existing `.canvas` JSON.
- Append text nodes without modifying unrelated nodes or edges.
- Place nodes in page-based coordinate zones.
- Apply category visual treatment through a compact category label and the JSON Canvas `color` field.

### Module: HighlightIndex

Purpose:

- Own the durable relationship between PDF highlights and Canvas nodes.

Depends on:

- Plugin data directory
- JSON serialization
- Settings schema versions

Public responsibilities:

- Store highlight records.
- Look up a record by PDF path, Canvas file, Canvas node ID, or annotation fingerprint.
- Support repair commands for missing Canvas nodes or moved files.
- Export and import index data.
- Migrate index schema versions.

## Data Model

### Highlight Record

```json
{
  "id": "highlight_20260615_001",
  "schemaVersion": 1,
  "pdfPath": "Sources/paper-name.pdf",
  "pdfMtime": 1781444229000,
  "pageNumber": 12,
  "selectedText": "The selected sentence appears as the main body of the canvas node.",
  "pdfRects": [
    { "x": 72.2, "y": 421.5, "width": 338.7, "height": 14.8 }
  ],
  "viewportRects": [
    { "x": 108.3, "y": 632.2, "width": 508.1, "height": 22.2, "scale": 1.5 }
  ],
  "annotationFingerprint": "sha256:...",
  "canvasPath": "Sources/paper-name.canvas",
  "canvasNodeId": "node_...",
  "categoryId": "core-claim",
  "tags": ["method"],
  "createdAt": "2026-06-15T00:00:00.000Z",
  "updatedAt": "2026-06-15T00:00:00.000Z"
}
```

### Canvas Node Content

Canvas node text uses a compact readable format:

```text
Core claim

The selected sentence appears as the main body of the canvas node.

paper-name.pdf · p.12
```

Category and tags are not mixed into the main body text. The category appears as a short label above the highlight text. The node also stores the category color in the JSON Canvas `color` field. JSON Canvas supports node color but does not define a left-edge-only border field, so the plugin uses native Canvas color rendering instead of unsupported custom styling. Tags are stored in the plugin index and remain hidden from the default node text.

### Category Preset

```json
{
  "id": "core-claim",
  "label": "Core claim",
  "color": "#f59e0b",
  "defaultTags": ["claim"]
}
```

Initial presets:

- Core claim
- Evidence
- Question
- Quote
- Counterpoint

The user can rename presets, change colors, and update default tags in settings.

## Canvas Behavior

### Default Target Canvas

The default Canvas is generated per PDF:

```text
<pdf-folder>/<pdf-basename>.canvas
```

Example:

```text
Sources/paper-name.pdf
Sources/paper-name.canvas
```

The popover and settings let the user select a different existing Canvas.

### Page-Based Placement

Generated nodes are placed in page-based coordinate zones.

- Each PDF page gets a horizontal or grid zone in Canvas coordinates.
- Nodes from the same page are placed near each other.
- The plugin does not create page header nodes.
- The plugin does not create page image nodes.
- The plugin avoids overlap with nodes it previously created by checking indexed node positions.
- Existing user-created Canvas content is preserved.

### Edges

MVP does not create arrows automatically. The user connects nodes manually in Obsidian Canvas.

The design keeps node IDs stable in the index so later versions can add edge suggestions or automatic edge creation.

## Settings

### Reader

- Use plugin PDF reader automatically for Vault PDFs: default `true`.
- Default zoom behavior: fit width.
- Temporary source emphasis duration: default `1600ms`.
- Temporary source emphasis style: outline and soft fill.

### Canvas

- Default target strategy: PDF-specific Canvas.
- Allow target Canvas override in popover: default `true`.
- Default node width: `420`.
- Page zone spacing: `720`.
- Node vertical spacing: `180`.

### Categories

- Editable category presets.
- Default category.
- Category colors.
- Default tags per category.

### PDF Writing

- Store annotations in original PDF: enabled and required for MVP.
- Explain that node creation is skipped if PDF annotation writing fails.
- Show last PDF write error in settings for troubleshooting.

### Index Management

- Repair index for current PDF.
- Rebuild source-return records from existing index.
- Export index JSON.
- Import index JSON with validation.

## Error Handling

### Unsupported PDF

If the PDF has no text layer or text selection cannot be captured, the plugin shows:

```text
This PDF does not expose selectable text. Scanned/OCR-less PDFs are not supported in this MVP.
```

### PDF Write Failure

If annotation writing fails, the plugin shows a notice that the Canvas node was not created. Common causes include:

- Read-only file
- File locked by another app
- Cloud sync conflict
- Unsupported or encrypted PDF structure
- Vault write failure

The plugin must not create a Canvas node after this failure.

### Canvas Write Failure

If Canvas writing fails after PDF annotation succeeds, the plugin records a recoverable error and offers a repair command. This state can happen because the original PDF write and Canvas write are separate file operations.

### Index Write Failure

If index writing fails after PDF and Canvas writes succeed, the plugin shows a warning and records enough in memory for a retry during the current session. The repair command should detect Canvas nodes created by the plugin when possible.

## Testing Strategy

### Unit Tests

- Selection rectangle normalization.
- PDF-space and viewport-space coordinate conversion.
- Canvas JSON parsing and node append behavior.
- Page-based placement calculation.
- Highlight index insert, lookup, migration, export, and import.
- Settings defaults and preset editing.
- Failure ordering: PDF write failure prevents Canvas creation.

### Integration Tests

- Open a sample text-layer PDF.
- Select text and create a highlight node.
- Confirm the PDF annotation writer returns success.
- Confirm the `.canvas` file contains one new text node.
- Confirm the index links PDF path, page, rectangles, Canvas path, and node ID.
- Confirm source return navigates to the stored page and triggers temporary emphasis.

### Manual Obsidian Checks

- Vault PDF opens in the plugin reader by default.
- The user can opt out and open the default PDF viewer.
- Popover stays readable in light and dark themes.
- Category color remains visible in Canvas through the native node color field.
- Existing Canvas nodes and edges remain unchanged.
- Cloud-synced Vault files produce clear errors if temporarily unavailable.

## Implementation Order

1. Scaffold Obsidian plugin project.
2. Add plugin manifest, TypeScript build pipeline, and basic settings tab.
3. Implement Canvas JSON writer and index store first because they can be tested without Obsidian rendering.
4. Implement PDF reader view with sample PDF rendering.
5. Implement text selection capture and popover.
6. Implement PDF annotation writer.
7. Wire create-node flow with strict operation ordering.
8. Implement source-return navigation and temporary emphasis.
9. Add repair/export/import commands.
10. Verify the plugin in an Obsidian test Vault.

## Design Review Notes

- Scope is intentionally PDF-first and does not include a custom canvas.
- The default behavior changes PDF opening, so settings include an opt-out command and setting.
- Real PDF annotation writing is a hard requirement. Canvas creation depends on it.
- Scanned PDFs and OCR are excluded from MVP to keep the first implementation focused.
- The JSON index is the source of truth for source-return metadata.
- Canvas remains user-editable through Obsidian's native Canvas UI.
- JSON Canvas supports node `color`, but not left-edge-only border styling. The design maps the requested colored-edge intent to native Canvas color plus a compact label.

## References

- Obsidian API repository: https://github.com/obsidianmd/obsidian-api
- JSON Canvas specification: https://jsoncanvas.org/spec/1.0/
- Obsidian JSON Canvas announcement: https://obsidian.md/blog/json-canvas/
- PDF.js examples: https://mozilla.github.io/pdf.js/examples/
