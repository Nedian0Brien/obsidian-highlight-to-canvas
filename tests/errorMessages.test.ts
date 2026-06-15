import { describe, expect, it } from "vitest";
import { toFriendlyErrorMessage, toPdfRenderErrorMessage } from "../src/ui/errorMessages";

describe("toFriendlyErrorMessage", () => {
  it("maps permission failures to original PDF guidance", () => {
    expect(toFriendlyErrorMessage(new Error("EACCES: permission denied"))).toBe(
      "The original PDF could not be saved because the file is read-only or permission was denied."
    );
  });

  it("maps encrypted PDF failures to an unsupported PDF message", () => {
    expect(toFriendlyErrorMessage(new Error("encrypted documents are not supported"))).toBe(
      "This PDF structure is encrypted or unsupported, so the highlight could not be written."
    );
  });

  it("keeps an unknown failure readable", () => {
    expect(toFriendlyErrorMessage("something odd")).toBe("Something went wrong while creating the highlight node.");
  });
});

describe("toPdfRenderErrorMessage", () => {
  it("maps PDF worker failures to renderer startup guidance", () => {
    expect(toPdfRenderErrorMessage(new Error('Setting up fake worker failed: "Cannot find module pdf.worker.mjs"'))).toBe(
      "The PDF renderer could not start inside Obsidian. Reload Obsidian and update Highlight to Canvas from BRAT."
    );
  });

  it("maps encrypted PDF render failures to a PDF-specific message", () => {
    expect(toPdfRenderErrorMessage(new Error("PasswordException: encrypted PDF"))).toBe(
      "This PDF is encrypted or password-protected, so it cannot be rendered yet."
    );
  });

  it("includes unknown render details for diagnostics", () => {
    expect(toPdfRenderErrorMessage("Unexpected render crash")).toBe("The PDF could not be rendered: Unexpected render crash");
  });
});
