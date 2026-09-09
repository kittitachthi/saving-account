import { useEffect, useRef, useState } from "react";
import type { Transaction } from "./domain";
import styles from "./Transactions.module.css";

export function TransactionActions({
  item,
  onEdit,
  onDelete,
  disabled,
}: {
  item: Transaction;
  onEdit: (item: Transaction) => void;
  onDelete: (item: Transaction) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  const choose = (action: (item: Transaction) => void) => {
    setOpen(false);
    trigger.current?.focus();
    action(item);
  };
  return (
    <div
      ref={root}
      className={styles.rowActions}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        className={styles.actionsTrigger}
        aria-label={`จัดการรายการ ${item.title}`}
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen(!open)}
      >
        ⋯
      </button>
      {open && (
        <div
          className={styles.actionsPopover}
          role="group"
          aria-label={`การดำเนินการ ${item.title}`}
        >
          <button
            type="button"
            disabled={disabled}
            onClick={() => choose(onEdit)}
          >
            แก้ไข
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => choose(onDelete)}
          >
            ลบ
          </button>
        </div>
      )}
    </div>
  );
}
