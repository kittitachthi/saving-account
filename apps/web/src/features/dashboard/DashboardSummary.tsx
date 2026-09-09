import type { TransactionTotals, Transaction } from "../transactions";
import styles from "./DashboardSummary.module.css";
import { dashboardMonthlySummaryCalculate } from "./domain";
import { DashboardMascot } from "./DashboardMascot";
import type { MascotState } from "./useDashboardMascot";
import { DailyCashflowCard } from "./DailyCashflowCard";
import type { CashflowSegment } from "./domain";
import { formatMoney, type MoneyUnit } from "../../shared/money-input";
export function DashboardSummary({
  totals,
  transactions,
  now,
  mascotState,
  online,
  moneyUnit = "baht",
}: {
  totals: TransactionTotals;
  transactions: Transaction[];
  now: Date;
  mascotState: MascotState;
  moneyUnit?: MoneyUnit;
  online?: {
    monthly: { income: number; expense: number; saving: number };
    daily: CashflowSegment[];
  };
}) {
  const monthly =
    online?.monthly ?? dashboardMonthlySummaryCalculate(transactions, now);
  return (
    <>
      <section className={styles["dashboard-balance-card"]}>
        <div className={styles["dashboard-balance-rings"]} aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className={styles["dashboard-balance-content"]}>
          <p>ยอดเงินพร้อมใช้　◉</p>
          <h2>฿{formatMoney(totals.balance, moneyUnit, true)}</h2>
        </div>
        <DashboardMascot state={mascotState} />
      </section>
      <section className={styles["dashboard-summary-grid"]}>
        <article className={styles["dashboard-monthly-card"]}>
          <i
            className={`${styles["dashboard-monthly-icon"]} ${styles["dashboard-income-icon"]}`}
          >
            ↙
          </i>
          <div>
            <p>รายรับเดือนนี้</p>
            <h3>฿{formatMoney(monthly.income, moneyUnit)}</h3>
          </div>
        </article>
        <article className={styles["dashboard-monthly-card"]}>
          <i
            className={`${styles["dashboard-monthly-icon"]} ${styles["dashboard-expense-icon"]}`}
          >
            ↗
          </i>
          <div>
            <p>รายจ่ายเดือนนี้</p>
            <h3>฿{formatMoney(monthly.expense, moneyUnit)}</h3>
          </div>
        </article>
        <article className={styles["dashboard-monthly-card"]}>
          <i
            className={`${styles["dashboard-monthly-icon"]} ${styles["dashboard-saving-icon"]}`}
          >
            ◎
          </i>
          <div>
            <p>เงินเก็บเดือนนี้</p>
            <h3>฿{formatMoney(monthly.saving, moneyUnit)}</h3>
          </div>
        </article>
        <div className={styles["dashboard-daily-row"]}>
          <DailyCashflowCard
            transactions={transactions}
            now={now}
            serverSegments={online?.daily}
            moneyUnit={moneyUnit}
          />
        </div>
      </section>
    </>
  );
}
