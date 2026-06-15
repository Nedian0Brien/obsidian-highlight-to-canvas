import { describe, expect, it } from "vitest";
import { createStableFingerprint } from "../src/utils/hash";

describe("createStableFingerprint", () => {
  it("returns a sha256-prefixed hex fingerprint", async () => {
    const fingerprint = await createStableFingerprint("hello");

    expect(fingerprint).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(fingerprint).toBe("sha256:2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
  });

  it("returns stable output for equivalent input", async () => {
    const first = await createStableFingerprint("same");
    const second = await createStableFingerprint("same");

    expect(second).toBe(first);
  });
});
