# Highlight to Canvas

Turn PDF highlights into connected Obsidian Canvas nodes.

Highlight to Canvas lets you read a PDF inside Obsidian, select text, save the highlight back to the PDF, and create a linked Canvas text node from that selection.

## Features

- Read selectable-text PDFs in a dedicated Obsidian view.
- Create real PDF highlight annotations from selected text.
- Send highlights to an Obsidian Canvas as categorized text nodes.
- Keep source metadata, page numbers, and Canvas node references in a local index.
- Choose the target Canvas and reuse recent Canvas destinations.
- Works on desktop and is prepared for mobile BRAT testing.

## Install With BRAT

1. Install and enable the BRAT plugin in Obsidian.
2. Run `BRAT: Plugins: Add a beta plugin for testing`.
3. Enter this repository:

   ```text
   Nedian0Brien/obsidian-highlight-to-canvas
   ```

4. Enable `Highlight to Canvas` from Obsidian's Community plugins list.

## Opening PDFs

Opening a PDF with a normal click may still show Obsidian's built-in PDF viewer. To use Highlight to Canvas, open the PDF through one of the plugin entry points:

- Command palette: `Open current PDF in Highlight to Canvas`
- File explorer menu: right-click or long-press a PDF and choose `Open in Highlight to Canvas`

The highlight popover only appears inside the Highlight to Canvas reader.

## Manual Install

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest GitHub release.
2. Create this folder in your vault:

   ```text
   .obsidian/plugins/highlight-to-canvas/
   ```

3. Copy the three files into that folder.
4. Reload Obsidian and enable `Highlight to Canvas`.

## Development

```bash
npm ci
npm test
npm run build
```

## Release

Push a tag matching the version in `manifest.json`:

```bash
git tag v0.1.1
git push origin main
git push origin v0.1.1
```

The release workflow uploads `main.js`, `manifest.json`, `styles.css`, and a zip package for BRAT/manual installation.
