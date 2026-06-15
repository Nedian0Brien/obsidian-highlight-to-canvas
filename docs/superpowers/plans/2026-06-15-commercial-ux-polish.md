# Commercial UX Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the commercial UX checklist for the PDF Highlight Canvas plugin by improving reader chrome, popover workflow, Canvas targeting, settings, recovery, accessibility, and verification.

**Architecture:** Add pure state/formatting modules first, then wire them into the Obsidian UI. The implementation keeps the current PDF annotation -> Canvas node -> index order and layers commercial UX on top through focused components.

**Tech Stack:** TypeScript, Obsidian plugin API, Vitest, PDF.js, pdf-lib, JSON Canvas.

---

## Source Docs

- `docs/ux-commercial-quality-checklist.md`
- `docs/superpowers/specs/2026-06-15-commercial-ux-polish-design.md`

## Tasks

### Task 1: Pure UX State Modules

Files:

- Create `src/pdf/popoverPosition.ts`
- Create `src/pdf/popoverState.ts`
- Create `src/canvas/canvasTarget.ts`
- Create `src/ui/errorMessages.ts`
- Modify `src/types.ts`
- Tests: `tests/popoverPosition.test.ts`, `tests/popoverState.test.ts`, `tests/canvasTarget.test.ts`, `tests/errorMessages.test.ts`

Steps:

- [ ] Write failing tests for viewport-safe popover positioning.
- [ ] Implement `getPopoverPosition(anchorRect, containerRect, popoverSize)`.
- [ ] Write failing tests for popover states: idle, creating, success, error.
- [ ] Implement `createInitialPopoverState`, `markCreating`, `markSuccess`, `markError`.
- [ ] Write failing tests for Canvas target options and recent-target persistence.
- [ ] Implement default target plus recent targets in `canvasTarget.ts`.
- [ ] Write failing tests for friendly error mapping.
- [ ] Implement `toFriendlyErrorMessage`.
- [ ] Run `npm test`.

### Task 2: Canvas Node Formatting and Settings Model

Files:

- Modify `src/canvas/canvasNodeWriter.ts`
- Modify `src/settings.ts`
- Modify `src/types.ts`
- Tests: `tests/canvasNodeWriter.test.ts`, `tests/settings.test.ts`

Steps:

- [ ] Write failing test for long-highlight display truncation while preserving source text in index flow.
- [ ] Implement `formatCanvasNodeText` with category label, truncated body, and separated source line.
- [ ] Write failing tests for new settings fields: recent Canvas targets, page spacing, category editing defaults, last-error reset support.
- [ ] Extend settings types and normalization.
- [ ] Run `npm test`.

### Task 3: Reader Toolbar and Reader States

Files:

- Create `src/pdf/readerToolbar.ts`
- Modify `src/pdf/pdfReaderView.ts`
- Modify `styles.css`

Steps:

- [ ] Add toolbar rendering with file name, page progress, zoom controls, target Canvas, and status.
- [ ] Add loading, unsupported, and error panels inside the reader.
- [ ] Add page markers and active page tracking.
- [ ] Add zoom controls backed by `zoomScale`.
- [ ] Add reduced-motion CSS for emphasis.
- [ ] Run `npm run build`.

### Task 4: Anchored Popover and Canvas Target UX

Files:

- Modify `src/pdf/highlightPopover.ts`
- Modify `src/pdf/pdfReaderView.ts`
- Modify `styles.css`

Steps:

- [ ] Wire popover anchor rectangle from selection.
- [ ] Position popover with `getPopoverPosition`.
- [ ] Add category swatch, target Canvas selector, PDF write policy note, inline status, retry, cancel, and open Canvas action.
- [ ] Add Escape, Enter, focus-in, and focus-restore behavior.
- [ ] Persist recent target after successful node creation.
- [ ] Run `npm test` and `npm run build`.

### Task 5: Settings IA and Maintenance Controls

Files:

- Modify `src/settings.ts`
- Modify `src/commands.ts`
- Modify `styles.css`

Steps:

- [ ] Add section headings for Reader, Canvas, Categories, PDF Writing, and Index Management.
- [ ] Add controls for spacing, default category, category labels/colors/tags, and last-error reset.
- [ ] Add settings buttons for repair, export, and import index.
- [ ] Run `npm run build`.

### Task 6: Docs, Checklist, and Final Audit

Files:

- Modify `docs/manual-test-checklist.md`
- Modify `docs/ux-commercial-quality-checklist.md`

Steps:

- [ ] Update manual checklist with improved UX flows.
- [ ] Check every completed item in `docs/ux-commercial-quality-checklist.md`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Audit every checklist item against code, tests, or manual verification evidence.
- [ ] Commit final implementation.
