import { describe, expect, it } from "vitest";
import { toFriendlyErrorMessage } from "../src/ui/errorMessages";

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
