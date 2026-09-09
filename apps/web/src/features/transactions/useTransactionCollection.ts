import { useEffect, useRef, useState } from "react";
import {
  transactionTotalsCalculate,
  transactionRemoveValidate,
  transactionRemove,
  transactionRestore,
  transactionNewestFirstSort,
} from "./domain";
import type {
  RemovedTransaction,
  Transaction,
  TransactionType,
} from "./domain";
import { transactionStorageLoad, transactionStorageSave } from "./storage";

export type TransactionFilter = "all" | TransactionType;
const UNDO_MS = 5000;
export const useTransactionCollection = (fallback: Transaction[]) => {
  const [transactions, setTransactions] = useState(() =>
    transactionNewestFirstSort(transactionStorageLoad(fallback)),
  );
  const [filter, setFilter] = useState<TransactionFilter>("all");
  const [page, setPage] = useState(1);
  const [now, setNow] = useState(() => new Date());
  const [pendingDelete, setPendingDeleteState] = useState<Transaction | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState("");
  const [removed, setRemoved] = useState<RemovedTransaction | null>(null);
  const [newItemId, setNewItemId] = useState<Transaction["id"] | null>(null);
  const persistedTransactions = useRef(transactions);
  const transactionCollectionPersist = (nextTransactions: Transaction[]) => {
    transactionStorageSave(nextTransactions);
    persistedTransactions.current = nextTransactions;
    setTransactions(nextTransactions);
  };
  useEffect(() => {
    if (newItemId === null) return;
    const timer = window.setTimeout(() => setNewItemId(null), 500);
    return () => clearTimeout(timer);
  }, [newItemId]);
  useEffect(() => {
    if (!removed) return;
    const timer = window.setTimeout(() => setRemoved(null), UNDO_MS);
    return () => clearTimeout(timer);
  }, [removed]);
  useEffect(() => {
    const delay =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() -
      Date.now() +
      50;
    const timer = window.setTimeout(() => setNow(new Date()), delay);
    return () => clearTimeout(timer);
  }, [now]);
  const totals = transactionTotalsCalculate(transactions);
  const transactionCreate = (transaction: Transaction) => {
    try {
      transactionCollectionPersist(
        transactionNewestFirstSort([
          transaction,
          ...persistedTransactions.current,
        ]),
      );
    } catch {
      return false;
    }
    setPage(1);
    setNewItemId(transaction.id);
    return true;
  };
  const transactionFilterChange = (nextFilter: TransactionFilter) => {
    setFilter(nextFilter);
    setPage(1);
  };
  const transactionDeleteRequest = (transaction: Transaction | null) => {
    setPendingDeleteState(transaction);
    setDeleteError("");
  };
  const transactionDeleteConfirm = () => {
    if (!pendingDelete) return;
    if (!transactionRemoveValidate(transactions, pendingDelete.id)) {
      const shortage = Math.abs(totals.balance - pendingDelete.amount);
      setDeleteError(
        `ไม่สามารถลบรายรับได้ เงินพร้อมใช้จะติดลบ ${new Intl.NumberFormat("th-TH").format(shortage)} บาท`,
      );
      return;
    }
    const result = transactionRemove(transactions, pendingDelete.id);
    try {
      transactionCollectionPersist(result.transactions);
    } catch {
      setDeleteError("ลบรายการไม่สำเร็จ กรุณาลองอีกครั้ง");
      return;
    }
    setRemoved(result.removed);
    setPendingDeleteState(null);
  };
  const transactionDeleteUndo = () => {
    if (!removed) return;
    try {
      transactionCollectionPersist(
        transactionRestore(persistedTransactions.current, removed),
      );
    } catch {
      return;
    }
    setRemoved(null);
  };
  return {
    transactions,
    totals,
    filter,
    transactionFilterChange,
    page,
    transactionPageChange: setPage,
    now,
    pendingDelete,
    transactionDeleteRequest,
    deleteError,
    transactionDeleteConfirm,
    removed,
    transactionDeleteUndo,
    newItemId,
    transactionCreate,
  };
};
