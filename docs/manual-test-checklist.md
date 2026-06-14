# Manual Test Checklist

## Install

1. Build with `npm run build`.
2. Copy `main.js`, `manifest.json`, and `styles.css` into a test Vault at `.obsidian/plugins/pdf-highlight-canvas/`.
3. Enable the plugin in Obsidian community plugin settings.

## PDF Reader

1. Open a Vault PDF that has selectable text.
2. Run `Open current PDF in PDF Highlight Reader`.
3. Confirm the plugin reader renders pages.
4. Select text on one page.
5. Confirm the creation popover appears.

## Highlight to Canvas

1. Choose the `Evidence` category.
2. Click `Create node`.
3. Confirm the original PDF file is modified.
4. Confirm `<pdf-basename>.canvas` is created beside the PDF.
5. Confirm the Canvas has a text node with category label, selected text, source line, and node color.
6. Confirm `.obsidian/plugins/pdf-highlight-canvas/highlights.json` contains the PDF path, page, rectangles, Canvas path, and Canvas node ID.

## Failure Behavior

1. Try a scanned PDF with no selectable text.
2. Confirm the plugin does not create a highlight node.
3. Make a PDF read-only.
4. Confirm PDF write failure prevents Canvas node creation.
