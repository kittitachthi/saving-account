import { useMemo } from "react";
import type { Transaction } from "../transactions/domain";
import { InteractiveDonut } from "../../shared/ui/InteractiveDonut";
import { calculateCategorySummaries } from "./domain";
import type { CategorySummary } from "./domain";
import styles from "./CategoryChart.module.css";

const colors = [
  "var(--color-expense-chart-1)",
  "var(--color-expense-chart-2)",
  "var(--color-expense-chart-3)",
  "var(--color-expense-chart-4)",
];
const money = (value: number) => new Intl.NumberFormat("th-TH").format(value);

export function CategoryChart({
  transactions,
  expenseTotal,
}: {
  transactions: Transaction[];
  expenseTotal: number;
}) {
  const summaries = useMemo(
    () => calculateCategorySummaries(transactions),
    [transactions],
  );
  const segments = summaries.map((item, index) => ({
    id: item.name,
    item,
    color: colors[index],
    percentage: item.percentage,
    offset: item.offset,
    ariaLabel: `${item.name} ${item.percentage}%`,
  }));
  const tooltip = (item: CategorySummary) => (
    <>
      <b>{item.name}</b>
      <span>ยอดรวม ฿{money(item.total)}</span>
      <span>{item.percentage}% ของรายจ่าย</span>
      <span>{item.count} รายการ</span>
      <span>เฉลี่ย ฿{money(Math.round(item.average))}</span>
    </>
  );
  return (
    <article className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <h3>ภาพรวมรายจ่าย</h3>
          <p>สัดส่วนรายจ่ายเดือนนี้</p>
        </div>
        <button aria-label="ตัวเลือกภาพรวม">•••</button>
      </div>
      <InteractiveDonut
        ariaLabel="กราฟสัดส่วนรายจ่าย"
        segments={segments}
        center={
          <div className={styles.chartCenter}>
            <b>฿{money(expenseTotal)}</b>
            <small>รายจ่ายทั้งหมด</small>
          </div>
        }
        renderTooltip={tooltip}
        renderLegend={(item) => (
          <>
            <span>{item.name}</span>
            <b>{item.percentage}%</b>
          </>
        )}
      />
    </article>
  );
}
