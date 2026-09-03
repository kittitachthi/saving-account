import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import type { Transaction } from "../transactions/domain";
import { calculateCategorySummaries } from "./domain";
import styles from "./CategoryChart.module.css";
const colors = ["#087f5b", "#61bc9d", "#efb45f", "#a8b2ae"];
const money = (value: number) => new Intl.NumberFormat("th-TH").format(value);
export function CategoryChart({
  transactions,
  expenseTotal,
}: {
  transactions: Transaction[];
  expenseTotal: number;
}) {
  const [active, setActive] = useState<number | null>(null),
    summaries = useMemo(
      () => calculateCategorySummaries(transactions),
      [transactions],
    );
  useEffect(() => {
    const clear = (event: PointerEvent) => {
      if (
        event.target instanceof Element &&
        !event.target.closest(
          `.${styles.donutSegment}, .${styles.legend} button, .${styles.tooltip}`,
        )
      )
        setActive(null);
    };
    document.addEventListener("pointerdown", clear);
    return () => document.removeEventListener("pointerdown", clear);
  }, []);
  const key = (event: KeyboardEvent, index: number) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setActive((current) => (current === index ? null : index));
    }
    if (event.key === "Escape") setActive(null);
  };
  return (
    <article className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <h3>ภาพรวมรายจ่าย</h3>
          <p>สัดส่วนรายจ่ายเดือนนี้</p>
        </div>
        <button aria-label="ตัวเลือกภาพรวม">•••</button>
      </div>
      <div className={styles.chartWrap}>
        <svg
          className={styles.donutChart}
          viewBox="0 0 42 42"
          role="group"
          aria-label="กราฟสัดส่วนรายจ่าย"
        >
          <circle className={styles.donutTrack} cx="21" cy="21" r="15.9155" />
          {summaries.map((item, index) => (
            <circle
              key={item.name}
              className={`${styles.donutSegment} ${active === index ? styles.active : ""}`}
              cx="21"
              cy="21"
              r="15.9155"
              pathLength="100"
              stroke={colors[index]}
              strokeDasharray={`${item.percentage} ${100 - item.percentage}`}
              strokeDashoffset={-item.offset}
              tabIndex={0}
              role="button"
              aria-label={`${item.name} ${item.percentage}%`}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
              onClick={() =>
                setActive((current) => (current === index ? null : index))
              }
              onKeyDown={(event) => key(event, index)}
            />
          ))}
        </svg>
        <div className={styles.chartCenter}>
          <b>฿{money(expenseTotal)}</b>
          <small>รายจ่ายทั้งหมด</small>
        </div>
        {active !== null && (
          <div className={styles.tooltip} role="tooltip">
            <b>{summaries[active].name}</b>
            <span>ยอดรวม ฿{money(summaries[active].total)}</span>
            <span>{summaries[active].percentage}% ของรายจ่าย</span>
            <span>{summaries[active].count} รายการ</span>
            <span>เฉลี่ย ฿{money(Math.round(summaries[active].average))}</span>
          </div>
        )}
      </div>
      <div className={styles.legend}>
        {summaries.map((item, index) => (
          <button key={item.name} onClick={() => setActive(index)}>
            <i style={{ background: colors[index] }} />
            {item.name} <b>{item.percentage}%</b>
          </button>
        ))}
      </div>
    </article>
  );
}
