import styles from "./Transactions.module.css";

export function UndoToast({ onUndo }: { onUndo: () => void }) {
  return (
    <div className={styles.undoToast} role="status" aria-label="ผลการลบรายการ">
      <span>ลบรายการแล้ว</span>
      <button onClick={onUndo}>Undo</button>
    </div>
  );
}
