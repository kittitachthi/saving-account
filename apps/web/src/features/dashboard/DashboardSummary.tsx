import type { TransactionTotals, Transaction } from "../transactions";
import styles from "./Dashboard.module.css";
import { calculateMonthlyCashflow } from "./domain";
import { DashboardMascot } from "./DashboardMascot";
import type { MascotState } from "./useDashboardMascot";
import { DailyCashflowCard } from "./DailyCashflowCard";
const money = (value: number) => new Intl.NumberFormat("th-TH").format(value);
export function DashboardSummary({
  totals,
  transactions,
  now,
  mascotState,
}: {
  totals: TransactionTotals;
  transactions: Transaction[];
  now: Date;
  mascotState: MascotState;
}) {
  const monthly = calculateMonthlyCashflow(transactions, now);
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
          <h2>
            ฿{money(totals.balance)}
            <small>.00</small>
          </h2>
        </div>
        <DashboardMascot state={mascotState} />
      </section>
      <section className={styles.stats}>
        <article>
          <i className={`${styles.stat} ${styles.incomeStat}`}>↙</i>
          <div>
            <p>รายรับเดือนนี้</p>
            <h3>฿{money(monthly.income)}</h3>
          </div>
        </article>
        <article>
          <i className={`${styles.stat} ${styles.expenseStat}`}>↗</i>
          <div>
            <p>รายจ่ายเดือนนี้</p>
            <h3>฿{money(monthly.expense)}</h3>
          </div>
        </article>
        <DailyCashflowCard transactions={transactions} now={now} />
      </section>
    </>
  );
}
