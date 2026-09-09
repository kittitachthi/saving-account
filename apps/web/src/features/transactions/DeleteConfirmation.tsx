import { useEffect, useRef } from "react";
import type { Transaction } from "./domain";
import { Overlay } from "../../shared/ui/Overlay";
import styles from "./DeleteConfirmation.module.css";
import { formatMoney, type MoneyUnit } from "../../shared/money-input";
type Props = {
  transaction: Transaction;
  onTransactionDeleteCancel: () => void;
  onTransactionDeleteConfirm: () => void;
  error?: string;
  pending?: boolean;
  moneyUnit?: MoneyUnit;
};
export function DeleteConfirmation({
  transaction,
  onTransactionDeleteCancel,
  onTransactionDeleteConfirm,
  error,
  pending = false,
  moneyUnit = "baht",
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => cancelRef.current?.focus(), []);
  useEffect(() => {
    const transactionDeleteEscapeHandle = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onTransactionDeleteCancel();
    };
    window.addEventListener("keydown", transactionDeleteEscapeHandle);
    return () =>
      window.removeEventListener("keydown", transactionDeleteEscapeHandle);
  }, [onTransactionDeleteCancel, pending]);
  return (
    <Overlay
      onDismiss={() => {
        if (!pending) onTransactionDeleteCancel();
      }}
      priority="alert"
    >
      <section
        className={styles["transaction-delete-dialog"]}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles["transaction-delete-warning-icon"]}>!</div>
        <h3 id="delete-title">ลบรายการนี้หรือไม่?</h3>
        <p>
          คุณกำลังจะลบ <b>{transaction.title}</b>
        </p>
        <strong
          className={styles[`transaction-delete-${transaction.type}-amount`]}
        >
          {transaction.type === "income" ? "+" : "−"}฿
          {formatMoney(transaction.amount, moneyUnit, true)}
        </strong>
        {error && (
          <p
            className={styles["transaction-delete-error-message"]}
            role="alert"
          >
            {error}
          </p>
        )}
        <div className={styles["transaction-delete-actions"]}>
          <button
            className={styles["transaction-delete-cancel-button"]}
            ref={cancelRef}
            onClick={onTransactionDeleteCancel}
            disabled={pending}
          >
            ยกเลิก
          </button>
          <button
            className={styles["transaction-delete-confirm-button"]}
            onClick={onTransactionDeleteConfirm}
            disabled={pending}
          >
            {pending ? "กำลังลบ…" : "ลบรายการ"}
          </button>
        </div>
      </section>
    </Overlay>
  );
}
