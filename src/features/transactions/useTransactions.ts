import { useEffect, useState } from "react";
import { calculateTotals, canRemoveTransaction, removeTransaction, restoreTransaction, sortTransactionsNewestFirst } from "./domain";
import type { RemovedTransaction, Transaction, TransactionType } from "./domain";
import { loadTransactions, saveTransactions } from "./storage";

export type TransactionFilter = "all" | TransactionType;
const UNDO_MS = 5000;
export const useTransactions = (fallback: Transaction[]) => {
  const [transactions, setTransactions] = useState(() => sortTransactionsNewestFirst(loadTransactions(fallback)));
  const [filter, setFilter] = useState<TransactionFilter>("all");
  const [page, setPage] = useState(1);
  const [now, setNow] = useState(() => new Date());
  const [pendingDelete, setPendingDeleteState] = useState<Transaction | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [removed, setRemoved] = useState<RemovedTransaction | null>(null);
  const [newItemId, setNewItemId] = useState<number | null>(null);
  useEffect(() => saveTransactions(transactions), [transactions]);
  useEffect(() => { if (!removed) return; const timer = window.setTimeout(() => setRemoved(null), UNDO_MS); return () => clearTimeout(timer); }, [removed]);
  useEffect(() => {
    const delay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - Date.now() + 50;
    const timer = window.setTimeout(() => setNow(new Date()), delay);
    return () => clearTimeout(timer);
  }, [now]);
  const totals = calculateTotals(transactions);
  const addTransaction = (item: Transaction) => { setTransactions((current) => sortTransactionsNewestFirst([item, ...current])); setPage(1); setNewItemId(item.id); window.setTimeout(() => setNewItemId(null), 500); };
  const changeFilter = (next: TransactionFilter) => { setFilter(next); setPage(1); };
  const setPendingDelete = (item: Transaction | null) => { setPendingDeleteState(item); setDeleteError(""); };
  const confirmDelete = () => {
    if (!pendingDelete) return;
    if (!canRemoveTransaction(transactions, pendingDelete.id)) {
      const shortage = Math.abs(totals.balance - pendingDelete.amount);
      setDeleteError(`ไม่สามารถลบรายรับได้ เงินพร้อมใช้จะติดลบ ${new Intl.NumberFormat("th-TH").format(shortage)} บาท`);
      return;
    }
    const result = removeTransaction(transactions, pendingDelete.id);
    setTransactions(result.transactions); setRemoved(result.removed); setPendingDeleteState(null);
  };
  const undoDelete = () => { if (!removed) return; setTransactions((current) => restoreTransaction(current, removed)); setRemoved(null); };
  return { transactions, totals, filter, setFilter: changeFilter, page, setPage, now, pendingDelete, setPendingDelete, deleteError, confirmDelete, removed, undoDelete, newItemId, addTransaction };
};
