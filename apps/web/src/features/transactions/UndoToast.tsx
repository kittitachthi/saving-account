import styles from "./Transactions.module.css";

export function UndoToast({
  onUndo,
  pending = false,
  autoFocus = false,
}: {
  onUndo: () => void;
  pending?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div className={styles.undoToast} role="status" aria-label="ผลการลบรายการ">
      <span>ลบรายการแล้ว</span>
      <button autoFocus={autoFocus} onClick={onUndo} disabled={pending}>
        {pending ? "กำลังคืนรายการ…" : "Undo"}
      </button>
    </div>
  );
}
