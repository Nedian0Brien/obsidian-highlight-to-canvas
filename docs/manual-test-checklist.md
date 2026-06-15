# Manual Test Checklist

## Install

1. Build with `npm run build`.
2. Copy `main.js`, `manifest.json`, and `styles.css` into a test Vault at `.obsidian/plugins/highlight-to-canvas/`.
3. Enable the plugin in Obsidian community plugin settings.

## Mobile Install

1. Build with `npm run build`.
2. Sync or copy `main.js`, `manifest.json`, and `styles.css` into the mobile test Vault at `.obsidian/plugins/highlight-to-canvas/`.
3. Open Obsidian on iOS or Android.
4. Confirm the plugin appears in Community plugins and can be enabled.
5. Open a selectable-text PDF and run a smoke test: render PDF, select text, create a Canvas node, and confirm the target Canvas file updates.
6. If PDF rendering, text selection, or binary PDF saving fails on mobile, record the device, OS, Obsidian version, PDF file type, and the exact step that failed.

## PDF Reader

1. Open a Vault PDF that has selectable text.
2. Confirm a normal click may open Obsidian's built-in PDF viewer.
3. Use one of the plugin entry points:
   - Run `Open current PDF in Highlight to Canvas` from the command palette while the PDF is active.
   - Or right-click/long-press the PDF in the file explorer and choose `Open in Highlight to Canvas`.
4. Confirm the plugin reader renders pages.
5. Confirm the reader toolbar shows file name, page progress, zoom controls, target Canvas, and status.
6. Use fit width, zoom out, zoom in, and reset zoom.
7. Confirm page markers remain visible enough to orient long PDF scrolling.
8. Select text on one page with mouse or touch selection.
9. Confirm the creation popover appears near the selected text and stays within the pane.
10. Press Escape and confirm the popover closes.

## Highlight to Canvas

1. Choose the `Evidence` category.
2. Confirm the category swatch color changes with the selected category.
3. Confirm the target Canvas selector shows the PDF-specific Canvas and any recent Canvas targets.
4. Click `Create node`.
5. Confirm inline progress moves through PDF saving, Canvas creation, and source-link recording.
6. Confirm the original PDF file is modified.
7. Confirm `<pdf-basename>.canvas` is created beside the PDF or the selected target Canvas is updated.
8. Confirm the Canvas has a text node with category label, selected text, source line, and node color.
9. Confirm the success state shows `Open Canvas`.
10. Confirm `.obsidian/plugins/highlight-to-canvas/highlights.json` contains the PDF path, page, rectangles, Canvas path, and Canvas node ID.

## Failure Behavior

1. Try a scanned PDF with no selectable text.
2. Confirm the plugin does not create a highlight node.
3. Make a PDF read-only.
4. Confirm PDF write failure prevents Canvas node creation.
5. Simulate a Canvas or index write failure after PDF writing.
6. Confirm settings show pending recovery state.
7. Retry from the popover and confirm the plugin does not write a duplicate PDF annotation.

## Settings

1. Confirm settings are divided into Reader, Canvas, Categories, PDF Writing, and Index Management sections.
2. Edit category label, color, and default tags.
3. Change default category.
4. Change node width, page spacing, node spacing, and emphasis duration.
5. Confirm the original PDF write policy is visible.
6. Confirm last error can be reset.
7. Run repair, export, and import index controls from settings.
