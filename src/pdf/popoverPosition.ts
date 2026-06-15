export interface BoxRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PopoverSize {
  width: number;
  height: number;
}

export interface PopoverPosition {
  left: number;
  top: number;
  placement: "above" | "below";
}

const GAP = 8;
const EDGE_PADDING = 8;

export function getPopoverPosition(anchorRect: BoxRect, containerRect: BoxRect, popoverSize: PopoverSize): PopoverPosition {
  const preferredTop = anchorRect.y + anchorRect.height + GAP;
  const topLimit = containerRect.y + EDGE_PADDING;
  const bottomLimit = containerRect.y + containerRect.height - EDGE_PADDING;
  const rightLimit = containerRect.x + containerRect.width - EDGE_PADDING;
  const placement = preferredTop + popoverSize.height <= bottomLimit ? "below" : "above";
  const unclampedTop = placement === "below" ? preferredTop : anchorRect.y - popoverSize.height - GAP;
  const unclampedLeft = anchorRect.x;

  return {
    left: clamp(unclampedLeft, containerRect.x + EDGE_PADDING, rightLimit - popoverSize.width),
    top: clamp(unclampedTop, topLimit, bottomLimit - popoverSize.height),
    placement
  };
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

