export type Point = { x: number; y: number };
export type Size = { width: number; height: number };
export type Rect = { left: number; top: number; width: number; height: number };
const OFFSET = 12;
const MARGIN = 8;

export const calculateFloatingTooltipPosition = (
  anchor: Point,
  tooltip: Size,
  viewport: Size,
): Point => {
  let x = anchor.x + OFFSET;
  let y = anchor.y + OFFSET;
  if (x + tooltip.width + MARGIN > viewport.width)
    x = anchor.x - tooltip.width - OFFSET;
  if (y + tooltip.height + MARGIN > viewport.height)
    y = anchor.y - tooltip.height - OFFSET;
  return {
    x: Math.max(
      MARGIN,
      Math.min(x, Math.max(MARGIN, viewport.width - tooltip.width - MARGIN)),
    ),
    y: Math.max(
      MARGIN,
      Math.min(y, Math.max(MARGIN, viewport.height - tooltip.height - MARGIN)),
    ),
  };
};
export const calculateTriggerAnchor = (rect: Rect): Point => ({
  x: rect.left + rect.width / 2,
  y: rect.top + rect.height / 2,
});
