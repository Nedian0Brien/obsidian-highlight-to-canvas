# Mobile Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Obsidian PDF Highlight Canvas plugin installable on mobile by removing known Node-only runtime dependencies and enabling the manifest for mobile.

**Architecture:** Isolate hashing behind `src/utils/hash.ts` so PDF annotation writing no longer imports Node `crypto`. Keep the rest of the PDF and Canvas flow unchanged, then verify the bundle has no Node crypto require.

**Tech Stack:** TypeScript, Obsidian plugin manifest, pdf-lib, Vitest, esbuild.

---

### Task 1: Platform-Neutral Hash Helper

**Files:**
- Create: `src/utils/hash.ts`
- Test: `tests/hash.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { createStableFingerprint } from "../src/utils/hash";

describe("createStableFingerprint", () => {
  it("returns a sha256-prefixed hex fingerprint", async () => {
    const fingerprint = await createStableFingerprint("hello");

    expect(fingerprint).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it("returns stable output for equivalent input", async () => {
    await expect(createStableFingerprint("same")).resolves.toBe(await createStableFingerprint("same"));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/hash.test.ts`
Expected: FAIL because `src/utils/hash.ts` does not exist.

- [ ] **Step 3: Implement minimal helper**

Create `src/utils/hash.ts` with Web Crypto support and deterministic fallback.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/hash.test.ts`
Expected: PASS.

### Task 2: Remove Node Crypto From Annotation Writer

**Files:**
- Modify: `src/pdf/pdfAnnotationWriter.ts`
- Test: `tests/pdfAnnotationWriter.test.ts`

- [ ] **Step 1: Write failing regression check**

Add a test that confirms `writeHighlightAnnotation` returns a `sha256:<hex>` fingerprint.

- [ ] **Step 2: Run targeted test**

Run: `npm test -- tests/pdfAnnotationWriter.test.ts`
Expected: FAIL until the writer awaits the new hash helper.

- [ ] **Step 3: Update writer**

Remove `import { createHash } from "crypto"` and call `createStableFingerprint(JSON.stringify(...))`.

- [ ] **Step 4: Run targeted tests**

Run: `npm test -- tests/pdfAnnotationWriter.test.ts tests/hash.test.ts`
Expected: PASS.

### Task 3: Enable Mobile Manifest And QA Docs

**Files:**
- Modify: `manifest.json`
- Modify: `docs/manual-test-checklist.md`

- [ ] **Step 1: Update manifest**

Set `"isDesktopOnly": false`.

- [ ] **Step 2: Update manual QA**

Add mobile install and smoke-test steps for iOS/Android Obsidian.

- [ ] **Step 3: Verify mobile blockers are absent**

Run: `rg -n "from ['\"]crypto|require\\(['\"]crypto|require\\(\"crypto\"\\)" src main.js`
Expected after build: no production crypto import/require remains.

### Task 4: Final Verification

**Files:**
- Generated: `main.js`

- [ ] **Step 1: Run all tests**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: TypeScript and esbuild complete successfully.

- [ ] **Step 3: Check bundle and git state**

Run: `rg -n "require\\(\"crypto\"\\)|from ['\"]crypto" main.js src || true`
Expected: no output.

Run: `git status --short`
Expected: only intentional changes before commit, clean after commit.
