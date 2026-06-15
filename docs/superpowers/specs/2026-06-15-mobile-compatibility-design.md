# Mobile Compatibility Design

Date: 2026-06-15

## Goal

Make the plugin installable and loadable on Obsidian mobile while preserving the desktop PDF highlight to Canvas workflow.

## Scope

This pass removes known mobile load blockers and adds regression coverage. It does not promise that every PDF rendering edge case behaves identically on iOS and Android before real-device QA.

## Design

- Change the plugin manifest from desktop-only to mobile-capable.
- Remove direct Node built-in runtime dependencies from production plugin code.
- Replace Node `crypto.createHash` with a small platform-neutral hash helper.
- Prefer Web Crypto SHA-256 when available because Obsidian mobile runs in a browser-like WebView.
- Provide a deterministic non-cryptographic fallback for environments without Web Crypto, mainly tests and older runtimes.
- Keep the existing annotation fingerprint format as `sha256:<hex>` so index records remain stable in shape.
- Add automated tests proving the fallback hash is stable and the annotation writer still produces a fingerprint.
- Add mobile installation steps to manual QA.

## Non-Goals

- No mobile-specific UI redesign in this pass.
- No feature degradation on desktop.
- No Canvas-only mobile mode unless real-device testing later proves PDF binary writes are unreliable.

## Acceptance Criteria

- `manifest.json` sets `isDesktopOnly` to `false`.
- Source files under `src/` do not import Node built-ins such as `crypto`, `fs`, or `path`.
- Production bundle does not contain `require("crypto")`.
- `npm test` passes.
- `npm run build` passes.
- Manual QA checklist includes mobile install and smoke-test steps.
