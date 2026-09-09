import { useState } from "react";
import type { Transaction } from "./domain";
import { TransactionActions } from "./TransactionActions";
import { formatMoney, type MoneyUnit } from "../../shared/money-input";
import type { TransactionFilter } from "./useTransactionCollection";
import styles from "./TransactionPanel.module.css";
import {
  transactionFilterApply,
  transactionDateFormat,
  transactionPageCalculate,
  transactionNewestFirstSort,
} from "./domain";
type Props = {
  transactions: Transaction[];
  filter: TransactionFilter;
  newItemId: Transaction["id"] | null;
  onTransactionFilterChange: (filter: TransactionFilter) => void;
  onTransactionDeleteRequest?: (item: Transaction) => void;
  onTransactionEditRequest?: (item: Transaction) => void;
  actionsDisabled?: boolean;
  page: number;
  now: Date;
  onTransactionPageChange: (page: number) => void;
  serverPagination?: { page: number; totalPages: number };
  moneyUnit?: MoneyUnit;
};
export function TransactionPanel({
  transactions,
  filter,
  newItemId,
  onTransactionFilterChange,
  onTransactionDeleteRequest,
  onTransactionEditRequest,
  actionsDisabled,
  page,
  now,
  onTransactionPageChange,
  serverPagination,
  moneyUnit = "baht",
}: Props) {
  const [transactionActionsOpenId, setTransactionActionsOpenId] = useState<
    Transaction["id"] | null
  >(null);
  const filtered = transactionNewestFirstSort(
    transactionFilterApply(transactions, filter),
  );
  const paged = serverPagination
    ? {
        items: transactions,
        currentPage: serverPagination.page,
        totalPages: serverPagination.totalPages,
      }
    : transactionPageCalculate(filtered, page);
  return (
    <article className={styles["transaction-panel"]}>
      <div className={styles["transaction-panel-header"]}>
        <div>
          <h3>รายการล่าสุด</h3>
          <p>การเคลื่อนไหวล่าสุดของคุณ</p>
        </div>
        {!serverPagination && <button>ดูทั้งหมด →</button>}
      </div>
      <div
        className={styles["transaction-filter-group"]}
        role="group"
        aria-label="กรองรายการ"
      >
        {(
          [
            ["all", "ทั้งหมด"],
            ["income", "รายรับ"],
            ["expense", "รายจ่าย"],
            ["saving", "เงินเก็บ"],
          ] as const
        ).map(([key, label]) => (
          <button
            className={`${styles["transaction-filter-button"]} ${filter === key ? styles["transaction-filter-selected"] : ""}`}
            onClick={() => onTransactionFilterChange(key)}
            key={key}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={styles["transaction-list"]}>
        {paged.items.map((item) => (
          <div
            className={`${styles["transaction-row"]} ${!onTransactionDeleteRequest ? styles["transaction-read-only-row"] : ""} ${newItemId === item.id ? styles["transaction-new-row"] : ""}`}
            key={item.id}
            data-actions-open={
              transactionActionsOpenId === item.id ? "true" : undefined
            }
          >
            <i
              className={`${styles["transaction-icon"]} ${item.type === "income" ? styles["transaction-income-icon"] : item.type === "saving" ? styles["transaction-saving-icon"] : ""}`}
            >
              {item.icon}
            </i>
            <div className={styles["transaction-details"]}>
              <b className={styles["transaction-title"]}>{item.title}</b>
              <small className={styles["transaction-metadata"]}>
                {item.category} •{" "}
                {item.occurredOn
                  ? `${item.occurredOn}${item.occurredTime ? ` ${item.occurredTime}` : ""}`
                  : item.createdAt
                    ? transactionDateFormat(item.createdAt, now)
                    : item.date}
              </small>
            </div>
            <strong
              className={`${styles["transaction-amount"]} ${styles[`transaction-${item.type}-amount`]}`}
            >
              {item.type === "income" ? "+" : "−"}฿
              {formatMoney(item.amount, moneyUnit, true)}
            </strong>
            {onTransactionEditRequest && onTransactionDeleteRequest ? (
              <TransactionActions
                item={item}
                onTransactionEditRequest={onTransactionEditRequest}
                onTransactionDeleteRequest={onTransactionDeleteRequest}
                onTransactionActionsOpenChange={(open) =>
                  setTransactionActionsOpenId(open ? item.id : null)
                }
                disabled={actionsDisabled}
              />
            ) : (
              onTransactionDeleteRequest && (
                <button
                  className={styles["transaction-legacy-delete-button"]}
                  aria-label={`ลบรายการ ${item.title}`}
                  title="ลบรายการ"
                  onClick={() => onTransactionDeleteRequest(item)}
                >
                  ×
                </button>
              )
            )}
          </div>
        ))}
        {!paged.items.length && (
          <p className={styles["transaction-empty-message"]}>
            ยังไม่มีรายการธุรกรรม
          </p>
        )}
      </div>
      {paged.totalPages > 1 && (
        <nav
          className={styles["transaction-pagination"]}
          aria-label="หน้ารายการธุรกรรม"
        >
          <button
            className={styles["transaction-page-button"]}
            disabled={paged.currentPage === 1}
            onClick={() => onTransactionPageChange(paged.currentPage - 1)}
          >
            ก่อนหน้า
          </button>
          {Array.from(
            { length: paged.totalPages },
            (_, index) => index + 1,
          ).map((number) => (
            <button
              className={styles["transaction-page-button"]}
              key={number}
              aria-current={number === paged.currentPage ? "page" : undefined}
              onClick={() => onTransactionPageChange(number)}
            >
              {number}
            </button>
          ))}
          <button
            className={styles["transaction-page-button"]}
            disabled={paged.currentPage === paged.totalPages}
            onClick={() => onTransactionPageChange(paged.currentPage + 1)}
          >
            ถัดไป
          </button>
        </nav>
      )}
    </article>
  );
}
