import type { TransactionTotals } from "../transactions/domain";
import styles from "./Dashboard.module.css";
import type { Transaction } from "../transactions/domain";
import { DailyCashflowCard } from "./DailyCashflowCard";
const money = (value: number) => new Intl.NumberFormat("th-TH").format(value);
export function DashboardSummary({
  totals,
  transactions,
  now,
}: {
  totals: TransactionTotals;
  transactions: Transaction[];
  now: Date;
}) {
  return (
    <>
      <section className={styles.hero}>
        <p>ยอดเงินพร้อมใช้　◉</p>
        <h2>
          ฿{money(totals.balance)}
          <small>.00</small>
        </h2>
        <label>↗ 8.4%</label>
        <span> จากเดือนที่แล้ว</span>
        <div className={styles.rings}>
          <i />
          <i />
          <i />
          <b>฿</b>
        </div>
      </section>
      <section className={styles.stats}>
        <article>
          <i className={`${styles.stat} ${styles.incomeStat}`}>↙</i>
          <div>
            <p>รายรับเดือนนี้</p>
            <h3>฿{money(totals.income)}</h3>
            <small className={styles.incomeText}>↗ 12.5%</small>
          </div>
        </article>
        <article>
          <i className={`${styles.stat} ${styles.expenseStat}`}>↗</i>
          <div>
            <p>รายจ่ายเดือนนี้</p>
            <h3>฿{money(totals.expense)}</h3>
            <small className={styles.expenseText}>↘ 3.2%</small>
          </div>
        </article>
        <DailyCashflowCard transactions={transactions} now={now} />
      </section>
    </>
  );
}
