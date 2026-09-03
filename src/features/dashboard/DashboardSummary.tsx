import type { TransactionTotals } from "../transactions/domain";
import styles from "./Dashboard.module.css";
const money = (value: number) => new Intl.NumberFormat("th-TH").format(value);
export function DashboardSummary({
  totals,
  budget = 15000,
}: {
  totals: TransactionTotals;
  budget?: number;
}) {
  return (
    <>
      <section className={styles.hero}>
        <p>ยอดเงินคงเหลือทั้งหมด　◉</p>
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
        <article className={styles.budget}>
          <div>
            <p>งบประมาณคงเหลือ</p>
            <b>{Math.round((totals.expense / budget) * 100)}%</b>
          </div>
          <h3>฿{money(budget - totals.expense)}</h3>
          <div className={styles.progress}>
            <i
              style={{
                width: `${Math.min(100, (totals.expense / budget) * 100)}%`,
              }}
            />
          </div>
          <small>
            ใช้ไป ฿{money(totals.expense)} จาก ฿{money(budget)}
          </small>
        </article>
      </section>
    </>
  );
}
