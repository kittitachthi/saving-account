import styles from "./UndoToast.module.css";

export function UndoToast({
  onTransactionDeleteUndo,
  pending = false,
  autoFocus = false,
}: {
  onTransactionDeleteUndo: () => void;
  pending?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div
      className={styles["transaction-undo-toast"]}
      role="status"
      aria-label="ผลการลบรายการ"
    >
      <span className={styles["transaction-undo-message"]}>ลบรายการแล้ว</span>
      <button
        className={styles["transaction-undo-button"]}
        autoFocus={autoFocus}
        onClick={onTransactionDeleteUndo}
        disabled={pending}
      >
        {pending ? "กำลังคืนรายการ…" : "Undo"}
      </button>
    </div>
  );
}
