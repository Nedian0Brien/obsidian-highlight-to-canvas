import { describe, expect, it } from "vitest";
import { createInitialPopoverState, markCreating, markError, markSuccess } from "../src/pdf/popoverState";

describe("popoverState", () => {
  it("starts idle and transitions through creating to success", () => {
    const initial = createInitialPopoverState();
    const creating = markCreating(initial, "writing-pdf");
    const success = markSuccess(creating, "Sources/paper.canvas");

    expect(initial.status).toBe("idle");
    expect(creating).toMatchObject({ status: "creating", step: "writing-pdf", canSubmit: false });
    expect(success).toMatchObject({ status: "success", canvasPath: "Sources/paper.canvas", canSubmit: false });
  });

  it("keeps retry available after an error", () => {
    const error = markError(createInitialPopoverState(), "PDF is read-only");

    expect(error).toMatchObject({ status: "error", message: "PDF is read-only", canRetry: true, canSubmit: true });
  });
});
