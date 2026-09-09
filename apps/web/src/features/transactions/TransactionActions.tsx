import { useCallback, useEffect, useRef, useState } from "react";
import type { Transaction } from "./domain";
import styles from "./TransactionActions.module.css";

export function TransactionActions({
  item,
  onTransactionEditRequest,
  onTransactionDeleteRequest,
  onTransactionActionsOpenChange,
  disabled,
}: {
  item: Transaction;
  onTransactionEditRequest: (item: Transaction) => void;
  onTransactionDeleteRequest: (item: Transaction) => void;
  onTransactionActionsOpenChange: (open: boolean) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const transactionActionsOpenSet = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      onTransactionActionsOpenChange(nextOpen);
    },
    [onTransactionActionsOpenChange],
  );
  useEffect(() => {
    if (!open) return;
    const transactionActionsOutsidePointerHandle = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node))
        transactionActionsOpenSet(false);
    };
    document.addEventListener(
      "pointerdown",
      transactionActionsOutsidePointerHandle,
    );
    return () =>
      document.removeEventListener(
        "pointerdown",
        transactionActionsOutsidePointerHandle,
      );
  }, [open, transactionActionsOpenSet]);
  const transactionActionSelect = (action: (item: Transaction) => void) => {
    transactionActionsOpenSet(false);
    trigger.current?.focus();
    action(item);
  };
  return (
    <div
      ref={root}
      className={styles["transaction-actions-container"]}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          transactionActionsOpenSet(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          transactionActionsOpenSet(false);
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        className={styles["transaction-actions-trigger-button"]}
        aria-label={`จัดการรายการ ${item.title}`}
        aria-expanded={open}
        disabled={disabled}
        onClick={() => transactionActionsOpenSet(!open)}
      >
        ⋯
      </button>
      {open && (
        <div
          className={styles["transaction-actions-popover"]}
          role="group"
          aria-label={`การดำเนินการ ${item.title}`}
        >
          <button
            className={styles["transaction-actions-option-button"]}
            type="button"
            disabled={disabled}
            onClick={() => transactionActionSelect(onTransactionEditRequest)}
          >
            แก้ไข
          </button>
          <button
            className={styles["transaction-actions-option-button"]}
            type="button"
            disabled={disabled}
            onClick={() => transactionActionSelect(onTransactionDeleteRequest)}
          >
            ลบ
          </button>
        </div>
      )}
    </div>
  );
}
