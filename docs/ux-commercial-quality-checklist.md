# Commercial-Grade UI/UX Improvement Checklist

Date: 2026-06-15
Status: In progress

## Reader Workspace

- [ ] Add a persistent reader toolbar with file name, page progress, zoom controls, target Canvas summary, and save status.
- [ ] Show loading, PDF render failure, and unsupported text-layer states inside the reader instead of relying on silent failures or generic notices.
- [ ] Add page number markers so long PDFs remain navigable while scrolling.
- [ ] Add fit-width, zoom in, zoom out, and reset zoom actions.
- [ ] Keep the reader visually consistent with Obsidian design tokens in light and dark themes.

## Selection and Popover

- [ ] Anchor the highlight popover near the selected text instead of fixing it to the top-right corner.
- [ ] Reposition the popover when the selection is near viewport edges.
- [ ] Show category color, category label, selected text preview, target Canvas, and primary action in a compact hierarchy.
- [ ] Add loading, disabled, success, and failure states for the Create node action.
- [ ] Add retry and cancel behavior that keeps the user in context.
- [ ] Add keyboard behavior: Escape closes, Enter creates, Tab order is predictable.

## Canvas Destination and Node Outcome

- [ ] Let the user see and change the target Canvas before creating a node.
- [ ] Support the default PDF-specific Canvas and recently used Canvas targets.
- [ ] Show a post-create action to open or reveal the target Canvas.
- [ ] Improve generated Canvas node text for long highlights, source line readability, and category clarity.
- [ ] Avoid overlap with existing plugin-created nodes and reduce collision risk with user-created nodes.

## PDF Save Trust and Recovery

- [ ] Explain on first use that the plugin writes real annotations to the original PDF.
- [ ] Show progress while writing the PDF annotation, Canvas node, and index record.
- [ ] Use friendly, cause-specific error messages for read-only files, locked files, encrypted/unsupported PDFs, and Vault write failures.
- [ ] Store enough recoverable state to retry Canvas or index writes after PDF annotation succeeds.
- [ ] Make repair/export/import actions discoverable from settings.

## Settings and Information Architecture

- [ ] Expand settings into sections: Reader, Canvas, Categories, PDF Writing, and Index Management.
- [ ] Let users edit category labels, colors, default tags, and default category.
- [ ] Let users configure default Canvas strategy, node width, page spacing, and emphasis duration.
- [ ] Add explicit original-PDF write policy text and last-error reset behavior.
- [ ] Add index repair, export, and import controls to the settings UI.

## Accessibility and Design System

- [ ] Use Obsidian CSS variables for spacing, borders, typography, colors, and focus states.
- [ ] Add accessible labels for icon or compact controls.
- [ ] Ensure focus is moved into the popover and restored after close.
- [ ] Respect reduced-motion preferences for emphasis animation.
- [ ] Keep controls usable at narrow pane widths.

## Verification

- [ ] Add automated tests for popover state, target Canvas choice, Canvas node formatting, settings normalization, and failure message mapping.
- [ ] Keep `npm test` passing.
- [ ] Keep `npm run build` passing.
- [ ] Update `docs/manual-test-checklist.md` with the improved commercial UX flows.
- [ ] Run a final requirement-by-requirement audit against this checklist before marking the work complete.
