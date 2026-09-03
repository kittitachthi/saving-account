import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { FocusEvent, KeyboardEvent, PointerEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { calculateFloatingTooltipPosition, calculateTriggerAnchor } from "./floatingTooltipPosition";
import type { Point } from "./floatingTooltipPosition";
import styles from "./InteractiveDonut.module.css";

const elementAnchor = (element: Element): Point => calculateTriggerAnchor(element.getBoundingClientRect());
const pointerPoint = (event: { clientX: number; clientY: number }): Point => ({ x: event.clientX, y: event.clientY });

export function useFloatingTooltip<T>(items: T[], renderTooltip: (item: T, pinned: boolean) => ReactNode) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [pinned, setPinned] = useState(false);
  const [anchor, setAnchor] = useState<Point>({ x: 0, y: 0 });
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const lastPointerType = useRef("");
  const close = () => { setActiveIndex(null); setPinned(false); };

  useEffect(() => {
    const dismiss = (event: globalThis.PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (!rootRef.current?.contains(event.target) && !tooltipRef.current?.contains(event.target)) close();
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);
  useLayoutEffect(() => {
    if (activeIndex === null || !tooltipRef.current) return;
    const rect = tooltipRef.current.getBoundingClientRect();
    setPosition(calculateFloatingTooltipPosition(anchor, { width: rect.width, height: rect.height }, { width: window.innerWidth, height: window.innerHeight }));
  }, [activeIndex, anchor, pinned]);

  const hover = (index: number, point: Point) => { if (!pinned) { setActiveIndex(index); setAnchor(point); } };
  const leave = () => { if (!pinned) setActiveIndex(null); };
  const togglePin = (index: number, point: Point) => {
    if (pinned && activeIndex === index) return close();
    setActiveIndex(index); setAnchor(point); setPinned(true);
  };
  const pointerEnter = (index: number) => (event: PointerEvent<Element>) => hover(index, pointerPoint(event));
  const pointerMove = (index: number) => (event: PointerEvent<Element>) => hover(index, pointerPoint(event));
  const pointerDown = (event: PointerEvent<Element>) => { lastPointerType.current = event.pointerType; };
  const focus = (index: number) => (event: FocusEvent<Element>) => hover(index, elementAnchor(event.currentTarget));
  const click = (index: number) => (event: React.MouseEvent<Element>) => togglePin(index, lastPointerType.current === "touch" || event.detail === 0 ? elementAnchor(event.currentTarget) : pointerPoint(event));
  const keyDown = (index: number, manualActivation = false) => (event: KeyboardEvent<Element>) => {
    if (manualActivation && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); togglePin(index, elementAnchor(event.currentTarget)); }
    if (event.key === "Escape") close();
  };
  const tooltip = activeIndex === null ? null : createPortal(
    <div ref={tooltipRef} className={`${styles.floatingTooltip} ${pinned ? styles.pinnedTooltip : ""}`} role="tooltip" style={{ left: position.x, top: position.y }}>
      {renderTooltip(items[activeIndex], pinned)}
    </div>, document.body,
  );
  return { rootRef, activeIndex, pinned, pointerEnter, pointerMove, pointerDown, pointerLeave: leave, focus, blur: leave, click, keyDown, tooltip };
}
