import { useEffect, useRef } from "react";
import type { Transaction } from "./domain";
import { Overlay } from "../../shared/ui/Overlay";
import styles from "./Transactions.module.css";
const money = (value: number) => new Intl.NumberFormat("th-TH").format(value);
type Props = {
  transaction: Transaction;
  onCancel: () => void;
  onConfirm: () => void;
  error?: string;
};
export function DeleteConfirmation({
  transaction,
  onCancel,
  onConfirm,
  error,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => cancelRef.current?.focus(), []);
  useEffect(() => {
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, [onCancel]);
  return (
    <Overlay onDismiss={onCancel} priority="alert">
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
          {money(transaction.amount)}.00
        </strong>
        {error && <p className={styles.formError} role="alert">{error}</p>}
        <div className={styles.confirmActions}>
          <button ref={cancelRef} onClick={onCancel}>
            ยกเลิก
          </button>
          <button className={styles.dangerButton} onClick={onConfirm}>
            ลบรายการ
          </button>
        </div>
      </section>
    </Overlay>
  );
}
