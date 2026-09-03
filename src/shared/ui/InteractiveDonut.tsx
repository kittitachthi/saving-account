import type { CSSProperties, ReactNode } from "react";
import { useFloatingTooltip } from "./useFloatingTooltip";
import styles from "./InteractiveDonut.module.css";

export type InteractiveDonutSegment<T> = { id: string; item: T; color: string; percentage: number; offset: number; ariaLabel: string };
type Props<T> = { ariaLabel: string; segments: InteractiveDonutSegment<T>[]; center: ReactNode; renderTooltip: (item: T) => ReactNode; renderLegend: (item: T) => ReactNode; size?: number; strokeWidth?: number; activeStrokeWidth?: number };

export function InteractiveDonut<T>({ ariaLabel, segments, center, renderTooltip, renderLegend, size = 210, strokeWidth = 7, activeStrokeWidth = 8.7 }: Props<T>) {
  const { rootRef, activeIndex, pinned, pointerEnter, pointerMove, pointerDown, pointerLeave, focus, blur, click, keyDown, tooltip } = useFloatingTooltip(segments, (segment) => renderTooltip(segment.item));
  const wrapStyle = { "--donut-size": `${size}px`, "--donut-stroke": strokeWidth, "--donut-active-stroke": activeStrokeWidth } as CSSProperties;
  return <div ref={rootRef} className={styles.root} data-interactive-donut="true" style={wrapStyle}>
    <div className={styles.chartWrap}>
      <svg className={styles.chart} viewBox="0 0 42 42" role="group" aria-label={ariaLabel}>
        <circle className={styles.track} cx="21" cy="21" r="15.9155" />
        {segments.map((segment, index) => <circle key={segment.id} className={`${styles.segment} ${activeIndex === index ? styles.active : ""} ${activeIndex !== null && activeIndex !== index ? styles.inactive : ""}`} cx="21" cy="21" r="15.9155" pathLength="100" stroke={segment.color} strokeDasharray={`${segment.percentage} ${100 - segment.percentage}`} strokeDashoffset={-segment.offset} tabIndex={0} role="button" aria-label={segment.ariaLabel}
          onPointerEnter={pointerEnter(index)} onPointerMove={pointerMove(index)} onPointerLeave={pointerLeave} aria-pressed={pinned && activeIndex === index} onPointerDown={pointerDown} onFocus={focus(index)} onBlur={blur} onClick={click(index)} onKeyDown={keyDown(index, true)} />)}
      </svg>
      <div className={styles.center}>{center}</div>
    </div>
    <div className={styles.legend}>{segments.map((segment, index) => <button key={segment.id} className={activeIndex === index ? styles.activeLegend : undefined} aria-pressed={pinned && activeIndex === index}
      onPointerDown={pointerDown} onPointerEnter={pointerEnter(index)} onPointerMove={pointerMove(index)} onPointerLeave={pointerLeave} onFocus={focus(index)} onBlur={blur} onClick={click(index)} onKeyDown={keyDown(index)}><i style={{ background: segment.color }} />{renderLegend(segment.item)}</button>)}</div>
    {tooltip}
  </div>;
}
