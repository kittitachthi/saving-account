import type { Transaction } from "../transactions/domain";
import { useFloatingTooltip } from "../../shared/ui/useFloatingTooltip";
import { calculateDailyCashflow } from "./domain";
import styles from "./Dashboard.module.css";
const money = (value: number) => new Intl.NumberFormat("th-TH").format(value);

export function DailyCashflowCard({
  transactions,
  now,
}: {
  transactions: Transaction[];
  now: Date;
}) {
  const segments = calculateDailyCashflow(transactions, now);
  const {
    rootRef,
    activeIndex,
    pinned,
    pointerEnter,
    pointerMove,
    pointerDown,
    pointerLeave,
    focus,
    blur,
    click,
    keyDown,
    tooltip,
  } = useFloatingTooltip(segments, (segment, isPinned) => (
    <>
      <b>{segment.type === "income" ? "รายรับวันนี้" : "รายจ่ายวันนี้"}</b>
      <span>ยอดรวม ฿{money(segment.total)}</span>
      <span>{Math.round(segment.percentage)}% ของกระแสเงินวันนี้</span>
      <span>{segment.count} รายการ</span>
      {segment.highest.length ? (
        <>
          <span>รายการมูลค่าสูงสุด</span>
          <div
            className={isPinned ? styles.highestListPinned : styles.highestList}
          >
            {segment.highest.map((item) => (
              <span key={item.id}>
                {item.title} · ฿{money(item.amount)} ·{" "}
                {new Intl.DateTimeFormat("th-TH", {
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(item.createdAt!))}
              </span>
            ))}
          </div>
          {!isPinned && segment.highest.length > 3 && (
            <span>คลิกเพื่อตรึงและดูทั้งหมด</span>
          )}
        </>
      ) : (
        <span>ไม่มีรายการ</span>
      )}
    </>
  ));
  const income = segments[0],
    expense = segments[1],
    empty = income.count + expense.count === 0;
  const trigger = (index: number) => ({
    onPointerDown: pointerDown,
    onPointerEnter: pointerEnter(index),
    onPointerMove: pointerMove(index),
    onPointerLeave: pointerLeave,
    onFocus: focus(index),
    onBlur: blur,
    onClick: click(index),
    onKeyDown: keyDown(index),
  });
  return (
    <article ref={rootRef} className={styles.cashflow}>
      <p>รายรับเทียบรายจ่ายวันนี้</p>
      <div className={styles.cashflowValues}>
        <button {...trigger(0)} aria-pressed={pinned && activeIndex === 0}>
          รายรับ <b>฿{money(income.total)}</b>
        </button>
        <button {...trigger(1)} aria-pressed={pinned && activeIndex === 1}>
          รายจ่าย <b>฿{money(expense.total)}</b>
        </button>
      </div>
      {empty ? (
        <>
          <div className={styles.emptyBar} />
          <small>ยังไม่มีรายการวันนี้</small>
        </>
      ) : (
        <div
          className={styles.cashflowBar}
          aria-label={`รายรับ ${Math.round(income.percentage)}% รายจ่าย ${Math.round(expense.percentage)}%`}
        >
          {income.percentage > 0 && (
            <button
              className={styles.incomeBar}
              {...trigger(0)}
              aria-label={`รายรับ ${Math.round(income.percentage)}%`}
              style={{ width: `${income.percentage}%` }}
            />
          )}
          {expense.percentage > 0 && (
            <button
              className={styles.expenseBar}
              {...trigger(1)}
              aria-label={`รายจ่าย ${Math.round(expense.percentage)}%`}
              style={{ width: `${expense.percentage}%` }}
            />
          )}
        </div>
      )}
      <div className={styles.cashflowPercents}>
        <span>{Math.round(income.percentage)}%</span>
        <span>{Math.round(expense.percentage)}%</span>
      </div>
      {tooltip}
    </article>
  );
}
