import { useMemo } from "react";
import type { Transaction } from "../transactions/domain";
import { InteractiveDonut } from "../../shared/ui/InteractiveDonut";
import { calculateSavingsCategories, savingsProgress } from "./domain";
import type { SavingsCategorySummary } from "./domain";
import styles from "./Savings.module.css";
import { formatMoney, type MoneyUnit } from "../../shared/money-input";

const colors = [
  "var(--color-saving)",
  "var(--color-saving-2)",
  "var(--color-saving-3)",
  "var(--color-saving-4)",
  "var(--color-saving-5)",
  "var(--color-saving-6)",
];
const money = (value: number) => new Intl.NumberFormat("th-TH").format(value);

export function SavingsChart({
  transactions,
  saved,
  goal,
  onSetGoal,
  serverCategories,
  moneyUnit = "baht",
}: {
  transactions: Transaction[];
  saved: number;
  goal: number | null;
  onSetGoal?: () => void;
  serverCategories?: SavingsCategorySummary[];
  moneyUnit?: MoneyUnit;
}) {
  const amount = (value: number) => formatMoney(value, moneyUnit);
  const categories = useMemo(
    () => serverCategories ?? calculateSavingsCategories(transactions, goal),
    [transactions, goal, serverCategories],
  );
  const progress = savingsProgress(saved, goal);
  const over = progress !== null && progress > 100 ? progress - 100 : 0;
  const segments = categories.map((item, index) => ({
    id: item.name,
    item,
    color: colors[index % colors.length],
    percentage: item.percentageOfGoal,
    offset: item.offset,
    ariaLabel: `${item.name} ${Math.round(item.shareOfSavings)}% ของเงินเก็บ`,
  }));
  const tooltip = (item: SavingsCategorySummary) => (
    <>
      <b>{item.name}</b>
      <span>ยอดรวม ฿{amount(item.total)}</span>
      <span>{money(Math.round(item.shareOfSavings))}% ของเงินเก็บทั้งหมด</span>
      <span>{item.count} รายการ</span>
      <span>
        เฉลี่ย ฿
        {amount(serverCategories ? item.average : Math.round(item.average))}
      </span>
      {item.shareOfGoal === null || item.goalDifference === null ? (
        <span>ยังไม่ได้ตั้งเป้าหมาย</span>
      ) : (
        <>
          <span>{money(Math.round(item.shareOfGoal))}% ของเป้าหมาย</span>
          <span>
            {item.goalDifference < 0
              ? `ยังขาด ฿${amount(Math.abs(item.goalDifference))}`
              : item.goalDifference > 0
                ? `เกินเป้า ฿${amount(item.goalDifference)} (${money(Math.round(over))}%)`
                : "ถึงเป้าหมายแล้ว"}
          </span>
        </>
      )}
    </>
  );

  return (
    <article className={`${styles.panel} ${styles["savings-panel"]}`}>
      <div className={styles.panelHead}>
        <div>
          <h3>เป้าหมายเงินเก็บ</h3>
          <p>
            {goal
              ? `เก็บแล้ว ฿${amount(saved)} จากเป้า ฿${amount(goal)}`
              : "ยังไม่ได้ตั้งเป้าหมาย"}
          </p>
        </div>
        {onSetGoal && (
          <button onClick={onSetGoal}>
            {goal ? "แก้ไขเป้าหมาย" : "ตั้งเป้าหมาย"}
          </button>
        )}
      </div>
      <InteractiveDonut
        ariaLabel="กราฟความคืบหน้าเงินเก็บ"
        segments={segments}
        size={230}
        strokeWidth={5}
        activeStrokeWidth={6.7}
        center={
          <div
            className={styles.center}
            data-testid="savings-chart-center"
            style={{ pointerEvents: "none" }}
          >
            <b>฿{amount(saved)}</b>
            <small>
              {progress === null
                ? "เงินเก็บรวม"
                : over > 0
                  ? `เกินเป้า ${money(Math.round(over))}%`
                  : `${money(Math.round(progress))}% ของเป้า`}
            </small>
          </div>
        }
        renderTooltip={tooltip}
        renderLegend={(item) => (
          <>
            <span>{item.name}</span>
            <b>฿{amount(item.total)}</b>
          </>
        )}
      />
    </article>
  );
}
