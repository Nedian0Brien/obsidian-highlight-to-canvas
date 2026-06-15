export const HIGHLIGHT_TO_CANVAS_SELECTION_EVENTS = ["mouseup", "touchend", "keyup"] as const;

export type HighlightSelectionEvent = typeof HIGHLIGHT_TO_CANVAS_SELECTION_EVENTS[number];
