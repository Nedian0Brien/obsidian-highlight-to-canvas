# Commercial UX Polish Design

Date: 2026-06-15
Status: Approved for implementation planning

## Summary

This design upgrades the PDF Highlight Canvas MVP from a functional prototype into a more credible daily-use reading workflow. The work keeps the existing architecture and focuses on the user-visible path:

1. Open a Vault PDF in the dedicated reader.
2. See a stable reader toolbar with document context, page progress, zoom, target Canvas, and status.
3. Select text and get an anchored, contextual popover near the selection.
4. Confirm category, tags, and target Canvas.
5. Watch clear progress while the plugin writes the PDF annotation, Canvas node, and index record.
6. Receive success feedback with a way to open the target Canvas.
7. Recover from failures with readable messages and settings-based maintenance controls.

## Goals

- Complete every item in `docs/ux-commercial-quality-checklist.md`.
- Preserve the existing data flow: PDF annotation succeeds before Canvas node and index writes.
- Improve product confidence around original-PDF writes.
- Make Canvas destination visible and adjustable during node creation.
- Keep the UI aligned with Obsidian design tokens and compact pane layouts.
- Add automated coverage for the new state models and formatting behavior.

## Non-Goals

- Replacing the PDF renderer.
- Building a custom Canvas editor.
- OCR support.
- Full visual regression testing.
- Shipping a public marketplace package.

## UX Architecture

### Reader Chrome

Add a `ReaderToolbar` component that renders inside `PdfReaderView` above the scrollable pages. It shows:

- PDF file basename.
- Current page and total page count.
- Zoom controls: fit width, zoom out, zoom in, reset.
- Target Canvas summary.
- Save/status text.

`PdfReaderView` owns reader state:

- `readerStatus`: loading, ready, unsupported, error.
- `totalPages`.
- `activePage`.
- `zoomScale`.
- `targetCanvasPath`.
- `saveStatus`: idle, writing-pdf, writing-canvas, writing-index, success, error.

### Reader States

Render visible states inside the reader:

- Loading: while reading bytes or rendering pages.
- Unsupported: when no page exposes text content.
- Error: when PDF rendering fails.
- Ready: when pages render and text selection can be captured.

### Anchored Popover

Replace the fixed top-right popover with an anchored popover model:

- The popover receives an anchor rectangle from the current selection.
- It computes a viewport-safe position inside the reader pane.
- It moves above, below, or inward when the selection is near pane edges.
- It focuses the first actionable control when opened.
- Escape closes and restores the selection context.
- Enter triggers Create node when not busy.

The popover shows:

- Category swatch and selector.
- Selected text preview.
- Target Canvas selector.
- Tags field under an advanced disclosure.
- PDF write policy note.
- Create, retry, cancel, and open Canvas actions depending on state.

### Canvas Target Model

Add a pure `canvasTarget` module:

- Computes the default PDF-specific Canvas path.
- Lists recently used targets from settings.
- Produces options for default target and recent targets.
- Persists recent targets when a node is created.

The MVP target chooser is a compact select control. It must always show the default PDF-specific Canvas and may show recent Canvas paths.

### Friendly Failure Model

Add a pure `errorMessages` module that maps technical errors to readable messages:

- Read-only or permission denied.
- Locked file.
- Encrypted or unsupported PDF.
- Vault write failure.
- Canvas write failure.
- Index write failure.
- Unknown failure.

The reader and popover use this mapper before showing a Notice or inline error.

### Settings Information Architecture

Expand settings into clear sections:

- Reader.
- Canvas.
- Categories.
- PDF Writing.
- Index Management.

Settings must expose:

- Reader auto-open.
- Source emphasis duration.
- Default node width.
- Page zone spacing.
- Node vertical spacing.
- Category labels, colors, default tags, and default category.
- Original-PDF write policy text.
- Last error with reset.
- Repair, export, and import index actions.

### Canvas Node Formatting

Improve generated node text:

- Keep category label on the first line.
- Truncate very long highlights to a readable display length while preserving full source text in the index.
- Keep a separated source line.
- Keep native Canvas `color` for category color.

### Accessibility and Design System

Use Obsidian CSS variables for:

- Backgrounds.
- Borders.
- Text colors.
- Focus rings.
- Spacing.
- Buttons and inputs.

Add:

- `aria-label` for compact controls.
- Focus movement into and out of popover.
- Reduced-motion override for highlight emphasis.
- Responsive toolbar wrapping for narrow panes.

## Implementation Boundaries

New focused modules:

- `src/pdf/readerToolbar.ts`
- `src/pdf/popoverPosition.ts`
- `src/pdf/popoverState.ts`
- `src/canvas/canvasTarget.ts`
- `src/ui/errorMessages.ts`

Modified modules:

- `src/pdf/pdfReaderView.ts`
- `src/pdf/highlightPopover.ts`
- `src/settings.ts`
- `src/types.ts`
- `src/canvas/canvasNodeWriter.ts`
- `styles.css`
- `docs/manual-test-checklist.md`
- `docs/ux-commercial-quality-checklist.md`

## Testing

Add tests for:

- Popover position clamping and edge behavior.
- Popover state transitions.
- Canvas target option generation and recent-target persistence.
- Friendly error message mapping.
- Canvas node long-highlight formatting.
- Settings normalization for new settings fields.

Existing tests must continue to pass.

## Completion Standard

Work is complete only when:

- Every checklist item in `docs/ux-commercial-quality-checklist.md` is checked.
- `npm test` passes.
- `npm run build` passes.
- Manual checklist reflects the improved UX flows.
- Final audit can point from every checklist item to code, tests, or manual verification evidence.
