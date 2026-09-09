import type { Transaction } from "../transactions";
import { useFloatingTooltip } from "../../shared/ui/useFloatingTooltip";
import { dailyCashflowCalculate, type CashflowSegment } from "./domain";
import styles from "./DailyCashflowCard.module.css";
import { formatMoney, type MoneyUnit } from "../../shared/money-input";

export function DailyCashflowCard({
  transactions,
  now,
  serverSegments,
  moneyUnit = "baht",
}: {
  transactions: Transaction[];
  now: Date;
  serverSegments?: CashflowSegment[];
  moneyUnit?: MoneyUnit;
}) {
  const dailyCashflowMoneyFormat = (value: number) =>
    formatMoney(value, moneyUnit);
  const segments = serverSegments ?? dailyCashflowCalculate(transactions, now);
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
      <span>ยอดรวม ฿{dailyCashflowMoneyFormat(segment.total)}</span>
      <span>{Math.round(segment.percentage)}% ของกระแสเงินวันนี้</span>
      <span>{segment.count} รายการ</span>
      {segment.highest.length ? (
        <>
          <span>รายการมูลค่าสูงสุด</span>
          <div
            className={
              isPinned
                ? styles["daily-cashflow-highest-pinned-list"]
                : styles["daily-cashflow-highest-list"]
            }
          >
            {segment.highest.map((item) => (
              <span key={item.id}>
                {item.title} · ฿{dailyCashflowMoneyFormat(item.amount)} ·{" "}
                {item.occurredOn
                  ? (item.occurredTime ?? item.occurredOn)
                  : new Intl.DateTimeFormat("th-TH", {
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
  const dailyCashflowTriggerPropsBuild = (index: number) => ({
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
    <article ref={rootRef} className={styles["daily-cashflow-card"]}>
      <p>รายรับเทียบรายจ่ายวันนี้</p>
      <div className={styles["daily-cashflow-values"]}>
        <button
          {...dailyCashflowTriggerPropsBuild(0)}
          aria-pressed={pinned && activeIndex === 0}
        >
          รายรับ <b>฿{dailyCashflowMoneyFormat(income.total)}</b>
        </button>
        <button
          {...dailyCashflowTriggerPropsBuild(1)}
          aria-pressed={pinned && activeIndex === 1}
        >
          รายจ่าย <b>฿{dailyCashflowMoneyFormat(expense.total)}</b>
        </button>
      </div>
      {empty ? (
        <>
          <div className={styles["daily-cashflow-empty-bar"]} />
          <small>ยังไม่มีรายการวันนี้</small>
        </>
      ) : (
        <div
          className={styles["daily-cashflow-bar"]}
          aria-label={`รายรับ ${Math.round(income.percentage)}% รายจ่าย ${Math.round(expense.percentage)}%`}
        >
          {income.percentage > 0 && (
            <button
              className={styles["daily-cashflow-income-bar"]}
              {...dailyCashflowTriggerPropsBuild(0)}
              aria-label={`รายรับ ${Math.round(income.percentage)}%`}
              style={{ width: `${income.percentage}%` }}
            />
          )}
          {expense.percentage > 0 && (
            <button
              className={styles["daily-cashflow-expense-bar"]}
              {...dailyCashflowTriggerPropsBuild(1)}
              aria-label={`รายจ่าย ${Math.round(expense.percentage)}%`}
              style={{ width: `${expense.percentage}%` }}
            />
          )}
        </div>
      )}
      <div className={styles["daily-cashflow-percentages"]}>
        <span>{Math.round(income.percentage)}%</span>
        <span>{Math.round(expense.percentage)}%</span>
      </div>
      {tooltip}
    </article>
  );
}
