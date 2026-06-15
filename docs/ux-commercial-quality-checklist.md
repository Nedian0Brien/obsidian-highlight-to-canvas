# Commercial-Grade UI/UX Improvement Checklist

Date: 2026-06-15
Status: Complete

## Reader Workspace

- [x] Add a persistent reader toolbar with file name, page progress, zoom controls, target Canvas summary, and save status.
- [x] Show loading, PDF render failure, and unsupported text-layer states inside the reader instead of relying on silent failures or generic notices.
- [x] Add page number markers so long PDFs remain navigable while scrolling.
- [x] Add fit-width, zoom in, zoom out, and reset zoom actions.
- [x] Keep the reader visually consistent with Obsidian design tokens in light and dark themes.

## Selection and Popover

- [x] Anchor the highlight popover near the selected text instead of fixing it to the top-right corner.
- [x] Reposition the popover when the selection is near viewport edges.
- [x] Show category color, category label, selected text preview, target Canvas, and primary action in a compact hierarchy.
- [x] Add loading, disabled, success, and failure states for the Create node action.
- [x] Add retry and cancel behavior that keeps the user in context.
- [x] Add keyboard behavior: Escape closes, Enter creates, Tab order is predictable.

## Canvas Destination and Node Outcome

- [x] Let the user see and change the target Canvas before creating a node.
- [x] Support the default PDF-specific Canvas and recently used Canvas targets.
- [x] Show a post-create action to open or reveal the target Canvas.
- [x] Improve generated Canvas node text for long highlights, source line readability, and category clarity.
- [x] Avoid overlap with existing plugin-created nodes and reduce collision risk with user-created nodes.

## PDF Save Trust and Recovery

- [x] Explain on first use that the plugin writes real annotations to the original PDF.
- [x] Show progress while writing the PDF annotation, Canvas node, and index record.
- [x] Use friendly, cause-specific error messages for read-only files, locked files, encrypted/unsupported PDFs, and Vault write failures.
- [x] Store enough recoverable state to retry Canvas or index writes after PDF annotation succeeds.
- [x] Make repair/export/import actions discoverable from settings.

## Settings and Information Architecture

- [x] Expand settings into sections: Reader, Canvas, Categories, PDF Writing, and Index Management.
- [x] Let users edit category labels, colors, default tags, and default category.
- [x] Let users configure default Canvas strategy, node width, page spacing, and emphasis duration.
- [x] Add explicit original-PDF write policy text and last-error reset behavior.
- [x] Add index repair, export, and import controls to the settings UI.

## Accessibility and Design System

- [x] Use Obsidian CSS variables for spacing, borders, typography, colors, and focus states.
- [x] Add accessible labels for icon or compact controls.
- [x] Ensure focus is moved into the popover and restored after close.
- [x] Respect reduced-motion preferences for emphasis animation.
- [x] Keep controls usable at narrow pane widths.

## Verification

- [x] Add automated tests for popover state, target Canvas choice, Canvas node formatting, settings normalization, and failure message mapping.
- [x] Keep `npm test` passing.
- [x] Keep `npm run build` passing.
- [x] Update `docs/manual-test-checklist.md` with the improved commercial UX flows.
- [x] Run a final requirement-by-requirement audit against this checklist before marking the work complete.
