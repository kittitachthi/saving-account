import type { Transaction } from "./domain";
import type { TransactionFilter } from "./useTransactions";
import styles from "./Transactions.module.css";
import { filterTransactions, formatTransactionDate, paginateTransactions, sortTransactionsNewestFirst } from "./domain";
const money = (value: number) => new Intl.NumberFormat("th-TH").format(value);
type Props = {
  transactions: Transaction[];
  filter: TransactionFilter;
  newItemId: number | null;
  onFilter: (filter: TransactionFilter) => void;
  onRequestDelete: (item: Transaction) => void;
  page: number;
  now: Date;
  onPage: (page: number) => void;
};
export function TransactionPanel({
  transactions,
  filter,
  newItemId,
  onFilter,
  onRequestDelete,
  page,
  now,
  onPage,
}: Props) {
  const filtered = sortTransactionsNewestFirst(filterTransactions(transactions, filter));
  const paged = paginateTransactions(filtered, page);
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
            ["saving", "เงินเก็บ"],
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
        {paged.items.map((item) => (
          <div
            className={`${styles.transaction} ${newItemId === item.id ? styles.newItem : ""}`}
            key={item.id}
          >
            <i className={styles[item.type]}>{item.icon}</i>
            <div>
              <b>{item.title}</b>
              <small>
                {item.category} • {item.createdAt ? formatTransactionDate(item.createdAt, now) : item.date}
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
        {!filtered.length && <p className={styles.empty}>ยังไม่มีรายการธุรกรรม</p>}
      </div>
      {paged.totalPages > 1 && <nav className={styles.pagination} aria-label="หน้ารายการธุรกรรม">
        <button disabled={paged.currentPage === 1} onClick={() => onPage(paged.currentPage - 1)}>ก่อนหน้า</button>
        {Array.from({ length: paged.totalPages }, (_, index) => index + 1).map((number) => <button key={number} aria-current={number === paged.currentPage ? "page" : undefined} onClick={() => onPage(number)}>{number}</button>)}
        <button disabled={paged.currentPage === paged.totalPages} onClick={() => onPage(paged.currentPage + 1)}>ถัดไป</button>
      </nav>}
    </article>
  );
}
