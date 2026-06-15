export type PopoverStatus = "idle" | "creating" | "success" | "error";
export type PopoverCreationStep = "writing-pdf" | "writing-canvas" | "writing-index";

export interface PopoverState {
  status: PopoverStatus;
  step: PopoverCreationStep | null;
  message: string | null;
  canvasPath: string | null;
  canSubmit: boolean;
  canRetry: boolean;
}

export function createInitialPopoverState(): PopoverState {
  return {
    status: "idle",
    step: null,
    message: null,
    canvasPath: null,
    canSubmit: true,
    canRetry: false
  };
}

export function markCreating(_state: PopoverState, step: PopoverCreationStep): PopoverState {
  return {
    status: "creating",
    step,
    message: creationMessage(step),
    canvasPath: null,
    canSubmit: false,
    canRetry: false
  };
}

export function markSuccess(_state: PopoverState, canvasPath: string): PopoverState {
  return {
    status: "success",
    step: null,
    message: "Canvas node created.",
    canvasPath,
    canSubmit: false,
    canRetry: false
  };
}

export function markError(_state: PopoverState, message: string): PopoverState {
  return {
    status: "error",
    step: null,
    message,
    canvasPath: null,
    canSubmit: true,
    canRetry: true
  };
}

function creationMessage(step: PopoverCreationStep): string {
  if (step === "writing-pdf") return "Saving highlight to the original PDF...";
  if (step === "writing-canvas") return "Creating Canvas node...";
  return "Recording source link...";
}

