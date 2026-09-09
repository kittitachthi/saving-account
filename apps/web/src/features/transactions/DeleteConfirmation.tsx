import { useEffect, useRef } from "react";
import type { Transaction } from "./domain";
import { Overlay } from "../../shared/ui/Overlay";
import styles from "./Transactions.module.css";
import { formatMoney, type MoneyUnit } from "../../shared/money-input";
type Props = {
  transaction: Transaction;
  onCancel: () => void;
  onConfirm: () => void;
  error?: string;
  pending?: boolean;
  moneyUnit?: MoneyUnit;
};
export function DeleteConfirmation({
  transaction,
  onCancel,
  onConfirm,
  error,
  pending = false,
  moneyUnit = "baht",
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => cancelRef.current?.focus(), []);
  useEffect(() => {
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onCancel();
    };
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, [onCancel, pending]);
  return (
    <Overlay
      onDismiss={() => {
        if (!pending) onCancel();
      }}
      priority="alert"
    >
      <section
        className={styles.confirmDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.dangerIcon}>!</div>
        <h3 id="delete-title">ลบรายการนี้หรือไม่?</h3>
        <p>
          คุณกำลังจะลบ <b>{transaction.title}</b>
        </p>
        <strong className={styles[transaction.type]}>
          {transaction.type === "income" ? "+" : "−"}฿
          {formatMoney(transaction.amount, moneyUnit, true)}
        </strong>
        {error && (
          <p className={styles.formError} role="alert">
            {error}
          </p>
        )}
        <div className={styles.confirmActions}>
          <button ref={cancelRef} onClick={onCancel} disabled={pending}>
            ยกเลิก
          </button>
          <button
            className={styles.dangerButton}
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "กำลังลบ…" : "ลบรายการ"}
          </button>
        </div>
      </section>
    </Overlay>
  );
}
