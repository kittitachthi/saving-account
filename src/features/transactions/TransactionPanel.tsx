import type { Transaction } from "./domain";
import type { TransactionFilter } from "./useTransactions";
import styles from "./Transactions.module.css";
const money = (value: number) => new Intl.NumberFormat("th-TH").format(value);
type Props = {
  transactions: Transaction[];
  filter: TransactionFilter;
  newItemId: number | null;
  onFilter: (filter: TransactionFilter) => void;
  onRequestDelete: (item: Transaction) => void;
};
export function TransactionPanel({
  transactions,
  filter,
  newItemId,
  onFilter,
  onRequestDelete,
}: Props) {
  const filtered =
    filter === "all"
      ? transactions
      : transactions.filter((item) => item.type === filter);
  return (
    <article className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <h3>รายการล่าสุด</h3>
          <p>การเคลื่อนไหวล่าสุดของคุณ</p>
        </div>
        <button>ดูทั้งหมด →</button>
      </div>
      <div className={styles.filters} role="group" aria-label="กรองรายการ">
        {(
          [
            ["all", "ทั้งหมด"],
            ["income", "รายรับ"],
            ["expense", "รายจ่าย"],
          ] as const
        ).map(([key, label]) => (
          <button
            className={filter === key ? styles.selected : undefined}
            onClick={() => onFilter(key)}
            key={key}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={styles.transactionGroup}>
        {filtered.map((item) => (
          <div
            className={`${styles.transaction} ${newItemId === item.id ? styles.newItem : ""}`}
            key={item.id}
          >
            <i className={styles[item.type]}>{item.icon}</i>
            <div>
              <b>{item.title}</b>
              <small>
                {item.category} • {item.date}
              </small>
            </div>
            <strong className={styles[item.type]}>
              {item.type === "income" ? "+" : "−"}฿{money(item.amount)}.00
            </strong>
            <button
              className={styles.deleteButton}
              aria-label={`ลบรายการ ${item.title}`}
              title="ลบรายการ"
              onClick={() => onRequestDelete(item)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </article>
  );
}
