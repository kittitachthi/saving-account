import type { TransactionTotals, Transaction } from "../transactions";
import styles from "./Dashboard.module.css";
import { calculateMonthlyCashflow } from "./domain";
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
    monthly: { income: number; expense: number };
    daily: CashflowSegment[];
  };
}) {
  const monthly =
    online?.monthly ?? calculateMonthlyCashflow(transactions, now);
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.rings} aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className={styles.balance}>
          <p>ยอดเงินพร้อมใช้　◉</p>
          <h2>฿{formatMoney(totals.balance, moneyUnit, true)}</h2>
        </div>
        <DashboardMascot state={mascotState} />
      </section>
      <section className={styles.stats}>
        <article>
          <i className={`${styles.stat} ${styles.incomeStat}`}>↙</i>
          <div>
            <p>รายรับเดือนนี้</p>
            <h3>฿{formatMoney(monthly.income, moneyUnit)}</h3>
          </div>
        </article>
        <article>
          <i className={`${styles.stat} ${styles.expenseStat}`}>↗</i>
          <div>
            <p>รายจ่ายเดือนนี้</p>
            <h3>฿{formatMoney(monthly.expense, moneyUnit)}</h3>
          </div>
        </article>
        <DailyCashflowCard
          transactions={transactions}
          now={now}
          serverSegments={online?.daily}
          moneyUnit={moneyUnit}
        />
      </section>
    </>
  );
}
